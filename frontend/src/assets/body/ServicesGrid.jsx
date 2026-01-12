// ServicesGrid.jsx
import React, { useEffect, useMemo, useState } from 'react';
import addOn from "../../../public/addOn.png"
import Basic from "../../../public/Basic.png"
import Premium from "../../../public/Premium.png"
import './ServicesGrid.css';

export default function ServicesGrid() {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(null); // null = nothing open, or index of service

  const servicesTier = [
  {
    img: Basic,
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
    img: addOn,
    title: "Add-Ons",
    description:
      "Extra services tailored to specific needs — choose these add-ons to enhance cleanliness beyond the basics.",
    items: [
      { subTitle: "Kitchen/Breakroom Deep Cleaning", desc: ["Appliances, sinks, counters", "Fridges & microwaves"] },
      { subTitle: "Move-In/Move-Out Cleaning", desc: ["Before or after tenant/office shifts", "Detailed turnover cleaning"] },
      { subTitle: "Post-Construction Cleaning", desc: ["Dust & debris removal", "Paint and adhesive spot removal"] },
      { subTitle: "Eco-Friendly/Green Cleaning", desc: ["Non-toxic products", "Allergy-safe cleaning options"] },
    ],
  },
  {
    img: Premium,
    title: "Premium",
    description:
      "High-value, specialized services designed for businesses with advanced cleaning requirements or unique environments.",
    items: [
      { subTitle: "Floor Refinishing Programs", desc: ["Quarterly stripping & waxing", "Machine scrubbing & polishing"] },
      { subTitle: "Carpet & Upholstery Extraction", desc: ["Deep steam cleaning", "Allergen and stain removal"] },
    ],
  },
];


  useEffect(()=>{
    const interval = setInterval(() => {
      setIndex((prev)=> (prev +1)% servicesTier.length);
    }, 9000);
    return ()=> clearInterval(interval);
  },[servicesTier.length]);
  
  

  const leftIdx = (index -1 +servicesTier.length)% servicesTier.length;
  const rightIdx = (index + 1)% servicesTier.length;

  const visible = [
      { slot: "left", data: servicesTier[leftIdx] },
      { slot: "center", data: servicesTier[index] },
      { slot: "right", data: servicesTier[rightIdx] },
    ];


  function renderGridSerivce( ){
    return (
      <section className='grid-serivce-tier' >
        <div className='grid-serivce-provider' >
        
          {visible.map(({slot, data})=>(
            <article
              key={data.title}
              className={`gsp-tier ${slot}`}
              aria-hidden={slot !== "center"}
              onClick={() => {
              if (slot === "left") setIndex(leftIdx);
              if (slot === "right") setIndex(rightIdx);
              }}
              style={{ cursor: slot === "center" ? "default" : "pointer" }}
              >
              <img src={data.img}></img>
              <h2>{data.title}</h2>
              <p>{data.description}</p>
                {slot === "center" && (
                  <button onClick={() => setExpanded(data)} className="expand-btn">
                    View More
                  </button>
                  )}


            </article>
            

          ))}
          {expanded && (
            <div className="modal-overlay" onClick={() => setExpanded(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
               
              <div className="modal-content-header">
              <img
                src={expanded.img}
                alt={`${expanded.title} logo`}
                loading="lazy"
              />
              <div className="modal-content-header-info">
                <h2 id="modal-title">{expanded.title}</h2>
                <p className="modal-desc">{expanded.description}</p>
              </div>
              </div>
              <div className="service-grid">
                {expanded.items.map((s) => (
                  <div key={s.subTitle} className="service-box">
                    <div className="info">
                      <h4>{s.subTitle}</h4>
                      <ul className="bullet-list">
                        {s.desc.map((line, idx) => <li key={idx}>{line}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>


              </div>
            </div>
          )}


        </div>

      </section>
    );
  }

  return (
    <div className="service-page">
      <h2 className="page-title">Our Services</h2>  
      {renderGridSerivce(servicesTier)}
      {/* {renderGrid('Specialized Add-On ','Extra services tailored to specific needs — choose these add-ons to enhance cleanliness beyond the basics.',addOnServices)} */}
    </div>
  );
}