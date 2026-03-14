import React, { useMemo, useState } from "react";
import { ApiError, apiPost } from "../../lib/apiClient";
import { InlineNotice } from "../../components/ui/PageStates";

import "./QuoteForm.css";

export default function QuoteForm({ innerRef }) {
  // -------------------------
  // Core state
  // -------------------------
  const [sqft, setSqft] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");

  // Step answers (category -> answer)
  const [footTrafficAnswers, setFootTrafficAnswers] = useState({});
  const [cleaningAnswers, setCleaningAnswers] = useState({});
  const [conditionAnswers, setConditionAnswers] = useState({});
  const [pricingModel, setPricingModel] = useState("");
  const [serviceAddOns, setServiceAddOns] = useState([]);
  const [qualityExpectations, setQualityExpectations] = useState("");
  const [specialRequests, setSpecialRequests] = useState([]);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitTone, setSubmitTone] = useState("info");
  const [submitMessage, setSubmitMessage] = useState("");

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
  const [step7Ready, setStep7Ready] = useState(false); // Quality -> Summary

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
    setStep7Ready(false);
    setStepError("");
    setRefCode("");
    setIsSubmitting(false);
    setSubmitTone("info");
    setSubmitMessage("");
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
      "Light - small offices or limited staff",
      "Moderate - regular staff and occasional visitors",
      "Heavy - malls, schools, transit hubs, gyms",
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
    "Glass Cleaning",
    "Move-In/Move-Out Cleaning",
    "Carpet & upholstery extraction",
    "Eco-Friendly/Green Cleaning",
    "Kitchen/Breakroom Deep Cleaning",
    "Post-Construction Cleaning",
    "No add-on",
  ];

  const QualityOptions = [
    "Spotless/disinfected - ideal for medical and client-facing spaces",
    "Tidy/maintained - practical standard for offices and warehouses",
    "Detail-focused finish - high-touch zones plus visual polish",
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
    setStepError("");
    setServiceAddOns((prev) => {
      const isSelected = prev.includes(item);
      const next = isSelected ? prev.filter((v) => v !== item) : [...prev, item];
      if (item === "No add-on") {
        return isSelected ? [] : ["No add-on"];
      }
      return next.filter((v) => v !== "No add-on");
    });
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

  const totalSteps = 8;
  const stepLabels = [
    "Space",
    "Traffic",
    "Frequency",
    "Condition",
    "Pricing",
    "Add-ons",
    "Quality",
    "Review",
  ];
  const currentStep = !step1Ready
    ? 1
    : !step2Ready
    ? 2
    : !step3Ready
    ? 3
    : !step4Ready
    ? 4
    : !step5Ready
    ? 5
    : !step6Ready
    ? 6
    : !step7Ready
    ? 7
    : 8;

  const contextChips = useMemo(() => {
    const chips = [];
    if (selectedIndustry) chips.push(`Industry: ${selectedIndustry}`);
    if (sqft) chips.push(`SqFt: ${sqft}`);
    if (cleaningAnswers["Frequency"]) chips.push(`Frequency: ${cleaningAnswers["Frequency"]}`);
    if (pricingModel) chips.push(`Pricing: ${pricingModel}`);
    if (serviceAddOns.length > 0) chips.push(`Add-ons: ${serviceAddOns.length}`);
    return chips;
  }, [selectedIndustry, sqft, cleaningAnswers, pricingModel, serviceAddOns]);

  const resetSpaceDetails = () => {
    setSqft("");
    setSelectedIndustry("");
    setFootTrafficAnswers({});
    setCleaningAnswers({});
    setConditionAnswers({});
    setPricingModel("");
    setServiceAddOns([]);
    setSpecialRequests([]);
    setFreqCount("");
    setFreqTimesPerDay("1");
    setRefCode("");
    setStep1Ready(false);
    setStep2Ready(false);
    setStep3Ready(false);
    setStep4Ready(false);
    setStep5Ready(false);
    setStep6Ready(false);
    setStep7Ready(false);
    setQualityExpectations("");
    setStepError("");
  };

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
      setSubmitTone("success");
      setSubmitMessage("Referral code copied to clipboard.");
    } catch {
      setSubmitTone("error");
      setSubmitMessage("Could not copy code. Please copy it manually.");
    }
  };

  const handleSubmitData = async () => {
    if (!refCode) {
      setSubmitTone("error");
      setSubmitMessage("Please generate your referral code first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    const payload = {
      referralCode: refCode,
      details: {
        submittedAt: new Date().toISOString(),
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
      await apiPost("/data", payload);
      setSubmitTone("success");
      setSubmitMessage(`Submission complete. Referral Code: ${payload.referralCode}`);
    } catch (err) {
      console.error("Error sending data:", err);
      if (err instanceof ApiError) {
        const validationErrors = err?.payload?.validationErrors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          setSubmitTone("error");
          setSubmitMessage(`Please review your answers: ${validationErrors[0]}`);
          return;
        }
        setSubmitTone("error");
        setSubmitMessage(err.message || "Could not send data to backend. Please try again.");
        return;
      }
      setSubmitTone("error");
      setSubmitMessage("Could not send data to backend. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <form className="Quote" ref={innerRef} onSubmit={(e) => e.preventDefault()}>
      <div className="Quote-header">
        <h2>Get a Quote</h2>
        <button type="button" onClick={resetForm} className="rest-button ui-btn ghost sm">
          Reset
        </button>
      </div>
      <div className="quote-progress" aria-label="Quote progress">
        <div className="quote-progress__meta">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="quote-progress__track" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={currentStep}>
          <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
      </div>
      <div className="quote-stepper" aria-label="Quote steps">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const state =
            stepNum < currentStep ? "done" : stepNum === currentStep ? "active" : "todo";
          return (
            <span key={label} className={`quote-step-pill ${state}`}>
              <strong>{stepNum}</strong> {label}
            </span>
          );
        })}
      </div>
      {contextChips.length > 0 && (
        <div className="quote-context" aria-label="Current selections">
          {contextChips.map((chip) => (
            <span key={chip} className="quote-context__chip">{chip}</span>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-left">
          <h4>How to use your Referral Code</h4>
          <ol>
            <li>Fill out the steps below and generate your code.</li>
            <li>
              Go to our{" "}
              <a href="/contactus" className="link">
                Contact
              </a>{" "}
              page.
            </li>
            <li>Paste your code in the "Referral / Promo Code" box and submit.</li>
          </ol>
        </div>

        <div className="info-right">
          <div className="mini-code">
            <span className="mini-code-label">Your Code</span>
            <div className="refrow">
              <input
                type="text"
                readOnly
                value={refCode || "-- no code yet --"}
                className="refcode-input"
              />
              <button
                type="button"
                className="btn-ghost ui-btn ghost sm"
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
              onChange={(e) => {
                setSqft(e.target.value);
                setStepError("");
              }}
            />

            <div className="radio-selections">
              {Object.keys(industryDetails).map((industry, index) => (
                <div className="radio-option" key={industry}>
                  <input
                    type="radio"
                    id={`industry-${index}`}
                    name="industry"
                    value={industry}
                    checked={selectedIndustry === industry}
                    onChange={(e) => {
                      setSelectedIndustry(e.target.value);
                      setStep1Ready(false);
                      setStep2Ready(false);
                      setStep3Ready(false);
                      setStep4Ready(false);
                      setStep5Ready(false);
                      setStep6Ready(false);
                      setStep7Ready(false);
                      setQualityExpectations("");
                      setStepError("");
                    }}
                  />
                  <label className="list-naem" htmlFor={`industry-${index}`}>
                    {industry}
                  </label>
                </div>
              ))}
            </div>
            {selectedIndustry && (
              <p className="selected-industry-note">
                Selected: <strong>{selectedIndustry}</strong>
              </p>
            )}
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={resetSpaceDetails}
            >
              Reset Space Details
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!step1Valid) {
                  setStepError("Please select your industry before continuing.");
                  return;
                }
                setStepError("");
                setStep1Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!step1Valid && stepError && <p className="step-error">{stepError}</p>}
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
                    onChange={(e) => {
                      setStepError("");
                      setFootTrafficAnswers((prev) => ({
                        ...prev,
                        "Foot traffic": e.target.value,
                      }));
                    }}
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
                    onChange={(e) => {
                      setStepError("");
                      setFootTrafficAnswers((prev) => ({
                        ...prev,
                        "Operating Hours": e.target.value,
                      }));
                    }}
                  />
                  <label className="list-naem" htmlFor={`oh-${idx}`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep1Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!step2Valid) {
                  setStepError("Please select foot traffic and operating hours to continue.");
                  return;
                }
                setStepError("");
                setStep2Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!step2Valid && stepError && <p className="step-error">{stepError}</p>}
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
                    onChange={() => {
                      setStepError("");
                      setSpecialRequests((prev) =>
                        prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
                      );
                    }}
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
                      setStepError("");
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
                      onChange={(e) => {
                        setFreqCount(e.target.value);
                        setStepError("");
                      }}
                    />
                    <span className="suffix">/ times</span>
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
                        onChange={(e) => {
                          setFreqTimesPerDay(e.target.value);
                          setStepError("");
                        }}
                      />
                      <span className="suffix">/ day</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep2Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!cleaningInputsValid) {
                  setStepError("Please select frequency and complete required count fields.");
                  return;
                }
                setStepError("");
                setStep3Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!cleaningInputsValid && stepError && <p className="step-error">{stepError}</p>}
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
                      onChange={(e) => {
                        setStepError("");
                        setConditionAnswers((prev) => ({
                          ...prev,
                          [category]: e.target.value,
                        }));
                      }}
                    />
                    <label className="list-naem" htmlFor={`condition-${idx}-${i}`}>
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep3Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!step4Valid) {
                  setStepError("Please answer all condition fields before continuing.");
                  return;
                }
                setStepError("");
                setStep4Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!step4Valid && stepError && <p className="step-error">{stepError}</p>}
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
                    setStepError("");
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

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep4Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!step5Valid) {
                  setStepError("Please select a pricing model before continuing.");
                  return;
                }
                setStepError("");
                setStep5Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!step5Valid && stepError && <p className="step-error">{stepError}</p>}
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

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep5Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!step6Valid) {
                  setStepError("Please choose at least one add-on (or 'No add-on').");
                  return;
                }
                setStepError("");
                setStep6Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!step6Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 7: Quality Expectations ========== */}
      {step6Ready && !step7Ready && (
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
                  onChange={(e) => {
                    setStepError("");
                    setQualityExpectations(e.target.value);
                  }}
                />
                <label className="list-naem" htmlFor={`quality-${i}`}>
                  {item}
                </label>
              </li>
            ))}
          </ul>
          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep6Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              onClick={() => {
                if (!qualityExpectations) {
                  setStepError("Please select your quality expectation before continuing.");
                  return;
                }
                setStepError("");
                setStep7Ready(true);
              }}
            >
              Next
            </button>
          </div>
          {!qualityExpectations && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 8: Summary + Referral Code ========== */}
      {step7Ready && qualityExpectations && (
        <div className="selected-message summary">
          <h3>Summary of Your Selections</h3>
          <p><strong>SqFt:</strong> {sqft || "-"}</p>
          <p><strong>Industry:</strong> {selectedIndustry || "-"}</p>
          <p>
            <strong>Foot Traffic:</strong>{" "}
            {`Foot traffic: ${footTrafficAnswers["Foot traffic"] || "-"}; Operating Hours: ${
              footTrafficAnswers["Operating Hours"] || "-"
            }; Shared: ${
              (footTrafficAnswers["Shared Spaces - (choose that apply)"] || []).join(", ") || "None"
            }`}
          </p>
          <p>
            <strong>Cleaning Frequency:</strong> {cleaningAnswers["Frequency"] || "-"}
            {freqCount ? ` | ${countLabel}: ${freqCount}` : ""}
            {cleaningAnswers["Frequency"] === "Daily" && freqTimesPerDay
              ? ` | Times/day: ${freqTimesPerDay}`
              : ""}
          </p>
          <p><strong>Special Requests:</strong> {specialRequests.length > 0 ? specialRequests.join(", ") : "None"}</p>
          <p><strong>Conditions:</strong> {Object.entries(conditionAnswers).map(([cat, ans]) => `${cat}: ${ans}`).join("; ")}</p>
          <p><strong>Preferred Pricing Model:</strong> {pricingModel || "-"}</p>
          <p><strong>Service Add-ons:</strong> {serviceAddOns.join(", ") || "None"}</p>
          <p><strong>Quality Expectations:</strong> {qualityExpectations || "-"}</p>

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
                placeholder="-- no code yet --"
                className="refcode-input"
              />
              <button
                type="button"
                className="btn-ghost ui-btn ghost sm"
                onClick={refCode ? copyRefCode : generateRefCode}
              >
                {refCode ? "Copy" : "Generate"}
              </button>
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                setStepError("");
                setStep7Ready(false);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="submit-cta"
              onClick={handleSubmitData}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
          <InlineNotice tone={submitTone}>{submitMessage}</InlineNotice>
        </div>
      )}
    </form>
  );
}






