import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import { ApiError, apiDelete, apiGet, apiPut } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import { EmptyState, InlineNotice, SkeletonRows } from "../../components/ui/PageStates";
import PageHeader from "../../components/ui/PageHeader";
import "./dashboard.css";

const SHARED_SPACES_KEY = "Shared Spaces - (choose that apply)";

const normalizeLeadDraft = (details = {}) => {
  const footTrafficAnswers = details.footTrafficAnswers || {};
  const cleaningAnswers = details.cleaningAnswers || {};
  const conditionAnswers = details.conditionAnswers || {};

  return {
    ...details,
    frequency: details.frequency || cleaningAnswers.Frequency || "",
    footTraffic: details.footTraffic || footTrafficAnswers["Foot traffic"] || "",
    operatingHours: details.operatingHours || footTrafficAnswers["Operating Hours"] || "",
    sharedSpaces: Array.isArray(details.sharedSpaces)
      ? details.sharedSpaces
      : Array.isArray(footTrafficAnswers[SHARED_SPACES_KEY])
      ? footTrafficAnswers[SHARED_SPACES_KEY]
      : [],
    addOns: Array.isArray(details.addOns)
      ? details.addOns
      : Array.isArray(details.serviceAddOns)
      ? details.serviceAddOns
      : [],
    currentCondition:
      details.currentCondition || conditionAnswers["Current Condition"] || "",
    currentCond: details.currentCond || conditionAnswers["Current Problem"] || "",
    servicePackage:
      details.servicePackage ||
      (details.pricingModel === "Flat monthly contract" ? "Premium" : "Basic"),
  };
};

const buildLeadPayload = (raw = {}) => {
  const cleaned = { ...raw };
  cleaned.freqCount = cleaned.freqCount ? Number(cleaned.freqCount) : 0;
  cleaned.freqTimesPerDay = cleaned.freqTimesPerDay ? Number(cleaned.freqTimesPerDay) : 0;
  cleaned.specialRequests = Array.isArray(cleaned.specialRequests) ? cleaned.specialRequests : [];

  const addOns = Array.isArray(cleaned.addOns)
    ? cleaned.addOns
    : Array.isArray(cleaned.serviceAddOns)
    ? cleaned.serviceAddOns
    : [];
  const normalizedAddOns = addOns.map((a) => String(a).trim()).filter(Boolean);
  cleaned.serviceAddOns = normalizedAddOns.includes("No add-on")
    ? ["No add-on"]
    : normalizedAddOns.filter((a) => a.toLowerCase() !== "no add-on");

  cleaned.cleaningAnswers = {
    ...(cleaned.cleaningAnswers || {}),
    Frequency: cleaned.frequency || cleaned.cleaningAnswers?.Frequency || "",
  };

  cleaned.footTrafficAnswers = {
    ...(cleaned.footTrafficAnswers || {}),
    "Foot traffic": cleaned.footTraffic || cleaned.footTrafficAnswers?.["Foot traffic"] || "",
    "Operating Hours": cleaned.operatingHours || cleaned.footTrafficAnswers?.["Operating Hours"] || "",
    [SHARED_SPACES_KEY]: Array.isArray(cleaned.sharedSpaces)
      ? cleaned.sharedSpaces
      : cleaned.footTrafficAnswers?.[SHARED_SPACES_KEY] || [],
  };

  cleaned.conditionAnswers = {
    ...(cleaned.conditionAnswers || {}),
    "Current Condition":
      cleaned.currentCondition || cleaned.conditionAnswers?.["Current Condition"] || "",
    "Current Problem":
      cleaned.currentCond || cleaned.conditionAnswers?.["Current Problem"] || "",
  };

  delete cleaned.addOnToAdd;
  delete cleaned.sharedSpaceToAdd;
  delete cleaned.specialRequestToAdd;

  return cleaned;
};

