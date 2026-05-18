import React, { useRef } from "react";

import Header from "../assets/header/HeaderPage";
import DisplayPage from "../assets/body/DisplayPage";
import DisplayMessage from "../assets/body/DisplayMessage";
import ServicesGrid from "../assets/body/ServicesGrid";
import QuoteForm from "../assets/body/QuoteForm";
import Measuring from "../assets/body/Measuring";
import usePageMeta from "../hooks/usePageMeta";

import "./landingpage.css";

import Amex from "../assets/Img/amex.svg";
import Visa from "../assets/Img/visa.svg";
import Mastercard from "../assets/Img/mastercard.svg";
import Paypal from "../assets/Img/paypal.svg";

import Facebook from "../assets/Img/icon-facebook.svg";
import Instagram from "../assets/Img/icon-instagram.svg";
import Tiktok from "../assets/Img/Tiktok.svg";

function Landingpage() {
  usePageMeta(
    "Commercial Cleaning Services",
    "Professional commercial cleaning across Toronto and the GTA."
  );
  const refQuoteForm = useRef(null);

  const goToQuoteForm = () => {
    if (refQuoteForm.current) {
      refQuoteForm.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="landingBody">
      <Header />

      <div className="body">
        {/* Hero */}
        <DisplayPage onNext={goToQuoteForm} />

        {/* Why Us */}
        <DisplayMessage />

        {/* Services */}
        <ServicesGrid />

        {/* Pricing */}
        <Measuring />

        {/* Quote Form */}
        <QuoteForm innerRef={refQuoteForm} />
      </div>

      <footer className="footer">
        <div className="footer__container">
          {/* Brand */}
          <div className="footer__column footer__column--brand">
            <div className="footer__brand-name">Tydra</div>
            <p className="footer__brand-tagline">Professional commercial cleaning across Toronto and the GTA.</p>
          </div>

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
            <p>Mon–Fri: 9 am – 6 pm</p>
            <p>Sat: 10 am – 6 pm</p>
            <p>Sun: Closed</p>
          </div>

          {/* Social */}
          <div className="footer__column">
            <h3 className="footer__header">Follow Us</h3>
            <div className="footer__social-icons">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <img src={Facebook} alt="Facebook" />
              </a>

              <a
                href="https://www.instagram.com/tydracommercial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <img src={Instagram} alt="Instagram" />
              </a>

              <a
                href="https://www.tiktok.com/@tydracommercial?lang=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <img src={Tiktok} alt="TikTok" />
              </a>
            </div>

            {/* Payments */}
            <h3 className="footer__header" style={{ marginTop: "1.1rem" }}>We Accept</h3>
            <div className="footer__payment-icons">
              <img src={Visa} alt="Visa" />
              <img src={Mastercard} alt="Mastercard" />
              <img src={Amex} alt="American Express" />
              <img src={Paypal} alt="PayPal" />
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} Tydra Commercial Cleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landingpage;

