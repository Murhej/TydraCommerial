import React from "react";
import guarantee from "../Img/guarantee.png";
import DollarSign from "../Img/DollarSign.png";
import location from "../Img/Location.png";
import staff from "../Img/staff.png";
import leafIcon from "../Img/leafIcon.png";
import "./displayMessage.css";


const features = [
  {
    icon: DollarSign,
    title: "Affordable Packages",
    description:
      "Transparent per-sq-ft or hourly pricing with no hidden fees. Monthly plans available.",
  },
  {
    icon: location,
    title: "GTA Coverage",
    description:
      "Serving Toronto, Scarborough, North York, Etobicoke, Mississauga, Brampton, Vaughan, and Markham.",
  },
  {
    icon: staff,
    title: "Discreet, Professional Staff",
    description:
      "Background-checked, uniformed cleaners trained to work quietly without disrupting your space.",
  },
  {
    icon: guarantee,
    title: "100% Satisfaction Guarantee",
    description:
      "If anything is not right, we return within 24 hours to make it right — no questions asked.",
  },
  {
    icon: leafIcon,
    title: "Eco & Allergy-Safe Options",
    description:
      "Choose scent-free, eco-certified, or hypoallergenic products tailored to your preferences.",
  },
];

export default function DisplayMessage() {
  const iconSizeMap = {
    "Affordable Packages": { w: 305, h: 304 },
    "GTA Coverage": { w: 263, h: 353 },
    "Discreet, Professional Staff": { w: 560, h: 397 },
    "100% Satisfaction Guarantee": { w: 1024, h: 1024 },
    "Eco & Allergy-Safe Options": { w: 248, h: 220 },
  };

  return (
    <section className="features-section-wrap">
      <div className="features-section-header">
        <span className="section-label">Why Tydra</span>
        <h2>Built for Businesses That Can't Afford Mess</h2>
        <p>Everything you need from a commercial cleaning partner — reliability, transparency, and a standard your clients will notice.</p>
      </div>
      <div className="features">
        {features.map(({ icon, title, description }) => (
          <div key={title} className="feature-card">
            <div className="feature-card__icon-wrap">
              <img
                src={icon}
                alt={`${title} icon`}
                className="feature-card__icon"
                width={iconSizeMap[title]?.w}
                height={iconSizeMap[title]?.h}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__description">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

