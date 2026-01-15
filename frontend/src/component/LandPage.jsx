import React, { useRef } from "react";

import Header from "../assets/header/HeaderPage";
import DisplayPage from "../assets/body/DisplayPage";
import DisplayMessage from "../assets/body/DisplayMessage";
import ServicesGrid from "../assets/body/ServicesGrid";
import QuoteForm from "../assets/body/QuoteForm";
import Measuring from "../assets/body/Measuring";

import "./landingpage.css";

import Amex from "../assets/Img/amex.svg";
import Visa from "../assets/Img/visa.svg";
import Mastercard from "../assets/Img/mastercard.svg";
import Paypal from "../assets/Img/paypal.svg";

import Facebook from "../assets/Img/icon-facebook.svg";
import Instagram from "../assets/Img/icon-instagram.svg";
import Tiktok from "../assets/Img/Tiktok.svg";

function Landingpage() {
  const refQouteForm = useRef(null);

  const goToQouteForm = () => {
    if (refQouteForm.current) {
      refQouteForm.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="landingBody">
      <Header />

      <div className="body">
        {/* display page */}
        <DisplayPage onNext={goToQouteForm} />

        {/* Message */}
        <DisplayMessage />

        {/* Service */}
        <ServicesGrid />
        <Measuring />

        {/* Quote */}
        <QuoteForm innerRef={refQouteForm} />
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
    </div>
  );
}

export default Landingpage;
