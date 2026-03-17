from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
import sqlite3
import os
import json
import stripe
import logging
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta, date
from calendar import monthrange
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import hmac
import hashlib
import re
import time
from typing import Any
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import uuid

load_dotenv()

# ------------------ ENV ------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

APP_SECRET_KEY = os.getenv("APP_SECRET_KEY")
INVITE_PEPPER = os.getenv("INVITE_PEPPER")
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24
MAX_AVATAR_BYTES = 5 * 1024 * 1024
ALLOWED_AVATAR_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")
CURRENCY_WHITELIST = {"cad", "usd"}
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://www.tydracleaning.com",
    "https://tydracleaning.com",
]

_origins = (os.getenv("CORS_ORIGINS") or "").strip()
ALLOWED_ORIGINS = (
    [o.strip() for o in _origins.split(",") if o.strip()]
    if _origins
    else DEFAULT_ALLOWED_ORIGINS
)

RATE_LIMIT_BUCKETS = {}
RATE_LIMIT_LOGIN = (10, 60)  # 10 attempts / minute
RATE_LIMIT_INVOICE = (20, 60)  # 20 requests / minute
SLOW_REQUEST_MS = int(os.getenv("SLOW_REQUEST_MS", "800"))

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("tydra.api")

# ------------------ APP ------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = APP_SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_AVATAR_BYTES
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
# ------------------ APP ------------------

# ------------------ APP ------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = APP_SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_AVATAR_BYTES
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

if not APP_SECRET_KEY:
    raise RuntimeError("APP_SECRET_KEY is required")

CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)
# ------------------ APP ------------------
# ------------------ UPLOADS ------------------
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ensure folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = "data.db"


@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "status": "ok",
            "message": "Flask backend running",
            "requestId": get_request_id(),
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "requestId": get_request_id(),
            "serverTimeUtc": datetime.now(timezone.utc).isoformat(),
        }
    )


# ------------------ HELPERS ------------------
def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def get_request_id() -> str:
    rid = getattr(g, "request_id", None)
    return str(rid) if rid else ""


def error_response(message: str, status: int = 400, details: Any = None):
    payload = {"error": message, "requestId": get_request_id()}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status


def parse_json_body() -> tuple[dict | None, tuple | None]:
    data = request.get_json(silent=True)
    if data is None:
        return None, error_response("Expected JSON body", 400)
    if not isinstance(data, dict):
        return None, error_response("Payload must be a JSON object", 400)
    return data, None


def clean_text(value: Any, max_len: int = 250, allow_newlines: bool = False) -> str:
    text = str(value or "").strip()
    if not allow_newlines:
        text = " ".join(text.split())
    return text[:max_len]


def clean_string_list(values: Any, max_items: int = 20, max_item_len: int = 120):
    if not isinstance(values, list):
        return []
    cleaned = []
    for raw in values:
        item = clean_text(raw, max_len=max_item_len)
        if item:
            cleaned.append(item)
    # keep order, remove duplicates
    deduped = []
    seen = set()
    for item in cleaned:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:max_items]


def apply_rate_limit(bucket_key: str, limit: int, period_seconds: int):
    now = time.time()
    key = f"{bucket_key}:{request.remote_addr or 'unknown'}"
    hits = RATE_LIMIT_BUCKETS.get(key, [])
    hits = [t for t in hits if now - t <= period_seconds]
    if len(hits) >= limit:
        retry_after = max(1, int(period_seconds - (now - hits[0])))
        resp, status = error_response(
            "Too many requests. Please retry shortly.",
            429,
            {"retryAfterSeconds": retry_after},
        )
        resp.headers["Retry-After"] = str(retry_after)
        return resp, status
    hits.append(now)
    RATE_LIMIT_BUCKETS[key] = hits
    return None


@app.before_request
def before_request_setup():
    g.request_started_at = time.perf_counter()
    inbound_id = (request.headers.get("X-Request-ID") or "").strip()
    g.request_id = inbound_id[:100] if inbound_id else str(uuid.uuid4())


@app.after_request
def set_security_headers(resp):
    elapsed_ms = int((time.perf_counter() - getattr(g, "request_started_at", time.perf_counter())) * 1000)
    request_id = get_request_id() or str(uuid.uuid4())

    resp.headers["X-Request-ID"] = request_id
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Cache-Control"] = "no-store"
    if request.is_secure:
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    log_payload = (
        f"requestId={request_id} method={request.method} path={request.path} "
        f"status={resp.status_code} durationMs={elapsed_ms}"
    )
    if elapsed_ms >= SLOW_REQUEST_MS:
        logger.warning("slow_request %s", log_payload)
    else:
        logger.info("request %s", log_payload)
    return resp


@app.errorhandler(400)
def handle_bad_request(_):
    return error_response("Bad request", 400)


@app.errorhandler(404)
def handle_not_found(_):
    return error_response("Route not found", 404)


@app.errorhandler(405)
def handle_method_not_allowed(_):
    return error_response("Method not allowed", 405)


