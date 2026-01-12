import { useEffect, useState } from "react";
import Header from "./header";
import "./todo.css";

export default function Todo({ openLead }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextInvoice, setNextInvoice] = useState(null);
  const MAX_DAYS_AHEAD = 30;

  const DAY = 24 * 60 * 60 * 1000;

  const daysUntil = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return null;
    return Math.ceil((d.getTime() - Date.now()) / DAY);
  };

  /* ================= HELPERS ================= */

  const normalizeFrequency = (f = "") => {
    const v = f.toLowerCase().trim();
    if (v === "daily") return "weekly";
    if (["weekly", "bi-weekly", "monthly", "one-time"].includes(v)) return v;
    return null;
  };

  const calculateNextDueDate = (startDate, frequency) => {
    const d = new Date(startDate);
    if (isNaN(d)) return null;

    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "bi-weekly":
        d.setDate(d.getDate() + 14);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      case "one-time":
        break;
      default:
        return null;
    }
    return d;
  };

  const getInvoiceStatus = (dueDate) => {
    const days = daysUntil(dueDate);

    if (days === null) return { label: "UNKNOWN", color: "gray" };
    if (days < 0) return { label: "OVERDUE", color: "danger" };
    if (days <= 3) return { label: "URGENT", color: "danger" };
    if (days <= 7) return { label: "SOON", color: "warning" };
    return { label: "SCHEDULED", color: "success" };
  };

  const getDueText = (dueDate) => {
    const days = daysUntil(dueDate);

    if (days < 0) return "Past due";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;
    return new Date(dueDate).toLocaleDateString();
  };

  /* ================= FETCH LEADS ================= */

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${API_URL}/leads`);
        const json = await res.json();
        setLeads(json || []);
      } catch (e) {
        console.error("Failed to load leads", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  /* ================= NEXT INVOICE ================= */

  useEffect(() => {
    if (!leads.length) return;

    const upcoming = [];

    leads.forEach((l) => {
      if (!l.submittedAt) return;

      const frequency = normalizeFrequency(l.invoiceFrequency || l.frequency || "");
      if (!frequency) return;

      const startDate = l.invoiceStartDate || l.submittedAt;
      const nextDue = calculateNextDueDate(startDate, frequency);
      if (!nextDue) return;

      const days = daysUntil(nextDue);

      // ✅ ONLY NEXT 30 DAYS
      if (days === null || days > MAX_DAYS_AHEAD) return;

      upcoming.push({
        ...l,
        frequency,
        nextDue,
      });
    });

    upcoming.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
    setNextInvoice(upcoming[0] || null);
  }, [leads]);

  /* ================= LAST 7 DAYS ================= */

  const recentLeads = leads.filter((l) => {
    if (!l.submittedAt) return false;
    const age = (Date.now() - new Date(l.submittedAt)) / DAY;
    return age <= 7;
  });

  /* ================= RENDER ================= */

return (
  <section className="dashboard-page todo-shell">
    <Header />

    <main className="todo-page">
      {/* ========= NEXT INVOICE ========= */}
      <section className="dashboard-list">
        <h2 className="section-title">Next Invoice</h2>

        <div className="task-header">
          <span>Referral #</span>
          <span>Business Name</span>
          <span>Client Name</span>
          <span>Status</span>
          <span>Due</span>
        </div>

        {nextInvoice ? (() => {
          const status = getInvoiceStatus(nextInvoice.nextDue);

          return (
            <div
              className={`task-row invoice-row ${status.color}`}
              onClick={() => openLead?.(nextInvoice)}
            >
              <span>{nextInvoice.id}</span>
              <span>{nextInvoice.company || "—"}</span>
              <span>{nextInvoice.name || "—"}</span>
              <span className="status-text">{status.label}</span>
              <span>{getDueText(nextInvoice.nextDue)}</span>
            </div>
          );
        })() : (
          <p className="ui-state">No upcoming invoices 🎉</p>
        )}
      </section>

      {/* ========= LAST 7 DAYS ========= */}
      <section className="dashboard-list compact">
        <h2 className="section-title">New Forms & Activity (Last 7 Days)</h2>

        <div className="task-header">
          <span>Referral #</span>
          <span>Business</span>
          <span>Client</span>
        </div>

        {loading && <p className="ui-state">Loading…</p>}

        {!loading &&
          recentLeads.map((l) => (
            <div
              key={l.id}
              className="task-row"
              onClick={() => openLead?.(l)}
            >
              <span>{l.id}</span>
              <span>{l.company || "—"}</span>
              <span>{l.name || "—"}</span>
            </div>
          ))}

        {!loading && recentLeads.length === 0 && (
          <p className="ui-state">No activity in the last 7 days</p>
        )}
      </section>
    </main>
  </section>
);

}
