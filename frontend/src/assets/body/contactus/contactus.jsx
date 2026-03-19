import React, { useEffect, useRef, useState } from "react";
import Header from "../../header/HeaderPage";
import { ApiError, apiPost } from "../../../lib/apiClient";
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
  ]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = "Enter a valid email.";
    if (!formData.message.trim()) e.message = "Tell us a bit about the job.";
    if (formData.phone && !/^[0-9+\s()-]{7,}$/.test(formData.phone)) {
      e.phone = "Use numbers and ()-+ only.";
    }

    return e;
  };
  const isFormReady =
    !!formData.name.trim() &&
    /^\S+@\S+\.\S+$/.test(formData.email) &&
    !!formData.message.trim() &&
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
    try {
      await apiPost("/save_contact", {
        referral: formData.referral_code,
        name: formData.name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setStatus({ type: "err", text: err.message || "Unable to save your details right now." });
        return;
      }
      setStatus({ type: "err", text: "Unable to save your details right now." });
      return;
    }

    setIsSending(true);
    try {
      await emailjs.sendForm(
        "service_0tgnh98",
        "template_tzdzdra",
        formRef.current,
        "qX6SW6EHquUVW_igH"
      );
      setStatus({ type: "ok", text: "Thank you! Your message has been sent." });
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
    } catch {
      setStatus({ type: "err", text: "Oops! Something went wrong. Please try again." });
    } finally {
      setIsSending(false);
    }
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

            <div className="field full">
              <label htmlFor="message" className="req">Notes / Message</label>
              <textarea
                id="message" name="message" rows={3} ref={msgRef} required
                value={formData.message} onChange={handleChange}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-err" : "message-hint"}
                maxLength={1000}
              />
              <div className="field__meta">
                {errors.message
                  ? <span id="message-err" className="field__error">{errors.message}</span>
                  : <span id="message-hint" className="field__hint">Include sq. ft., frequency, access details, and special requests.</span>}
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

