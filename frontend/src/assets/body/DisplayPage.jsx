import React from 'react';
import { Link } from "react-router-dom";
import CleaningIllustration from "../Img/CleaningIllustration.png";
import "./DisplayPage.css";

export default function DisplayPage({onNext}) {
  return (
    <section className="hero">
      <div className="hero__content">
        <div className="hero__eyebrow">Toronto & GTA Commercial Cleaning</div>
        <h1 className="hero__title">
          Keep Your Business <mark>Spotless</mark>, Every Single Day
        </h1>
        <p className="hero__subtitle">
          Professional commercial cleaning for offices, clinics, and workspaces across Toronto and the GTA. Reliable, discreet, and built around your schedule.
        </p>
        <div className="hero__actions">
          <button type="button" onClick={onNext} className="hero__button primary">
            Get a Free Quote
          </button>
          <Link to="/services" className="hero__button secondary">
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