@app.errorhandler(500)
def handle_server_error(err):
    logger.exception("unhandled_error requestId=%s err=%s", get_request_id(), err)
    return error_response("Internal server error", 500)

def invite_hash(code: str) -> str:
    if not INVITE_PEPPER:
        raise RuntimeError("INVITE_PEPPER is required for invite hashing")
    code = (code or "").strip().upper()
    return hmac.new(
        INVITE_PEPPER.encode("utf-8"),
        code.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def get_authenticated_user_id():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, error_response("Unauthorized", 401)

    token = auth.split(" ", 1)[1]
    try:
        payload = serializer.loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except SignatureExpired:
        return None, error_response("Token expired", 401)
    except BadSignature:
        return None, error_response("Invalid token", 401)

    user_id = payload.get("user_id")
    if not user_id:
        return None, error_response("Invalid token payload", 401)

    return user_id, None


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match((email or "").strip().lower()))


def is_valid_username(username: str) -> bool:
    return bool(USERNAME_RE.match((username or "").strip().lower()))


def validate_submission_details(details: dict):
    errors = []

    def as_positive_int(value, field_name):
        if value in (None, ""):
            return None
        try:
            num = int(value)
            if num < 1:
                errors.append(f"{field_name} must be at least 1")
            return num
        except (TypeError, ValueError):
            errors.append(f"{field_name} must be a number")
            return None

    selected_industry = (details.get("selectedIndustry") or "").strip()
    if not selected_industry:
        errors.append("selectedIndustry is required")
    elif len(selected_industry) > 120:
        errors.append("selectedIndustry is too long")

    sqft = details.get("sqft")
    if sqft not in (None, ""):
        try:
            sqft_num = float(sqft)
            if sqft_num < 0:
                errors.append("sqft cannot be negative")
        except (TypeError, ValueError):
            errors.append("sqft must be a number")

    foot_traffic_answers = details.get("footTrafficAnswers")
    if not isinstance(foot_traffic_answers, dict):
        errors.append("footTrafficAnswers must be an object")
    else:
        if not (foot_traffic_answers.get("Foot traffic") or "").strip():
            errors.append("Foot traffic selection is required")
        if not (foot_traffic_answers.get("Operating Hours") or "").strip():
            errors.append("Operating hours selection is required")

    cleaning_answers = details.get("cleaningAnswers")
    frequency = ""
    if not isinstance(cleaning_answers, dict):
        errors.append("cleaningAnswers must be an object")
    else:
        frequency = (cleaning_answers.get("Frequency") or "").strip()
        if not frequency:
            errors.append("Frequency selection is required")

    if frequency and frequency != "One-time deep clean":
        as_positive_int(details.get("freqCount"), "freqCount")
    if frequency == "Daily":
        as_positive_int(details.get("freqTimesPerDay"), "freqTimesPerDay")

    condition_answers = details.get("conditionAnswers")
    if not isinstance(condition_answers, dict):
        errors.append("conditionAnswers must be an object")
    else:
        if not (condition_answers.get("Current Condition") or "").strip():
            errors.append("Current Condition selection is required")
        if not (condition_answers.get("Current Problem") or "").strip():
            errors.append("Current Problem selection is required")

    if not (details.get("pricingModel") or "").strip():
        errors.append("pricingModel is required")

    service_add_ons = details.get("serviceAddOns")
    if not isinstance(service_add_ons, list) or len(service_add_ons) == 0:
        errors.append("At least one service add-on selection is required")
    elif any(not str(item).strip() for item in service_add_ons):
        errors.append("serviceAddOns contains an invalid value")

    if not (details.get("qualityExpectations") or "").strip():
        errors.append("qualityExpectations is required")

    return errors


