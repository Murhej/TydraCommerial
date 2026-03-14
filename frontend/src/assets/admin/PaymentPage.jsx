import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import { ApiError, apiGet, apiPost } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import { EmptyState, InlineNotice } from "../../components/ui/PageStates";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import "./Payments.css";

function normalizeFrequency(value = "") {
  const v = value.toLowerCase().trim();
  if (v === "biweekly") return "bi-weekly";
  return v;
}

function inferPackage(details = {}) {
  const explicit = (details.servicePackage || "").trim();
  if (explicit) return explicit;
  return details.pricingModel === "Flat monthly contract" ? "Premium" : "Basic";
}

export default function PaymentPage() {
  usePageMeta("Payments", "Lookup referrals and send invoices with schedule sync.");
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("error");

  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [servicePackage, setServicePackage] = useState("Basic");

  const [sending, setSending] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const details = useMemo(() => data?.details || {}, [data]);

  const addOns = useMemo(
    () => (details?.serviceAddOns || []).filter((a) => String(a).toLowerCase() !== "no add-on"),
    [details]
  );

  const frequency = normalizeFrequency(details?.invoiceFrequency || details?.cleaningAnswers?.Frequency || "");

  const billingHint = useMemo(() => {
    if (details?.pricingModel === "Flat monthly contract") {
      return "Monthly contract billing is scheduled at end of month.";
    }
    return "Per square foot and hourly pricing is billed on scheduled cleaning dates.";
  }, [details]);

  const handleLookup = async () => {
    setMessage("");
    setMessageTone("error");
    setData(null);
    setInvoiceResult(null);

    const referral = referralCode.trim();
    if (!referral) {
      setFormErrors({ referralCode: "Referral code is required." });
      setMessage("Please enter a referral code.");
      setMessageTone("error");
      return;
    }
    setFormErrors({});

    try {
      const json = await apiGet(`/data/${referral}`, { auth: true });

      setData(json);
      setEmail(json?.details?.email || "");

      const initialAmount = json?.details?.amountCents
        ? (Number(json.details.amountCents) / 100).toFixed(2)
        : "";
      setAmount(initialAmount);
      setServicePackage(inferPackage(json?.details || {}));
      setDue("");
      setMessageTone("info");
      setMessage("Referral loaded successfully.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setMessage(err.message || "Failed to lookup referral.");
      setMessageTone("error");
    }
  };

  const sendInvoice = async () => {
    if (!data?.referralCode) {
      setMessage("Please lookup a referral first.");
      setMessageTone("error");
      return;
    }

    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Customer email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = "Amount must be greater than 0.";
    }

    if (!due) {
      nextErrors.due = "Choose the first charge date.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please correct the invoice fields highlighted below.");
      setMessageTone("error");
      return;
    }

    setSending(true);
    setMessage("");
    setMessageTone("info");
    setInvoiceResult(null);

    const controller = new AbortController();

    try {
      const json = await apiPost(
        "/create_invoice",
        {
          referralCode: data.referralCode,
          email: email.trim(),
          amountCents: Math.round(numericAmount * 100),
          due,
          servicePackage,
        },
        {
          auth: true,
          timeoutMs: 45000,
          signal: controller.signal,
        }
      );

      setInvoiceResult(json);
      setMessage("Invoice created successfully. Calendar was updated from invoice schedule.");
      setMessageTone("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      if (err instanceof ApiError && err.status === 408) {
        setMessage("Invoice request timed out. Please try again.");
        setMessageTone("error");
      } else {
        setMessage(err.message || "Failed to send invoice.");
        setMessageTone("error");
      }
    } finally {
      controller.abort();
      setSending(false);
    }
  };

  const canSend = Boolean(data?.referralCode) && !sending;

  return (
    <div className="payment-wrapper">
      <Header />
      <div className="searchRefBar">
        <PageHeader
          title="Payments & Referrals"
          subtitle="Lookup leads, review billing profile, and send invoice links."
        />

        <div className="lookupRow">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value);
              setFormErrors((prev) => ({ ...prev, referralCode: "" }));
            }}
            placeholder="Enter referral code"
            className="referInput"
          />
          <Button className="lookup-btn" onClick={handleLookup}>
            Lookup
          </Button>
        </div>
        {formErrors.referralCode && <p className="fieldError">{formErrors.referralCode}</p>}

        <InlineNotice tone={messageTone === "error" ? "error" : messageTone === "success" ? "success" : "info"}>
          {message}
        </InlineNotice>
      </div>

      <div className="viewBox">
        {!data && (
          <section className="payment-empty">
            <EmptyState
              title="Lookup a referral to view billing details"
              description="Enter a referral code above to load client details, invoice settings, and schedule notes."
            />
          </section>
        )}

        {data && (
          <div className="Payments">
            <h3>Referral: {data.referralCode}</h3>

            <div className="kv-card">
              <div className="kv"><span className="k">Client Name</span><span className="v">{details?.Ownername || "N/A"}</span></div>
              <div className="kv"><span className="k">Business</span><span className="v">{details?.business_name || "N/A"}</span></div>
              <div className="kv"><span className="k">Email</span><span className="v">{details?.email || "N/A"}</span></div>
              <div className="kv"><span className="k">Phone</span><span className="v">{details?.phone || "N/A"}</span></div>
              <div className="kv"><span className="k">Message</span><span className="v">{details?.message || "N/A"}</span></div>
              <div className="kv"><span className="k">Referral Code</span><span className="v code">{data?.referralCode}</span></div>
            </div>

            <div className="kv-card">
              <div className="kv vblock"><span className="k">SqFt</span><span className="v">{details?.sqft || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Industry</span><span className="v">{details?.selectedIndustry || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Foot Traffic</span><span className="v">{details?.footTrafficAnswers?.["Foot traffic"] || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Operating Hours</span><span className="v">{details?.footTrafficAnswers?.["Operating Hours"] || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Shared Spaces</span><span className="v">{(details?.footTrafficAnswers?.["Shared Spaces - (choose that apply)"] || []).join(", ") || "None"}</span></div>
              <div className="kv vblock"><span className="k">Cleaning Frequency</span><span className="v">{details?.cleaningAnswers?.Frequency || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Visits (over period)</span><span className="v">{details?.freqCount || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Times / day</span><span className="v">{details?.freqTimesPerDay || "1"}</span></div>
              <div className="kv vblock"><span className="k">Special Requests</span><span className="v">{(details?.specialRequests || []).join(", ") || "None"}</span></div>
              <div className="kv vblock"><span className="k">Condition</span><span className="v">{details?.conditionAnswers?.["Current Condition"] || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Problem</span><span className="v">{details?.conditionAnswers?.["Current Problem"] || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Pricing Model</span><span className="v">{details?.pricingModel || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Quality Level</span><span className="v">{details?.qualityExpectations || "N/A"}</span></div>
              <div className="kv vblock"><span className="k">Add-Ons</span><span className="v">{addOns.join(", ") || "None"}</span></div>
            </div>

            <div className="kv-card">
              <h4 className="card-title">Billing & Cleaning Schedule</h4>
              <div className="kv vblock"><span className="k">Invoice Type</span><span className="v">Package - {servicePackage}</span></div>
              <div className="kv vblock"><span className="k">Invoice Frequency</span><span className="v">{frequency ? frequency.toUpperCase() : "AUTO"}</span></div>
              <div className="kv vblock"><span className="k">Billing Rule</span><span className="v">{billingHint}</span></div>
            </div>

            <div className="invoiceBox">
              <h4>Send Invoice</h4>

              <label className="fieldLabel">Customer Email</label>
              <input
                className="input"
                placeholder="Customer Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {formErrors.email && <p className="fieldError">{formErrors.email}</p>}

              <label className="fieldLabel">Invoice Type</label>
              <div className="invoiceTypeRow">
                <span className="invoiceTypeText">Package</span>
                <select
                  className="input"
                  value={servicePackage}
                  onChange={(e) => setServicePackage(e.target.value)}
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <label className="fieldLabel">Add-Ons on invoice</label>
              <p className="hintText">{addOns.join(", ") || "No add-ons selected"}</p>

              <label className="fieldLabel">Amount ($)</label>
              <input
                className="input"
                placeholder="Amount ($)"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFormErrors((prev) => ({ ...prev, amount: "" }));
                }}
              />
              {formErrors.amount && <p className="fieldError">{formErrors.amount}</p>}

              <label className="fieldLabel">First charge date</label>
              <input
                className="input"
                placeholder="Charge / Due Date"
                type="date"
                value={due}
                onChange={(e) => {
                  setDue(e.target.value);
                  setFormErrors((prev) => ({ ...prev, due: "" }));
                }}
              />
              {formErrors.due && <p className="fieldError">{formErrors.due}</p>}

              <Button
                className="sendBtn"
                variant="success"
                size="lg"
                onClick={sendInvoice}
                disabled={!canSend}
                loading={sending}
              >
                Send Invoice
              </Button>

              {invoiceResult?.invoice_url && (
                <div className="invoiceResult">
                  <p><strong>Invoice created:</strong> {invoiceResult.invoice_id}</p>
                  <p><strong>Calendar entries added:</strong> {invoiceResult?.calendar_updates?.addedEntries ?? 0}</p>
                  <a href={invoiceResult.invoice_url} target="_blank" rel="noreferrer" className="openInvoiceLink">
                    Open Invoice
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
