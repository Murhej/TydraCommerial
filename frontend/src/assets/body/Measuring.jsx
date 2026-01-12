import React, { useState } from "react";
import SQFTSheet from "../../../public/SQFTSheet.png";
import "./Measuring.css";

export default function Measuring() {
  const [selectedTab, setSelectedTab] = useState("sqft"); // 'sqft' | 'hourly'

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      setSelectedTab((prev) => (prev === "sqft" ? "hourly" : "sqft"));
    }
  };

  return (
    <section className="measurings">
      {/* Tabs */}
      <div
        className="Measuring-body"
        role="tablist"
        aria-label="Pricing type"
        onKeyDown={handleKeyDown}
      >
        <button
          id="sqft-tab"
          role="tab"
          aria-controls="sqft-panel"
          aria-selected={selectedTab === "sqft"}
          className={`tab ${selectedTab === "sqft" ? "active" : ""}`}
          onClick={() => setSelectedTab("sqft")}
        >
          SqFt
        </button>

        <button
          id="hourly-tab"
          role="tab"
          aria-controls="hourly-panel"
          aria-selected={selectedTab === "hourly"}
          className={`tab ${selectedTab === "hourly" ? "active" : ""}`}
          onClick={() => setSelectedTab("hourly")}
        >
          Hourly
        </button>
      </div>

      {/* SqFt Panel */}
      <div
        id="sqft-panel"
        className={`expand-wrapper ${selectedTab === "sqft" ? "open" : "closed"}`}
        role="tabpanel"
        aria-labelledby="sqft-tab"
      >
        <div className="expand-Sqft">
          <div className="sqft-text">
            <p className="expand-Sqft-text">
              Our commercial cleaning rates are based on <strong>square footage</strong> and
              <strong> number of visits per week</strong>. Use this table to estimate your monthly cost.
            </p>
            <p className="expand-Sqft-text note">
              Example: A <strong>5,000 sq. ft. office</strong> cleaned <strong>3× per week</strong> is billed at
              <strong> $0.10/sqft per clean</strong>. Multiply by your square footage and visits to estimate your
              monthly price. <span className="text-primary">Contact us for an exact quote.</span>
            </p>
          </div>

          <div className="sqft-image">
            <img src={SQFTSheet} alt="Square footage measuring guide" />
          </div>
        </div>
      </div>

      {/* Hourly Panel */}
      <div
        id="hourly-panel"
        className={`expand-wrapper ${selectedTab === "hourly" ? "open" : "closed"}`}
        role="tabpanel"
        aria-labelledby="hourly-tab"
      >
        <div className="expand-Hourly">
          <div className="hourly-box">
            <h4>Hourly Pricing Guidance</h4>
            <p>
              At Tydra Commercial Cleaning, rates range from <strong>$33–$55/hr per cleaner</strong>, depending on:
            </p>
            <ul>
              <li>Job type (standard, deep clean, post-construction)</li>
              <li>Site size & condition (sqft, frequency, layout)</li>
              <li>Location (travel, access, parking)</li>
              <li>Scope (special requests, supplies/equipment)</li>
            </ul>
            <p className="hourly-cta">
              Share details about your space and goals, and we’ll provide a tailored estimate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
