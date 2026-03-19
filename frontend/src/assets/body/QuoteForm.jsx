import React, { useEffect, useMemo, useState } from "react";
import { ApiError, apiPost } from "../../lib/apiClient";
import { InlineNotice } from "../../components/ui/PageStates";

import "./QuoteForm.css";

const DRAFT_STORAGE_KEY = "tydra_quote_form_draft_v1";

export default function QuoteForm({ innerRef }) {
  const NO_SPECIAL_REQUEST = "No special requests";
  const NO_SHARED_SPACES = "No shared spaces";

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
  const [isRefCodeManual, setIsRefCodeManual] = useState(false);
  const [summaryEditStep, setSummaryEditStep] = useState(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const clearSavedDraftOnly = () => {
    clearDraft();
    setDraftSavedAt("");
    setSubmitTone("info");
    setSubmitMessage("Saved draft cleared from this browser.");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsDraftHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        setIsDraftHydrated(true);
        return;
      }
      const draft = JSON.parse(raw);
      if (typeof draft !== "object" || draft === null) {
        setIsDraftHydrated(true);
        return;
      }

      setSqft(draft.sqft || "");
      setSelectedIndustry(draft.selectedIndustry || "");
      setFootTrafficAnswers(draft.footTrafficAnswers || {});
      setCleaningAnswers(draft.cleaningAnswers || {});
      setConditionAnswers(draft.conditionAnswers || {});
      setPricingModel(draft.pricingModel || "");
      setServiceAddOns(Array.isArray(draft.serviceAddOns) ? draft.serviceAddOns : []);
      setQualityExpectations(draft.qualityExpectations || "");
      setSpecialRequests(Array.isArray(draft.specialRequests) ? draft.specialRequests : []);
      setFreqCount(draft.freqCount || "");
      setFreqTimesPerDay(draft.freqTimesPerDay || "1");
      setRefCode(draft.refCode || "");
      setIsRefCodeManual(!!draft.isRefCodeManual);
      setSummaryEditStep(draft.summaryEditStep || null);
      setStep1Ready(!!draft.step1Ready);
      setStep2Ready(!!draft.step2Ready);
      setStep3Ready(!!draft.step3Ready);
      setStep4Ready(!!draft.step4Ready);
      setStep5Ready(!!draft.step5Ready);
      setStep6Ready(!!draft.step6Ready);
      setStep7Ready(!!draft.step7Ready);
      setDraftSavedAt(draft.draftSavedAt || "");
    } catch {
      // ignore malformed draft payloads
    } finally {
      setIsDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isDraftHydrated || typeof window === "undefined") return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const payload = {
      sqft,
      selectedIndustry,
      footTrafficAnswers,
      cleaningAnswers,
      conditionAnswers,
      pricingModel,
      serviceAddOns,
      qualityExpectations,
      specialRequests,
      freqCount,
      freqTimesPerDay,
      refCode,
      isRefCodeManual,
      summaryEditStep,
      step1Ready,
      step2Ready,
      step3Ready,
      step4Ready,
      step5Ready,
      step6Ready,
      step7Ready,
      draftSavedAt: nowLabel,
    };
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setDraftSavedAt(nowLabel);
    } catch {
      // ignore storage quota or serialization issues
    }
  }, [
    isDraftHydrated,
    sqft,
    selectedIndustry,
    footTrafficAnswers,
    cleaningAnswers,
    conditionAnswers,
    pricingModel,
    serviceAddOns,
    qualityExpectations,
    specialRequests,
    freqCount,
    freqTimesPerDay,
    refCode,
    isRefCodeManual,
    summaryEditStep,
    step1Ready,
    step2Ready,
    step3Ready,
    step4Ready,
    step5Ready,
    step6Ready,
    step7Ready,
  ]);

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
    setIsRefCodeManual(false);
    setSummaryEditStep(null);
    setIsSubmitting(false);
    setSubmitTone("info");
    setSubmitMessage("");
    setDraftSavedAt("");
    clearDraft();
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
      {
        value: "Common lobbies or reception areas",
        description: "Reception desks, waiting areas, or open-entry common zones.",
      },
      {
        value: "Elevators & stairwells",
        description: "Shared vertical routes used by staff, clients, or visitors.",
      },
      {
        value: "Shared restrooms or kitchens",
        description: "Multi-tenant restrooms, pantries, and breakroom kitchens.",
      },
      {
        value: NO_SHARED_SPACES,
        description: "Select this if your site does not have shared common areas.",
      },
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
      {
        value: "Green cleaning products",
        description: "Lower-toxicity products preferred for daily or frequent use.",
      },
      {
        value: "Fragrance-free",
        description: "Avoid scented products in occupied work environments.",
      },
      {
        value: "Allergy-safe",
        description: "Focus on low-irritant materials and dust-sensitive routines.",
      },
      {
        value: NO_SPECIAL_REQUEST,
        description: "No additional product or sensitivity constraints.",
      },
    ],
    Frequency: ["Daily", "Weekly", "Bi-weekly", "Monthly", "One-time deep clean"],
  };

  const ConditionsChallenges = {
    "Current Condition": [
      {
        value: "Well maintained",
        description: "Regularly cleaned with low visible buildup. Example: office cleaned 3-5 times/week.",
      },
      {
        value: "Moderately soiled",
        description: "Some visible buildup in active areas. Example: breakrooms and entries need restoration.",
      },
      {
        value: "Overdue deep clean",
        description: "Heavy buildup and neglected zones. Example: high-touch areas need intensive first clean.",
      },
    ],
    "Current Problem": [
      {
        value: "Soil",
        description: "Tracked-in dirt from outdoors. Common in schools, entrances, and warehouses.",
      },
      {
        value: "Grease",
        description: "Oil-based residue. Common in kitchens, food prep spaces, and some industrial sites.",
      },
      {
        value: "Dust",
        description: "Fine particle buildup on vents/shelves. Common in offices and post-construction spaces.",
      },
    ],
  };

  const PricingModel = [
    {
      value: "Per square foot pricing",
      description: "Estimated from total cleaned area and service complexity.",
    },
    {
      value: "Hourly rates",
      description: "Best for variable workloads or tasks that change week to week.",
    },
    {
      value: "Flat monthly contract",
      description: "Fixed monthly billing based on your selected needs, frequency, and conditions.",
    },
  ];

  const ServiceAddOns = [
    {
      value: "Glass Cleaning",
      description: "Interior glass, partitions, and smudge-prone surfaces.",
    },
    {
      value: "Move-In/Move-Out Cleaning",
      description: "Turnover-ready cleaning for occupancy transitions.",
    },
    {
      value: "Carpet & upholstery extraction",
      description: "Deep extraction for fibers, spots, and odor control.",
    },
    {
      value: "Eco-Friendly/Green Cleaning",
      description: "Expanded green-product process for broad site coverage.",
    },
    {
      value: "Kitchen/Breakroom Deep Cleaning",
      description: "Degreasing and sanitizing for food-contact and prep zones.",
    },
    {
      value: "Post-Construction Cleaning",
      description: "Debris and dust-detail cleanup after renovation or build-outs.",
    },
    {
      value: "No add-on",
      description: "Base service only with no additional service modules.",
    },
  ];

  const QualityOptions = [
    {
      value: "Spotless/disinfected - ideal for medical and client-facing spaces",
      label: "Spotless/disinfected",
      description: "Higher precision disinfection and presentation level.",
    },
    {
      value: "Tidy/maintained - practical standard for offices and warehouses",
      label: "Tidy/maintained",
      description: "Reliable baseline cleaning for everyday commercial operations.",
    },
    {
      value: "Detail-focused finish - high-touch zones plus visual polish",
      label: "Detail-focused finish",
      description: "Extra attention to touchpoints, edges, and visual consistency.",
    },
  ];

  const ContractLengthDiscountGuide = [
    {
      term: "Month-to-month",
      discount: "No discount",
      reason: "Maximum flexibility with no long commitment.",
    },
    {
      term: "3 months",
      discount: "5% off",
      reason: "Great for testing workflow fit with light savings.",
    },
    {
      term: "6 months",
      discount: "10% off",
      reason: "Balanced term for predictable service and cost.",
    },
    {
      term: "12 months",
      discount: "15% off",
      reason: "Best value for ongoing cleaning operations.",
    },
    {
      term: "24 months",
      discount: "20% off",
      reason: "Highest savings for long-term multi-site planning.",
    },
  ];

  const optionValue = (option) =>
    typeof option === "string" ? option : option?.value || "";
  const optionLabel = (option) =>
    typeof option === "string" ? option : option?.label || option?.value || "";
  const optionDescription = (option) =>
    typeof option === "string" ? "" : option?.description || "";

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
  const step7Valid = !!qualityExpectations;

  const step2RequiredDone =
    Number(!!footTrafficAnswers["Foot traffic"]) +
    Number(!!footTrafficAnswers["Operating Hours"]);
  const step4RequiredDone =
    Number(!!conditionAnswers["Current Condition"]) +
    Number(!!conditionAnswers["Current Problem"]);

  const sharedSpacesCount = (footTrafficAnswers["Shared Spaces - (choose that apply)"] || [])
    .filter((item) => item !== NO_SHARED_SPACES)
    .length;
  const specialRequestCount = specialRequests.filter((x) => x !== NO_SPECIAL_REQUEST).length;
  const addOnCount = serviceAddOns.includes("No add-on")
    ? 0
    : serviceAddOns.length;
  const sharedSpacesStatusText = sharedSpacesCount > 0 ? `Selected: ${sharedSpacesCount}` : "Selected: None";
  const specialRequestStatusText = specialRequestCount > 0 ? `Selected: ${specialRequestCount}` : "Selected: None";
  const addOnStatusText = serviceAddOns.includes("No add-on")
    ? "Selected: None"
    : addOnCount > 0
    ? `Selected: ${addOnCount}`
    : "Selected: 0";

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

  const handleSpecialRequestChange = (item) => {
    setStepError("");
    setSpecialRequests((prev) => {
      const isSelected = prev.includes(item);
      const next = isSelected ? prev.filter((v) => v !== item) : [...prev, item];
      if (item === NO_SPECIAL_REQUEST) {
        return isSelected ? [] : [NO_SPECIAL_REQUEST];
      }
      return next.filter((v) => v !== NO_SPECIAL_REQUEST);
    });
  };

  const toggleSharedSpace = (item) => {
    setFootTrafficAnswers((prev) => {
      const current = prev["Shared Spaces - (choose that apply)"] || [];
      const isSelected = current.includes(item);
      const next = isSelected ? current.filter((v) => v !== item) : [...current, item];
      if (item === NO_SHARED_SPACES) {
        return {
          ...prev,
          "Shared Spaces - (choose that apply)": isSelected ? [] : [NO_SHARED_SPACES],
        };
      }
      return {
        ...prev,
        "Shared Spaces - (choose that apply)": next.filter((v) => v !== NO_SHARED_SPACES),
      };
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
  const highestUnlockedStep = step7Ready && qualityExpectations
    ? 8
    : step6Ready
    ? 7
    : step5Ready
    ? 6
    : step4Ready
    ? 5
    : step3Ready
    ? 4
    : step2Ready
    ? 3
    : step1Ready
    ? 2
    : 1;

  const contextChips = useMemo(() => {
    const chips = [];
    if (selectedIndustry) chips.push(`Industry: ${selectedIndustry}`);
    if (sqft) chips.push(`SqFt: ${sqft}`);
    if (cleaningAnswers["Frequency"]) chips.push(`Frequency: ${cleaningAnswers["Frequency"]}`);
    if (pricingModel) chips.push(`Pricing: ${pricingModel}`);
    if (serviceAddOns.length > 0) chips.push(`Add-ons: ${serviceAddOns.length}`);
    return chips;
  }, [selectedIndustry, sqft, cleaningAnswers, pricingModel, serviceAddOns]);

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
    const normalizedRefCode = sanitizeReferralCode(refCode);
    if (!normalizedRefCode) {
      setSubmitTone("error");
      setSubmitMessage("Please generate or manually enter your referral code first.");
      return;
    }
    if (!/^[A-Z0-9-]{1,64}$/.test(normalizedRefCode)) {
      setSubmitTone("error");
      setSubmitMessage("Referral code can only include letters, numbers, and dashes.");
      return;
    }
    setRefCode(normalizedRefCode);

    setIsSubmitting(true);
    setSubmitMessage("");
    const normalizedSpecialRequests = specialRequests.filter(
      (item) => item !== NO_SPECIAL_REQUEST
    );

    const payload = {
      referralCode: normalizedRefCode,
      details: {
        submittedAt: new Date().toISOString(),
        sqft,
        selectedIndustry,
        footTrafficAnswers,
        cleaningAnswers,
        freqCount,
        freqTimesPerDay,
        specialRequests: normalizedSpecialRequests,
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
      clearDraft();
      setDraftSavedAt("");
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

  const specialRequestSummary =
    specialRequests.length === 0 ||
    (specialRequests.length === 1 && specialRequests[0] === NO_SPECIAL_REQUEST)
      ? "None"
      : specialRequests.join(", ");

  const addOnSummary =
    serviceAddOns.length === 0 || serviceAddOns.includes("No add-on")
      ? "None"
      : serviceAddOns.join(", ");

  const renderOptionCopy = (option) => {
    const label = optionLabel(option);
    const description = optionDescription(option);
    return (
      <>
        <span className="option-title">{label}</span>
        {description ? <span className="option-description">{description}</span> : null}
      </>
    );
  };

  const renderFieldHeader = (label, { required = false, optional = false, infoText = "" } = {}) => (
    <div className="field-header-wrap">
      <h4 className="field-header">
        <span className="field-header__title">
          {label}
          {required && (
            <span className="required-star" aria-hidden="true">
              *
            </span>
          )}
        </span>
        <span className="field-header__meta">
          {optional ? <span className="field-chip">Optional</span> : null}
        </span>
      </h4>
      {infoText ? <p className="field-info-inline">{infoText}</p> : null}
    </div>
  );

  const openSummaryView = () => {
    setStep1Ready(true);
    setStep2Ready(true);
    setStep3Ready(true);
    setStep4Ready(true);
    setStep5Ready(true);
    setStep6Ready(true);
    setStep7Ready(!!qualityExpectations);
  };

  const jumpToStep = (targetStep) => {
    const step = Math.min(8, Math.max(1, Number(targetStep) || 1));
    if (step > highestUnlockedStep) return;

    setSummaryEditStep(null);
    setStepError("");
    setSubmitTone("info");
    setSubmitMessage("");

    if (step === 8) {
      openSummaryView();
      return;
    }

    setStep1Ready(step > 1);
    setStep2Ready(step > 2);
    setStep3Ready(step > 3);
    setStep4Ready(step > 4);
    setStep5Ready(step > 5);
    setStep6Ready(step > 6);
    setStep7Ready(false);
  };

  const finishSummaryEdit = () => {
    setSummaryEditStep(null);
    setStepError("");
    setSubmitTone("info");
    setSubmitMessage("");
    openSummaryView();
  };

  const navigateToStep = (targetStep) => {
    const step = Math.min(7, Math.max(1, Number(targetStep) || 1));
    setSummaryEditStep(step);
    setStepError("");
    setSubmitTone("info");
    setSubmitMessage("");
    setStep1Ready(step > 1);
    setStep2Ready(step > 2);
    setStep3Ready(step > 3);
    setStep4Ready(step > 4);
    setStep5Ready(step > 5);
    setStep6Ready(step > 6);
    setStep7Ready(false);
  };

  const sharedSpacesSummary =
    (footTrafficAnswers["Shared Spaces - (choose that apply)"] || [])
      .filter((item) => item !== NO_SHARED_SPACES)
      .join(", ") || "None";

  const conditionSummary = `Condition: ${
    conditionAnswers["Current Condition"] || "-"
  } | Problem: ${conditionAnswers["Current Problem"] || "-"}`;

  const cleaningSummary = `${cleaningAnswers["Frequency"] || "-"}${
    freqCount ? ` | ${countLabel}: ${freqCount}` : ""
  }${
    cleaningAnswers["Frequency"] === "Daily" && freqTimesPerDay
      ? ` | Times/day: ${freqTimesPerDay}`
      : ""
  }`;

  const summaryItems = [
    { label: "Space Details", value: `SqFt: ${sqft || "-"} | Industry: ${selectedIndustry || "-"}`, step: 1 },
    {
      label: "Usage & Foot Traffic",
      value: `Traffic: ${footTrafficAnswers["Foot traffic"] || "-"} | Hours: ${
        footTrafficAnswers["Operating Hours"] || "-"
      } | Shared: ${sharedSpacesSummary}`,
      step: 2,
    },
    { label: "Cleaning Frequency", value: cleaningSummary, step: 3 },
    { label: "Special Requests", value: specialRequestSummary, step: 3 },
    { label: "Conditions & Challenges", value: conditionSummary, step: 4 },
    { label: "Preferred Pricing Model", value: pricingModel || "-", step: 5 },
    { label: "Service Add-ons", value: addOnSummary, step: 6 },
    { label: "Quality Expectations", value: qualityExpectations || "-", step: 7 },
  ];

  const sanitizeReferralCode = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 64);

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <form className="Quote" ref={innerRef} onSubmit={(e) => e.preventDefault()}>
      <div className="Quote-header">
        <h2>Get a Quote</h2>
        <div className="quote-header-actions">
          <span className="draft-badge">
            {draftSavedAt ? `Draft saved ${draftSavedAt}` : "Draft autosave on"}
          </span>
          <button
            type="button"
            onClick={clearSavedDraftOnly}
            className="draft-clear ui-btn ghost sm"
          >
            Clear Draft
          </button>
          <button type="button" onClick={resetForm} className="rest-button ui-btn ghost sm">
            Reset
          </button>
        </div>
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
          const canJump = stepNum !== currentStep && stepNum <= highestUnlockedStep;
          return (
            <button
              key={label}
              type="button"
              className={`quote-step-pill ${state} ${canJump ? "clickable" : ""}`.trim()}
              onClick={() => jumpToStep(stepNum)}
              disabled={!canJump}
              title={
                canJump
                  ? `Jump to ${label}`
                  : stepNum > highestUnlockedStep
                  ? "Complete earlier steps first"
                  : "Current step"
              }
            >
              <strong>{stepNum}</strong> {label}
            </button>
          );
        })}
      </div>
      <p className="stepper-help">Tip: click any completed step to jump back and edit quickly.</p>
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
          <p className="section-status">
            {step1Valid ? "Ready to continue." : "Select an industry to continue."}
          </p>

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

          <div className={`step-actions ${summaryEditStep === 1 ? "" : "step-actions--single"}`.trim()}>
            {summaryEditStep === 1 && (
              <button
                type="button"
                className="back-button ui-btn secondary md"
                onClick={() => {
                  finishSummaryEdit();
                }}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step1Valid}
              onClick={() => {
                if (!step1Valid) {
                  setStepError("Please select your industry before continuing.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 1) {
                  finishSummaryEdit();
                  return;
                }
                setStep1Ready(true);
              }}
            >
              {summaryEditStep === 1 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!step1Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 2: Foot Traffic ========== */}
      {step1Ready && !step2Ready && (
        <div className="selected-message">
          <h3>Usage & Foot Traffic</h3>
          <p className="section-status">
            Required complete: {step2RequiredDone}/2
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            Required fields
          </p>

          <div className="traffic-category">
            {renderFieldHeader("Shared Spaces - (choose that apply)", {
              optional: true,
              infoText:
                "Choose all shared areas your team uses. If none apply, pick 'No shared spaces'.",
            })}
            <ul>
              {FootTraffic["Shared Spaces - (choose that apply)"].map((item, idx) => {
                const option = optionValue(item);
                const arr = footTrafficAnswers["Shared Spaces - (choose that apply)"] || [];
                const checked = arr.includes(option);
                return (
                  <li className="number-option rich-option" key={`ss-${idx}`}>
                    <input
                      type="checkbox"
                      id={`ss-${idx}`}
                      value={option}
                      checked={checked}
                      onChange={() => toggleSharedSpace(option)}
                    />
                    <label className="list-naem" htmlFor={`ss-${idx}`}>
                      {renderOptionCopy(item)}
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="selection-count">
              {sharedSpacesStatusText}
            </p>
          </div>

          <div className="traffic-category">
            {renderFieldHeader("Foot traffic", {
              required: true,
              infoText:
                "Estimate daily people movement in your space. This helps size staffing and visit duration.",
            })}
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
            {renderFieldHeader("Operating Hours", {
              required: true,
              infoText:
                "Tell us when cleaning can happen. After-hours or 24/7 access may change scheduling and price.",
            })}
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
                if (summaryEditStep === 2) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep1Ready(false);
              }}
            >
              {summaryEditStep === 2 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step2Valid}
              onClick={() => {
                if (!step2Valid) {
                  setStepError("Please select foot traffic and operating hours to continue.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 2) {
                  finishSummaryEdit();
                  return;
                }
                setStep2Ready(true);
              }}
            >
              {summaryEditStep === 2 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!step2Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 3: Cleaning Needs & Frequency ========== */}
      {step1Ready && step2Ready && !step3Ready && (
        <div className="selected-message">
          <h3>Cleaning Needs & Frequency</h3>
          <p className="section-status">
            {cleaningInputsValid
              ? `Frequency set: ${cleaningAnswers["Frequency"] || "-"}`
              : "Select frequency and complete count fields."}
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            Frequency is required. Special requests are optional.
          </p>

          <div className="traffic-category">
            {renderFieldHeader("Special Requests - (choose that apply)", {
              optional: true,
              infoText:
                "Add any product or sensitivity preferences. Choose 'No special requests' if none apply.",
            })}
            <ul>
              {CleaningNeeds["Special Requests - (choose that apply)"].map((item, i) => {
                const option = optionValue(item);
                return (
                <li className="number-option rich-option" key={`sp-${i}`}>
                  <input
                    type="checkbox"
                    id={`special-${i}`}
                    value={option}
                    checked={specialRequests.includes(option)}
                    onChange={() => handleSpecialRequestChange(option)}
                  />
                  <label className="list-naem" htmlFor={`special-${i}`}>
                    {renderOptionCopy(item)}
                  </label>
                </li>
              )})}
            </ul>
            <p className="selection-count">
              {specialRequestStatusText}
            </p>
          </div>

          <div className="traffic-category">
            {renderFieldHeader("Frequency", {
              required: true,
              infoText:
                "Choose how often service is needed. We use this with your count inputs to estimate workload.",
            })}
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
                if (summaryEditStep === 3) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep2Ready(false);
              }}
            >
              {summaryEditStep === 3 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!cleaningInputsValid}
              onClick={() => {
                if (!cleaningInputsValid) {
                  setStepError("Please select frequency and complete required count fields.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 3) {
                  finishSummaryEdit();
                  return;
                }
                setStep3Ready(true);
              }}
            >
              {summaryEditStep === 3 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!cleaningInputsValid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 4: Conditions ========== */}
      {step3Ready && !step4Ready && (
        <div className="selected-message">
          <h3>Conditions & Challenges</h3>
          <p className="section-status">
            Required complete: {step4RequiredDone}/2
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            Both fields are required before continuing.
          </p>
          {Object.keys(ConditionsChallenges).map((category, idx) => (
            <div key={idx} className="traffic-category">
              {renderFieldHeader(category, {
                required: true,
                infoText:
                  category === "Current Condition"
                    ? "Well maintained = routinely cleaned with minimal buildup. Moderately soiled = visible dirt in active zones. Overdue deep clean = heavy buildup and neglected detail areas."
                    : "Soil = tracked dirt (common in entrances/schools/warehouses). Grease = oily residue (common in kitchens/food service). Dust = fine buildup (common in offices and post-construction sites).",
              })}
              <ul>
                {ConditionsChallenges[category].map((item, i) => {
                  const option = optionValue(item);
                  return (
                  <li className="number-option rich-option" key={`cond-${idx}-${i}`}>
                    <input
                      type="radio"
                      name={`condition-${idx}`}
                      id={`condition-${idx}-${i}`}
                      value={option}
                      checked={conditionAnswers[category] === option}
                      onChange={(e) => {
                        setStepError("");
                        setConditionAnswers((prev) => ({
                          ...prev,
                          [category]: e.target.value,
                        }));
                      }}
                    />
                    <label className="list-naem" htmlFor={`condition-${idx}-${i}`}>
                      {renderOptionCopy(item)}
                    </label>
                  </li>
                )})}
              </ul>
            </div>
          ))}

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                if (summaryEditStep === 4) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep3Ready(false);
              }}
            >
              {summaryEditStep === 4 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step4Valid}
              onClick={() => {
                if (!step4Valid) {
                  setStepError("Please answer all condition fields before continuing.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 4) {
                  finishSummaryEdit();
                  return;
                }
                setStep4Ready(true);
              }}
            >
              {summaryEditStep === 4 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!step4Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 5: Pricing Model ========== */}
      {step4Ready && !step5Ready && (
        <div className="selected-message">
          <h3>
            Preferred Pricing Model
            <span className="required-star" aria-hidden="true">
              *
            </span>
          </h3>
          <p className="section-status">
            {step5Valid ? `Selected: ${pricingModel}` : "Select one pricing model."}
          </p>
          <p className="field-info-inline">
            Pick the billing style you want. Flat monthly contract pricing is created from your
            selected facility details, frequency, conditions, and add-ons.
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            One pricing model is required.
          </p>
          <ul className="pricing-grid">
            {PricingModel.map((item, i) => {
              const option = optionValue(item);
              return (
              <li className="number-option rich-option" key={`pm-${i}`}>
                <input
                  type="radio"
                  name="pricing-model"
                  id={`pricing-${i}`}
                  value={option}
                  checked={pricingModel === option}
                  onChange={(e) => {
                    setStepError("");
                    setPricingModel(e.target.value);
                    setStep5Ready(false);
                  }}
                />
                <label className="list-naem" htmlFor={`pricing-${i}`}>
                  {renderOptionCopy(item)}
                </label>
              </li>
            )})}
          </ul>

          {pricingModel === "Flat monthly contract" && (
            <div className="contract-guide">
              <p>
                Flat monthly contract pricing is based on your selected industry, square footage,
                frequency, condition, and add-ons. Contract term discounts are applied as follows:
              </p>
              <div className="contract-guide__table">
                <div className="contract-guide__head">Contract Length</div>
                <div className="contract-guide__head">Discount</div>
                <div className="contract-guide__head">Why It Works</div>
                {ContractLengthDiscountGuide.map((row) => (
                  <React.Fragment key={row.term}>
                    <div>{row.term}</div>
                    <div>{row.discount}</div>
                    <div>{row.reason}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                if (summaryEditStep === 5) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep4Ready(false);
              }}
            >
              {summaryEditStep === 5 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step5Valid}
              onClick={() => {
                if (!step5Valid) {
                  setStepError("Please select a pricing model before continuing.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 5) {
                  finishSummaryEdit();
                  return;
                }
                setStep5Ready(true);
              }}
            >
              {summaryEditStep === 5 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!step5Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 6: Service Add-ons ========== */}
      {step5Ready && !step6Ready && (
        <div className="selected-message">
          <h3>
            Service Add-ons
            <span className="required-star" aria-hidden="true">
              *
            </span>
          </h3>
          <p className="section-status">
            {serviceAddOns.includes("No add-on")
              ? "No add-on selected."
              : addOnCount > 0
              ? `Selected add-ons: ${addOnCount}`
              : "No add-ons selected yet."}
          </p>
          <p className="field-info-inline">
            Add-ons are optional upgrades to your base plan. Select at least one item or choose
            &apos;No add-on&apos; to continue.
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            Select add-ons or choose No add-on.
          </p>
          <ul className="addon-grid">
            {ServiceAddOns.map((item, i) => {
              const option = optionValue(item);
              return (
              <li className="number-option rich-option" key={`ao-${i}`}>
                <input
                  type="checkbox"
                  id={`addon-${i}`}
                  value={option}
                  checked={serviceAddOns.includes(option)}
                  onChange={() => handleAddOnChange(option)}
                />
                <label className="list-naem" htmlFor={`addon-${i}`}>
                  {renderOptionCopy(item)}
                </label>
              </li>
            )})}
          </ul>
          <p className="selection-count">
            {addOnStatusText}
          </p>

          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                if (summaryEditStep === 6) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep5Ready(false);
              }}
            >
              {summaryEditStep === 6 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step6Valid}
              onClick={() => {
                if (!step6Valid) {
                  setStepError("Please choose at least one add-on (or 'No add-on').");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 6) {
                  finishSummaryEdit();
                  return;
                }
                setStep6Ready(true);
              }}
            >
              {summaryEditStep === 6 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!step6Valid && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 7: Quality Expectations ========== */}
      {step6Ready && !step7Ready && (
        <div className="selected-message">
          <h3>
            Quality Expectations
            <span className="required-star" aria-hidden="true">
              *
            </span>
          </h3>
          <p className="section-status">
            {step7Valid ? "Quality level selected." : "Pick one quality level."}
          </p>
          <p className="field-info-inline">
            This sets the outcome standard your team expects after each visit and helps align scope,
            staffing, and QA checks.
          </p>
          <p className="required-note">
            <span className="required-star" aria-hidden="true">
              *
            </span>{" "}
            One quality level is required.
          </p>
          <ul className="quality-grid">
            {QualityOptions.map((item, i) => {
              const option = optionValue(item);
              return (
              <li className="number-option rich-option" key={`qe-${i}`}>
                <input
                  type="radio"
                  name="quality"
                  id={`quality-${i}`}
                  value={option}
                  checked={qualityExpectations === option}
                  onChange={(e) => {
                    setStepError("");
                    setQualityExpectations(e.target.value);
                  }}
                />
                <label className="list-naem" htmlFor={`quality-${i}`}>
                  {renderOptionCopy(item)}
                </label>
              </li>
            )})}
          </ul>
          <div className="step-actions">
            <button
              type="button"
              className="back-button ui-btn secondary md"
              onClick={() => {
                if (summaryEditStep === 7) {
                  finishSummaryEdit();
                  return;
                }
                setStepError("");
                setStep6Ready(false);
              }}
            >
              {summaryEditStep === 7 ? "Cancel Edit" : "Back"}
            </button>
            <button
              type="button"
              className="next-button ui-btn primary md"
              disabled={!step7Valid}
              onClick={() => {
                if (!qualityExpectations) {
                  setStepError("Please select your quality expectation before continuing.");
                  return;
                }
                setStepError("");
                if (summaryEditStep === 7) {
                  finishSummaryEdit();
                  return;
                }
                setStep7Ready(true);
              }}
            >
              {summaryEditStep === 7 ? "Save & Return" : "Next"}
            </button>
          </div>
          {!qualityExpectations && stepError && <p className="step-error">{stepError}</p>}
        </div>
      )}

      {/* ========== STEP 8: Summary + Referral Code ========== */}
      {step7Ready && qualityExpectations && (
        <div className="selected-message summary">
          <div className="summary-head">
            <h3>Summary of Your Selections</h3>
            <p className="summary-help">
              Use the Edit buttons to manually update any section before submitting.
            </p>
          </div>

          <div className="summary-list">
            {summaryItems.map((item) => (
              <div className="summary-item" key={item.label}>
                <div className="summary-item__body">
                  <p className="summary-item__label">{item.label}</p>
                  <p className="summary-item__value">{item.value}</p>
                </div>
                <button
                  type="button"
                  className="summary-edit-btn ui-btn ghost sm"
                  onClick={() => navigateToStep(item.step)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <div className="referral-card">
            <div className="referral-head">
              <h4>Referral Code</h4>
              <p className="muted">Use this on the Contact page to fast-track your request.</p>
            </div>

            <div className="refrow">
              <input
                type="text"
                readOnly={!isRefCodeManual}
                value={refCode}
                placeholder="-- no code yet --"
                className="refcode-input"
                onChange={(e) => {
                  setRefCode(sanitizeReferralCode(e.target.value));
                  setSubmitTone("info");
                  setSubmitMessage("");
                }}
              />
              <div className="ref-actions">
                <button
                  type="button"
                  className="btn-ghost ui-btn ghost sm"
                  onClick={refCode ? copyRefCode : generateRefCode}
                >
                  {refCode ? "Copy" : "Generate"}
                </button>
                <button
                  type="button"
                  className={`btn-ghost ui-btn ghost sm ${isRefCodeManual ? "active" : ""}`}
                  onClick={() => setIsRefCodeManual((prev) => !prev)}
                >
                  {isRefCodeManual ? "Lock Code" : "Manual Edit"}
                </button>
              </div>
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






