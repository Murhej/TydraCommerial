import React from "react";
import "./DisplayMessage.css";

const features = [
  {
    icon: "/dollarSign.png",
    title: "Affordable Packages",
    description:
      "Transparent per-sq-ft or hourly pricing with no hidden fees. Monthly plans available.",
  },
  {
    icon: "/location.png",
    title: "GTA Coverage",
    description:
      "Serving Toronto, Scarborough, North York, Etobicoke, Mississauga, Brampton, Vaughan, and Markham.",
  },
  {
    icon: "/staff.png",
    title: "Discreet, professional staff",
    description:
      "Background-checked, uniformed cleaners trained to work quietly without disrupting your space.",
  },
  {
    icon: "/guarantee.png",
    title: "100% satisfaction guarantee",
    description: "If anything isn’t right, we’ll return within 24 hours to make it right.",
  },
  {
    icon: "/leafIcon.png",
    title: "Eco & allergy-safe options",
    description:
      "Choose scent-free, eco-certified, or hypoallergenic products tailored to your preferences.",
  },
];

export default function DisplayMessage() {
  return (
    <section className="features">
      {features.map(({ icon, title, description }) => (
        <div key={title} className="feature-card">
          <img src={icon} alt={`${title} icon`} className="feature-card__icon" />
          <h2 className="feature-card__title">{title}</h2>
          <p id="services" className="feature-card__description">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}
