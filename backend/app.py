from flask import Flask, request, jsonify,  send_from_directory
from flask_cors import CORS
import sqlite3
import os
import json
import stripe
from dotenv import load_dotenv
from datetime import datetime, timezone
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import hmac
import hashlib
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

# ------------------ ENV ------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

APP_SECRET_KEY = os.getenv("APP_SECRET_KEY")
INVITE_PEPPER = os.getenv("INVITE_PEPPER")

# ------------------ APP ------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = APP_SECRET_KEY
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
# ------------------ APP ------------------


# If you want stricter CORS (recommended):
# CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
CORS(app)

# ------------------ UPLOADS ------------------
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ensure folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = "data.db"


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "ok", "message": "Flask backend running"})


# ------------------ HELPERS ------------------
def db():
    return sqlite3.connect(DB_PATH)

def invite_hash(code: str) -> str:
    code = (code or "").strip().upper()
    return hmac.new(
        INVITE_PEPPER.encode("utf-8"),
        code.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


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
            avatar_url TEXT
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

    conn.commit()
    conn.close()

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

from werkzeug.utils import secure_filename
import uuid

@app.route("/profile/avatar", methods=["POST"])
def upload_avatar():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth.split(" ", 1)[1]
    try:
        payload = serializer.loads(token)
        user_id = payload["user_id"]
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        return jsonify({"error": "Invalid image type"}), 400

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

@app.route("/profile", methods=["PUT"])
def update_profile():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth.split(" ", 1)[1]
    try:
        payload = serializer.loads(token)
        user_id = payload["user_id"]
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    data = request.json or {}
    full_name = data.get("fullName")
    username = data.get("username")

    conn = db()
    c = conn.cursor()
    c.execute("""
        UPDATE users
        SET full_name = ?, username = ?
        WHERE id = ?
    """, (full_name, username, user_id))
    conn.commit()
    conn.close()

    return jsonify({"status": "updated"})

@app.route("/profile", methods=["GET", "PUT"])
def get_profile():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth.split(" ", 1)[1]

    try:
        payload = serializer.loads(token, max_age=60 * 60 * 24)
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["user_id"]

    conn = db()
    c = conn.cursor()

    if request.method == "GET":
        c.execute("""
            SELECT full_name, username, email, avatar_url
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
        })

    # PUT (update)
    data = request.json or {}
    c.execute("""
        UPDATE users
        SET full_name=?, username=?, avatar_url=?
        WHERE id=?
    """, (
        data.get("fullName"),
        data.get("username"),
        data.get("avatar"),
        user_id
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True})


@app.route("/admin/create_invite", methods=["POST"])
def create_invite():
    data = request.json or {}
    raw_code = (data.get("code") or "").strip().upper()

    if not raw_code:
        return jsonify({"error": "Invite code required"}), 400

    code_hash = invite_hash(raw_code)

    c.execute(
        "INSERT INTO invite_codes (code_hash, created_at) VALUES (?, ?)",
        (code_hash, datetime.utcnow().isoformat())
    )


init_db()


# ------------------ APPOINTMENTS ------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
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
    data = request.json
    if not data:
        return jsonify({"error": "Empty payload"}), 400

    conn = db()
    c = conn.cursor()
    c.execute("DELETE FROM appointments")

    for date, items in data.items():
        for item in items:
            c.execute(
                "INSERT INTO appointments (date, data) VALUES (?, ?)",
                (date, json.dumps(item))
            )

    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ------------------ SUBMISSIONS (REFERRAL DATA) ------------------
@app.route('/data', methods=['POST'])
def save_data():
    data = request.json or {}
    referral = (data.get("referralCode") or "").strip()
    details = data.get("details")

    if not referral:
        return jsonify({"error": "Referral code required"}), 400

    if not isinstance(details, dict):
        return jsonify({"error": "Details must be JSON object"}), 400

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
    c.execute("SELECT details FROM submissions WHERE referral = ?", (referral,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Referral not found"}), 404

    details = json.loads(row[0])
    return jsonify({"referralCode": referral, "details": details})


@app.route("/save_contact", methods=["POST"])
def save_contact():
    data = request.json or {}
    referral = (data.get("referral") or "").strip().upper()

    if not referral:
        return jsonify({"error": "Missing referral"}), 400

    conn = db()
    c = conn.cursor()
    c.execute("SELECT details FROM submissions WHERE referral=?", (referral,))
    row = c.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Referral not found"}), 404

    details = json.loads(row[0])

    details.update({
        "Ownername": data.get("name"),
        "business_name": data.get("business_name"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "message": data.get("message"),
    })

    c.execute(
        "UPDATE submissions SET details=? WHERE referral=?",
        (json.dumps(details), referral)
    )

    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route('/register', methods=['POST'])
def register():
    data = request.json or {}

    full_name = (data.get("fullName") or "").strip()
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    referral = (data.get("referral") or "").strip()

    OWNER_INVITE_CODE = (os.getenv("OWNER_INVITE_CODE") or "").strip()

    # ---- BASIC VALIDATION FIRST ----
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if not username:
        return jsonify({"error": "Username required"}), 400

    if not referral:
        return jsonify({"error": "Owner code required"}), 400

    # ---- OWNER CODE CHECK (ONLY ONCE) ----
    if referral != OWNER_INVITE_CODE:
        return jsonify({
            "error": "Invalid owner approval code. Account not authorized."
        }), 403

    # ---- CREATE ACCOUNT ----
    password_hash = generate_password_hash(password)

    conn = db()
    c = conn.cursor()

    try:
        c.execute("""
            INSERT INTO users (full_name, username, email, password_hash)
            VALUES (?, ?, ?, ?)
        """, (full_name, username, email, password_hash))
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
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    

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
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Missing token"}), 401

    token = auth.split(" ", 1)[1]
    try:
        payload = serializer.loads(token, max_age=60 * 60 * 24)  # 24h
        return jsonify({"ok": True, "user": payload})
    except SignatureExpired:
        return jsonify({"error": "Token expired"}), 401
    except BadSignature:
        return jsonify({"error": "Invalid token"}), 401


# ------------------ STRIPE INVOICE ------------------
@app.route("/create_invoice", methods=["POST"])
def create_invoice():
    data = request.json or {}

    referral = data.get("referralCode")
    override_email = data.get("email")
    override_amount = data.get("amountCents")
    due = data.get("due")

    if not referral:
        return jsonify({"error": "Referral code required"}), 400

    conn = db()
    c = conn.cursor()
    c.execute("SELECT details FROM submissions WHERE referral = ?", (referral,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Referral not found"}), 404

    details = json.loads(row[0])

    email = override_email or details.get("email")
    amount_cents = override_amount or details.get("amountCents")
    currency = details.get("currency", "cad")

    if not email:
        return jsonify({"error": "Missing email"}), 400

    if not amount_cents:
        return jsonify({"error": "Missing amountCents"}), 400

    try:
        amount_cents = int(amount_cents)
    except Exception:
        return jsonify({"error": "Invalid amountCents"}), 400

    due_timestamp = None
    if due:
        due_timestamp = int(
            datetime.strptime(due, "%Y-%m-%d")
            .replace(tzinfo=timezone.utc)
            .timestamp()
        )

    customer = stripe.Customer.create(
        email=email,
        metadata={
            "referral": referral,
            "client_name": details.get("Ownername"),
            "phone": details.get("phone"),
        }
    )

    invoice = stripe.Invoice.create(
        customer=customer.id,
        collection_method="send_invoice",
        due_date=due_timestamp,
        description="Commercial Cleaning Service"
    )

    def text_row(text):
        stripe.InvoiceItem.create(
            customer=customer.id,
            invoice=invoice.id,
            amount=0,
            currency=currency,
            description=(text or "")[:500]
        )

    stripe.InvoiceItem.create(
        customer=customer.id,
        invoice=invoice.id,
        amount=int(amount_cents),
        currency=currency,
        description="Commercial Cleaning Service"
    )

    text_row("FACILITY DETAILS")
    text_row(f"Industry: {details.get('selectedIndustry')}")
    text_row(f"Square Footage: {details.get('sqft')}")
    text_row(f"Operating Hours: {details.get('footTrafficAnswers', {}).get('Operating Hours')}")
    text_row(f"Foot Traffic: {details.get('footTrafficAnswers', {}).get('Foot traffic')}")
    text_row(" ")

    text_row("SERVICE DETAILS")
    text_row(f"Frequency: {details.get('cleaningAnswers', {}).get('Frequency')}")
    text_row(f"Times per Visit: {details.get('freqTimesPerDay')}")
    text_row(f"Condition: {details.get('conditionAnswers', {}).get('Current Condition')}")
    text_row(f"Problem: {details.get('conditionAnswers', {}).get('Current Problem')}")
    text_row(f"Quality Level: {details.get('qualityExpectations')}")
    text_row(f"Pricing Model: {details.get('pricingModel')}")
    text_row(f"Special Requests: {', '.join(details.get('specialRequests', []))}")
    text_row(" ")

    addons = details.get("serviceAddOns", [])
    if addons:
        text_row("ADD-ONS")
        for addon in addons:
            text_row(addon)

    invoice = stripe.Invoice.finalize_invoice(invoice.id)

    return jsonify({
        "status": "invoice_created",
        "invoice_id": invoice.id,
        "invoice_url": invoice.hosted_invoice_url
    })

@app.route("/leads/<referral>", methods=["DELETE"])
def delete_lead(referral):
    conn = db()
    c = conn.cursor()
    c.execute("DELETE FROM submissions WHERE referral=?", (referral,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ------------------ LEADS ------------------
@app.route("/leads", methods=["GET"])
def get_leads():
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
            print(f"⚠️ Skipping invalid JSON for referral {referral}: {e}")
            continue

        leads.append({
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
        })

    return jsonify(leads)

@app.route("/leads/<referral>", methods=["PUT"])
def update_lead(referral):
    incoming = request.json or {}

    conn = db()
    c = conn.cursor()

    c.execute("SELECT details FROM submissions WHERE referral=?", (referral,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Lead not found"}), 404

    existing = json.loads(row[0])
    existing.update(incoming)

    c.execute(
        "UPDATE submissions SET details=? WHERE referral=?",
        (json.dumps(existing), referral)
    )

    conn.commit()
    conn.close()
    return jsonify({"success": True})

print("APP_SECRET_KEY loaded:", bool(APP_SECRET_KEY))
print("INVITE_PEPPER loaded:", bool(INVITE_PEPPER))
print("OWNER_INVITE_CODE loaded:", repr(os.getenv("OWNER_INVITE_CODE")))

# ------------------ RUN ------------------
if __name__ == "__main__":
    app.run(debug=True)
