import { useState, useEffect, useRef } from "react";
import Header from "./header";
import { API_URL } from "../../config";
import "./dashboard.css";
import "../admin/Payments.css";





export default function Dashboard() {
  const [filter, setFilter] = useState("");

  const menuRef = useRef(null);
  const [vieInfo, setViewInfo] = useState(false)
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);


  const [leads, setLeads] = useState([]);

useEffect(() => {
  const fetchLeads = async () => {
    try {
      const res = await authFetch(`/leads`);
      if (!res) return;
      const json = await res.json();

      setLeads(json);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  fetchLeads(); // ✅ just call it (NO await)
}, []);
 const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers || {});

  // Only set JSON header if you're not sending FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, { ...options, headers });

  // Optional: auto-handle expired/invalid token
  if (res.status === 401) {
    localStorage.removeItem("token");
    // window.location.href = "/login"; // if you want auto-redirect
  }

  return res;
};





  // detect clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



const openLead = async (t) => {
  try {
        // 1️⃣ Fetch EVERYTHING by referral code
    const res = await authFetch(`/data/${t.id}`);
    if (!res) return;
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || "Failed to load lead");

    // 2️⃣ Store full backend payload
    setSelected({
    id: t.id,               // ✅ ADD THIS
    referralCode: t.id,
    company: t.company,
    name: t.name,
    ...json.details
  });


    // 3️⃣ Editable copy
    setDraft(json.details);

    // 4️⃣ Open modal
    setViewInfo(true);

  } catch (err) {
    alert(err.message);
  }
};


  

  // track screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const deleteLead = async () => {
  if (!selected?.referralCode) return;

  const confirmDelete = window.confirm(
    `Are you sure you want to delete lead ${selected.referralCode}?`
  );
  if (!confirmDelete) return;

  try {
    const payload = {
      deleted: true,
    };

    const res = await authFetch(
      `/leads/${selected.referralCode}`,
      {
        method: "PUT", // ✅ MUST be PUT
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error("Failed to delete lead");

    // remove from UI immediately
    setLeads(prev => prev.filter(l => l.id !== selected.referralCode));

    setViewInfo(false);
    setSelected(null);
    setDraft(null);

    alert("Lead deleted successfully");
  } catch (err) {
    alert(err.message);
  }
};

const filteredLeads = leads
  // 🔍 SEARCH
  .filter((lead) => {
    if (!search) return true;

    const q = search.toLowerCase();

    return (
      lead.id?.toString().toLowerCase().includes(q) ||
      lead.name?.toLowerCase().includes(q) ||
      lead.company?.toLowerCase().includes(q)
    );
  })
  // 🧰 SORT / FILTER
  .sort((a, b) => {
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




  return (
  <div className="dashboard-page">
    <Header />


    <section className="info-Box">
      {/* Search + Filters */}
      <section className="dashboard-filters">
        <div className="searchRefBar">
          <div className="lookupRow">
            <input
              type="text"
              placeholder="Search Refer code, clients, or businesses..."
              className="referInput"
              onChange={(e)=> setSearch(e.target.value)}
            />
          </div>
        </div>
     
        
      </section>

      {/* Task List */}
      <section className="dashboard-list">
        <h2 className="section-title">Tasks</h2>

        {/* Table Header */}
        <div className="task-header">
          <span>Referral #</span>
          <span>Business Name</span>
          <span>Client Name</span>
        </div>

        {/* Table Rows */}
        <div>
          {filteredLeads.map((t) => (

            <div className="task-row" key={t.id} onClick={() => openLead(t)}>
              <span>{t.id}</span>
              <span>{t.company || "—"}</span>
              <span>{t.name || "—"}</span>
            </div>
          ))}
        </div>
        {filteredLeads.length === 0 && (
          <p style={{ padding: "1rem" }}>No results found</p>
        )}

      </section>
    </section>

    {/* ✅ MODAL (keep it OUTSIDE the table/list markup) */}
    {vieInfo && draft && selected && (
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-title"
        onClick={() => setViewInfo(false)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 id="lead-title">Selected Lead</h3>

              <section className="kv-grid">
                <div className="kv">
                  <span className="k">Company Name</span>
                  <input
                    className="v"
                    value={draft.business_name ?? selected.business_name ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, business_name: e.target.value }))
                    }
                  />
                </div>

                <div className="kv">
                  <span className="k">Owner Name</span>
                  <input
                    className="v"
                    value={draft.Ownername ?? selected.Ownername ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, Ownername: e.target.value }))
                    }
                  />
                </div>
              </section>
            </div>

            <button
              className="icon-btn"
              onClick={() => setViewInfo(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <section className="kv-grid">
              <div className="kv">
                <span className="k">Submitted At</span>
                <span className="v">{selected.submittedAt ?? "—"}</span>
              </div>

              <div className="kv">
                <span className="k">ID</span>
                <span className="v">{selected.id ?? "—"}</span>
              </div>

              <div className="kv">
                <span className="k">Referral Code</span>
                <span className="v code">{selected.referralCode ?? "—"}</span>
              </div>

              <div className="kv">
                <span className="k">Email</span>
                <input
                  className="v"
                  value={draft.email ?? selected.email ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
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

            <div className="divider" />

           
                      <div className="divider" />

                      <section className="kv-grid">
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
                          value={draft?.frequency ?? selected?.frequency ?? ""}
                          onChange={(e) =>
                            setDraft(d => ({ ...d, frequency: e.target.value }))
                          }
                        >

                            <option value="daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="bi-weekly">bi-weekly</option>
                            <option value="monthly">monthly</option>
                            <option value="DeepClean">Deep Clean</option>
                          </select>

                        </div>

                        <div className="kv">
                          <span className="k">Industry</span>

                          <select 
                          className="kv"
                            name="SpaceDetail" id="SpaceDetail">
                          
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
                              className="k"
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
                              className="k"
                              name="opH"
                              id="opH"
                              value={draft?.operatingHours ?? selected?.operatingHours ?? ""}
                              onChange={(e) =>
                                setDraft((o) => ({ ...o, operatingHours: e.target.value }))
                              }
                            >
                              <option value="">Select Operating hours</option>
                              <option value="Daytime only">Daytime only</option>
                              <option value="After-hours">After-Hours</option>
                              <option value="24/7 facilites service">24/7 facilites service</option>
                            </select>
                        </div>
                        <div className="kv">
                          <span className="k">Pricing Model</span>
                           <select
                              className="k"
                              name="opH"
                              id="opH"
                              value={draft?.pricingModel ?? selected?.pricingModel ?? ""}
                              onChange={(e) =>
                                setDraft((P) => ({ ...P, pricingModel: e.target.value }))
                              }
                            >
                              <option value="">Select Operating hours</option>
                              <option value="Per square foot pricing">Per square foot pricing</option>
                              <option value="Hourly rates">Hourly rates</option>
                              <option value="Flat monthly contract">Flat monthly contract</option>
                            </select>
                        </div>

                        <div className="kv">
                          <span className="k">Visits (over peirod)</span>
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
                            value={draft?.freqCount ?? selected?.freqCount ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, freqCount: Number(e.target.value) }))
                            }

                          />                        

                        </div>

                        <div className="kv">
                          <span className="k">Quality Expectations</span>
                           <select
                              className="k"
                              name="qe"
                              id="qe"
                              value={draft?.qualityExpectations ?? selected?.qualityExpectations ?? ""}
                              onChange={(e) =>
                                setDraft((q) => ({ ...q, qualityExpectations: e.target.value }))
                              }
                            >
                              <option value="">Select current Operating</option>
                              <option value="Well maintained">Well maintained</option>
                              <option value="Moderately Soiled">Moderately Soiled</option>
                              <option value="Overdue deep clean">Overdue deep clean</option>
                            </select>
                        </div>
                        
                        <div className="kv">
                          <span className="k">Current</span>
                        <select
                              className="kv"
                              name="cc"
                              id="cc"
                              value={draft?.currentCond ?? selected?.currentCond ?? ""}
                              onChange={(e) =>
                                setDraft((c) => ({ ...c, currentCond: e.target.value }))
                              }
                            >
                              <option value="">Select current problem</option>
                              <option value="Soil">soil</option>
                              <option value="Grease">Grease</option>
                              <option value="Dust">Dust</option>
                            </select>
                        </div>
                        


<div className="divider" />

                      </section>
<div className="divider" />

<section className="chips-block">
  {/* ---------- Shared Spaces ---------- */}
  <h4>Shared Spaces</h4>
  <div className="chips">
    {(selected.sharedSpaces || []).map((s, idx) => (
      <div className="chip" key={idx}>
        <span>{s}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setSelected(prev => ({
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

          setSelected(prev => ({
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
    {(selected.addOns || []).map((a, idx) => (
      <div className="chip" key={idx}>
        <span>{a}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setSelected(prev => ({
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
        <option value="No add-On">No add-On</option>
      </select>

      <button
        type="button"
        className="Addbutton"
        onClick={() => {
          const value = draft?.addOnToAdd;
          if (!value) return;

          setSelected(prev => ({
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
    {(selected.specialRequests || []).map((r, idx) => (
      <div className="chip" key={idx}>
        <span>{r}</span>
        <button
          className="button"
          type="button"
          onClick={() => {
            setSelected(prev => ({
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

          setSelected(prev => ({
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
                        <section className="billing-box">
  <h4>Billing & Cleaning Schedule</h4>

  <div className="kv-grid">

    {/* Type of Cleaning */}
    <div className="kv">
      <span className="k">Type of Cleaning</span>
      <select
        className="k"
        value={draft?.cleaningType ?? selected?.cleaningType ?? ""}
        onChange={(e) =>
          setDraft(d => ({ ...d, cleaningType: e.target.value }))
        }
      >
        <option value="">Select type</option>
        <option value="Recurring Cleaning">Recurring Cleaning</option>
        <option value="Deep Clean">Deep Clean</option>
        <option value="One-Time Cleaning">One-Time Cleaning</option>
       
      </select>
    </div>

    {/* Invoice Frequency */}
    <div className="kv">
      <span className="k">Invoice Frequency</span>
      <select
        className="k"
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
    </div>

    {/* Invoice Day */}
    <div className="kv">
      <span className="k">Invoice Day</span>
      <select
        className="k"
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
        <option value="Saturday">Saturday</option>
        <option value="Sunday">Sunday</option>
      </select>
    </div>

  </div>
</section>

            {/* IMPORTANT: keep tag nesting correct and close every <section> you open */}

            <div className="divider" />

            {/* 🔻 ACTION BUTTONS */}
            <div className="modal-footer">
              <button className="btn danger" onClick={deleteLead}>
                Delete Lead
              </button>

              <button
                className="btn primary"
                onClick={async () => {
                  try {
                    const payload = {
                        referralCode: selected.referralCode,

                    };

                    const res = await fetch(
                      `${API_URL}/leads/${selected.referralCode}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      }
                    );

                    if (!res.ok) throw new Error("Failed to save lead");

                    setSelected(payload);
                    setDraft(payload);
                    setViewInfo(false);

                    alert("Lead updated successfully");
                  } catch (err) {
                    alert(err.message);
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