const validateLeadDraft = (draft = {}) => {
  const errors = {};
  if (!String(draft.business_name || "").trim()) errors.business_name = "Business name is required.";
  if (!String(draft.Ownername || "").trim()) errors.Ownername = "Owner name is required.";
  if (!String(draft.email || "").trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(String(draft.email).trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!String(draft.frequency || "").trim()) errors.frequency = "Cleaning frequency is required.";
  if (!String(draft.pricingModel || "").trim()) errors.pricingModel = "Pricing model is required.";
  if (!String(draft.servicePackage || "").trim()) errors.servicePackage = "Invoice package is required.";
  if (!String(draft.invoiceFrequency || "").trim()) errors.invoiceFrequency = "Invoice frequency is required.";
  if (
    ["weekly", "bi-weekly"].includes(String(draft.invoiceFrequency || "").toLowerCase()) &&
    !String(draft.invoiceDay || "").trim()
  ) {
    errors.invoiceDay = "Select an invoice day for weekly cycles.";
  }
  return errors;
};





export default function Dashboard() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [filter, setFilter] = useState("recent");
  const [vieInfo, setViewInfo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [originalDraft, setOriginalDraft] = useState(null);
  const [activeLeadTab, setActiveLeadTab] = useState("client");
  const [modalNotice, setModalNotice] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  usePageMeta("Admin Dashboard", "Review and manage commercial cleaning leads.");

const leadErrors = useMemo(() => (draft ? validateLeadDraft(draft) : {}), [draft]);
const isModalDirty = useMemo(() => {
  if (!vieInfo || !draft || !originalDraft) return false;
  return JSON.stringify(draft) !== JSON.stringify(originalDraft);
}, [vieInfo, draft, originalDraft]);

useEffect(() => {
  const fetchLeads = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const json = await apiGet("/leads", { auth: true });
      if (!Array.isArray(json)) {
        throw new Error("Invalid leads response from server");
      }

      setLeads(json.filter((l) => !l.deleted));

    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setErrorMessage(err.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  fetchLeads();
}, [navigate]);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const requestCloseLeadModal = useCallback(() => {
  if (!vieInfo) return;
  if (isModalDirty) {
    const shouldClose = window.confirm("You have unsaved changes. Close without saving?");
    if (!shouldClose) return;
  }
  setModalNotice("");
  setViewInfo(false);
}, [isModalDirty, vieInfo]);

useEffect(() => {
  if (!vieInfo || !isModalDirty) return undefined;
  const onBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = "";
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, [isModalDirty, vieInfo]);

useEffect(() => {
  if (!vieInfo) return undefined;
  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      requestCloseLeadModal();
      return;
    }

    if (event.key !== "Tab" || !modalRef.current) return;
    const focusables = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [requestCloseLeadModal, vieInfo]);

const openLead = async (t) => {
  try {
    setNotice("");
    setModalNotice("");
    const json = await apiGet(`/data/${t.id}`, { auth: true });

    // Store full backend payload
    const normalizedDraft = normalizeLeadDraft(json.details || {});

    setSelected({
      id: t.id,
      referralCode: t.id,
      company: t.company,
      name: t.name,
      ...normalizedDraft,
    });

    setDraft(normalizedDraft);
    setOriginalDraft(normalizedDraft);
    setActiveLeadTab("client");

    // Open modal
    setViewInfo(true);

  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      return;
    }
    setNotice(err.message || "Failed to load lead details");
  }
};

  const deleteLead = async () => {
  if (!selected?.referralCode) return;

  const confirmDelete = window.confirm(
    `Are you sure you want to delete lead ${selected.referralCode}?`
  );
  if (!confirmDelete) return;

  try {
    await apiDelete(`/leads/${selected.referralCode}`, { auth: true });

    // remove from UI immediately
    setLeads(prev => prev.filter(l => l.id !== selected.referralCode));

    setViewInfo(false);
    setSelected(null);
    setDraft(null);
    setOriginalDraft(null);
    setModalNotice("");

    setNotice("Lead deleted successfully.");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      return;
    }
    setNotice(err.message || "Failed to delete lead");
  }
};

const filteredLeads = leads
  // Search
  .filter((lead) => {
    if (!search) return true;

    const q = search.toLowerCase();

    return (
      lead.id?.toString().toLowerCase().includes(q) ||
      lead.name?.toLowerCase().includes(q) ||
      lead.company?.toLowerCase().includes(q)
    );
  })
  // Sort / filter
  .sort((a, b) => {
    if (filter === "recent") {
      const at = new Date(a.submittedAt || 0).getTime();
      const bt = new Date(b.submittedAt || 0).getTime();
      return bt - at;
    }

    if (filter === "A-Z") {
      return (a.company || "").localeCompare(b.company || "");
    }

    if (filter === "Z-A") {
      return (b.company || "").localeCompare(a.company || "");
    }

    if (filter === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }

    if (filter === "Refer Code") {
      return a.id.toString().localeCompare(b.id.toString());
    }

    return 0; // no filter
  });

const uniqueCompanies = new Set(
  leads.map((l) => (l.company || "").trim()).filter(Boolean)
).size;

const pendingWithoutEmail = leads.filter((l) => !(l.email || "").trim()).length;



  return (
  <div className="dashboard-page">
    <Header />


    <section className="info-Box">
      <PageHeader
        title="Lead Management"
        subtitle="Review incoming referrals, update service details, and manage invoice settings."
      />
      {/* Search + Filters */}
      <section className="dashboard-filters">
        <div className="lookupRow">
          <input
            type="text"
            placeholder="Search referral code, client, or business..."
            className="referInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="dashboard-sort"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Sort leads"
          >
            <option value="recent">Most recent</option>
            <option value="A-Z">Company A-Z</option>
            <option value="Z-A">Company Z-A</option>
            <option value="name">Client name</option>
            <option value="Refer Code">Referral code</option>
          </select>
        </div>

        <div className="dashboard-stats">
          <div className="stat-chip">
            <span>Total leads</span>
            <strong>{leads.length}</strong>
          </div>
          <div className="stat-chip">
            <span>Companies</span>
            <strong>{uniqueCompanies}</strong>
          </div>
          <div className="stat-chip">
            <span>Missing email</span>
            <strong>{pendingWithoutEmail}</strong>
          </div>
        </div>
      </section>

      {/* Task List */}
      <section className="dashboard-list">
        <div className="dashboard-list-title">
          <h2 className="section-title">Leads</h2>
          <span className="list-count">{filteredLeads.length} shown</span>
        </div>

        <InlineNotice tone="success">{notice}</InlineNotice>
        <InlineNotice tone="error">{errorMessage}</InlineNotice>

        {/* Table Header */}
        <div className="task-header">
          <span>Referral #</span>
          <span>Business Name</span>
          <span>Client Name</span>
        </div>

        {/* Table Rows */}
        <div>
          {loading && <SkeletonRows rows={8} columns={3} />}

          {filteredLeads.map((t) => (

            <div className="task-row" key={t.id} onClick={() => openLead(t)}>
              <span>{t.id}</span>
              <span>{t.company || "-"}</span>
              <span>{t.name || "-"}</span>
            </div>
          ))}
        </div>
        {!loading && filteredLeads.length === 0 && (
          <EmptyState
            compact
            title="No leads found"
            description="Try adjusting search or sort to find a lead."
          />
        )}

      </section>
    </section>

    {/* Modal (keep it outside the table/list markup) */}
    {vieInfo && draft && selected && (
	      <div
	        className="modal-overlay"
	        role="dialog"
	        aria-modal="true"
	        aria-labelledby="lead-title"
	        onClick={requestCloseLeadModal}
	      >
	        <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
	          <div className="modal-header">
	            <div>
	              <h3 id="lead-title">Selected Lead</h3>
                {isModalDirty && <span className="dirty-pill">Unsaved changes</span>}

	              <section className="kv-grid lead-identity-grid">
	                <div className="kv">
	                  <span className="k">Company Name</span>
	                  <input
	                    className={`v${leadErrors.business_name ? " invalid" : ""}`}
	                    value={draft.business_name ?? selected.business_name ?? ""}
	                    onChange={(e) =>
	                      setDraft((d) => ({ ...d, business_name: e.target.value }))
	                    }
	                  />
                    {leadErrors.business_name && <span className="field-help error">{leadErrors.business_name}</span>}
	                </div>

	                <div className="kv">
	                  <span className="k">Owner Name</span>
	                  <input
	                    className={`v${leadErrors.Ownername ? " invalid" : ""}`}
	                    value={draft.Ownername ?? selected.Ownername ?? ""}
	                    onChange={(e) =>
	                      setDraft((d) => ({ ...d, Ownername: e.target.value }))
	                    }
	                  />
                    {leadErrors.Ownername && <span className="field-help error">{leadErrors.Ownername}</span>}
	                </div>
	              </section>
	            </div>

	            <button
	              className="icon-btn"
	              onClick={requestCloseLeadModal}
	              aria-label="Close"
	            >
	              X
	            </button>
	          </div>

	          <div className="modal-body">
              <div className="lead-tabs" role="tablist" aria-label="Lead edit sections">
                <button
                  type="button"
                  className={`lead-tab${activeLeadTab === "client" ? " active" : ""}`}
                  onClick={() => setActiveLeadTab("client")}
                >
                  Client
                </button>
                <button
                  type="button"
                  className={`lead-tab${activeLeadTab === "service" ? " active" : ""}`}
                  onClick={() => setActiveLeadTab("service")}
                >
                  Service
                </button>
                <button
                  type="button"
                  className={`lead-tab${activeLeadTab === "billing" ? " active" : ""}`}
                  onClick={() => setActiveLeadTab("billing")}
                >
                  Billing
                </button>
              </div>
              <InlineNotice tone="error">{modalNotice}</InlineNotice>

            {activeLeadTab === "client" && (
              <>
	            <h4 className="modal-section-title">Client Details</h4>
	            <section className="kv-grid lead-contact-grid">
	              <div className="kv">
	                <span className="k">Submitted At</span>
	                <span className="v">{formatDateTime(selected.submittedAt)}</span>
	              </div>

	              <div className="kv">
	                <span className="k">ID</span>
	                <span className="v">{selected.id ?? "-"}</span>
	              </div>

	              <div className="kv">
	                <span className="k">Referral Code</span>
	                <span className="v code">{selected.referralCode ?? "-"}</span>
	              </div>

	              <div className="kv">
	                <span className="k">Email</span>
	                <input
	                  className={`v${leadErrors.email ? " invalid" : ""}`}
	                  value={draft.email ?? selected.email ?? ""}
	                  onChange={(e) =>
	                    setDraft((d) => ({ ...d, email: e.target.value }))
	                  }
	                />
                  {leadErrors.email && <span className="field-help error">{leadErrors.email}</span>}
	              </div>

	              <div className="kv full">
	                <span className="k">Message</span>
	                <input
	                  className="v message"
	                  value={draft.message ?? selected.message ?? ""}
	                  onChange={(e) =>
	                    setDraft((d) => ({ ...d, message: e.target.value }))
	                  }
	                />
	              </div>
	            </section>
              </>
            )}

            {activeLeadTab === "service" && (
              <>
	            <h4 className="modal-section-title">Service Preferences</h4>
	                      <section className="kv-grid lead-work-grid">
	                        <div className="kv">
	                          <span className="k">Sqft</span>
	                          <input
                            className="v"
                            value={draft.sqft ?? selected.sqft ?? ""}
                            onChange={(e) =>
                              setDraft(d => ({ ...d, sqft: e.target.value }))
                            }
                          />


                        </div>
	                        <div className="kv">
	                          <span className="k">Frequency</span>
	                       <select
                          className={`v${leadErrors.frequency ? " invalid" : ""}`}
	                          value={draft?.frequency ?? selected?.frequency ?? ""}
	                          onChange={(e) =>
	                            setDraft(d => ({ ...d, frequency: e.target.value }))
                          }
                        >

                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Bi-weekly">Bi-weekly</option>
                            <option value="Monthly">Monthly</option>
	                            <option value="One-time deep clean">One-time deep clean</option>
	                          </select>
                          {leadErrors.frequency && <span className="field-help error">{leadErrors.frequency}</span>}

	                        </div>

                        <div className="kv">
                          <span className="k">Industry</span>

                          <select 
                          className="v"
                            name="SpaceDetail"
                            id="SpaceDetail"
                            value={draft?.selectedIndustry ?? selected?.selectedIndustry ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, selectedIndustry: e.target.value }))
                            }
                          >
                          
                            <option value="Corporate Offices & Co-Working Spaces">Corporate Offices & Co-Working Spaces</option>
                            <option value="Medical & Healthcare">Medical & Healthcare</option>
                            <option value="Construction & Renovation Sites">Construction & Renovation Sites</option>
                            <option value="Retail & Shopping Centers">Retail & Shopping Centers</option>
                            <option value="Education">Education</option>
                            <option value="Government & Public Facilities">Government & Public Facilities</option>
                            <option value="Hospitality">Hospitality</option>
                          </select>

                        </div>
                          <div className="kv">
                            <span className="k">Foot Traffic</span>

                            <select
                              className="v"
                              name="footTraffic"
                              id="footTraffic"
                              value={draft?.footTraffic ?? selected?.footTraffic ?? ""}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, footTraffic: e.target.value }))
                              }
                            >
                              <option value="">Select foot traffic</option>
                              <option value="Light - small offices or limited staff">Light - small offices or limited staff</option>
                              <option value="Moderate - regular daily activity">Moderate - regular daily activity</option>
                              <option value="Heavy - high volume / public access">Heavy - high volume / public access</option>
                            </select>
                          </div>


                        <div className="kv">
                          <span className="k">Operating Hours</span>
                            <select
                              className="v"
                              name="opH"
                              id="opH"
                              value={draft?.operatingHours ?? selected?.operatingHours ?? ""}
                              onChange={(e) =>
                                setDraft((o) => ({ ...o, operatingHours: e.target.value }))
                              }
                            >
                              <option value="">Select operating hours</option>
                              <option value="Daytime only">Daytime only</option>
                              <option value="After-hours">After-Hours</option>
                              <option value="24/7 facilities service">24/7 facilities service</option>
                            </select>
                        </div>
                        <div className="kv">
	                          <span className="k">Pricing Model</span>
	                           <select
	                              className={`v${leadErrors.pricingModel ? " invalid" : ""}`}
	                              name="opH"
	                              id="opH"
	                              value={draft?.pricingModel ?? selected?.pricingModel ?? ""}
                              onChange={(e) =>
                                setDraft((P) => ({ ...P, pricingModel: e.target.value }))
                              }
                            >
                              <option value="">Select pricing model</option>
                              <option value="Per square foot pricing">Per square foot pricing</option>
                              <option value="Hourly rates">Hourly rates</option>
	                              <option value="Flat monthly contract">Flat monthly contract</option>
	                            </select>
                          {leadErrors.pricingModel && <span className="field-help error">{leadErrors.pricingModel}</span>}
	                        </div>

                        <div className="kv">
                          <span className="k">Visits (over period)</span>
                        <input
                          className="v"
                          value={draft?.freqCount ?? selected?.freqCount ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, freqCount: Number(e.target.value) }))
                          }

                        />
                        </div>
                        <div className="kv">
                          <span className="k">Hours / Visit</span>
                          <input
                            className="v"
                            value={draft?.freqTimesPerDay ?? selected?.freqTimesPerDay ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, freqTimesPerDay: Number(e.target.value) }))
                            }

                          />                        

                        </div>

                        <div className="kv">
                          <span className="k">Quality Expectations</span>
                           <select
                              className="v"
                              name="qe"
                              id="qe"
                              value={draft?.qualityExpectations ?? selected?.qualityExpectations ?? ""}
                              onChange={(e) =>
                                setDraft((q) => ({ ...q, qualityExpectations: e.target.value }))
                              }
                            >
                              <option value="">Select quality level</option>
                              <option value="Spotless/disinfected - ideal for medical and client-facing spaces">Spotless/disinfected - ideal for medical and client-facing spaces</option>
                              <option value="Tidy/maintained - practical standard for offices and warehouses">Tidy/maintained - practical standard for offices and warehouses</option>
                              <option value="Detail-focused finish - high-touch zones plus visual polish">Detail-focused finish - high-touch zones plus visual polish</option>
                            </select>
                        </div>
                        
                        <div className="kv">
                          <span className="k">Current Problem</span>
                        <select
                              className="v"
                              name="cc"
                              id="cc"
                              value={draft?.currentCond ?? selected?.currentCond ?? ""}
                              onChange={(e) =>
                                setDraft((c) => ({ ...c, currentCond: e.target.value }))
                              }
                            >
                              <option value="">Select current problem</option>
                              <option value="Soil">Soil</option>
                              <option value="Grease">Grease</option>
                              <option value="Dust">Dust</option>
	                            </select>
	                        </div>
	                        
	                      </section>
