import React, { useState } from "react";
import "./Measuring.css";

export default function Measuring() {
  const [selectedTab, setSelectedTab] = useState("sqft"); // 'sqft' | 'hourly' | 'contract'

  const handleKeyDown = (e) => {
    const tabs = ["sqft", "hourly", "contract"];
    const currentIndex = tabs.indexOf(selectedTab);
    if (e.key === "ArrowRight") {
      setSelectedTab(tabs[(currentIndex + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      setSelectedTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
    }
  };

  return (
    <section className="measurings">
      <header className="pricing-head">
        <h3>Pricing Guide</h3>
        <p>Transparent pricing with recommended visit patterns for most offices.</p>
      </header>
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

        <button
          id="contract-tab"
          role="tab"
          aria-controls="contract-panel"
          aria-selected={selectedTab === "contract"}
          className={`tab ${selectedTab === "contract" ? "active" : ""}`}
          onClick={() => setSelectedTab("contract")}
        >
          Contract
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
              Example: A <strong>5,000 sq. ft. office</strong> cleaned <strong>3x per week</strong> is billed at
              <strong> $0.07/sqft per clean</strong> based on the table above. Multiply by your square footage and visits to estimate your
              monthly price. <span className="text-primary">Contact us for an exact quote.</span>
            </p>
            <p className="pricing-recommendation">
              Recommended baseline: <strong>3 visits/week</strong> for high-touch office environments.
            </p>
          </div>

          <div className="sqft-table-wrap" role="region" aria-label="Square foot pricing table">
            <table className="sqft-rate-table">
              <thead>
                <tr>
                  <th>Per Week</th>
                  <th>1,000 SQFt</th>
                  <th>2,500 SQFt</th>
                  <th>4,000 SQFt</th>
                  <th>5,000 SQFt</th>
                  <th>6,000+ SQFt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>$0.12</td>
                  <td>$0.10</td>
                  <td>$0.09</td>
                  <td>$0.09</td>
                  <td>$0.08</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>$0.11</td>
                  <td>$0.09</td>
                  <td>$0.08</td>
                  <td>$0.08</td>
                  <td>$0.07</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>$0.10</td>
                  <td>$0.08</td>
                  <td>$0.07</td>
                  <td>$0.07</td>
                  <td>$0.06</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>$0.09</td>
                  <td>$0.07</td>
                  <td>$0.06</td>
                  <td>$0.06</td>
                  <td>$0.05</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>$0.08</td>
                  <td>$0.06</td>
                  <td>$0.05</td>
                  <td>$0.05</td>
                  <td>$0.04</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>$0.07</td>
                  <td>$0.06</td>
                  <td>$0.05</td>
                  <td>$0.05</td>
                  <td>$0.04</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>$0.07</td>
                  <td>$0.05</td>
                  <td>$0.04</td>
                  <td>$0.04</td>
                  <td>$0.04</td>
                </tr>
              </tbody>
            </table>
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
              At Tydra Commercial Cleaning, rates range from <strong>$33-$55/hr per cleaner</strong>, depending on:
            </p>
            <ul>
              <li>Job type (standard, deep clean, post-construction)</li>
              <li>Site size & condition (sqft, frequency, layout)</li>
              <li>Location (travel, access, parking)</li>
              <li>Scope (special requests, supplies/equipment)</li>
            </ul>
            <p className="hourly-cta">
              Share details about your space and goals, and we will provide a tailored estimate.
            </p>
          </div>
        </div>
      </div>

      {/* Contract Panel */}
      <div
        id="contract-panel"
        className={`expand-wrapper ${selectedTab === "contract" ? "open" : "closed"}`}
        role="tabpanel"
        aria-labelledby="contract-tab"
      >
        <div className="expand-Contract">
          <div className="contract-intro">
            <h4>Contract Length Discount Guide</h4>
            <p>
              Longer agreements reduce pricing and lock in stable service planning. Choose the term that matches your
              operations and budget goals.
            </p>
          </div>

          <div className="contract-table-wrap" role="region" aria-label="Contract length discounts">
            <table className="contract-table">
              <thead>
                <tr>
                  <th>Contract Length</th>
                  <th>Discount</th>
                  <th>Why it works</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Month-to-month</td>
                  <td><span className="discount-badge neutral">No discount</span></td>
                  <td>Maximum flexibility with no long commitment.</td>
                </tr>
                <tr>
                  <td>3 months</td>
                  <td><span className="discount-badge">5% off</span></td>
                  <td>Great for testing workflow fit with light savings.</td>
                </tr>
                <tr>
                  <td>6 months</td>
                  <td><span className="discount-badge">10% off</span></td>
                  <td>Balanced term for predictable service and cost.</td>
                </tr>
                <tr>
                  <td>12 months</td>
                  <td><span className="discount-badge">15% off</span></td>
                  <td>Best value for ongoing cleaning operations.</td>
                </tr>
                <tr>
                  <td>24 months</td>
                  <td><span className="discount-badge">20% off</span></td>
                  <td>Highest savings for long-term multi-site planning.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

