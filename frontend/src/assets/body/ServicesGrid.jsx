import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import addOn from "../Img/addOn.png";
import Basic from "../Img/Basic.png";
import Premium from "../Img/Premium.png";
import "./ServicesGrid.css";

const SERVICES_TIER = [
  {
    img: Basic,
    imgWidth: 522,
    imgHeight: 478,
    title: "Basic",
    description:
      "Essential cleaning tasks that keep your workplace fresh, sanitary, and professional on a daily basis.",
    preview: ["Floor care", "Restroom sanitation", "Surface disinfection"],
    items: [
      { subTitle: "Floor Care", desc: ["Sweeping, mopping, vacuuming", "Basic carpet cleaning"] },
      { subTitle: "Restroom Sanitation", desc: ["Toilets, sinks, mirrors, partitions", "Restocking essentials (soap, paper towels, toilet paper)"] },
      { subTitle: "Surface Cleaning & Disinfection", desc: ["Desks, counters, tables", "Touchpoints (doorknobs, switches, elevator buttons)"] },
      { subTitle: "Trash & Recycling Removal", desc: ["Emptying bins and replacing liners", "Recycling management and bin wipe-down"] },
      { subTitle: "Dusting", desc: ["Low and high surfaces (shelves, vents, fans, ledges)"] },
    ],
  },
  {
    img: addOn,
    imgWidth: 531,
    imgHeight: 470,
    title: "Add-Ons",
    description:
      "Extra services tailored to specific needs. Choose these add-ons to enhance your scope beyond core cleaning.",
    preview: ["Glass cleaning", "Kitchen deep cleaning", "Move-in/move-out"],
    items: [
      { subTitle: "Glass Cleaning", desc: ["Mirrors and interior partitions", "Smear-free finish"] },
      { subTitle: "Kitchen/Breakroom Deep Cleaning", desc: ["Appliances, sinks, counters", "Fridges and microwaves"] },
      { subTitle: "Move-In/Move-Out Cleaning", desc: ["Before or after tenant or office shifts", "Detailed turnover cleaning"] },
      { subTitle: "Carpet & Upholstery Extraction", desc: ["Deep steam cleaning", "Allergen and stain removal"] },
      { subTitle: "Post-Construction Cleaning", desc: ["Dust and debris removal", "Paint and adhesive spot removal"] },
      { subTitle: "Eco-Friendly/Green Cleaning", desc: ["Non-toxic products", "Allergy-safe cleaning options"] },
    ],
  },
  {
    img: Premium,
    imgWidth: 447,
    imgHeight: 460,
    title: "Premium",
    description:
      "High-value, specialized services for advanced cleaning requirements and sensitive environments.",
    preview: ["Floor refinishing", "Electrostatic disinfection", "High-touch programs"],
    items: [
      { subTitle: "Floor Refinishing Programs", desc: ["Quarterly stripping and waxing", "Machine scrubbing and polishing"] },
      { subTitle: "Electrostatic Disinfection (On Request)", desc: ["Hospital-grade disinfectant application", "Rapid coverage in high-touch zones"] },
    ],
  },
];

export default function ServicesGrid() {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!expanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setExpanded(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const stats = useMemo(() => ({
    plans: SERVICES_TIER.length,
    lineItems: SERVICES_TIER.reduce((sum, tier) => sum + tier.items.length, 0),
  }), []);

  return (
    <div className="service-page">
      <h2 className="page-title">Our Services</h2>
      <p className="page-subtitle">
        Start with a core plan, layer add-ons, and scale into premium programs as your space grows.
      </p>

      <div className="service-stats">
        <span>{stats.plans} plan types</span>
        <span>{stats.lineItems} service groups</span>
        <span>Flexible custom scope</span>
      </div>

      <section className="services-grid" aria-label="Service plans">
        {SERVICES_TIER.map((tier) => (
          <article
            key={tier.title}
            className={`service-card service-card--${tier.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <div className="service-card__icon" aria-hidden="true">
              <img
                src={tier.img}
                alt=""
                width={tier.imgWidth}
                height={tier.imgHeight}
                loading="lazy"
                decoding="async"
              />
            </div>
            <h3>{tier.title}</h3>
            <p>{tier.description}</p>
            <ul>
              {tier.preview.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              className="expand-btn ui-btn primary md"
              onClick={() => setExpanded(tier)}
            >
              View Details
            </button>
          </article>
        ))}
      </section>

      {expanded && (
        <div className="sg-modal-overlay" onClick={() => setExpanded(null)}>
          <div
            className="sg-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="sg-modal-close"
              type="button"
              aria-label="Close service details"
              onClick={() => setExpanded(null)}
            >
              <span aria-hidden="true">&times;</span>
            </button>

            <div className="sg-modal-header">
              <img
                src={expanded.img}
                alt={`${expanded.title} logo`}
                width={expanded.imgWidth}
                height={expanded.imgHeight}
                loading="lazy"
                decoding="async"
              />
              <div className="sg-modal-header-info">
                <h2 id="modal-title">{expanded.title}</h2>
                <p className="sg-modal-desc">{expanded.description}</p>
                <div className="sg-modal-meta">
                  <span>{expanded.items.length} service groups</span>
                  <Link to="/services" className="sg-modal-link" onClick={() => setExpanded(null)}>
                    Full service catalog
                  </Link>
                </div>
              </div>
            </div>

            <div className="service-grid">
              {expanded.items.map((serviceItem) => (
                <div key={serviceItem.subTitle} className="service-box">
                  <div className="info">
                    <h4>{serviceItem.subTitle}</h4>
                    <ul className="bullet-list">
                      {serviceItem.desc.map((line, lineIdx) => <li key={lineIdx}>{line}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="sg-modal-actions">
              <Link to="/services" className="sg-action-btn outline ui-btn secondary md" onClick={() => setExpanded(null)}>
                View Full Catalog
              </Link>
              <Link to="/contactus" className="sg-action-btn filled ui-btn primary md" onClick={() => setExpanded(null)}>
                Get Custom Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