<div className="divider" />

<section className="chips-block modal-panel">
  {/* ---------- Shared Spaces ---------- */}
  <h4>Shared Spaces</h4>
  <div className="chips">
    {(draft?.sharedSpaces || []).map((s, idx) => (
      <div className="chip" key={idx}>
        <span>{s}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setDraft(prev => ({
              ...prev,
              sharedSpaces: (prev.sharedSpaces || []).filter((_, i) => i !== idx),
            }));
          }}
        >
          X
        </button>
      </div>
    ))}

    {/* Add new shared space */}
    <div className="chip-input">
      <select
        className="LeftInput"
        name="sharedSpaceToAdd"
        id="sharedSpaceToAdd"
        value={draft?.sharedSpaceToAdd ?? ""}
        onChange={(e) =>
          setDraft(prev => ({ ...prev, sharedSpaceToAdd: e.target.value }))
        }
      >
        <option value="">Add Shared Space</option>
        <option value="Common lobbies or reception areas">
          Common lobbies or reception areas
        </option>
        <option value="Elevators & stairwells">Elevators & stairwells</option>
        <option value="Shared restrooms or kitchens">
          Shared restrooms or kitchens
        </option>
      </select>

      <button
        type="button"
        className="Addbutton"
        onClick={() => {
          const value = draft?.sharedSpaceToAdd;
          if (!value) return;

          setDraft(prev => ({
            ...prev,
            sharedSpaces: (prev.sharedSpaces || []).includes(value)
              ? prev.sharedSpaces
              : [ ...(prev.sharedSpaces || []), value ],
          }));

          setDraft(prev => ({ ...prev, sharedSpaceToAdd: "" }));
        }}
      >
        +
      </button>
    </div>
  </div>

  {/* ---------- Add-ons ---------- */}
  <h4>Add-ons</h4>
  <div className="chips">
    {(draft?.addOns || []).map((a, idx) => (
      <div className="chip" key={idx}>
        <span>{a}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setDraft(prev => ({
              ...prev,
              addOns: (prev.addOns || []).filter((_, i) => i !== idx),
            }));
          }}
        >
          X
        </button>
      </div>
    ))}

    {/* Add new add-on */}
    <div className="chip-input">
      <select
        className="LeftInput"
        name="addOnToAdd"
        id="addOnToAdd"
        value={draft?.addOnToAdd ?? ""}
        onChange={(e) =>
          setDraft(prev => ({ ...prev, addOnToAdd: e.target.value }))
        }
      >
        <option value="">Add Add-on</option>
        <option value="Glass Cleaning">Glass Cleaning</option>
        <option value="Move-In/Move-Out Cleaning">Move-In/Move-Out Cleaning</option>
        <option value="Carpet & upholstery extraction">
          Carpet & upholstery extraction
        </option>
        <option value="Eco-Friendly/Green Cleaning">
          Eco-Friendly/Green Cleaning
        </option>
        <option value="Kitchen/Breakroom Deep Cleaning">
          Kitchen/Breakroom Deep Cleaning
        </option>
        <option value="Post-Construction Cleaning">
          Post-Construction Cleaning
        </option>
        <option value="No add-on">No add-on</option>
      </select>

      <button
        type="button"
        className="Addbutton"
        onClick={() => {
          const value = draft?.addOnToAdd;
          if (!value) return;

          setDraft(prev => ({
            ...prev,
            addOns: (prev.addOns || []).includes(value)
              ? prev.addOns
              : [ ...(prev.addOns || []), value ],
          }));

          setDraft(prev => ({ ...prev, addOnToAdd: "" }));
        }}
      >
        +
      </button>
    </div>
  </div>

  {/* ---------- Special Requests ---------- */}
  <h4>Special Requests</h4>
  <div className="chips">
    {(draft?.specialRequests || []).map((r, idx) => (
      <div className="chip" key={idx}>
        <span>{r}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setDraft(prev => ({
              ...prev,
              specialRequests: (prev.specialRequests || []).filter((_, i) => i !== idx),
            }));
          }}
        >
          X
        </button>
      </div>
    ))}

    {/* Add new special request */}
    <div className="chip-input">
      <select
        className="LeftInput"
        name="specialRequestToAdd"
        id="specialRequestToAdd"
        value={draft?.specialRequestToAdd ?? ""}
        onChange={(e) =>
          setDraft(prev => ({ ...prev, specialRequestToAdd: e.target.value }))
        }
      >
        <option value="">Add Special Request</option>
        <option value="Green Cleaning Products">Green Cleaning Products</option>
        <option value="Fragrance-free">Fragrance-free</option>
        <option value="Allergy-safe">Allergy-safe</option>
      </select>

      <button
        type="button"
        className="Addbutton"
        onClick={() => {
          const value = draft?.specialRequestToAdd;
          if (!value) return;

          setDraft(prev => ({
            ...prev,
            specialRequests: (prev.specialRequests || []).includes(value)
              ? prev.specialRequests
              : [ ...(prev.specialRequests || []), value ],
          }));

          setDraft(prev => ({ ...prev, specialRequestToAdd: "" }));
        }}
      >
        +
      </button>
	    </div>
	  </div>
