import { useMemo, useState, useEffect } from "react";
import { API_URL } from "../../config";


import Header from "./header";

import "./invoice-calendar.css";

const DAY = 24 * 60 * 60 * 1000;

export default function InvoiceCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDate, setExpandedDate] = useState(null);
  const [appointments, setAppointments] = useState({});
  const [modal, setModal] = useState(null); // { key, index }
  const [loaded, setLoaded] = useState(false);


  const [draft, setDraft] = useState({
    owner: "",
    business: "",
    location: "",
    startTime: "",
    endTime: "",
    type: "",
    comment: "",
    repeat: "once", // ✅ schedule type
  });

  /* ================= TODAY ================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysFromToday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / DAY);
  };
useEffect(() => {
  fetch(`${API_URL}/appointments`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data === "object") {
        setAppointments(data);
      }
      setLoaded(true); // ✅ mark as ready
    })
    .catch(err => {
      console.error("Failed to load appointments", err);
      setLoaded(true); // still allow saving later
    });
}, []);

const saveAllAppointments = () => {
  fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appointments),
  })
    .then(() => {
      alert("Appointments saved successfully ✅");
    })
    .catch((err) => {
      console.error("Failed to save appointments", err);
      alert("Failed to save appointments ❌");
    });
};


const getRecurringDates = (startDate, repeat, monthsAhead = 3) => {
  const dates = [];
  const base = new Date(startDate);

  if (repeat === "once") return dates;

  if (repeat === "daily") {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
  }

  if (repeat === "weekly") {
    for (let i = 1; i <= 12; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * 7);
      dates.push(d);
    }
  }

  if (repeat === "biweekly") {
    for (let i = 1; i <= 6; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * 14);
      dates.push(d);
    }
  }

  if (repeat === "monthly") {
    for (let i = 1; i <= monthsAhead; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      dates.push(d);
    }
  }

  return dates;
};

  /* ================= STATUS ================= */
  const getStatusClass = (date, hasAppointments) => {
    if (!hasAppointments) return "";
    const diff = daysFromToday(date);

    if (diff === 0) return "today-appointment";
    if (diff >= 1 && diff <= 7) return "soon-appointment";
    return "future-appointment";
  };

  /* ================= CURRENT MONTH ================= */
  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  /* ================= DAYS ================= */
  const days = useMemo(() => {
    const arr = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      arr.push(new Date(year, month, i));
    }
    return arr;
  }, [currentMonth]);

  /* ================= ADD ================= */
  const addAppointment = (key) => {
  if (!draft.owner || !draft.business) return;

  const startDate = new Date(key);
  const repeatDates = getRecurringDates(startDate, draft.repeat);

  setAppointments((prev) => {
    const updated = { ...prev };

    // add original
    updated[key] = [...(updated[key] || []), { ...draft }];

    // add recurring
    repeatDates.forEach((date) => {
      const dateKey = date.toDateString();
      updated[dateKey] = [
        ...(updated[dateKey] || []),
        { ...draft },
      ];
    });

    return updated;
  });

  resetDraft();
  setExpandedDate(null);
};

  /* ================= SAVE EDIT ================= */
  const saveEdit = () => {
    const { key, index } = modal;

    setAppointments((prev) => {
      const list = [...prev[key]];
      list[index] = draft;
      return { ...prev, [key]: list };
    });

    resetDraft();
    setModal(null);
  };

  /* ================= DELETE ================= */
  const deleteAppointment = () => {
    const { key, index } = modal;

    setAppointments((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

    resetDraft();
    setModal(null);
  };

  const resetDraft = () =>
    setDraft({
      owner: "",
      business: "",
      location: "",
      startTime: "",
      endTime: "",
      type: "",
      comment: "",
      repeat: "once",
    });

  return (
    <section className="calendar-box">
      {/* HEADER */}
      <Header/>
      <div className="calendar-header">
        <button onClick={() => setMonthOffset((m) => m - 1)}>←</button>
        <h2>
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={() => setMonthOffset((m) => m + 1)}>→</button>
      </div>

      <div className="calendar-header-actions">
        <button className="save-btn" onClick={saveAllAppointments}>
            💾 Save Changes
        </button>

        <button className="today-btn" onClick={() => setMonthOffset(0)}>
            Today
        </button>
        </div>

      {/* WEEKDAYS */}
      <div className="calendar-weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* GRID */}
      <div className="calendar-grid">
        {days.map((day) => {
          const key = day.toDateString();
          const isPast = day < today;
          const items = appointments[key] || [];
          const expanded = expandedDate === key;

          return (
            <div
              key={key}
              className={`calendar-cell
                ${isPast ? "past" : ""}
                ${getStatusClass(day, items.length > 0)}
              `}
            >
              <div
                className={`calendar-date ${!isPast ? "clickable" : ""}`}
                onClick={() => !isPast && setExpandedDate(expanded ? null : key)}
              >
                {day.getDate()}
              </div>

              {items.map((a, i) => (
                <div
                  key={i}
                  className="calendar-entry clickable"
                  onClick={() => {
                    setDraft(a);
                    setModal({ key, index: i });
                  }}
                >
                  <div>
                    <strong>{a.business}</strong>
                    {a.repeat !== "once" && (
                      <span className="repeat-tag">{a.repeat}</span>
                    )}
                    <div className="sub">
                      {a.startTime}–{a.endTime}
                    </div>
                  </div>
                </div>
              ))}

              {expanded && (
                <div className="calendar-expand">
                  <input
                    placeholder="Owner"
                    value={draft.owner}
                    onChange={(e) =>
                      setDraft({ ...draft, owner: e.target.value })
                    }
                  />
                  <input
                    placeholder="Business"
                    value={draft.business}
                    onChange={(e) =>
                      setDraft({ ...draft, business: e.target.value })
                    }
                  />

                  <div className="time-row">
                    <input
                      type="time"
                      value={draft.startTime}
                      onChange={(e) =>
                        setDraft({ ...draft, startTime: e.target.value })
                      }
                    />
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(e) =>
                        setDraft({ ...draft, endTime: e.target.value })
                      }
                    />
                  </div>

                  {/* 🔁 REPEAT */}
                  <select
                    value={draft.repeat}
                    onChange={(e) =>
                      setDraft({ ...draft, repeat: e.target.value })
                    }
                  >
                    <option value="once">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>

                  <textarea
                    placeholder="Comments / Notes"
                    value={draft.comment}
                    onChange={(e) =>
                      setDraft({ ...draft, comment: e.target.value })
                    }
                  />

                  <button
                    className="calendar-btn"
                    onClick={() => addAppointment(key)}
                  >
                    Add Appointment
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Appointment</h3>

            <input
              placeholder="Owner"
              value={draft.owner}
              onChange={(e) =>
                setDraft({ ...draft, owner: e.target.value })
              }
            />

            <input
              placeholder="Business"
              value={draft.business}
              onChange={(e) =>
                setDraft({ ...draft, business: e.target.value })
              }
            />

            <div className="time-row">
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) =>
                  setDraft({ ...draft, startTime: e.target.value })
                }
              />
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) =>
                  setDraft({ ...draft, endTime: e.target.value })
                }
              />
            </div>

            {/* 🔁 REPEAT */}
            <select
              value={draft.repeat}
              onChange={(e) =>
                setDraft({ ...draft, repeat: e.target.value })
              }
            >
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <textarea
              placeholder="Comments / Notes"
              value={draft.comment}
              onChange={(e) =>
                setDraft({ ...draft, comment: e.target.value })
              }
            />

            <button className="primary-btn" onClick={saveEdit}>
              Save Changes
            </button>
            <button className="danger-btn" onClick={deleteAppointment}>
              Delete Appointment
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
