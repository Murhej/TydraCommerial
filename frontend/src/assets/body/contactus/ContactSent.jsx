import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiPost } from "../../../lib/apiClient";
import Header from "../../header/HeaderPage";
import usePageMeta from "../../../hooks/usePageMeta";
import "./ContactSent.css";

const STAR_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

export default function ContactSent() {
  usePageMeta("Message Sent", "Your message has been received by Tydra Cleaning.");

  const location = useLocation();
  const { name, email, referral } = location.state || {};

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (val) => {
    setRating(val);
    try {
      await apiPost("/survey_rating", { rating: val, referral: referral || "" });
    } catch {
      // non-critical — don't block UX
    }
    setSubmitted(true);
  };

  const activeLevel = hovered || rating;

  return (
    <section className="sent-page">
      <Header />

      <div className="sent-container">
        <div className="sent-card">

          {/* Success icon */}
          <div className="sent-icon" aria-hidden="true">✅</div>
          <h1 className="sent-title">Message Sent!</h1>
          <p className="sent-sub">
            {name ? `Thanks ${name} — your` : "Your"} message is on its way.
            We usually reply within the hour.
          </p>

          {/* Email confirmations */}
          <div className="sent-emails">
            <div className="sent-email-row">
              <span className="sent-email-icon" aria-hidden="true">📨</span>
              <div>
                <strong>Our team has been notified</strong>
                <p>We received your request and will be in touch shortly.</p>
              </div>
            </div>

            {email && (
              <div className="sent-email-row">
                <span className="sent-email-icon" aria-hidden="true">📬</span>
                <div>
                  <strong>Confirmation sent to you</strong>
                  <p>
                    A no-reply confirmation was sent to{" "}
                    <span className="sent-email-addr">{email}</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Satisfaction survey */}
          <div className="survey-block">
            <h2 className="survey-title">How was your website experience?</h2>

            {!submitted ? (
              <>
                <div
                  className="stars"
                  role="group"
                  aria-label="Rate your website experience"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn${activeLevel >= star ? " active" : ""}`}
                      aria-label={`${STAR_LABELS[star - 1]} — ${star} star${star > 1 ? "s" : ""}`}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="survey-hint">
                  {hovered ? STAR_LABELS[hovered - 1] : "Tap a star to rate"}
                </p>
              </>
            ) : (
              <p className="survey-thanks">
                {rating >= 4
                  ? `Amazing! ${rating}/5 stars — thanks for the love! 🎉`
                  : rating === 3
                  ? `${rating}/5 stars — thanks for the honest feedback!`
                  : `${rating}/5 stars — we'll work to improve. Thanks for letting us know.`}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="sent-actions">
            <Link to="/" className="btn ui-btn primary">Back to Home</Link>
            <Link to="/services" className="btn ui-btn ghost">Our Services</Link>
          </div>

        </div>
      </div>
    </section>
  );
}
