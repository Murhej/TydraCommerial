import React, {useRef} from 'react';
import CleaningIllustration from "../Img/CleaningIllustration.png";
import "./DisplayPage.css";

export default function DisplayPage({onNext}) {
  

  return (
    <section className="hero">
      <div className="hero__content">
        <h1 className="hero__title">
          Spotless Commercial Cleaning Service
        </h1>
        <p className="hero__subtitle">
          Providing office and clinic cleaning across the GTA with reliability and efficiency.
        </p>
        <a onClick={onNext} className="hero__button">
          Get a Quote
        </a>

      </div>
      <div className="hero__image">
        <img
          src={CleaningIllustration}
          alt="Illustration of a cleaner at work"
        />
      </div>
    </section>
  );
}
