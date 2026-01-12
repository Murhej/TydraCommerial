import React, { useState } from "react";
import Header from "../header/HeaderPage";
import "./services.css";

const servicePackages = [
  {
    title: "Basic",
    badge: "✓",
    theme: "basic",
    tagline: "Daily upkeep for a spotless, professional look.",
    description:
      "Essential cleaning tasks that keep your workplace fresh, sanitary, and professional on a daily basis.",
    bestFor: ["Offices", "Studios", "Small clinics"],
    items: [
      {
        subTitle: "Floor Care",
        desc: ["Daily/weekly floor upkeep"],
        sub: [
          { title: "Hard Floors", tasks: ["Sweep & edge sweep", "Neutral pH mopping", "Spot mop spills"] },
          { title: "Carpets & Rugs", tasks: ["Vacuum (edges & under desks)", "Small spill spot treatment"] },
          { title: "Entrances", tasks: ["Shake/clean walk-off mats", "Salt/dirt control in winter"] }
        ]
      },
      {
        subTitle: "Restroom Sanitation",
        desc: ["Disinfect & restock"],
        sub: [
          { title: "Fixtures", tasks: ["Toilets & urinals (base + hinges)", "Sinks, counters, mirrors"] },
          { title: "Dispensers", tasks: ["Soap, paper towels, toilet paper", "Feminine bins service"] },
          { title: "High-Touch", tasks: ["Door handles, partitions, flush levers", "Odor control check"] }
        ]
      },
      {
        subTitle: "Surface Cleaning & Disinfection",
        desc: ["Workstations & shared areas"],
        sub: [
          { title: "Desks & Counters", tasks: ["Microfiber dust & wipe", "Disinfect high-touch points"] },
          { title: "Electronics (dry wipe)", tasks: ["Monitors & bezels", "Keyboards & mice (no liquid)"] },
          { title: "Shared Areas", tasks: ["Tables & chairs", "Lobby & reception surfaces"] }
        ]
      },
      {
        subTitle: "Trash & Recycling Removal",
        desc: ["Daily removal & reliners"],
        sub: [
          { title: "Trash", tasks: ["Empty bins, tie & reliner", "Spot clean spills in bins"] },
          { title: "Recycling", tasks: ["Cardboard breakdown", "Bin wipe-down as needed"] }
        ]
      },
      {
        subTitle: "Dusting",
        desc: ["Low & high dusting"],
        sub: [
          { title: "Low Areas", tasks: ["Shelves, sills, ledges", "Baseboards (rotational)"] },
          { title: "High Areas", tasks: ["Vents & returns", "Ceiling fans & tops of partitions"] }
        ]
      }
    ]
  },
  {
    title: "Add-Ons",
    badge: "＋",
    theme: "addons",
    tagline: "Targeted extras to enhance cleanliness beyond the basics.",
    description:
      "Extra services tailored to specific needs — choose these add-ons to enhance cleanliness beyond the basics.",
    bestFor: ["Seasonal needs", "Turnovers", "Special requests"],
    items: [
      {
        subTitle: "Glass Cleaning",
        desc: ["Smear-free interior glass"],
        sub: [
          { title: "Partitions & Mirrors", tasks: ["Both sides where accessible", "Edges, frames, sills"] },
          { title: "Windows (interior reach)", tasks: ["Up to ~14' with extension poles"] }
        ]
      },
      {
        subTitle: "Kitchen/Breakroom Deep Cleaning",
        desc: ["Degrease & sanitize food areas"],
        sub: [
          { title: "Appliances", tasks: ["Fridges & microwaves (inside/out)", "Toasters, kettles, coffee machines wipe"] },
          { title: "Surfaces", tasks: ["Counters & backsplashes (degrease)", "Cabinet fronts & handles"] },
          { title: "Floors", tasks: ["Scrub & sanitize", "Grout touch-ups (optional)"] }
        ]
      },
      {
        subTitle: "Move-In / Move-Out Cleaning",
        desc: ["Top-to-bottom turnover"],
        sub: [
          { title: "Inside Storage", tasks: ["Cabinets & drawers (empty)", "Closets & shelves"] },
          { title: "Appliances Pulled", tasks: ["Behind/under fridge & stove", "Filter & gasket wipe"] },
          { title: "Marks & Smudges", tasks: ["Walls/doors spot clean", "Switch plates & handles"] }
        ]
      },
      {
        subTitle: "Post-Construction Cleaning",
        desc: ["Fine-dust removal protocol"],
        sub: [
          { title: "HEPA Vacuuming", tasks: ["Floors & carpets", "Vents, tracks, ledges"] },
          { title: "Detailing", tasks: ["Sticker/label & adhesive removal", "Paint splatter touch-ups"] },
          { title: "3-Pass Dusting", tasks: ["High → mid → low over 24–48h", "Final polish walk-through"] }
        ]
      },
      {
        subTitle: "Eco-Friendly / Green Cleaning",
        desc: ["Safer products & methods"],
        sub: [
          { title: "Products", tasks: ["Third-party certified (e.g., EcoLogo/Green Seal)", "Fragrance-free options"] },
          { title: "Process", tasks: ["Microfiber & dilution control", "Cold-water compatible chemistry"] }
        ]
      }
    ]
  },
  {
    title: "Premium",
    badge: "★",
    theme: "premium",
    tagline: "Specialized programs for higher demands & unique environments.",
    description:
      "High-value, specialized services designed for businesses with advanced cleaning requirements or unique environments.",
    bestFor: ["Medical & labs", "Showrooms", "High-traffic sites"],
    items: [
      {
        subTitle: "Floor Refinishing Programs",
        desc: ["Resilience & shine restoration"],
        sub: [
          { title: "Strip & Wax", tasks: ["Old finish removal", "Multiple coats high-solids finish"] },
          { title: "Scrub & Recoat", tasks: ["Interim maintenance", "Gloss recovery without full strip"] },
          { title: "Burnish Plan", tasks: ["Periodic high-speed burnish", "Traffic-based scheduling"] }
        ]
      },
      {
        subTitle: "Carpet & Upholstery Extraction",
        desc: ["Deep fiber care"],
        sub: [
          { title: "Pre-Treat & Agitate", tasks: ["Enzyme/oxy pre-spray", "Edge & spot agitation"] },
          { title: "Hot-Water Extraction", tasks: ["Dual pass rinse/recover", "Neutralize & groom pile"] },
          { title: "Stain/Odor", tasks: ["Proteins, tannins, oils protocols", "Optional protectant application"] }
        ]
      },
      {
        subTitle: "Electrostatic Disinfection (On Request)",
        desc: ["Rapid coverage for outbreaks"],
        sub: [
          { title: "Chemistry", tasks: ["Hospital-grade disinfectant", "Dwell time compliance"] },
          { title: "Scope", tasks: ["High-touch, shared areas, washrooms", "Logbook of treated zones"] }
        ]
      }
    ]
  }
];

