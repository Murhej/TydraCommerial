import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../header/HeaderPage";
import usePageMeta from "../../hooks/usePageMeta";
import "./services.css";

import Amex from "../Img/amex.svg";
import Visa from "../Img/visa.svg";
import Mastercard from "../Img/mastercard.svg";
import Paypal from "../Img/paypal.svg";

import Facebook from "../Img/icon-facebook.svg";
import Instagram from "../Img/icon-instagram.svg";
import Tiktok from "../Img/Tiktok.svg";

const servicePackages = [
  {
    title: "Basic",
    badge: "B",
    theme: "basic",
    tagline: "Daily upkeep for a spotless, professional look.",
    description:
      "Essential cleaning tasks that keep your workplace fresh, sanitary, and professional on a daily basis.",
    bestFor: ["Offices", "Studios", "Small clinics"],
    items: [
      {
        subTitle: "Floor Care",
        desc: ["Daily or weekly floor upkeep"],
        sub: [
          { title: "Hard Floors", tasks: ["Sweep and edge sweep", "Neutral pH mopping", "Spot mop spills"] },
          { title: "Carpets & Rugs", tasks: ["Vacuum (edges and under desks)", "Small spill spot treatment"] },
          { title: "Entrances", tasks: ["Clean walk-off mats", "Salt and dirt control in winter"] }
        ]
      },
      {
        subTitle: "Restroom Sanitation",
        desc: ["Disinfect and restock"],
        sub: [
          { title: "Fixtures", tasks: ["Toilets and urinals", "Sinks, counters, mirrors"] },
          { title: "Dispensers", tasks: ["Soap, paper towels, toilet paper", "Feminine bins service"] },
          { title: "High-Touch", tasks: ["Handles, partitions, flush levers", "Odor control check"] }
        ]
      },
      {
        subTitle: "Surface Cleaning & Disinfection",
        desc: ["Workstations and shared areas"],
        sub: [
          { title: "Desks & Counters", tasks: ["Microfiber dust and wipe", "Disinfect high-touch points"] },
          { title: "Electronics (Dry Wipe)", tasks: ["Monitors and bezels", "Keyboards and mice (no liquid)"] },
          { title: "Shared Areas", tasks: ["Tables and chairs", "Lobby and reception surfaces"] }
        ]
      },
      {
        subTitle: "Trash & Recycling Removal",
        desc: ["Daily removal and reliners"],
        sub: [
          { title: "Trash", tasks: ["Empty bins and reliner", "Spot clean spills in bins"] },
          { title: "Recycling", tasks: ["Cardboard breakdown", "Bin wipe-down as needed"] }
        ]
      },
      {
        subTitle: "Dusting",
        desc: ["Low and high dusting"],
        sub: [
          { title: "Low Areas", tasks: ["Shelves, sills, ledges", "Baseboards (rotational)"] },
          { title: "High Areas", tasks: ["Vents and returns", "Ceiling fans and partition tops"] }
        ]
      }
    ]
  },
  {
    title: "Add-Ons",
    badge: "+",
    theme: "addons",
    tagline: "Targeted extras to enhance cleanliness beyond the basics.",
    description:
      "Extra services tailored to specific needs. Choose add-ons to extend your cleaning scope.",
    bestFor: ["Seasonal needs", "Turnovers", "Special requests"],
    items: [
      {
        subTitle: "Glass Cleaning",
        desc: ["Smear-free interior glass"],
        sub: [
          { title: "Partitions & Mirrors", tasks: ["Both sides where accessible", "Edges, frames, sills"] },
          { title: "Windows (Interior Reach)", tasks: ["Extension-pole cleaning up to high points"] }
        ]
      },
      {
        subTitle: "Kitchen/Breakroom Deep Cleaning",
        desc: ["Degrease and sanitize food areas"],
        sub: [
          { title: "Appliances", tasks: ["Fridges and microwaves (inside/out)", "Coffee machines and kettles wipe"] },
          { title: "Surfaces", tasks: ["Counters and backsplashes", "Cabinet fronts and handles"] },
          { title: "Floors", tasks: ["Scrub and sanitize", "Grout touch-up on request"] }
        ]
      },
      {
        subTitle: "Move-In / Move-Out Cleaning",
        desc: ["Top-to-bottom turnover"],
        sub: [
          { title: "Storage", tasks: ["Cabinets and drawers (empty)", "Closets and shelves"] },
          { title: "Behind and Under", tasks: ["Behind fridge and stove", "Filter and gasket wipe"] },
          { title: "Detailing", tasks: ["Walls and doors spot clean", "Switch plates and handles"] }
        ]
      },
      {
        subTitle: "Carpet & Upholstery Extraction",
        desc: ["Deep fiber care"],
        sub: [
          { title: "Pre-Treat", tasks: ["Targeted pre-spray", "Spot agitation"] },
          { title: "Hot-Water Extraction", tasks: ["Rinse and recover passes", "Neutralize and groom pile"] },
          { title: "Stain and Odor", tasks: ["Protocol-based treatment", "Optional protectant"] }
        ]
      },
      {
        subTitle: "Post-Construction Cleaning",
        desc: ["Fine-dust removal protocol"],
        sub: [
          { title: "HEPA Vacuuming", tasks: ["Floors and carpets", "Vents, tracks, ledges"] },
          { title: "Detailing", tasks: ["Adhesive and label removal", "Paint spot touch-up"] },
          { title: "Final Pass", tasks: ["High-to-low dust removal", "Polish walk-through"] }
        ]
      },
      {
        subTitle: "Eco-Friendly / Green Cleaning",
        desc: ["Safer products and methods"],
        sub: [
          { title: "Products", tasks: ["Eco-focused product options", "Fragrance-free choices"] },
          { title: "Process", tasks: ["Microfiber and dilution control", "Low-residue methods"] }
        ]
      }
    ]
  },
  {
    title: "Premium",
    badge: "P",
    theme: "premium",
    tagline: "Specialized programs for higher demands and unique environments.",
    description:
      "High-value, specialized services designed for businesses with advanced cleaning requirements.",
    bestFor: ["Medical", "Showrooms", "High-traffic sites"],
    items: [
      {
        subTitle: "Floor Refinishing Programs",
        desc: ["Resilience and shine restoration"],
        sub: [
          { title: "Strip & Wax", tasks: ["Old finish removal", "Multiple high-solids coats"] },
          { title: "Scrub & Recoat", tasks: ["Interim maintenance", "Gloss recovery without full strip"] },
          { title: "Burnish Plan", tasks: ["Periodic high-speed burnish", "Traffic-based scheduling"] }
        ]
      },
      {
        subTitle: "Electrostatic Disinfection (On Request)",
        desc: ["Rapid coverage for outbreak response"],
        sub: [
          { title: "Chemistry", tasks: ["Hospital-grade disinfectant", "Dwell-time compliance"] },
          { title: "Scope", tasks: ["High-touch and shared zones", "Service logbook available"] }
        ]
      }
    ]
  }
];

