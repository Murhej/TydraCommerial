import React, { useMemo, useState } from "react";
import { API_URL } from "../../config"; // adjust path if needed

import "./QuoteForm.css";

export default function QuoteForm({ innerRef }) {
  // -------------------------
  // Core state
  // -------------------------
  const [sqft, setSqft] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");

  // Step answers (category → answer)
  const [footTrafficAnswers, setFootTrafficAnswers] = useState({});
  const [cleaningAnswers, setCleaningAnswers] = useState({});
  const [conditionAnswers, setConditionAnswers] = useState({});
  const [pricingModel, setPricingModel] = useState("");
  const [serviceAddOns, setServiceAddOns] = useState([]);
  const [qualityExpectations, setQualityExpectations] = useState("");
  const [specialRequests, setSpecialRequests] = useState([]);

  // Frequency helpers
  const [freqCount, setFreqCount] = useState("");
  const [freqTimesPerDay, setFreqTimesPerDay] = useState("1");

  // Step confirm flags (each step requires clicking Next)
  const [step1Ready, setStep1Ready] = useState(false); // SqFt & Industry
  const [step2Ready, setStep2Ready] = useState(false); // Foot traffic
  const [step3Ready, setStep3Ready] = useState(false); // Cleaning Needs & Frequency
  const [step4Ready, setStep4Ready] = useState(false); // Conditions
  const [step5Ready, setStep5Ready] = useState(false); // Pricing model
  const [step6Ready, setStep6Ready] = useState(false); // Service add-ons -> Quality
  new Date().toISOString()

  // Referral code
  const [refCode, setRefCode] = useState("");

  const resetForm = () => {
    setSqft("");
    setSelectedIndustry("");
    setFootTrafficAnswers({});
    setCleaningAnswers({});
    setConditionAnswers({});
    setPricingModel("");
    setServiceAddOns([]);
    setQualityExpectations("");
    setSpecialRequests([]);
    setFreqCount("");
    setFreqTimesPerDay("1");
    setStep1Ready(false);
    setStep2Ready(false);
    setStep3Ready(false);
    setStep4Ready(false);
    setStep5Ready(false);
    setStep6Ready(false);
    setRefCode("");
  };

  // -------------------------
  // Question Data
  // -------------------------
  const industryDetails = {
    "Corporate Offices & Co-Working Spaces": [
      "Professional cleaning for offices, shared spaces, and conference rooms.",
    ],
    "Medical & Healthcare": [
      "Sanitation for clinics, hospitals, and labs with strict healthcare standards.",
    ],
    "Construction & Renovation Sites": [
      "Post-construction cleanup including debris removal, dust control, and site sanitation.",
    ],
    "Retail & Shopping Centers": [
      "Cleaning for high-traffic areas, storefronts, food courts, and retail spaces.",
    ],
    Education: [
      "Schools, daycares, and universities with deep disinfection of classrooms, cafeterias, and gyms.",
    ],
    "Government & Public Facilities": [
      "Reliable cleaning for courthouses, municipal buildings, and community centers.",
    ],
    Hospitality: [
      "Hotels, resorts, and event venues kept spotless for guests and visitors.",
    ],
  };

  const FootTraffic = {
    "Shared Spaces - (choose that apply)": [
      "Common lobbies or reception areas",
      "Elevators & stairwells",
      "Shared restrooms or kitchens",
    ],
    "Foot traffic": [
      "Light – small offices or limited staff",
      "Moderate – regular staff & occasional visitors",
      "Heavy – malls, schools, transit hubs, gyms",
    ],
    "Operating Hours": ["Daytime only", "After-hours", "24/7 facilities service"],
  };

  const CleaningNeeds = {
    "Special Requests - (choose that apply)": [
      "Green cleaning products",
      "Fragrance-free",
      "Allergy-safe",
    ],
    Frequency: ["Daily", "Weekly", "Bi-weekly", "Monthly", "One-time deep clean"],
  };

  const ConditionsChallenges = {
    "Current Condition": ["Well maintained", "Moderately soiled", "Overdue deep clean"],
    "Current Problem": ["Soil", "Grease", "Dust"],
  };

  const PricingModel = ["Per square foot pricing", "Hourly rates", "Flat monthly contract"];

  const ServiceAddOns = [

    "Move-In/Move-Out Cleaning",
    "Carpet & upholstery extraction",
    "Eco-Friendly/Green Cleaning",
    "Kitchen/Breakroom Deep Cleaning",
    "Post-Construction Cleaning",
    "No add-On",
  ];

  const QualityOptions = [
    "Spotless/disinfected – medical facilities",
    "Tidy/maintained – warehouses, offices",
  ];

  // -------------------------
  // Validation helpers
  // -------------------------
  const step1Valid = !!selectedIndustry; // SqFt optional
  const step2Valid =
    !!footTrafficAnswers["Foot traffic"] && !!footTrafficAnswers["Operating Hours"];

  const cleaningInputsValid = (() => {
    const f = cleaningAnswers["Frequency"];
    if (!f) return false;
    if (f === "One-time deep clean") return true;
    if (!freqCount) return false;
    if (f === "Daily" && !freqTimesPerDay) return false;
    return true;
  })();

  const step4Valid = Object.keys(ConditionsChallenges).every(
    (cat) => !!conditionAnswers[cat]
  );

  const step5Valid = !!pricingModel;
  const step6Valid = serviceAddOns.length > 0;

  // -------------------------
  // UI Helpers
  // -------------------------
  const handleAddOnChange = (item) => {
    setServiceAddOns((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  const toggleSharedSpace = (item) => {
    setFootTrafficAnswers((prev) => {
      const current = prev["Shared Spaces - (choose that apply)"] || [];
      const next = current.includes(item)
        ? current.filter((v) => v !== item)
        : [...current, item];
      return { ...prev, "Shared Spaces - (choose that apply)": next };
    });
  };

  const countLabel = useMemo(() => {
    const f = cleaningAnswers["Frequency"];
    if (f === "Daily") return "Days per week";
    if (f === "Weekly") return "Times per week";
    if (f === "Bi-weekly") return "Times every 2 weeks";
    if (f === "Monthly") return "Times per month";
    return "";
  }, [cleaningAnswers]);

  // -------------------------
  // Referral Code Helpers
  // -------------------------
  const industryAcronym = (txt = "") =>
    txt
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 4) || "GEN";

  const generateRefCode = () => {
    // Pattern: HYDRA-<IND>-<SQFT>-<YYMMDD>-<4CHAR>
    const ind = industryAcronym(selectedIndustry);
    const size = String(sqft || "0");
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, "0");

    const code = `HYDRA-${ind}-${size}-${y}${m}`;
    setRefCode(code);
  };

  const copyRefCode = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      alert("Referral code copied!");
    } catch {
      alert("Could not copy code. Please copy it manually.");
    }
  };

  const handleSubmitData = async () => {
 
  // Ensure a referral code exists
  if (!refCode) {
    alert("⚠️ Please generate your referral code first!");
    return;
  }

  // Package data around referral code
const payload = {
  referralCode: refCode,
  details: {
    submittedAt: new Date().toISOString(), // 🔥 REQUIRED
    sqft,
    selectedIndustry,
    footTrafficAnswers,
    cleaningAnswers,
    freqCount,
    freqTimesPerDay,
    specialRequests,
    conditionAnswers,
    pricingModel,
    serviceAddOns,
    qualityExpectations
  }
};


try {
  const res = await fetch(`${API_URL}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Server error:", data);
    alert("❌ Error: " + (data.error || "Request failed"));
    return;
  }

  alert("✅ Submission complete! Referral Code: " + payload.referralCode);

} catch (err) {
  console.error("Error sending data:", err);
  alert("❌ Could not send data to backend. Try again, thank you 🙏");
}

};

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <form className="Quote" ref={innerRef} onSubmit={(e) => e.preventDefault()}>
      <div className="Quote-header">
        <h2>Get a Quote</h2>
        <button type="button" onClick={resetForm} className="rest-button">
          Reset
        </button>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-left">
          <h4>How to use your Referral Code</h4>
          <ol>
            <li>Fill out the steps below and generate your code.</li>
            <li>
              Go to our{" "}
              <a href="/contact" className="link">
                Contact
              </a>{" "}
              page.
            </li>
            <li>Paste your code in the “Referral / Promo Code” box and submit.</li>
          </ol>
        </div>

        <div className="info-right">
          <div className="mini-code">
            <span className="mini-code-label">Your Code</span>
            <div className="refrow">
              <input
                type="text"
                readOnly
                value={refCode || "— no code yet —"}
                className="refcode-input"
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => (refCode ? copyRefCode() : generateRefCode())}
              >
                {refCode ? "Copy" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== STEP 1: SqFt & Industry ========== */}
      {!step1Ready && (
        <div className="selected-message">
          <h3>Space Details</h3>

          <div className="Quote-body">
            <input
              type="number"
              name="SqFt"
              min={0}
              placeholder="Enter SqFt"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
            />

            {!selectedIndustry && (
              <div className="radio-selections">
                {Object.keys(industryDetails).map((industry, index) => (
                  <div className="radio-option" key={industry}>
                    <input
                      type="radio"
                      id={`industry-${index}`}
                      name="industry"
                      value={industry}
                      onChange={(e) => {
                        setSelectedIndustry(e.target.value);
                        setStep1Ready(false);
                        setStep2Ready(false);
                        setStep3Ready(false);
                        setStep4Ready(false);
                        setStep5Ready(false);
                        setStep6Ready(false);
                        setQualityExpectations("");
                      }}
                    />
                    <label className="list-naem" htmlFor={`industry-${index}`}>
                      {industry}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="next-button"
            disabled={!step1Valid}
            onClick={() => setStep1Ready(true)}
            title={step1Valid ? "Continue" : "Select an industry"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 2: Foot Traffic ========== */}
      {step1Ready && !step2Ready && (
        <div className="selected-message">
          <h3>Usage & Foot Traffic</h3>

          <div className="traffic-category">
            <h4>Shared Spaces - (choose that apply)</h4>
            <ul>
              {FootTraffic["Shared Spaces - (choose that apply)"].map((item, idx) => {
                const arr = footTrafficAnswers["Shared Spaces - (choose that apply)"] || [];
                const checked = arr.includes(item);
                return (
                  <li className="number-option" key={`ss-${idx}`}>
                    <input
                      type="checkbox"
                      id={`ss-${idx}`}
                      value={item}
                      checked={checked}
                      onChange={() => toggleSharedSpace(item)}
                    />
                    <label className="list-naem" htmlFor={`ss-${idx}`}>
                      {item}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="traffic-category">
            <h4>Foot traffic</h4>
            <ul>
              {FootTraffic["Foot traffic"].map((item, idx) => (
                <li className="number-option" key={`ft-${idx}`}>
                  <input
                    type="radio"
                    name="foot-traffic"
                    id={`ft-${idx}`}
                    value={item}
                    checked={footTrafficAnswers["Foot traffic"] === item}
                    onChange={(e) =>
                      setFootTrafficAnswers((prev) => ({
                        ...prev,
                        "Foot traffic": e.target.value,
                      }))
                    }
                  />
                  <label className="list-naem" htmlFor={`ft-${idx}`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="traffic-category">
            <h4>Operating Hours</h4>
            <ul>
              {FootTraffic["Operating Hours"].map((item, idx) => (
                <li className="number-option" key={`oh-${idx}`}>
                  <input
                    type="radio"
                    name="operating-hours"
                    id={`oh-${idx}`}
                    value={item}
                    checked={footTrafficAnswers["Operating Hours"] === item}
                    onChange={(e) =>
                      setFootTrafficAnswers((prev) => ({
                        ...prev,
                        "Operating Hours": e.target.value,
                      }))
                    }
                  />
                  <label className="list-naem" htmlFor={`oh-${idx}`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="next-button"
            disabled={!step2Valid}
            onClick={() => setStep2Ready(true)}
            title={step2Valid ? "Continue" : "Select foot traffic and operating hours"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 3: Cleaning Needs & Frequency ========== */}
      {step1Ready && step2Ready && !step3Ready && (
        <div className="selected-message">
          <h3>Cleaning Needs & Frequency</h3>

          <div className="traffic-category">
            <h4>Special Requests - (click that apply)</h4>
            <ul>
              {CleaningNeeds["Special Requests - (choose that apply)"].map((item, i) => (
                <li className="number-option" key={`sp-${i}`}>
                  <input
                    type="checkbox"
                    id={`special-${i}`}
                    value={item}
                    checked={specialRequests.includes(item)}
                    onChange={() =>
                      setSpecialRequests((prev) =>
                        prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
                      )
                    }
                  />
                  <label className="list-naem" htmlFor={`special-${i}`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="traffic-category">
            <h4>Frequency</h4>
            <ul>
              {CleaningNeeds["Frequency"].map((item, i) => (
                <li className="number-option" key={`fq-${i}`}>
                  <input
                    type="radio"
                    name="clean-frequency"
                    id={`clean-frequency-${i}`}
                    value={item}
                    checked={cleaningAnswers["Frequency"] === item}
                    onChange={(e) => {
                      setCleaningAnswers((prev) => ({ ...prev, Frequency: e.target.value }));
                      setFreqCount("");
                      setFreqTimesPerDay("1");
                      setStep3Ready(false); // must reconfirm
                    }}
                  />
                  <label className="list-naem" htmlFor={`clean-frequency-${i}`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>

            {["Daily", "Weekly", "Bi-weekly", "Monthly"].includes(
              cleaningAnswers["Frequency"] || ""
            ) && (
              <div className="extra-inputs">
               <div className="extra-inputs">
  <div className="extra-field">
    <label htmlFor="freq-count">
      How many ({cleaningAnswers["Frequency"]})
    </label>
    <div className="inline-num fancy-input">
      <input
        id="freq-count"
        type="number"
        min={1}
        placeholder="e.g., 5"
        value={freqCount}
        onChange={(e) => setFreqCount(e.target.value)}
      />
      <span className="suffix">/ times</span>
    </div>
  </div>
</div>


                {cleaningAnswers["Frequency"] === "Daily" && (
                  <div className="extra-field">
                    <label htmlFor="times-per-day">Per day</label>
                    <div className="inline-num">
                      <input
                        id="times-per-day"
                        type="number"
                        min={1}
                        placeholder="e.g., 1"
                        value={freqTimesPerDay}
                        onChange={(e) => setFreqTimesPerDay(e.target.value)}
                      />
                      <span className="suffix">/ day</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="next-button"
            disabled={!cleaningInputsValid}
            onClick={() => setStep3Ready(true)}
            title={cleaningInputsValid ? "Continue" : "Complete frequency numbers"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 4: Conditions ========== */}
      {step3Ready && !step4Ready && (
        <div className="selected-message">
          <h3>Conditions & Challenges</h3>
          {Object.keys(ConditionsChallenges).map((category, idx) => (
            <div key={idx} className="traffic-category">
              <h4>{category}</h4>
              <ul>
                {ConditionsChallenges[category].map((item, i) => (
                  <li className="number-option" key={`cond-${idx}-${i}`}>
                    <input
                      type="radio"
                      name={`condition-${idx}`}
                      id={`condition-${idx}-${i}`}
                      value={item}
                      checked={conditionAnswers[category] === item}
                      onChange={(e) =>
                        setConditionAnswers((prev) => ({
                          ...prev,
                          [category]: e.target.value,
                        }))
                      }
                    />
                    <label className="list-naem" htmlFor={`condition-${idx}-${i}`}>
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button
            type="button"
            className="next-button"
            disabled={!step4Valid}
            onClick={() => setStep4Ready(true)}
            title={step4Valid ? "Continue" : "Answer all condition categories"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 5: Pricing Model ========== */}
      {step4Ready && !step5Ready && (
        <div className="selected-message">
          <h3>Preferred Pricing Model</h3>
          <ul>
            {PricingModel.map((item, i) => (
              <li className="number-option" key={`pm-${i}`}>
                <input
                  type="radio"
                  name="pricing-model"
                  id={`pricing-${i}`}
                  value={item}
                  checked={pricingModel === item}
                  onChange={(e) => {
                    setPricingModel(e.target.value);
                    setStep5Ready(false);
                  }}
                />
                <label className="list-naem" htmlFor={`pricing-${i}`}>
                  {item}
                </label>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="next-button"
            disabled={!step5Valid}
            onClick={() => setStep5Ready(true)}
            title={step5Valid ? "Continue" : "Pick a pricing model"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 6: Service Add-ons ========== */}
      {step5Ready && !step6Ready && (
        <div className="selected-message">
          <h3>Service Add-ons</h3>
          <ul>
            {ServiceAddOns.map((item, i) => (
              <li className="number-option" key={`ao-${i}`}>
                <input
                  type="checkbox"
                  id={`addon-${i}`}
                  value={item}
                  checked={serviceAddOns.includes(item)}
                  onChange={() => handleAddOnChange(item)}
                />
                <label className="list-naem" htmlFor={`addon-${i}`}>
                  {item}
                </label>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="next-button"
            disabled={!step6Valid}
            onClick={() => setStep6Ready(true)}
            title={step6Valid ? "Continue" : "Pick at least one add-on"}
          >
            Next
          </button>
        </div>
      )}

      {/* ========== STEP 7: Quality Expectations ========== */}
      {step6Ready && !qualityExpectations && (
        <div className="selected-message">
          <h3>Quality Expectations</h3>
          <ul>
            {QualityOptions.map((item, i) => (
              <li className="number-option" key={`qe-${i}`}>
                <input
                  type="radio"
                  name="quality"
                  id={`quality-${i}`}
                  value={item}
                  checked={qualityExpectations === item}
                  onChange={(e) => setQualityExpectations(e.target.value)}
                />
                <label className="list-naem" htmlFor={`quality-${i}`}>
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ========== STEP 8: Summary + Referral Code ========== */}
      {qualityExpectations && (
        <div className="selected-message summary">
          <h3>Summary of Your Selections</h3>
          <p><strong>SqFt:</strong> {sqft || "—"}</p>
          <p><strong>Industry:</strong> {selectedIndustry || "—"}</p>
          <p>
            <strong>Foot Traffic:</strong>{" "}
            {`Foot traffic: ${footTrafficAnswers["Foot traffic"] || "—"}; Operating Hours: ${
              footTrafficAnswers["Operating Hours"] || "—"
            }; Shared: ${
              (footTrafficAnswers["Shared Spaces - (choose that apply)"] || []).join(", ") || "None"
            }`}
          </p>
          <p>
            <strong>Cleaning Frequency:</strong> {cleaningAnswers["Frequency"] || "—"}
            {freqCount ? ` · ${countLabel}: ${freqCount}` : ""}
            {cleaningAnswers["Frequency"] === "Daily" && freqTimesPerDay
              ? ` · Times/day: ${freqTimesPerDay}`
              : ""}
          </p>
          <p><strong>Special Requests:</strong> {specialRequests.length > 0 ? specialRequests.join(", ") : "None"}</p>
          <p><strong>Conditions:</strong> {Object.entries(conditionAnswers).map(([cat, ans]) => `${cat}: ${ans}`).join("; ")}</p>
          <p><strong>Preferred Pricing Model:</strong> {pricingModel || "—"}</p>
          <p><strong>Service Add-ons:</strong> {serviceAddOns.join(", ") || "None"}</p>
          <p><strong>Quality Expectations:</strong> {qualityExpectations || "—"}</p>

          <div className="referral-card">
            <div className="referral-head">
              <h4>Referral Code</h4>
              <p className="muted">Use this on the Contact page to fast-track your request.</p>
            </div>

            <div className="refrow">
              <input
                type="text"
                readOnly
                value={refCode}
                placeholder="No code yet"
                className="refcode-input"
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={refCode ? copyRefCode : generateRefCode}
              >
                {refCode ? "Copy" : "Generate"}
              </button>
            </div>
          </div>

          <a className="submit-cta" onClick={handleSubmitData} role="button">
            Submit Request
          </a>
        </div>
      )}
    </form>
  );
}
