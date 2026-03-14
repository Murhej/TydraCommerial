import React from 'react';
import { Link } from "react-router-dom";
import CleaningIllustration from "../Img/CleaningIllustration.png";
// DisplayPage.jsx
import "./DisplayPage.css";

export default function DisplayPage({onNext}) {
  

  return (
    <section className="hero">
      <div className="hero__content">
        <h1 className="hero__title">
          Spotless Commercial Cleaning for GTA Businesses
        </h1>
        <p className="hero__subtitle">
          Reliable office, clinic, and commercial cleaning across Toronto and the GTA.
        </p>
        <div className="hero__actions">
          <button type="button" onClick={onNext} className="hero__button ui-btn primary lg">
            Get a Free Quote
          </button>
          <Link to="/services" className="hero__button secondary ui-btn secondary lg">
            View Services
          </Link>
        </div>

        <ul className="hero__trust" aria-label="Trust indicators">
          <li>Trusted by GTA businesses</li>
          <li>Background-checked staff</li>
          <li>Satisfaction guarantee</li>
        </ul>
      </div>
      <div className="hero__image">
        <img
          src={CleaningIllustration}
          alt="Illustration of a cleaner at work"
          width="1024"
          height="1024"
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
}
