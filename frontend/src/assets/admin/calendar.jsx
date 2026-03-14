import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import { ApiError, apiGet, apiPost } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import { EmptyState, InlineNotice } from "../../components/ui/PageStates";
import PageHeader from "../../components/ui/PageHeader";
import "./invoice-calendar.css";

const DAY = 24 * 60 * 60 * 1000;

export default function InvoiceCalendar() {
  usePageMeta("Invoice Calendar", "Track cleaning visits and invoice schedule.");
  const navigate = useNavigate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDate, setExpandedDate] = useState(null);
  const [appointments, setAppointments] = useState({});
  const [modal, setModal] = useState(null); // { key, index }
  const [saveNotice, setSaveNotice] = useState("");
  const [saveTone, setSaveTone] = useState("info");

  const [draft, setDraft] = useState({
    owner: "",
    business: "",
    location: "",
    startTime: "",
    endTime: "",
    type: "",
    comment: "",
    repeat: "once",
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const daysFromToday = useCallback((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / DAY);
  }, [today]);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      try {
        const data = await apiGet("/appointments", { auth: true });
        if (!cancelled && data && typeof data === "object") {
          setAppointments(data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
            return;
          }
          setSaveTone("error");
          setSaveNotice(err.message || "Failed to load appointments.");
        }
      }
    }

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const saveAllAppointments = async () => {
    setSaveNotice("");
    setSaveTone("info");
    try {
      await apiPost("/appointments", appointments, { auth: true });
      setSaveTone("success");
      setSaveNotice("Appointments saved successfully.");
    } catch (err) {
      console.error("Failed to save appointments", err);
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setSaveTone("error");
      setSaveNotice(err.message || "Failed to save appointments.");
    }
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

  const getStatusClass = (date, hasAppointments) => {
    if (!hasAppointments) return "";
    const diff = daysFromToday(date);

    if (diff === 0) return "today-appointment";
    if (diff >= 1 && diff <= 7) return "soon-appointment";
    return "future-appointment";
  };

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

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

  const monthSummary = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let total = 0;
    let daysWithEvents = 0;

    Object.entries(appointments).forEach(([key, items]) => {
      const d = new Date(key);
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const list = Array.isArray(items) ? items : [];
      if (list.length > 0) {
        total += list.length;
        daysWithEvents += 1;
      }
    });

    return { total, daysWithEvents };
  }, [appointments, currentMonth]);

  const statusSummary = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;

    Object.entries(appointments).forEach(([key, items]) => {
      const d = new Date(key);
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const list = Array.isArray(items) ? items : [];
      if (list.length === 0) return;
      const diff = daysFromToday(d);
      if (diff === 0) todayCount += list.length;
      else if (diff > 0) upcomingCount += list.length;
      else overdueCount += list.length;
    });

    return { todayCount, upcomingCount, overdueCount };
  }, [appointments, currentMonth, daysFromToday]);

  const calendarSlots = useMemo(() => {
    const startOffset = (currentMonth.getDay() + 6) % 7; // Monday-first
    const padded = [...Array(startOffset).fill(null), ...days];
    const fullGridCount = Math.ceil(padded.length / 7) * 7;
    return [...padded, ...Array(fullGridCount - padded.length).fill(null)];
  }, [currentMonth, days]);

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

  const addAppointment = (key) => {
    if (!draft.owner || !draft.business) return;

    const startDate = new Date(key);
    const repeatDates = getRecurringDates(startDate, draft.repeat);

    setAppointments((prev) => {
      const updated = { ...prev };
      updated[key] = [...(updated[key] || []), { ...draft }];

      repeatDates.forEach((date) => {
        const dateKey = date.toDateString();
        updated[dateKey] = [...(updated[dateKey] || []), { ...draft }];
      });

      return updated;
    });

    resetDraft();
    setExpandedDate(null);
  };

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

  const deleteAppointment = () => {
    const { key, index } = modal;

    setAppointments((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

    resetDraft();
    setModal(null);
  };

  return (
    <section className="calendar-box">
      <Header />
      <PageHeader
        title="Invoice Calendar"
        subtitle="Track cleaning visits and billing events generated from invoices."
      />
      <div className="calendar-header">
        <button onClick={() => setMonthOffset((m) => m - 1)}>&lt;</button>
        <h2>
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={() => setMonthOffset((m) => m + 1)}>&gt;</button>
      </div>

      <div className="calendar-header-actions">
        <button className="save-btn" onClick={saveAllAppointments}>Save Changes</button>
        <button className="today-btn" onClick={() => setMonthOffset(0)}>Today</button>
      </div>
      <InlineNotice tone={saveTone}>{saveNotice}</InlineNotice>

      <div className="calendar-summary">
        <span>{monthSummary.total} appointments this month</span>
        <span>{monthSummary.daysWithEvents} active days</span>
      </div>
      <div className="calendar-summary status">
        <span className="summary-chip today">Today: {statusSummary.todayCount}</span>
        <span className="summary-chip upcoming">Upcoming: {statusSummary.upcomingCount}</span>
        <span className="summary-chip overdue">Overdue: {statusSummary.overdueCount}</span>
      </div>
      <div className="calendar-legend">
        <span><i className="dot today" /> Today</span>
        <span><i className="dot soon" /> Upcoming (next 7 days)</span>
        <span><i className="dot future" /> Future</span>
      </div>

      <p className="calendar-scroll-hint">Tip: on small screens, calendar switches to compact agenda cards for easier reading.</p>
      {monthSummary.total === 0 && (
        <EmptyState
          compact
          title="No appointments in this month"
          description="Create a manual appointment or send an invoice to auto-generate schedule entries."
        />
      )}
      <div className="calendar-scroller">
        <div className="calendar-sheet">
          <div className="calendar-weekdays">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarSlots.map((day, slotIndex) => {
              if (!day) {
                return <div key={`empty-${slotIndex}`} className="calendar-cell empty" aria-hidden="true" />;
              }

              const key = day.toDateString();
              const isPast = day < today;
              const items = appointments[key] || [];
              const expanded = expandedDate === key;

              return (
                <div
                  key={key}
                  className={`calendar-cell ${isPast ? "past" : ""} ${getStatusClass(day, items.length > 0)}`}
                >
                  <div className="calendar-day-label">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`calendar-date ${!isPast ? "clickable" : ""}`}
                    onClick={() => {
                      if (isPast) return;
                      const nextExpanded = expanded ? null : key;
                      setExpandedDate(nextExpanded);
                      if (nextExpanded) resetDraft();
                    }}
                  >
                    {day.getDate()}
                  </div>
                  {!isPast && !expanded && (
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => {
                        setExpandedDate(key);
                        resetDraft();
                      }}
                    >
                      + Add
                    </button>
                  )}

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
                        {a.repeat !== "once" && <span className="repeat-tag">{a.repeat}</span>}
                        <div className="sub">{a.type || "Appointment"}</div>
                        {(a.startTime || a.endTime) && <div className="sub">{a.startTime} - {a.endTime}</div>}
                      </div>
                    </div>
                  ))}

                  {expanded && (
                    <div className="calendar-expand">
                      <input
                        placeholder="Owner"
                        value={draft.owner}
                        onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                      />
                      <input
                        placeholder="Business"
                        value={draft.business}
                        onChange={(e) => setDraft({ ...draft, business: e.target.value })}
                      />

                      <div className="time-row">
                        <input
                          type="time"
                          value={draft.startTime}
                          onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                        />
                        <input
                          type="time"
                          value={draft.endTime}
                          onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                        />
                      </div>

                      <select
                        value={draft.repeat}
                        onChange={(e) => setDraft({ ...draft, repeat: e.target.value })}
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
                        onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
                      />

                      <button className="calendar-btn" onClick={() => addAppointment(key)}>
                        Add Appointment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Appointment</h3>

            <input
              placeholder="Owner"
              value={draft.owner}
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
            />

            <input
              placeholder="Business"
              value={draft.business}
              onChange={(e) => setDraft({ ...draft, business: e.target.value })}
            />

            <div className="time-row">
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
              />
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
              />
            </div>

            <select
              value={draft.repeat}
              onChange={(e) => setDraft({ ...draft, repeat: e.target.value })}
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
              onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
            />

            <button className="primary-btn" onClick={saveEdit}>Save Changes</button>
            <button className="danger-btn" onClick={deleteAppointment}>Delete Appointment</button>
          </div>
        </div>
      )}
    </section>
  );
}
