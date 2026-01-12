import React, { useState } from "react";
import Header from "./header";
import { API_URL } from "../../config";
import "./Payments.css";

export default function PaymentPage() {

  const [referralCode, setReferralCode] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");



  const handleLookup = async () => {
    setMessage("");
    setData(null);

    if (!referralCode.trim()) {
      setMessage("Please enter a referral code");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/data/${referralCode.trim()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Referral not found");

      setData(json);
      setEmail(json?.details?.email || "");
      setAmount(json?.details?.amountCents ? json.details.amountCents / 100 : "");

    } catch (err) {
      setMessage(err.message);
    }
  };

  const sendInvoice = async () => {
    if (!email || !amount) {
      alert("Email + Amount are required");
      return;
    }

    const res = await fetch(`${API_URL}/create_invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode: data.referralCode,
        email,
        amountCents: Math.round(amount * 100),
        due
      })
    });

    const json = await res.json();

    if (json.invoice_url) {
      window.open(json.invoice_url, "_blank");

    } else {
      alert("Error: " + json.error);
    }
  };

  return (
    <div className="payment-wrapper">
      <Header/>
      <div className="searchRefBar">
        <h1>Payment & Referral Info</h1>

        <div className="lookupRow">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            className="referInput"
          />
          <button className="button" onClick={handleLookup}>Lookup</button>
        </div>

        {message && <p className="error">{message}</p>}
      </div>

      <div className="viewBox">

        {data && (
          <div className="Payments">

            <h3>Referral: {data.referralCode}</h3>

            <div className="kv-card">

              <div className="kv">
                <span className="k">Client Name</span>
                <span className="v">{data?.details?.Ownername || "N/A"}</span>
              </div>

              <div className="kv">
                <span className="k">Business</span>
                <span className="v">{data?.details?.business_name || "N/A"}</span>
              </div>

              <div className="kv">
                <span className="k">Email</span>
                <span className="v">{data?.details?.email || "N/A"}</span>
              </div>

              <div className="kv">
                <span className="k">Phone</span>
                <span className="v">{data?.details?.phone || "N/A"}</span>
              </div>

              <div className="kv">
                <span className="k">Message</span>
                <span className="v">{data?.details?.message || "N/A"}</span>
              </div>

              <div className="kv">
                <span className="k">Referral Code</span>
                <span className="v code">{data?.referralCode}</span>
              </div>

            </div>


            <div className="kv-card">

              <div className="kv vblock">
                <span className="k">SqFt</span>
                <span className="v">{data?.details?.sqft || "N/A"}</span>
              </div>

              <div className="kv vblock">
                <span className="k">Industry</span>
                <span className="v">{data?.details?.selectedIndustry || "N/A"}</span>
              </div>

              <div className="kv vblock">
                <span className="k">Foot Traffic</span>
                <span className="v">
                  {data?.details?.footTrafficAnswers?.["Foot traffic"] || "N/A"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Operating Hours</span>
                <span className="v">
                  {data?.details?.footTrafficAnswers?.["Operating Hours"] || "N/A"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Shared Spaces</span>
                <span className="v">
                  {(data?.details?.footTrafficAnswers?.["Shared Spaces - (choose that apply)"] || [])
                    .join(", ") || "None"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Cleaning Frequency</span>
                <span className="v">
                  {data?.details?.cleaningAnswers?.Frequency || "N/A"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Times per {data?.details?.cleaningAnswers?.Frequency}</span>
                <span className="v">{data?.details?.freqTimesPerDay || "N/A"}</span>
              </div>

              <div className="kv vblock">
                <span className="k">Special Requests</span>
                <span className="v">
                  {(data?.details?.specialRequests || []).join(", ") || "None"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Condition</span>
                <span className="v">
                  {data?.details?.conditionAnswers?.["Current Condition"] || "N/A"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Problem</span>
                <span className="v">
                  {data?.details?.conditionAnswers?.["Current Problem"] || "N/A"}
                </span>
              </div>

              <div className="kv vblock">
                <span className="k">Pricing Model</span>
                <span className="v">{data?.details?.pricingModel || "N/A"}</span>
              </div>

              <div className="kv vblock">
                <span className="k">Quality Level</span>
                <span className="v">{data?.details?.qualityExpectations || "N/A"}</span>
              </div>

              <div className="kv vblock">
                <span className="k">Add-Ons</span>
                <span className="v">
                  {(data?.details?.serviceAddOns || []).join(", ") || "None"}
                </span>
              </div>

            </div>
            {/* ================= Billing & Cleaning Schedule ================= */}
<div className="kv-card">
  <h4 className="card-title">Billing & Cleaning Schedule</h4>

  <div className="kv vblock">
    <span className="k">Type of Cleaning</span>
    <span className="v">
      {data?.details?.cleaningType || "N/A"}
    </span>
  </div>

  <div className="kv vblock">
    <span className="k">Invoice Frequency</span>
    <span className="v">
      {data?.details?.invoiceFrequency
        ? data.details.invoiceFrequency.toUpperCase()
        : "N/A"}
    </span>
  </div>

  <div className="kv vblock">
    <span className="k">Invoice Day</span>
    <span className="v">
      {data?.details?.invoiceDay
        ? data.details.invoiceDay.replace(/^\w/, c => c.toUpperCase())
        : "Auto / End of period"}
    </span>
  </div>
</div>

            
            <div className="invoiceBox">
              <h4>Send Invoice</h4>

              <input
                className="input"
                placeholder="Customer Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="input"
                placeholder="Amount ($)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <input
                className="input"
                placeholder="Charge / Due Date (optional)"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />

              <button className="sendBtn" onClick={sendInvoice}>
                Send Invoice
              </button>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
