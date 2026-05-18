import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../header/HeaderPage";
import { apiPost } from "../../../lib/apiClient";
import usePageMeta from "../../../hooks/usePageMeta";
import emailjs from "@emailjs/browser";
import "./ContactInfo.css";

import Amex from "../../Img/amex.svg";
import Visa from "../../Img/visa.svg";
import Mastercard from "../../Img/mastercard.svg";
import Paypal from "../../Img/paypal.svg";

import Facebook from "../../Img/icon-facebook.svg";
import Instagram from "../../Img/icon-instagram.svg";
import Tiktok from "../../Img/Tiktok.svg";

const CONTACT_DRAFT_STORAGE_KEY = "tydra_contact_form_draft_v1";

export default function ContactInfo() {
  usePageMeta("Contact Us", "Contact Tydra for a fast commercial cleaning quote.");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    email: "",
    phone: "",
    referral_code: "",
    message: "",
    bot_field: ""
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSending, setIsSending] = useState(false);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [quoteSummary, setQuoteSummary] = useState(null);

  const formRef = useRef(null);
  const msgRef = useRef(null);
  const referralRef = useRef(null);

  const sanitizeReferralCode = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 64);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = name === "referral_code" ? sanitizeReferralCode(value) : value;
    setFormData((p) => ({ ...p, [name]: normalizedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const clearContactDraft = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CONTACT_DRAFT_STORAGE_KEY);
  };

  const clearContactDraftOnly = () => {
    clearContactDraft();
    setDraftSavedAt("");
    setQuoteSummary(null);
    setStatus({ type: "ok", text: "Saved contact draft was cleared." });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsDraftHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(CONTACT_DRAFT_STORAGE_KEY);
      if (!raw) {
        setIsDraftHydrated(true);
        return;
      }
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object") {
        setIsDraftHydrated(true);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        name: draft.name || "",
        business_name: draft.business_name || "",
        email: draft.email || "",
        phone: draft.phone || "",
        referral_code: draft.referral_code || "",
        message: draft.message || "",
      }));
      if (draft.quoteSummary && typeof draft.quoteSummary === "object") {
        setQuoteSummary(draft.quoteSummary);
      }
      setDraftSavedAt(draft.draftSavedAt || "");
    } catch {
      // ignore malformed drafts
    } finally {
      setIsDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isDraftHydrated || typeof window === "undefined") return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const payload = {
      name: formData.name,
      business_name: formData.business_name,
      email: formData.email,
      phone: formData.phone,
      referral_code: formData.referral_code,
      message: formData.message,
      quoteSummary: quoteSummary || undefined,
      draftSavedAt: nowLabel,
    };
    try {
      window.localStorage.setItem(CONTACT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setDraftSavedAt(nowLabel);
    } catch {
      // ignore quota issues
    }
  }, [
    isDraftHydrated,
    formData.name,
    formData.business_name,
    formData.email,
    formData.phone,
    formData.referral_code,
    formData.message,
    quoteSummary,
  ]);

  const buildSummaryText = (qs) => {
    const lines = ["QUOTE DETAILS", "─────────────────────────────────"];
    if (qs.industry || qs.sqft) lines.push(`Space         : ${qs.industry || "-"} · ${qs.sqft || "-"} sq ft`);
    if (qs.traffic || qs.hours) lines.push(`Foot Traffic  : ${qs.traffic || "-"} · ${qs.hours || "-"}`);
    if (qs.shared && qs.shared !== "None") lines.push(`Shared Areas  : ${qs.shared}`);
    if (qs.frequency) {
      let freq = qs.frequency;
      if (qs.freqDetail) freq += ` · ${qs.freqDetail}`;
      lines.push(`Frequency     : ${freq}`);
    }
    if (qs.pricingModel) lines.push(`Pricing Model : ${qs.pricingModel}`);
    if (qs.addOns && qs.addOns !== "None") lines.push(`Add-ons       : ${qs.addOns}`);
    if (qs.specialRequests && qs.specialRequests !== "None") lines.push(`Special Req   : ${qs.specialRequests}`);
    if (qs.condition || qs.problem) lines.push(`Condition     : ${qs.condition || "-"} · Problem: ${qs.problem || "-"}`);
    if (qs.qualityExpectations) lines.push(`Quality Exp   : ${qs.qualityExpectations}`);
    if (qs.referral) lines.push(`Referral #    : ${qs.referral}`);
    lines.push("─────────────────────────────────");
    return lines.join("\n");
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = "Enter a valid email.";
    if (!quoteSummary && !formData.message.trim()) e.message = "Tell us a bit about the job.";
    if (formData.phone && !/^[0-9+\s()-]{7,}$/.test(formData.phone)) {
      e.phone = "Use numbers and ()-+ only.";
    }
    return e;
  };
  const isFormReady =
    !!formData.name.trim() &&
    /^\S+@\S+\.\S+$/.test(formData.email) &&
    (!!quoteSummary || !!formData.message.trim()) &&
    (!formData.phone || /^[0-9+\s()-]{7,}$/.test(formData.phone));

  const sendEmail = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    if (formData.bot_field) return;

    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      setStatus({ type: "err", text: "Please fix the highlighted fields." });
      return;
    }

    setIsSending(true);

    // Capture values before clearing state
    const submittedName = formData.name;
    const submittedEmail = formData.email;
    const submittedReferral = formData.referral_code;

    // Build combined message: structured summary + user's personal notes
    const summaryText = quoteSummary ? buildSummaryText(quoteSummary) : "";
    const userNotes = formData.message.trim();
    const combinedMessage = summaryText && userNotes
      ? summaryText + "\n\nAdditional Comments:\n" + userNotes
      : summaryText || userNotes;

    // Update textarea DOM value so emailjs picks up the combined message
    if (msgRef.current) msgRef.current.value = combinedMessage;

    // Fire-and-forget: save to DB (non-blocking — user proceeds even if this fails)
    apiPost("/save_contact", {
      referral: submittedReferral,
      name: submittedName,
      business_name: formData.business_name,
      email: submittedEmail,
      phone: formData.phone,
      message: combinedMessage
    }).catch(() => { /* non-critical — DB save best-effort */ });

    // Send via emailjs (best-effort — don't block redirect on failure)
    try {
      await emailjs.sendForm(
        "service_0tgnh98",
        "template_tzdzdra",
        formRef.current,
        "qX6SW6EHquUVW_igH"
      );
    } catch {
      // EmailJS failed — still navigate, team will see backend notification email
    }

    // Always clear form and redirect
    setFormData({
      name: "",
      business_name: "",
      email: "",
      phone: "",
      referral_code: "",
      message: "",
      bot_field: ""
    });
    clearContactDraft();
    setDraftSavedAt("");
    formRef.current?.reset();
    setIsSending(false);
    navigate("/contact-sent", {
      state: { name: submittedName, email: submittedEmail, referral: submittedReferral }
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (!msgRef.current) return;
    msgRef.current.style.height = "auto";
    msgRef.current.style.height = `${msgRef.current.scrollHeight}px`;
  }, [formData.message]);

  const scrollToReferral = () => {
    referralRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    referralRef.current?.querySelector("input")?.focus();
  };

  return (
    <section className="contact-section" aria-busy={isSending}>
      <Header />

      <div className="services__container">
        <div className="services__hero">
          <h1 className="services__title">Contact Us</h1>
          <p className="services__subtitle">
            Get a fast, friendly quote. We usually reply within the hour.
          </p>

          {/* Quick actions + referral jump */}
          <ul className="services__highlights">
            <li><button type="button" className="chip chip--button ui-btn ghost sm" onClick={scrollToReferral}>I have a referral code</button></li>
            <li><a className="chip" href="tel:16478773741">Call now</a></li>
            <li><a className="chip" href="mailto:tydra.gta.cleaning@gmail.com">Email us</a></li>
          </ul>

          {/* Step chips for polish */}
          <ul className="steps" aria-label="Steps">
            <li className="step step--active">1. Contact</li>
            <li className="step">2. Quote</li>
            <li className="step">3. Schedule</li>
          </ul>
        </div>

        {/* Card: header + form */}
        <div className="contact-card">
          <header className="contact-header">
            <h2>Toronto, ON</h2>
            <p className="contact-meta">
              <a href="tel:16478773741">(647) 877-3741</a> |{" "}
              <a href="mailto:tydra.gta.cleaning@gmail.com">tydra.gta.cleaning@gmail.com</a>
            </p>
            <div className="hours" aria-label="Business hours">
              <span>Mon-Fri: 9am-6pm</span><span>Sat: 10am-6pm</span><span>Sun: Closed</span>
            </div>
            <div className="draft-row">
              <span className="draft-pill">
                {draftSavedAt ? `Draft saved ${draftSavedAt}` : "Draft autosave on"}
              </span>
              <button
                type="button"
                className="chip chip--button ui-btn ghost sm"
                onClick={clearContactDraftOnly}
              >
                Clear Draft
              </button>
            </div>
          </header>

          <form
            ref={formRef}
            onSubmit={sendEmail}
            className="contact-form"
            noValidate
            aria-describedby={status.type ? "form-status" : undefined}
          >
            <input type="hidden" name="submitted_at" value={new Date().toISOString()} />
            <input type="hidden" name="subject" value="New message from Contact page" />

            <div className="visually-hidden" aria-hidden="true">
              <label>Do not fill this out
                <input name="bot_field" value={formData.bot_field} onChange={handleChange}/>
              </label>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="name" className="req">Name</label>
                <input
                  id="name" name="name" type="text" required
                  value={formData.name} onChange={handleChange}
                  autoComplete="name" aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-err" : undefined}
                />
                {errors.name && <span id="name-err" className="field__error">{errors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="business_name">Business Name</label>
                <input
                  id="business_name" name="business_name" type="text"
                  value={formData.business_name} onChange={handleChange}
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="email" className="req">Email</label>
                <input
                  id="email" name="email" type="email" required
                  value={formData.email} onChange={handleChange}
                  autoComplete="email" inputMode="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-err" : "email-hint"}
                />
                {errors.email
                  ? <span id="email-err" className="field__error">{errors.email}</span>
                  : <span id="email-hint" className="field__hint">We will only use this to reply.</span>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone" name="phone" type="tel" inputMode="tel"
                  pattern="^[0-9+\\s()-]*$" placeholder="Optional"
                  value={formData.phone} onChange={handleChange}
                  autoComplete="tel" aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-err" : undefined}
                />
                {errors.phone && <span id="phone-err" className="field__error">{errors.phone}</span>}
              </div>
            </div>

            <div className="field full" ref={referralRef}>
              <label htmlFor="referral_code">Referral # (from the Quote form)</label>
              <input
                id="referral_code" name="referral_code" type="text"
                placeholder="e.g., REF-12345"
                value={formData.referral_code} onChange={handleChange}
                aria-invalid={!!errors.referral_code}
                aria-describedby={errors.referral_code ? "ref-err" : "ref-hint"}
              />
              {errors.referral_code
                ? <span id="ref-err" className="field__error">{errors.referral_code}</span>
                : <span id="ref-hint" className="field__hint">If you started a Quote, paste the referral number here for faster lookup.</span>}
            </div>

            {quoteSummary && (
              <div className="quote-summary-card">
                <div className="qsc-header">
                  <span className="qsc-title">📋 Quote Summary</span>
                  <button type="button" className="qsc-dismiss" onClick={() => setQuoteSummary(null)} aria-label="Remove quote summary">✕</button>
                </div>
                <dl className="qsc-grid">
                  {quoteSummary.industry && <><dt>Industry</dt><dd>{quoteSummary.industry}</dd></>}
                  {quoteSummary.sqft && <><dt>Square Footage</dt><dd>{quoteSummary.sqft} sq ft</dd></>}
                  {quoteSummary.traffic && <><dt>Foot Traffic</dt><dd>{quoteSummary.traffic}</dd></>}
                  {quoteSummary.hours && <><dt>Operating Hours</dt><dd>{quoteSummary.hours}</dd></>}
                  {quoteSummary.shared && quoteSummary.shared !== "None" && <><dt>Shared Areas</dt><dd>{quoteSummary.shared}</dd></>}
                  {quoteSummary.frequency && <><dt>Cleaning Frequency</dt><dd>{quoteSummary.frequency}{quoteSummary.freqDetail ? ` · ${quoteSummary.freqDetail}` : ""}</dd></>}
                  {quoteSummary.pricingModel && <><dt>Pricing Model</dt><dd>{quoteSummary.pricingModel}</dd></>}
                  {quoteSummary.specialRequests && quoteSummary.specialRequests !== "None" && <><dt>Special Requests</dt><dd>{quoteSummary.specialRequests}</dd></>}
                  {quoteSummary.condition && <><dt>Condition</dt><dd>{quoteSummary.condition}</dd></>}
                  {quoteSummary.problem && <><dt>Problem</dt><dd>{quoteSummary.problem}</dd></>}
                  {quoteSummary.addOns && quoteSummary.addOns !== "None" && <><dt>Add-ons</dt><dd>{quoteSummary.addOns}</dd></>}
                  {quoteSummary.qualityExpectations && <><dt>Quality</dt><dd>{quoteSummary.qualityExpectations}</dd></>}
                  {quoteSummary.referral && <><dt>Referral #</dt><dd className="qsc-ref">{quoteSummary.referral}</dd></>}
                </dl>
              </div>
            )}

            <div className="field full">
              <label htmlFor="message" className={quoteSummary ? undefined : "req"}>
                {quoteSummary ? "Additional Comments (optional)" : "Notes / Message"}
              </label>
              <textarea
                id="message" name="message" rows={3} ref={msgRef}
                required={!quoteSummary}
                value={formData.message} onChange={handleChange}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-err" : "message-hint"}
                maxLength={1000}
                placeholder={quoteSummary ? "Add any extra details, questions, or special notes…" : ""}
              />
              <div className="field__meta">
                {errors.message
                  ? <span id="message-err" className="field__error">{errors.message}</span>
                  : <span id="message-hint" className="field__hint">
                      {quoteSummary ? "Your quote details above will be included automatically." : "Include sq. ft., frequency, access details, and special requests."}
                    </span>}
                <span className="count">{formData.message.length}/1000</span>
              </div>
            </div>

            <div className="actions">
              <button type="submit" className="btn ui-btn primary lg" disabled={isSending || !isFormReady}>
                {isSending ? <span className="spinner" aria-hidden /> : null}
                {isSending ? "Sending..." : "Send Message"}
              </button>
            </div>

            <div id="form-status" className={`toast ${status.type || ""}`} role="status" aria-live="polite">
              {status.text}
            </div>
          </form>
        </div>
        
      </div>
      
            <footer className="footer">
              <div className="footer__container">
                {/* Contact */}
                <div className="footer__column">
                  <h3 className="footer__header">Contact</h3>
                  <p>Toronto, ON</p>
                  <p>(647) 877-3741</p>
                  <p>tydra.gta.cleaning@gmail.com</p>
                </div>
      
                {/* Business Hours */}
                <div className="footer__column">
                  <h3 className="footer__header">Business Hours</h3>
                  <p>Mon-Fri: 9 am-6 pm</p>
                  <p>Sat: 10 am-6 pm</p>
                  <p>Sun: Closed</p>
                </div>
      
                {/* Social */}
                <div className="footer__column">
                  <h3 className="footer__header">Follow Us</h3>
                  <div className="footer__social-icons">
                    <a
                      href="https://www.facebook.com/"  // put your real page link here
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={Facebook} alt="Facebook" />
                    </a>
      
                    <a
                      href="https://www.instagram.com/tydracommercial/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={Instagram} alt="Instagram" />
                    </a>
      
                    <a
                      href="https://www.tiktok.com/@tydracommercial?lang=en"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={Tiktok} alt="TikTok" />
                    </a>
                  </div>
                </div>
      
                {/* Payments & Trust */}
                <div className="footer__column">
                  <h3 className="footer__header">Payments &amp; Trust</h3>
                  <div className="footer__payment-icons">
                    <img src={Visa} alt="Visa" />
                    <img src={Mastercard} alt="Mastercard" />
                    <img src={Amex} alt="American Express" />
                    <img src={Paypal} alt="PayPal" />
                  </div>
                </div>
              </div>
            </footer>
    </section>
  );
}

