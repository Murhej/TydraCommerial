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
    title: "Discreet, professional staff",
    description:
      "Background-checked, uniformed cleaners trained to work quietly without disrupting your space.",
  },
  {
    icon: guarantee,
    title: "100% satisfaction guarantee",
    description:
      "If anything is not right, we will return within 24 hours to make it right.",
  },
  {
    icon: leafIcon,
    title: "Eco & allergy-safe options",
    description:
      "Choose scent-free, eco-certified, or hypoallergenic products tailored to your preferences.",
  },
];

export default function DisplayMessage() {
  const iconSizeMap = {
    "Affordable Packages": { w: 305, h: 304 },
    "GTA Coverage": { w: 263, h: 353 },
    "Discreet, professional staff": { w: 560, h: 397 },
    "100% satisfaction guarantee": { w: 1024, h: 1024 },
    "Eco & allergy-safe options": { w: 248, h: 220 },
  };

  return (
    <section className="features">
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
          <h2 className="feature-card__title">{title}</h2>
          <p id="services" className="feature-card__description">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}

