import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../header/HeaderPage";
import QouteForm from "../QuoteForm";
import usePageMeta from "../../../hooks/usePageMeta";

import "./Aboutus.css";

import Amex from "../../Img/amex.svg";
import Visa from "../../Img/visa.svg";
import Mastercard from "../../Img/mastercard.svg";
import Paypal from "../../Img/paypal.svg";

import Facebook from "../../Img/icon-facebook.svg";
import Instagram from "../../Img/icon-instagram.svg";
import Tiktok from "../../Img/Tiktok.svg";

export default function About() {
  usePageMeta("About Tydra", "Learn about Tydra Commercial Cleaning and our service approach.");
  const [viewQoute, setViewQoute] = useState(false);

  const onclickview = () => {
    setViewQoute(!viewQoute);
  };

  const servicePackages = [
    {
      title: "Basic",
      description:
        "Essential cleaning tasks that keep your workplace fresh, sanitary, and professional on a daily basis.",
      items: [
        { subTitle: "Floor Care", desc: ["Sweeping, mopping, vacuuming", "Basic carpet cleaning"] },
        { subTitle: "Restroom Sanitation", desc: ["Toilets, sinks, mirrors, partitions", "Restocking essentials (soap, paper towels, toilet paper)"] },
        { subTitle: "Surface Cleaning & Disinfection", desc: ["Desks, counters, tables", "Touchpoints (doorknobs, switches, elevator buttons)"] },
        { subTitle: "Trash & Recycling Removal", desc: ["Emptying bins and replacing liners", "Recycling management and bin wipe-down"] },
        { subTitle: "Dusting", desc: ["Low and high surfaces (shelves, vents, fans, ledges)"] },
      ],
    },
    {
      title: "Add-Ons",
      description:
        "Targeted extras for unique spaces. Layer these add-ons when your site needs a deeper or more specialized pass.",
      items: [
        { subTitle: "Glass Cleaning", desc: ["Mirrors and interior glass partitions"] },
        { subTitle: "Kitchen/Breakroom Deep Cleaning", desc: ["Appliances, sinks, counters", "Fridges and microwaves"] },
        { subTitle: "Move-In/Move-Out Cleaning", desc: ["Before or after tenant or office shifts", "Detailed turnover cleaning"] },
        { subTitle: "Carpet & Upholstery Extraction", desc: ["Deep steam cleaning", "Allergen and stain removal"] },
        { subTitle: "Post-Construction Cleaning", desc: ["Dust and debris removal", "Paint and adhesive spot removal"] },
        { subTitle: "Eco-Friendly/Green Cleaning", desc: ["Non-toxic products", "Allergy-safe cleaning options"] },
      ],
    },
    {
      title: "Premium",
      description:
        "High-value, specialized services designed for businesses with advanced cleaning requirements or unique environments.",
      items: [
        { subTitle: "Floor Refinishing Programs", desc: ["Quarterly stripping and waxing", "Machine scrubbing and polishing"] },
        { subTitle: "Electrostatic Disinfection (On Request)", desc: ["Hospital-grade disinfectant application", "Rapid coverage for high-touch and shared zones"] },
      ],
    },
  ];

  const [openCards, setOpenCards] = useState(() => servicePackages.map(() => false));
  const toggleCard = (i) =>
    setOpenCards((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="page">
      <Header />

      <main className="container">
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">Clean More, Save More</h1>
          <p className="hero-text">
            Founded by a mother-son team and run daily by our family, <strong>Tydra</strong> is your trusted
            commercial cleaning partner across Toronto and the GTA (Vaughan, Etobicoke, Scarborough,
            Mississauga, and more). We focus on offices, clinics, and shared workspaces with reliable,
            transparent service that fits your schedule and budget.
          </p>
          <div className="hero-cta">
            <button onClick={onclickview} className="btn-primary ui-btn primary md">Get a Free Quote</button>
            {viewQoute && (
              <div className="floating-space" onClick={() => setViewQoute(false)}>
                <div className="floating-table" onClick={(e) => e.stopPropagation()}>
                  <QouteForm />
                </div>
              </div>
            )}
            <Link to="/services" className="btn-secondary ui-btn secondary md">View All Services</Link>
          </div>
        </section>

        <section className="section" aria-labelledby="services-title">
          <h2 id="services-title" className="section-title">Our Services</h2>

          <div className="packages">
            {servicePackages.map((pkg, i) => {
              const previewCount = 3;
              const showingAll = openCards[i];
              const visibleItems = showingAll ? pkg.items : pkg.items.slice(0, previewCount);

              return (
                <article key={pkg.title} className="package" aria-labelledby={`pkg-${i}-title`}>
                  <div className="package-head">
                    <span className="pkg-badge" aria-hidden="true">
                      {pkg.title === "Premium" ? "*" : "?"}
                    </span>
                    <h3 id={`pkg-${i}-title`} className="package-title">{pkg.title}</h3>
                  </div>

                  <p className="package-desc">{pkg.description}</p>

                  <ul id={`pkg-${i}-list`} className="package-list">
                    {visibleItems.map((item, j) => (
                      <li key={`${pkg.title}-${item.subTitle}-${j}`} className="package-item">
                        <div className="pi-title">
                          <span className="pi-dot" aria-hidden="true">*</span>
                          <strong className="pi-heading">{item.subTitle}</strong>
                        </div>

                        {Array.isArray(item.desc) ? (
                          <ul className="pi-desc" aria-label={`${item.subTitle} details`}>
                            {item.desc.map((line, k) => (
                              <li key={k}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="pi-desc">{item.desc}</p>
                        )}
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
        </section>

        <section className="section" aria-labelledby="why-title">
          <h2 id="why-title" className="section-title">Why Choose Tydra?</h2>
          <ul className="bullets">
            <li><strong>Family-Owned:</strong> Founders oversee each account directly.</li>
            <li><strong>Reliable:</strong> We show up on time with clear cleaning checklists.</li>
            <li><strong>Transparent:</strong> Upfront quotes and straightforward communication.</li>
            <li><strong>Consistent:</strong> Trained crews and quality checks on every visit.</li>
          </ul>
        </section>

        <section className="section" aria-labelledby="approach-title">
          <h2 id="approach-title" className="section-title">Our Approach</h2>
          <p>
            We focus on outcomes, not just tasks. A clean workspace supports health, safety, and productivity,
            so we tailor each visit around your traffic level, operating hours, and sensitive areas.
          </p>
          <p>
            From daily refreshes to deep-clean programs, we coordinate with your team and usually schedule
            after-hours windows to minimize disruption to your operations.
          </p>
        </section>

        <section className="section" aria-labelledby="team-title">
          <h2 id="team-title" className="section-title">Meet Our Team</h2>
          <p>
            Our crew is the heart of Tydra. From veteran floor technicians to sanitation specialists,
            each team member is background-checked and trained for sensitive commercial environments,
            with ongoing coaching to keep standards high.
          </p>
        </section>

        <section className="section" aria-labelledby="community-title">
          <h2 id="community-title" className="section-title">Commitment to Community</h2>
          <p>
            As proud GTA residents, we support local schools and non-profits where we can. Choosing Tydra
            supports a local team that cares about cleaner, safer neighbourhood spaces.
          </p>
        </section>

        <section className="section" aria-labelledby="mission-title">
          <h2 id="mission-title" className="section-title">Our Mission</h2>
          <p>
            Help businesses clean more and save more with professional commercial cleaning that balances
            high standards with practical pricing.
          </p>
        </section>

        <section className="cta-band" aria-label="Get a quote">
          <div className="cta-band-inner">
            <p className="cta-text">Ready for a cleaner workspace?</p>
            <Link to="/contactus" className="btn-primary ui-btn primary md">Request Your Quote</Link>
          </div>
        </section>
      </main>

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
    </div>
  );
}