</section>
              </>
            )}
            {activeLeadTab === "billing" && (
              <>
	                        <section className="billing-box modal-panel">
	  <h4>Billing & Cleaning Schedule</h4>

	  <div className="kv-grid billing-grid">

    {/* Invoice Type */}
	    <div className="kv">
	      <span className="k">Invoice Type</span>
	      <select
	        className={`v${leadErrors.servicePackage ? " invalid" : ""}`}
	        value={draft?.servicePackage ?? selected?.servicePackage ?? "Basic"}
	        onChange={(e) =>
	          setDraft(d => ({ ...d, servicePackage: e.target.value }))
        }
      >
	        <option value="Basic">Package - Basic</option>
	        <option value="Premium">Package - Premium</option>
	      </select>
        {leadErrors.servicePackage && <span className="field-help error">{leadErrors.servicePackage}</span>}
	    </div>

    {/* Invoice Frequency */}
	    <div className="kv">
	      <span className="k">Invoice Frequency</span>
	      <select
	        className={`v${leadErrors.invoiceFrequency ? " invalid" : ""}`}
	        value={draft?.invoiceFrequency ?? selected?.invoiceFrequency ?? ""}
	        onChange={(e) =>
	          setDraft(d => ({ ...d, invoiceFrequency: e.target.value }))
        }
      >
        <option value="">Select frequency</option>
        <option value="weekly">Weekly</option>
        <option value="bi-weekly">Bi-Weekly</option>
	        <option value="monthly">Monthly</option>
	        <option value="one-time">One-Time</option>
	      </select>
        {leadErrors.invoiceFrequency && <span className="field-help error">{leadErrors.invoiceFrequency}</span>}
	    </div>

    {/* Invoice Day */}
	    <div className="kv">
	      <span className="k">Invoice Day</span>
	      <select
	        className={`v${leadErrors.invoiceDay ? " invalid" : ""}`}
	        value={draft?.invoiceDay ?? selected?.invoiceDay ?? ""}
	        onChange={(e) =>
	          setDraft(d => ({ ...d, invoiceDay: e.target.value }))
        }
      >
        <option value="">Auto / End of period</option>
        <option value="monday">Monday</option>
        <option value="tuesday">Tuesday</option>
        <option value="wednesday">Wednesday</option>
        <option value="thursday">Thursday</option>
        <option value="friday">Friday</option>
	        <option value="saturday">Saturday</option>
	        <option value="sunday">Sunday</option>
	      </select>
        {leadErrors.invoiceDay && <span className="field-help error">{leadErrors.invoiceDay}</span>}
	    </div>

	  </div>
</section>
              </>
            )}

	            <div className="divider" />

            {/* Action buttons */}
            <div className="modal-footer">
              <button className="btn danger" onClick={deleteLead}>
                Delete Lead
              </button>

	              <button
	                className="btn primary"
	                onClick={async () => {
                  const errors = validateLeadDraft(draft);
                  if (Object.keys(errors).length > 0) {
                    if (errors.email || errors.business_name || errors.Ownername) setActiveLeadTab("client");
                    else if (errors.frequency || errors.pricingModel) setActiveLeadTab("service");
                    else setActiveLeadTab("billing");
                    setModalNotice("Please fix required fields before saving.");
                    return;
                  }
                  setModalNotice("");
	                  try {
	                    const payload = buildLeadPayload({
	                      referralCode: selected.referralCode,
                      ...draft,
                    });

                    await apiPut(`/leads/${selected.referralCode}`, payload, {
                      auth: true,
                    });

                    const normalizedSaved = normalizeLeadDraft(payload);
	                    setSelected((prev) => ({
	                      ...(prev || {}),
	                      ...normalizedSaved,
	                    }));
	                    setDraft(normalizedSaved);
                      setOriginalDraft(normalizedSaved);
	                    setViewInfo(false);

	                    setNotice("Lead updated successfully.");
	                  } catch (err) {
                    if (err instanceof ApiError && err.status === 401) {
                      localStorage.removeItem("token");
                      navigate("/login", { replace: true });
                      return;
                    }
                    setNotice(err.message || "Failed to update lead");
                  }
                }}
              >
                Save Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

}




