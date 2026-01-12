import React, {Component, useRef} from 'react';

import Header from '../assets/header/HeaderPage';
import DisplayPage from '../assets/body/DisplayPage';
import DisplayMessage from '../assets/body/DisplayMessage';
import ServicesGrid from '../assets/body/ServicesGrid';
import QuoteForm from '../assets/body/QuoteForm';
import Measuring from '../assets/body/Measuring';
import './landingpage.css';


function Landingpage() {
  const refQouteForm = useRef(null);

  const goToQouteForm = () =>{
    if(refQouteForm.current){
      refQouteForm.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }
  }

  return (
    <div className="landingBody">
      <Header />
      <div className="body">
        {/* display pagge */}
        <DisplayPage onNext={goToQouteForm}/>
        {/* Message */}
        <DisplayMessage/>
        
      
        {/* Service */}
        <ServicesGrid/>
        <Measuring/>
        {/* Qoute */}
        <QuoteForm innerRef={refQouteForm}/>
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
    </div>
  );
}

export default Landingpage;
