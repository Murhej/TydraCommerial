import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export default function PaymentWithReferral() {
  const stripe = useStripe();
  const elements = useElements();

  const [refCode, setRefCode] = useState("");
  const [quote, setQuote] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const backendBase = "http://127.0.0.1:5000"; // change if needed

  const handleLookup = async () => {
    setMessage("");
    setQuote(null);
    try {
      const res = await fetch(`${backendBase}/data/${refCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find referral");
      setQuote(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const createIntent = async () => {
    const res = await fetch(`${backendBase}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: refCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create payment intent");
    setClientSecret(data.clientSecret);
    return data.clientSecret;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setMessage("");

    try:
      const cs = clientSecret || (await createIntent());
      const card = elements.getElement(CardElement);

      const { paymentIntent, error } = await stripe.confirmCardPayment(cs, {
        payment_method: { card },
      });

      if (error) {
        setMessage(error.message || "Payment failed");
      } else if (paymentIntent.status === "succeeded") {
        setMessage("Payment successful 🎉");
        // later: you can hit /data/<refCode> again to show "paid" status
      }
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "20px auto" }}>
      <h2>Pay with your Referral Code</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          placeholder="Enter your referral code"
          style={{ width: "70%", padding: 8 }}
        />
        <button onClick={handleLookup} style={{ marginLeft: 8 }}>
          Look up
        </button>
      </div>

      {quote && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <p><strong>Referral:</strong> {quote.referralCode}</p>
          <p><strong>Company:</strong> {quote.details.companyName}</p>
          <p>
            <strong>Amount:</strong>{" "}
            {(quote.details.amountCents / 100).toFixed(2)}{" "}
            {quote.details.currency?.toUpperCase()}
          </p>
        </div>
      )}

      {quote && (
        <form onSubmit={handlePay}>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          >
            <CardElement />
          </div>

          <button type="submit" disabled={!stripe || loading}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