const highlights = [
  { icon: "+", label: "Locally owned family team" },
  { icon: "+", label: "Eco-friendly product options" },
  { icon: "+", label: "Background-checked professionals" },
  { icon: "+", label: "Flexible scheduling" }
];

export default function ServicesSection() {
  usePageMeta("Our Services", "Explore Basic, Add-On, and Premium commercial cleaning services.");
  const [openCards, setOpenCards] = useState(() => servicePackages.map(() => false));
  const previewCount = 2;

  const toggleCard = (i) =>
    setOpenCards((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <section className="services section" aria-labelledby="services-title">
      <Header />

      <div className="services__container">
        <header className="services__hero">
          <h2 id="services-title" className="services__title">Our Services</h2>
          <p className="services__subtitle">
            Choose a plan that fits your space. Start with <strong>Basic</strong>, layer any <strong>Add-Ons</strong>,
            or step up to <strong>Premium</strong> for specialized programs.
          </p>
          <ul className="services__highlights" aria-label="Service highlights">
            {highlights.map((h) => (
              <li key={h.label} className="chip">
                <span aria-hidden="true" className="chip__icon">{h.icon}</span>
                {h.label}
              </li>
            ))}
          </ul>
        </header>

        <div className="packages" role="list">
          {servicePackages.map((pkg, i) => {
            const showingAll = openCards[i];
            const visibleItems = showingAll ? pkg.items : pkg.items.slice(0, previewCount);

            return (
              <article
                key={pkg.title}
                className={`package package--${pkg.theme}`}
                aria-labelledby={`pkg-${i}-title`}
              >
                <div className="package__top">
                  <div className="package-head">
                    <span className="pkg-badge" aria-hidden="true">{pkg.badge}</span>
                    <h3 id={`pkg-${i}-title`} className="package-title">{pkg.title}</h3>
                  </div>

                  {pkg.tagline && <p className="package-tagline">{pkg.tagline}</p>}
                  <p className="package-desc">{pkg.description}</p>

                  {pkg.bestFor?.length > 0 && (
                    <ul className="bestfor" aria-label="Best for">
                      {pkg.bestFor.map((b) => <li key={b} className="bestfor__tag">{b}</li>)}
                    </ul>
                  )}
                </div>

                <ul id={`pkg-${i}-list`} className="package-list">
                  {visibleItems.map((item, j) => (
                    <li key={`${pkg.title}-${item.subTitle}-${j}`} className="package-item">
                      <div className="pi-title">
                        <strong className="pi-heading">{item.subTitle}</strong>
                        {item.desc?.length ? (
                          <span className="pi-note">{item.desc.join(" | ")}</span>
                        ) : null}
                      </div>

                      {item.sub?.length ? (
                        <div className="pi-subwrap">
                          {item.sub.map((s, k) => (
                            <details className="pi-sub" key={k}>
                              <summary>{s.title}</summary>
                              <ul className="pi-sublist">
                                {s.tasks.map((t, ti) => <li key={ti}>{t}</li>)}
                              </ul>
                            </details>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {pkg.items.length > previewCount && (
                  <button
                    className="btn-tertiary ui-btn ghost sm"
                    onClick={() => toggleCard(i)}
                    aria-expanded={showingAll}
                    aria-controls={`pkg-${i}-list`}
                  >
                    {showingAll ? "Show less" : `Show ${pkg.items.length - previewCount} more`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="included">
          <div className="included__card">
            <h4>Included in every visit</h4>
            <ul className="bullets">
              <li>Supplies and equipment provided (eco options available)</li>
              <li>Before and after photo documentation on request</li>
              <li>Quality checklist completed by your cleaner</li>
              <li>Simple, no-surprise pricing</li>
            </ul>
          </div>
          <div className="included__card">
            <h4>Good to know</h4>
            <ul className="bullets">
              <li>Background-checked crews with account notes kept up to date.</li>
              <li>After-hours and weekend slots available.</li>
              <li>Fragrance-free and allergy-safe products on request.</li>
              <li>Custom scopes for medical, labs, and high-security sites.</li>
            </ul>
          </div>
        </div>

        <div className="cta-band">
          <div className="cta-band__inner">
            <p className="cta-text">Ready for a custom quote?</p>
            <Link className="btn-primary ui-btn primary md" to="/contactus">Get a Free Estimate</Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer__container">
          <div className="footer__column">
            <h3 className="footer__header">Contact</h3>
            <p>Toronto, ON</p>
            <p>(647) 877-3741</p>
            <p>tydra.gta.cleaning@gmail.com</p>
          </div>

          <div className="footer__column">
            <h3 className="footer__header">Business Hours</h3>
            <p>Mon-Fri: 9 am-6 pm</p>
            <p>Sat: 10 am-6 pm</p>
            <p>Sun: Closed</p>
          </div>

          <div className="footer__column">
            <h3 className="footer__header">Follow Us</h3>
            <div className="footer__social-icons">
              <a
                href="https://www.facebook.com/"
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
    </section>
  );
}