def safe_int(value, default=0, min_value=None, max_value=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if min_value is not None and parsed < min_value:
        return min_value
    if max_value is not None and parsed > max_value:
        return max_value
    return parsed


def calendar_key_from_date(d: date) -> str:
    return d.strftime("%a %b %d %Y")


def normalize_frequency(value: str) -> str:
    v = (value or "").strip().lower()
    if v in {"daily"}:
        return "daily"
    if v in {"weekly", "weeky"}:
        return "weekly"
    if v in {"bi-weekly", "biweekly", "bi weekly"}:
        return "bi-weekly"
    if v in {"monthly"}:
        return "monthly"
    if "one-time" in v or "deep clean" in v:
        return "one-time"
    return ""


def infer_package(details: dict, override_package: str = "") -> str:
    from_payload = (override_package or "").strip().title()
    if from_payload in {"Basic", "Premium"}:
        return from_payload

    from_details = (details.get("servicePackage") or "").strip().title()
    if from_details in {"Basic", "Premium"}:
        return from_details

    pricing_model = (details.get("pricingModel") or "").strip().lower()
    if pricing_model == "flat monthly contract":
        return "Premium"
    return "Basic"


def infer_invoice_frequency(details: dict, cleaning_frequency: str, pricing_model: str) -> str:
    explicit = normalize_frequency(details.get("invoiceFrequency") or "")
    if explicit:
        return explicit
    if pricing_model == "flat monthly contract":
        return "monthly"
    if cleaning_frequency == "daily":
        return "weekly"
    if cleaning_frequency:
        return cleaning_frequency
    return "one-time"


def end_of_month(d: date) -> date:
    return d.replace(day=monthrange(d.year, d.month)[1])


def spread_offsets(period_days: int, visits: int):
    clamped_period = max(1, period_days)
    clamped_visits = max(1, min(visits, clamped_period))
    if clamped_visits == 1:
        return [0]

    step = clamped_period / clamped_visits
    offsets = sorted(
        set(min(clamped_period - 1, max(0, int(round(i * step)))) for i in range(clamped_visits))
    )

    while len(offsets) < clamped_visits:
        candidate = offsets[-1] + 1
        if candidate >= clamped_period:
            break
        offsets.append(candidate)

    return offsets


def add_months_preserve_day(base_date: date, month_delta: int, day: int = None) -> date:
    month_index = (base_date.month - 1) + month_delta
    year = base_date.year + month_index // 12
    month = (month_index % 12) + 1
    target_day = day if day is not None else base_date.day
    day_cap = monthrange(year, month)[1]
    return date(year, month, min(target_day, day_cap))


def build_cleaning_dates(start_date: date, frequency: str, visits_per_period: int, horizon_days: int = 90):
    frequency = normalize_frequency(frequency)
    visits = max(1, visits_per_period)
    result = set()
    end_date = start_date + timedelta(days=horizon_days)

    if frequency == "one-time" or not frequency:
        return [start_date]

    if frequency == "monthly":
        months = max(1, horizon_days // 28 + 1)
        for m in range(months):
            month_start = add_months_preserve_day(start_date, m, day=1)
            days_in_month = monthrange(month_start.year, month_start.month)[1]
            offsets = spread_offsets(days_in_month, visits)
            for off in offsets:
                candidate = month_start + timedelta(days=off)
                if candidate < start_date or candidate > end_date:
                    continue
                result.add(candidate)
        return sorted(result)

    period_days = 14 if frequency == "bi-weekly" else 7
    offsets = spread_offsets(period_days, visits)
    periods = max(1, horizon_days // period_days + 1)

    for p in range(periods):
        period_start = start_date + timedelta(days=p * period_days)
        for off in offsets:
            candidate = period_start + timedelta(days=off)
            if candidate > end_date:
                continue
            result.add(candidate)

    return sorted(result)


def build_billing_dates(start_date: date, pricing_model: str, cleaning_dates, horizon_days: int = 90):
    pricing = (pricing_model or "").strip().lower()
    if pricing != "flat monthly contract":
        return sorted(set(cleaning_dates or [start_date]))

    result = set()
    months = max(1, horizon_days // 28 + 1)
    for m in range(months):
        month_base = add_months_preserve_day(start_date, m, day=1)
        result.add(end_of_month(month_base))
    return sorted(result)


def load_appointments_map():
    conn = db()
    c = conn.cursor()
    c.execute("SELECT date, data FROM appointments")
    rows = c.fetchall()
    conn.close()

    mapped = {}
    for appt_date, payload in rows:
        try:
            item = json.loads(payload)
        except Exception:
            continue
        mapped.setdefault(appt_date, []).append(item)
    return mapped


def write_appointments_map(appointments_map: dict):
    conn = db()
    c = conn.cursor()
    c.execute("DELETE FROM appointments")
    for appt_date, items in appointments_map.items():
        for item in items:
            c.execute(
                "INSERT INTO appointments (date, data) VALUES (?, ?)",
                (appt_date, json.dumps(item)),
            )
    conn.commit()
    conn.close()


def merge_appointments_map(new_entries: dict):
    existing = load_appointments_map()
    merged_count = 0

    for appt_date, items in new_entries.items():
        bucket = existing.setdefault(appt_date, [])
        existing_ids = {str(i.get("eventId")) for i in bucket if i.get("eventId")}

        for item in items:
            event_id = str(item.get("eventId") or "").strip()
            if event_id and event_id in existing_ids:
                continue
            bucket.append(item)
            if event_id:
                existing_ids.add(event_id)
            merged_count += 1

    write_appointments_map(existing)
    return merged_count


def build_invoice_calendar_entries(
    referral: str,
    details: dict,
    service_package: str,
    invoice_date: date,
    pricing_model: str,
    invoice_frequency: str,
):
    cleaning_frequency = normalize_frequency(details.get("cleaningAnswers", {}).get("Frequency"))
    if not cleaning_frequency:
        cleaning_frequency = normalize_frequency(details.get("frequency") or "")

    freq_count = safe_int(details.get("freqCount"), default=1, min_value=1, max_value=14)
    visits_per_period = freq_count
    if cleaning_frequency == "daily":
        visits_per_period = max(1, min(freq_count, 7))

    cleaning_dates = build_cleaning_dates(
        start_date=invoice_date,
        frequency=cleaning_frequency or invoice_frequency or "one-time",
        visits_per_period=visits_per_period,
        horizon_days=90,
    )
    billing_dates = build_billing_dates(
        start_date=invoice_date,
        pricing_model=pricing_model,
        cleaning_dates=cleaning_dates,
        horizon_days=90,
    )

    business = (details.get("business_name") or "").strip() or "Unknown Business"
    owner = (details.get("Ownername") or "").strip() or "Unknown Owner"
    add_ons = [
        str(x).strip()
        for x in (details.get("serviceAddOns") or [])
        if str(x).strip() and str(x).strip().lower() != "no add-on"
    ]
    add_on_text = ", ".join(add_ons) if add_ons else "None"
    times_per_day = safe_int(details.get("freqTimesPerDay"), default=1, min_value=1, max_value=6)

    entries = {}

    for idx, d in enumerate(cleaning_dates):
        key = calendar_key_from_date(d)
        item = {
            "eventId": f"{referral}:clean:{d.isoformat()}:{idx}",
            "owner": owner,
            "business": business,
            "location": details.get("selectedIndustry") or "",
            "startTime": "",
            "endTime": "",
            "type": f"Cleaning Visit - Package {service_package}",
            "comment": (
                f"Referral {referral} | Pricing: {pricing_model} | Add-ons: {add_on_text}"
                + (f" | Times/day: {times_per_day}" if cleaning_frequency == "daily" else "")
            ),
            "repeat": cleaning_frequency or "one-time",
            "source": "invoice",
            "referral": referral,
        }
        entries.setdefault(key, []).append(item)

    if (pricing_model or "").strip().lower() == "flat monthly contract":
        for idx, d in enumerate(billing_dates):
            key = calendar_key_from_date(d)
            item = {
                "eventId": f"{referral}:bill:{d.isoformat()}:{idx}",
                "owner": owner,
                "business": business,
                "location": details.get("selectedIndustry") or "",
                "startTime": "",
                "endTime": "",
                "type": "Invoice Billing - End of month contract",
                "comment": f"Referral {referral} monthly contract billing date",
                "repeat": "monthly",
                "source": "invoice",
                "referral": referral,
            }
            entries.setdefault(key, []).append(item)

    return entries, cleaning_dates, billing_dates


def get_submission_row_by_referral(cursor, referral: str):
    normalized = (referral or "").strip().upper()
    cursor.execute(
        "SELECT referral, details FROM submissions WHERE UPPER(referral)=?",
        (normalized,),
    )
    return cursor.fetchone()


@app.errorhandler(413)
def payload_too_large(_):
    return error_response("Uploaded file is too large (max 5MB)", 413)


# ------------------ INIT / MIGRATION ------------------
def init_db():
    conn = db()
    c = conn.cursor()

    # submissions
    c.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referral TEXT UNIQUE,
            details TEXT
        )
    """)

    # users (secure)
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            avatar_url TEXT,
            created_at TEXT
        )
    """)


    # invite codes (hashed, safe)
  # ---------- invite codes (NEW) ----------
    c.execute("""
        CREATE TABLE IF NOT EXISTS invite_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code_hash TEXT UNIQUE,
            is_used INTEGER DEFAULT 0,
            created_at TEXT
        )
    """)


    # appointments
    c.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            data TEXT
        )
    """)

    c.execute("CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_submissions_referral ON submissions(referral)")

    # --- lightweight migration in case old users table exists without columns ---
    c.execute("PRAGMA table_info(users)")
    cols = {row[1] for row in c.fetchall()}

    if "full_name" not in cols:
        try:
            c.execute("ALTER TABLE users ADD COLUMN full_name TEXT")
        except Exception:
            pass

    if "username" not in cols:
        try:
            c.execute("ALTER TABLE users ADD COLUMN username TEXT")
        except Exception:
            pass

    if "password_hash" not in cols:
        # If your table used to have "password" you should migrate by deleting DB (dev)
        # or add this column and force reset passwords.
        try:
            c.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        except Exception:
            pass
    if "avatar_url" not in cols:
        try:
            c.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        except Exception:
            pass
    if "created_at" not in cols:
        try:
            c.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
        except Exception:
            pass

    conn.commit()
    conn.close()

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/profile/avatar", methods=["POST"])
def upload_avatar():
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        return jsonify({"error": "Invalid image type"}), 400
    if file.mimetype and not file.mimetype.startswith("image/"):
        return jsonify({"error": "Uploaded file must be an image"}), 400

    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_AVATAR_BYTES:
        return jsonify({"error": "Uploaded file is too large (max 5MB)"}), 413

    filename = secure_filename(f"{uuid.uuid4()}{ext}")
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    file.save(path)

    avatar_url = f"/uploads/{filename}"

    conn = db()
    c = conn.cursor()
    c.execute(
        "UPDATE users SET avatar_url=? WHERE id=?",
        (avatar_url, user_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"avatar": avatar_url})

@app.route("/profile", methods=["GET", "PUT"])
def get_profile():
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    conn = db()
    c = conn.cursor()

    if request.method == "GET":
        c.execute("""
            SELECT full_name, username, email, avatar_url, created_at
            FROM users WHERE id=?
        """, (user_id,))
        row = c.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "fullName": row[0],
            "username": row[1],
            "email": row[2],
            "avatar": row[3],
            "created_at": row[4],
        })

    # PUT (update)
    data, parse_error = parse_json_body()
    if parse_error:
        conn.close()
        return parse_error

    full_name = clean_text(data.get("fullName"), max_len=120)
    username = (data.get("username") or "").strip().lower()
    if not username:
        conn.close()
        return error_response("Username required", 400)
    if not is_valid_username(username):
        conn.close()
        return error_response("Username must be 3-30 chars: lowercase letters, numbers, underscore", 400)

    try:
        if "avatar" in data:
            avatar = (data.get("avatar") or "").strip() or None
            if avatar and not avatar.startswith("/uploads/"):
                conn.close()
                return error_response("Avatar path is invalid", 400)
            c.execute("""
                UPDATE users
                SET full_name=?, username=?, avatar_url=?
                WHERE id=?
            """, (full_name, username, avatar, user_id))
        else:
            c.execute("""
                UPDATE users
                SET full_name=?, username=?
                WHERE id=?
            """, (full_name, username, user_id))
    except sqlite3.IntegrityError:
        conn.close()
        return error_response("Username already taken", 409)

    conn.commit()
    conn.close()

    return jsonify({"success": True})


@app.route("/admin/create_invite", methods=["POST"])
def create_invite():
    _, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error
    raw_code = (data.get("code") or "").strip().upper()

    if not raw_code:
        return jsonify({"error": "Invite code required"}), 400

    try:
        code_hash = invite_hash(raw_code)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    conn = db()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO invite_codes (code_hash, created_at) VALUES (?, ?)",
            (code_hash, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Invite code already exists"}), 409

    conn.close()
    return jsonify({"status": "invite_created", "code": raw_code})


init_db()


# ------------------ APPOINTMENTS ------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    conn = db()
    c = conn.cursor()
    c.execute("SELECT date, data FROM appointments")
    rows = c.fetchall()
    conn.close()

    result = {}
    for date, data in rows:
        result.setdefault(date, []).append(json.loads(data))

    return jsonify(result)


@app.route("/appointments", methods=["POST"])
def save_appointments():
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    normalized = {}
    for date, items in data.items():
        if not isinstance(items, list):
            return error_response(f"Invalid value for date '{date}'. Expected a list.", 400)
        normalized_items = []
        for item in items:
            if not isinstance(item, dict):
                return error_response(
                    f"Invalid appointment for date '{date}'. Expected an object.",
                    400,
                )
            normalized_items.append(item)
        normalized[date] = normalized_items

    write_appointments_map(normalized)
    return jsonify({"success": True})


# ------------------ SUBMISSIONS (REFERRAL DATA) ------------------
@app.route('/data', methods=['POST'])
def save_data():
    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    referral = (data.get("referralCode") or "").strip().upper()
    details = data.get("details")

    if not referral:
        return jsonify({"error": "Referral code required"}), 400
    if len(referral) > 64:
        return jsonify({"error": "Referral code too long"}), 400
    if not re.fullmatch(r"[A-Z0-9-]+", referral):
        return jsonify({"error": "Referral code format is invalid"}), 400

    if not isinstance(details, dict):
        return jsonify({"error": "Details must be JSON object"}), 400

    validation_errors = validate_submission_details(details)
    if validation_errors:
        return jsonify({
            "error": validation_errors[0],
            "validationErrors": validation_errors[:8],
        }), 400

    # Normalize selected list fields to keep downstream logic predictable.
    details["serviceAddOns"] = clean_string_list(details.get("serviceAddOns"), max_items=12)
    details["specialRequests"] = clean_string_list(details.get("specialRequests"), max_items=12)

    details_str = json.dumps(details)

    conn = db()
    c = conn.cursor()

    try:
        c.execute(
            "INSERT INTO submissions (referral, details) VALUES (?, ?)",
            (referral, details_str)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Referral code already used"}), 409

    conn.close()
    return jsonify({"status": "success", "referralCode": referral})


@app.route('/data/<referral>', methods=['GET'])
def get_data(referral):
    conn = db()
    c = conn.cursor()
    row = get_submission_row_by_referral(c, referral)
    conn.close()

    if not row:
        return jsonify({"error": "Referral not found"}), 404

    stored_referral, details_raw = row
    details = json.loads(details_raw)
    return jsonify({"referralCode": stored_referral, "details": details})


@app.route("/save_contact", methods=["POST"])
def save_contact():
    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    referral = (data.get("referral") or "").strip().upper()

    if not referral:
        return jsonify({"error": "Missing referral"}), 400
    if data.get("email") and not is_valid_email(data.get("email")):
        return jsonify({"error": "Invalid email"}), 400

    conn = db()
    c = conn.cursor()
    row = get_submission_row_by_referral(c, referral)

    if not row:
        conn.close()
        return jsonify({"error": "Referral not found"}), 404

    stored_referral, details_raw = row
    details = json.loads(details_raw)

    details.update({
        "Ownername": clean_text(data.get("name"), max_len=120),
        "business_name": clean_text(data.get("business_name"), max_len=180),
        "email": clean_text(data.get("email"), max_len=180),
        "phone": clean_text(data.get("phone"), max_len=40),
        "message": clean_text(data.get("message"), max_len=2000, allow_newlines=True),
    })

    c.execute(
        "UPDATE submissions SET details=? WHERE referral=?",
        (json.dumps(details), stored_referral)
    )

    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route('/register', methods=['POST'])
def register():
    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    full_name = clean_text(data.get("fullName"), max_len=120)
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    referral = (data.get("referral") or "").strip().upper()
    owner_invite_code = (os.getenv("OWNER_INVITE_CODE") or "").strip().upper()

    # ---- BASIC VALIDATION FIRST ----
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not username:
        return jsonify({"error": "Username required"}), 400
    if not is_valid_username(username):
        return jsonify({"error": "Username must be 3-30 chars: lowercase letters, numbers, underscore"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if not referral:
        return jsonify({"error": "Owner code required"}), 400

    # ---- OWNER CODE CHECK (ONLY ONCE) ----
    if referral != owner_invite_code:
        return jsonify({
            "error": "Invalid owner approval code. Account not authorized."
        }), 403

    # ---- CREATE ACCOUNT ----
    password_hash = generate_password_hash(password)

    conn = db()
    c = conn.cursor()

    try:
        c.execute("""
            INSERT INTO users (full_name, username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            full_name,
            username,
            email,
            password_hash,
            datetime.now(timezone.utc).isoformat(),
        ))
        conn.commit()

    except sqlite3.IntegrityError as e:
        conn.close()
        msg = str(e).lower()

        if "email" in msg:
            return jsonify({"error": "Email already registered"}), 409
        if "username" in msg:
            return jsonify({"error": "Username already taken"}), 409

        return jsonify({"error": "Account already exists"}), 409

    conn.close()
    return jsonify({"status": "registered", "email": email})


