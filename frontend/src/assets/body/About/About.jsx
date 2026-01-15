import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../header/HeaderPage";
import QouteForm from "../QuoteForm"
import "./Aboutus.css";

import Amex from "../assets/Img/amex.svg";
import Visa from "../assets/Img/visa.svg";
import Mastercard from "../assets/Img/mastercard.svg";
import Paypal from "../assets/Img/paypal.svg";

import Facebook from "../assets/Img/icon-facebook.svg";
import Instagram from "../assets/Img/icon-instagram.svg";
import Tiktok from "../assets/Img/Tiktok.svg";

export default function About() {
  // Your structured packages
  const [viewQoute, setViewQoute] = useState(false)
  const  onclickview = ()=>  {
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
        { subTitle: "Trash & Recycling Removal", desc: ["Emptying bins & replacing liners", "Recycling management & bin wipe-down"] },
        { subTitle: "Dusting", desc: ["Low & high surfaces (shelves, vents, fans, ledges)"] },
      ],
    },
    {
      title: "Add-Ons",
      description:
        "Extra services tailored to specific needs — choose these add-ons to enhance cleanliness beyond the basics.",
      items: [
        { subTitle: "Glass Cleaning", desc: ["Mirrors and glass partitions"] },
        { subTitle: "Kitchen/Breakroom Deep Cleaning", desc: ["Appliances, sinks, counters", "Fridges & microwaves"] },
        { subTitle: "Move-In/Move-Out Cleaning", desc: ["Before or after tenant/office shifts", "Detailed turnover cleaning"] },
        { subTitle: "Post-Construction Cleaning", desc: ["Dust & debris removal", "Paint and adhesive spot removal"] },
        { subTitle: "Eco-Friendly/Green Cleaning", desc: ["Non-toxic products", "Allergy-safe cleaning options"] },
      ],
    },
    {
      title: "Premium",
      description:
        "High-value, specialized services designed for businesses with advanced cleaning requirements or unique environments.",
      items: [
        { subTitle: "Floor Refinishing Programs", desc: ["Quarterly stripping & waxing", "Machine scrubbing & polishing"] },
        { subTitle: "Carpet & Upholstery Extraction", desc: ["Deep steam cleaning", "Allergen and stain removal"] },
      ],
    },
  ];

  // Control "show more" per package
  const [openCards, setOpenCards] = useState(() =>
    servicePackages.map(() => false)
  );
  const toggleCard = (i) =>
    setOpenCards((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="page">
      <Header />

      <main className="container">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">Clean More, Save More</h1>
          <p className="hero-text">
            Founded by a mother–son team and run daily by our family, <strong>Tydra</strong> is your trusted
            commercial-cleaning partner across Toronto, the GTA and surrounding communities (Vaughan,
            Etobicoke, Scarborough, Mississauga, and beyond). We specialize in small offices and corporate
            headquarters, delivering reliable, transparent, excellence-driven service that fits your schedule
            and budget.
          </p>
          <div className="hero-cta">
            <button onClick={onclickview} className="btn-primary">Get a Free Quote</button>
            {viewQoute && (
              <div className="floating-space" onClick={() => setViewQoute(false)}>
            
                <div className="floating-table" onClick={(e) => e.stopPropagation()}>
                  <QouteForm/>
                </div>
              </div>
            )}
            <Link to="/services" className="btn-secondary">View All Services</Link>
          </div>
        </section>

        {/* Services */}
        <section className="section" aria-labelledby="services-title">
          <h2 id="services-title" className="section-title">Our Services</h2>

          <div className="packages">
            {servicePackages.map((pkg, i) => {
              const previewCount = 3; // show this many items before "show more"
              const showingAll = openCards[i];
              const visibleItems = showingAll ? pkg.items : pkg.items.slice(0, previewCount);

              return (
                <article key={pkg.title} className="package" aria-labelledby={`pkg-${i}-title`}>
                  <div className="package-head">
                    <span className="pkg-badge" aria-hidden="true">
                      {pkg.title === "Premium" ? "★" : "✓"}
                    </span>
                    <h3 id={`pkg-${i}-title`} className="package-title">{pkg.title}</h3>
                  </div>

                  <p className="package-desc">{pkg.description}</p>

<ul id={`pkg-${i}-list`} className="package-list">
  {visibleItems.map((item, j) => (
    <li key={`${pkg.title}-${item.subTitle}-${j}`} className="package-item">
      <div className="pi-title">
        <span className="pi-dot" aria-hidden="true">•</span>
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
                      className="btn-tertiary"
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

        {/* Why Choose */}
        <section className="section" aria-labelledby="why-title">
          <h2 id="why-title" className="section-title">Why Choose Tydra?</h2>
          <ul className="bullets">
            <li><strong>Family-Owned:</strong> Founders oversee every job—no middlemen, no surprises.</li>
            <li><strong>Reliability:</strong> We show up on time and complete most jobs in under two hours.</li>
            <li><strong>Transparency:</strong> Clear, upfront quotes and real-time progress updates.</li>
            <li><strong>Excellence:</strong> Trained pros, industry-standard equipment, spotless results.</li>
          </ul>
        </section>

        {/* Approach */}
        <section className="section" aria-labelledby="approach-title">
          <h2 id="approach-title" className="section-title">Our Approach</h2>
          <p>
            We take a holistic view of cleanliness—because a truly clean workspace isn’t just about
            appearances, it’s about health, safety, and productivity. We optimize workflows to minimize
            disruption, coordinate with your staff, and tailor each visit to your needs.
          </p>
          <p>
            Whether it’s a daily refresh or a deep-clean overhaul, you’ll notice the difference in every
            corner. We typically clean after business hours or during your designated closing times to
            ensure zero interruption to your operations.
          </p>
        </section>

        {/* Team */}
        <section className="section" aria-labelledby="team-title">
          <h2 id="team-title" className="section-title">Meet Our Team</h2>
          <p>
            Our crew is the heart of Tydra. From veteran floor technicians to sanitation specialists,
            each team member is background-checked, insured, and trained for sensitive commercial
            environments—with ongoing training so our specialists keep improving.
          </p>
        </section>

        {/* Community */}
        <section className="section" aria-labelledby="community-title">
          <h2 id="community-title" className="section-title">Commitment to Community</h2>
          <p>
            As proud residents of the GTA, we give back by partnering with local schools and non-profits to
            support community centres, shelters, and youth programs. Choosing Tydra helps keep our
            neighbourhoods safe and thriving.
          </p>
        </section>

        {/* Mission */}
        <section className="section" aria-labelledby="mission-title">
          <h2 id="mission-title" className="section-title">Our Mission</h2>
          <p>
            Help businesses “Clean More, Save More” with premium commercial-cleaning solutions that balance
            top-tier results with smart pricing.
          </p>
        </section>

        {/* CTA band */}
        <section className="cta-band" aria-label="Get a quote">
          <div className="cta-band-inner">
            <p className="cta-text">Ready for a cleaner workspace?</p>
            <Link to="/ContactUs" className="btn-primary">Request Your Quote</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
    
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
                  <a
                    href="https://www.facebook.com/"  // put your real page link here
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
    
              {/* Payments & Trust */}
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
