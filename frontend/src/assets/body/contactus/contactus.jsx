import React, { useEffect, useRef, useState } from "react";
import Header from "../../header/HeaderPage";
import emailjs from "@emailjs/browser";
import "./ContactInfo.css";

export default function ContactInfo() {
  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    email: "",
    phone: "",
    referral_code: "",
    message: "",
  
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSending, setIsSending] = useState(false);

  const formRef = useRef(null);
  const msgRef = useRef(null);
  const referralRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = "Enter a valid email.";
    if (!formData.message.trim()) e.message = "Tell us a bit about the job.";
    if (formData.phone && !/^[0-9\-\+\s\(\)]{7,}$/.test(formData.phone)) {
      e.phone = "Use numbers and ()-+ only.";
    }

    return e;
  };

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
    await fetch(`${API_URL}/save_contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referral: formData.referral_code,
        name: formData.name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      })
    });

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
        referralCode: "",
        message: "",
        bot_field: ""
      });
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
            <li><button type="button" className="chip chip--button" onClick={scrollToReferral}>🏷️ I have a referral code</button></li>
            <li><a className="chip" href="tel:16478773741">📞 Call</a></li>
            <li><a className="chip" href="mailto:tydra.gta.cleaning@gmail.com">✉️ Email</a></li>
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
              <a href="tel:16478773741">(647) 877-3741</a> ·{" "}
              <a href="mailto:tydra.gta.cleaning@gmail.com">tydra.gta.cleaning@gmail.com</a>
            </p>
            <div className="hours" aria-label="Business hours">
              <span>Mon–Fri: 9am–6pm</span><span>Sat: 10am–6pm</span><span>Sun: Closed</span>
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
                  : <span id="email-hint" className="field__hint">We’ll only use this to reply.</span>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone" name="phone" type="tel" inputMode="tel"
                  pattern="^[0-9\\-\\+\\s\\(\\)]*$" placeholder="Optional"
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
              <button type="submit" className="btn" disabled={isSending}>
                {isSending ? <span className="spinner" aria-hidden /> : null}
                {isSending ? "Sending…" : "Send Message"}
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
          <p>Mon–Fri: 9 am–6 pm</p>
          <p>Sat: 10 am–6 pm</p>
          <p>Sun: Closed</p>
        </div>

        {/* Social */}
        <div className="footer__column">
          <h3 className="footer__header">Follow Us</h3>
          <div className="footer__social-icons">
            <a href="face"><img src="/icon-facebook.svg" alt="Facebook" /></a>
            <a href="https://www.instagram.com/tydracommercial/"><img src="/icon-instagram.svg" alt="Instagram" /></a>
            <a href="https://www.tiktok.com/@tydracommercial?lang=en"><img src="/Tiktok.svg"   alt="TikTok" /></a>
          </div>
        </div>

        {/* Payments & Trust */}
        <div className="footer__column">
          <h3 className="footer__header">Payments &amp; Trust</h3>
          <div className="footer__payment-icons">
            <img src="/visa.svg"       alt="Visa" />
            <img src="/mastercard.svg" alt="Mastercard" />
            <img src="/amex.svg"       alt="American Express" />
            <img src="/paypal.svg"     alt="PayPal" />
          </div>
        </div>
      </div>
    </footer>
    </section>
  );
}