@app.route('/login', methods=['POST'])
def login():
    blocked = apply_rate_limit("login", RATE_LIMIT_LOGIN[0], RATE_LIMIT_LOGIN[1])
    if blocked:
        return blocked

    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid credentials"}), 401

    conn = db()
    c = conn.cursor()
    c.execute("SELECT id, password_hash FROM users WHERE email=?", (email,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Invalid credentials"}), 401

    user_id, password_hash = row

    if not password_hash or not check_password_hash(password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = serializer.dumps({"user_id": user_id, "email": email})
    return jsonify({"status": "success", "email": email, "token": token})


@app.route("/auth/me", methods=["GET"])
def auth_me():
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    return jsonify({"ok": True, "user": {"user_id": user_id}})


@app.route("/change_password", methods=["POST"])
def change_password():
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    conn = db()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE id=?", (user_id,))
    row = c.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    existing_hash = row[0]
    if not existing_hash or not check_password_hash(existing_hash, current_password):
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 401

    c.execute(
        "UPDATE users SET password_hash=? WHERE id=?",
        (generate_password_hash(new_password), user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ------------------ STRIPE INVOICE ------------------
@app.route("/create_invoice", methods=["POST"])
def create_invoice():
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    blocked = apply_rate_limit("create_invoice", RATE_LIMIT_INVOICE[0], RATE_LIMIT_INVOICE[1])
    if blocked:
        return blocked

    data, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    if not stripe.api_key:
        return error_response("Stripe is not configured", 500)

    referral = (data.get("referralCode") or "").strip().upper()
    override_email = data.get("email")
    override_amount = data.get("amountCents")
    due = data.get("due")
    override_package = data.get("servicePackage")

    if not referral:
        return error_response("Referral code required", 400)

    conn = db()
    c = conn.cursor()
    row = get_submission_row_by_referral(c, referral)
    conn.close()

    if not row:
        return error_response("Referral not found", 404)

    stored_referral, details_raw = row
    details = json.loads(details_raw)

    email = override_email or details.get("email")
    amount_cents = override_amount or details.get("amountCents")
    currency = str(details.get("currency", "cad")).strip().lower()
    if currency not in CURRENCY_WHITELIST:
        currency = "cad"

    if not email:
        return error_response("Missing email", 400)
    if not is_valid_email(email):
        return error_response("Invalid email", 400)

    if not amount_cents:
        return error_response("Missing amountCents", 400)

    try:
        amount_cents = int(amount_cents)
    except Exception:
        return error_response("Invalid amountCents", 400)
    if amount_cents <= 0:
        return error_response("amountCents must be greater than 0", 400)

    pricing_model = (details.get("pricingModel") or "").strip()
    cleaning_frequency = normalize_frequency(details.get("cleaningAnswers", {}).get("Frequency") or details.get("frequency"))
    invoice_frequency = infer_invoice_frequency(details, cleaning_frequency, pricing_model.lower())
    service_package = infer_package(details, override_package)
    invoice_type = "Package"

    due_date = None
    if due:
        try:
            due_date = datetime.strptime(due, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid due date format. Use YYYY-MM-DD", 400)
    else:
        today_utc = datetime.now(timezone.utc).date()
        if pricing_model.lower() == "flat monthly contract":
            due_date = end_of_month(today_utc)
        else:
            due_date = today_utc

    if due_date < datetime.now(timezone.utc).date():
        return error_response("Due date cannot be in the past", 400)

    due_timestamp = int(
        datetime.combine(due_date, datetime.min.time())
        .replace(tzinfo=timezone.utc)
        .timestamp()
    )

    special_requests = details.get("specialRequests", [])
    if not isinstance(special_requests, list):
        special_requests = [str(special_requests)]
    add_ons = [
        str(a).strip()
        for a in (details.get("serviceAddOns") or [])
        if str(a).strip() and str(a).strip().lower() != "no add-on"
    ]
    add_ons_text = ", ".join(add_ons) if add_ons else "None"

    try:
        customer = stripe.Customer.create(
            email=email,
            metadata={
                "referral": stored_referral,
                "client_name": (details.get("Ownername") or "")[:120],
                "phone": (details.get("phone") or "")[:40],
                "service_package": service_package,
            }
        )

        invoice_description = (
            f"{invoice_type} - {service_package} | Pricing: {pricing_model or 'N/A'} | "
            f"Frequency: {invoice_frequency} | Add-ons: {add_ons_text}"
        )

        invoice = stripe.Invoice.create(
            customer=customer.id,
            collection_method="send_invoice",
            due_date=due_timestamp,
            description=invoice_description,
            metadata={
                "referral": stored_referral,
                "service_package": service_package,
                "pricing_model": pricing_model[:120],
                "invoice_frequency": invoice_frequency,
            }
        )

        stripe.InvoiceItem.create(
            customer=customer.id,
            invoice=invoice.id,
            amount=int(amount_cents),
            currency=currency,
            description=(
                f"{invoice_type} - {service_package}; "
                f"Add-ons: {add_ons_text}; "
                f"Special requests: {', '.join(special_requests) if special_requests else 'None'}"
            )[:500]
        )

        invoice = stripe.Invoice.finalize_invoice(invoice.id)
    except stripe.error.StripeError as exc:
        msg = getattr(exc, "user_message", None) or str(exc)
        return error_response(f"Failed to create Stripe invoice: {msg}", 502)

    calendar_entries, cleaning_dates, billing_dates = build_invoice_calendar_entries(
        referral=stored_referral,
        details=details,
        service_package=service_package,
        invoice_date=due_date,
        pricing_model=pricing_model,
        invoice_frequency=invoice_frequency,
    )
    merged_appointments = merge_appointments_map(calendar_entries)

    details["servicePackage"] = service_package
    details["invoiceType"] = invoice_type
    details["invoiceFrequency"] = invoice_frequency
    details["invoiceStartDate"] = due_date.isoformat()
    details["lastInvoice"] = {
        "invoiceId": invoice.id,
        "invoiceUrl": invoice.hosted_invoice_url,
        "amountCents": amount_cents,
        "currency": currency,
        "dueDate": due_date.isoformat(),
        "servicePackage": service_package,
        "pricingModel": pricing_model,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    conn = db()
    c = conn.cursor()
    c.execute(
        "UPDATE submissions SET details=? WHERE referral=?",
        (json.dumps(details), stored_referral),
    )
    conn.commit()
    conn.close()

    return jsonify({
        "status": "invoice_created",
        "invoice_id": invoice.id,
        "invoice_url": invoice.hosted_invoice_url,
        "invoice_type": invoice_type,
        "service_package": service_package,
        "add_ons": add_ons,
        "calendar_updates": {
            "addedEntries": merged_appointments,
            "cleaningDates": [d.isoformat() for d in cleaning_dates[:24]],
            "billingDates": [d.isoformat() for d in billing_dates[:12]],
        },
    })

@app.route("/leads/<referral>", methods=["DELETE"])
def delete_lead(referral):
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    referral_key = (referral or "").strip().upper()
    conn = db()
    c = conn.cursor()
    c.execute("DELETE FROM submissions WHERE UPPER(referral)=?", (referral_key,))
    conn.commit()
    deleted_rows = c.rowcount
    conn.close()
    if deleted_rows == 0:
        return error_response("Lead not found", 404)
    return jsonify({"success": True})

# ------------------ LEADS ------------------
@app.route("/leads", methods=["GET"])
def get_leads():
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    search_q = clean_text(request.args.get("q"), max_len=100).lower()
    sort = (request.args.get("sort") or "submittedAt_desc").strip().lower()
    limit = safe_int(request.args.get("limit"), default=500, min_value=1, max_value=2000)

    conn = db()
    c = conn.cursor()
    c.execute("SELECT referral, details FROM submissions")
    rows = c.fetchall()
    conn.close()

    leads = []
    for referral, details in rows:
        try:
            d = json.loads(details)
        except Exception as e:
            print(f"Skipping invalid JSON for referral {referral}: {e}")
            continue

        lead = {
            "id": referral,
            "company": d.get("business_name"),
            "name": d.get("Ownername"),
            "email": d.get("email"),
            "amountCents": d.get("amountCents"),
            "submittedAt": d.get("submittedAt"),
            "frequency": (
                d.get("invoiceFrequency")
                or d.get("cleaningAnswers", {}).get("Frequency")
            ),
            "invoiceFrequency": d.get("invoiceFrequency"),
            "invoiceStartDate": d.get("invoiceStartDate"),
        }

        if search_q:
            searchable = " ".join(
                str(lead.get(k) or "")
                for k in ("id", "company", "name", "email")
            ).lower()
            if search_q not in searchable:
                continue

        leads.append(lead)

    reverse = sort != "submittedat_asc"
    leads.sort(key=lambda x: (x.get("submittedAt") or ""), reverse=reverse)

    return jsonify(leads[:limit])

@app.route("/leads/<referral>", methods=["PUT"])
def update_lead(referral):
    _, error_response_obj = get_authenticated_user_id()
    if error_response_obj:
        return error_response_obj

    incoming, parse_error = parse_json_body()
    if parse_error:
        return parse_error

    conn = db()
    c = conn.cursor()

    row = get_submission_row_by_referral(c, referral)
    if not row:
        conn.close()
        return error_response("Lead not found", 404)

    stored_referral, details_raw = row
    existing = json.loads(details_raw)

    allowed_keys = {
        "Ownername",
        "business_name",
        "email",
        "phone",
        "message",
        "sqft",
        "frequency",
        "selectedIndustry",
        "footTraffic",
        "operatingHours",
        "pricingModel",
        "freqCount",
        "freqTimesPerDay",
        "qualityExpectations",
        "currentCond",
        "currentCondition",
        "sharedSpaces",
        "addOns",
        "serviceAddOns",
        "specialRequests",
        "invoiceFrequency",
        "invoiceDay",
        "servicePackage",
        "footTrafficAnswers",
        "cleaningAnswers",
        "conditionAnswers",
    }
    safe_incoming = {k: incoming[k] for k in incoming.keys() if k in allowed_keys}

    if "email" in safe_incoming:
        email = clean_text(safe_incoming.get("email"), max_len=180).lower()
        if email and not is_valid_email(email):
            conn.close()
            return error_response("Invalid email format", 400)
        safe_incoming["email"] = email

    text_fields = {
        "Ownername": 120,
        "business_name": 180,
        "phone": 40,
        "message": 2000,
        "selectedIndustry": 140,
        "footTraffic": 120,
        "operatingHours": 120,
        "pricingModel": 120,
        "qualityExpectations": 220,
        "currentCond": 120,
        "currentCondition": 120,
        "invoiceFrequency": 40,
        "invoiceDay": 40,
        "servicePackage": 40,
    }
    for key, max_len in text_fields.items():
        if key in safe_incoming:
            safe_incoming[key] = clean_text(
                safe_incoming.get(key),
                max_len=max_len,
                allow_newlines=(key == "message"),
            )

    if "sqft" in safe_incoming and safe_incoming["sqft"] not in ("", None):
        try:
            sqft_val = float(safe_incoming["sqft"])
            if sqft_val < 0:
                raise ValueError
            safe_incoming["sqft"] = sqft_val
        except Exception:
            conn.close()
            return error_response("sqft must be a non-negative number", 400)

    if "freqCount" in safe_incoming:
        safe_incoming["freqCount"] = safe_int(
            safe_incoming.get("freqCount"), default=1, min_value=1, max_value=31
        )
    if "freqTimesPerDay" in safe_incoming:
        safe_incoming["freqTimesPerDay"] = safe_int(
            safe_incoming.get("freqTimesPerDay"), default=1, min_value=1, max_value=6
        )

    for list_key in ("sharedSpaces", "addOns", "serviceAddOns", "specialRequests"):
        if list_key in safe_incoming:
            safe_incoming[list_key] = clean_string_list(safe_incoming.get(list_key), max_items=16)

    for obj_key in ("footTrafficAnswers", "cleaningAnswers", "conditionAnswers"):
        if obj_key in safe_incoming and not isinstance(safe_incoming[obj_key], dict):
            conn.close()
            return error_response(f"{obj_key} must be an object", 400)

    existing.update(safe_incoming)

    c.execute(
        "UPDATE submissions SET details=? WHERE referral=?",
        (json.dumps(existing), stored_referral)
    )

    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ------------------ RUN ------------------
if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "0") == "1")