const highlights = [
  { icon: "🧹", label: "WSIB-insured" },
  { icon: "🌿", label: "Eco-friendly products" },
  { icon: "🛡️", label: "Bonded & background-checked" },
  { icon: "⏱️", label: "Flexible scheduling" }
];

export default function ServicesSection() {
  const [openCards, setOpenCards] = useState(() => servicePackages.map(() => false));
  const previewCount = 3;

  const toggleCard = (i) =>
    setOpenCards((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <section className="services section" aria-labelledby="services-title">
      <Header />

      <div className="services__container">
        {/* HERO */}
        <header className="services__hero">
          <h2 id="services-title" className="services__title">Our Services</h2>
          <p className="services__subtitle">
            Choose a plan that fits your space. Start with <strong>Basic</strong>, layer any{" "}
            <strong>Add-Ons</strong>, or step up to <strong>Premium</strong> for specialized programs.
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

        {/* PACKAGES */}
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
                          <span className="pi-note">{item.desc.join(" • ")}</span>
                        ) : null}
                      </div>

                      {/* SUB-CATEGORIES (collapsible) */}
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

        {/* OPTIONAL: included/notes & CTA (keep or remove as you like) */}
        <div className="included">
          <div className="included__card">
            <h4>Included in every visit</h4>
            <ul className="bullets">
              <li>Supplies & equipment provided (eco options available)</li>
              <li>Before/after photo documentation on request</li>
              <li>Quality checklist signed by your cleaner</li>
              <li>Simple, no-surprise pricing</li>
            </ul>
          </div>
          <div className="included__card">
            <h4>Good to know</h4>
            <ul className="bullets">
              <li>WSIB-insured and bonded.</li>
              <li>After-hours & weekend slots available.</li>
              <li>Fragrance-free and allergy-safe products on request.</li>
              <li>Custom scopes for medical, labs, and high-security sites.</li>
            </ul>
          </div>
        </div>

        <div className="cta-band">
          <div className="cta-band__inner">
            <p className="cta-text">Ready for a custom quote?</p>
            <a className="btn-primary" href="/ContactUs">Get a Free Estimate</a>
          </div>
        </div>
      </div>
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
            <a href="face"><img src="/icon-facebook.svg" alt="Facebook" /></a>
            <a href="https://www.instagram.com/tydracommercial/"><img src="/icon-instagram.svg" alt="Instagram" /></a>
            <a href="https://www.tiktok.com/@tydracommercial?lang=en"><img src="/Tiktok.svg"   alt="TikTok" /></a>
          </div>
        </div>

        {/* Payments & Trust */}
        <div className="footer__column">
          <h3 className="footer__header">Payments &amp; Trust</h3>
          <div className="footer__payment-icons">
            <img src="/visa.svg"       alt="Visa" />
            <img src="/mastercard.svg" alt="Mastercard" />
            <img src="/amex.svg"       alt="American Express" />
            <img src="/paypal.svg"     alt="PayPal" />
          </div>
        </div>
      </div>
    </footer>
    </section>
  );
}
