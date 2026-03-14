import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import { ApiError, apiGet } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import { EmptyState, InlineNotice, SkeletonRows } from "../../components/ui/PageStates";
import "./todo.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 30;

export default function Todo({ openLead }) {
  usePageMeta("Operations Board", "Upcoming invoices and recent lead activity.");
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const onLeadClick = (lead) => {
    if (typeof openLead === "function") {
      openLead(lead);
      return;
    }
    navigate("/dashboard");
  };

  const daysUntil = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / DAY_MS);
  };

  const normalizeFrequency = (f = "") => {
    const v = String(f).toLowerCase().trim();
    if (v === "daily") return "weekly";
    if (["weekly", "bi-weekly", "monthly", "one-time"].includes(v)) return v;
    return null;
  };

  const calculateNextDueDate = (startDate, frequency) => {
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return null;

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

    if (days === null) return "Unknown";
    if (days < 0) return "Past due";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;
    return new Date(dueDate).toLocaleDateString();
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoadError("");
        const json = await apiGet("/leads", { auth: true });
        setLeads(Array.isArray(json) ? json : []);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setLoadError(e.message || "Failed to load leads");
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [navigate]);

  const recentLeads = useMemo(
    () =>
      leads.filter((l) => {
        if (!l.submittedAt) return false;
        const age = (Date.now() - new Date(l.submittedAt).getTime()) / DAY_MS;
        return age <= 7;
      }),
    [leads]
  );

  const upcomingInvoices = useMemo(() => {
    const upcoming = [];

    leads.forEach((l) => {
      if (!l.submittedAt) return;

      const frequency = normalizeFrequency(l.invoiceFrequency || l.frequency || "");
      if (!frequency) return;

      const startDate = l.invoiceStartDate || l.submittedAt;
      const nextDue = calculateNextDueDate(startDate, frequency);
      if (!nextDue) return;

      const days = Math.ceil((nextDue.getTime() - Date.now()) / DAY_MS);
      if (days === null || days > MAX_DAYS_AHEAD) return;

      upcoming.push({
        ...l,
        frequency,
        nextDue,
      });
    });

    upcoming.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
    return upcoming;
  }, [leads]);

  const nextInvoice = upcomingInvoices[0] || null;

  const stats = useMemo(() => {
    let urgent = 0;
    let thisWeek = 0;

    upcomingInvoices.forEach((inv) => {
      const days = daysUntil(inv.nextDue);
      if (days === null) return;
      if (days <= 3) urgent += 1;
      if (days >= 0 && days <= 7) thisWeek += 1;
    });

    return {
      totalLeads: leads.length,
      newForms: recentLeads.length,
      invoices30d: upcomingInvoices.length,
      urgent,
      thisWeek,
    };
  }, [leads.length, recentLeads.length, upcomingInvoices]);

  return (
    <section className="dashboard-page todo-shell">
      <Header />

      <main className="todo-page">
        <section className="todo-hero">
          <div className="todo-hero-copy">
            <h1>Operations Desk</h1>
            <p>
              Monitor deadlines, review new quote activity, and keep invoicing clean and on schedule.
            </p>
          </div>

          <div className="todo-metrics">
            <article className="todo-metric-card">
              <span>Total Leads</span>
              <strong>{stats.totalLeads}</strong>
            </article>
            <article className="todo-metric-card">
              <span>New (7 days)</span>
              <strong>{stats.newForms}</strong>
            </article>
            <article className="todo-metric-card">
              <span>Invoices (30 days)</span>
              <strong>{stats.invoices30d}</strong>
            </article>
            <article className="todo-metric-card danger">
              <span>Urgent</span>
              <strong>{stats.urgent}</strong>
            </article>
          </div>
        </section>

        <div className="todo-grid">
          <section className="dashboard-list todo-card">
            <div className="todo-card-head">
              <h2 className="section-title">Next Invoice Priority</h2>
              <span className="todo-pill">Due this week: {stats.thisWeek}</span>
            </div>

            <div className="task-header">
              <span>Referral #</span>
              <span>Business Name</span>
              <span>Client Name</span>
              <span>Status</span>
              <span>Due</span>
            </div>

            <InlineNotice tone="error">{loadError}</InlineNotice>
            {loading && <SkeletonRows rows={4} columns={5} />}

            {nextInvoice ? (() => {
              const status = getInvoiceStatus(nextInvoice.nextDue);

              return (
                <div
                  className={`task-row invoice-row ${status.color}`}
                  onClick={() => onLeadClick(nextInvoice)}
                >
                  <span data-label="Referral #">{nextInvoice.id}</span>
                  <span data-label="Business Name">{nextInvoice.company || "-"}</span>
                  <span data-label="Client Name">{nextInvoice.name || "-"}</span>
                  <span data-label="Status" className="status-text">{status.label}</span>
                  <span data-label="Due">{getDueText(nextInvoice.nextDue)}</span>
                </div>
              );
            })() : (
              !loading && (
                <EmptyState
                  compact
                  title="No upcoming invoices"
                  description="There are no invoice deadlines in the next 30 days."
                />
              )
            )}
          </section>

          <section className="dashboard-list todo-card compact">
            <div className="todo-card-head">
              <h2 className="section-title">New Forms & Activity (Last 7 Days)</h2>
              <span className="todo-pill neutral">{recentLeads.length} records</span>
            </div>

            <div className="task-header">
              <span>Referral #</span>
              <span>Business</span>
              <span>Client</span>
            </div>

            {loading && <SkeletonRows rows={5} columns={3} />}

            {!loading &&
              recentLeads.slice(0, 12).map((l) => (
                <div
                  key={l.id}
                  className="task-row"
                  onClick={() => onLeadClick(l)}
                >
                  <span data-label="Referral #">{l.id}</span>
                  <span data-label="Business">{l.company || "-"}</span>
                  <span data-label="Client">{l.name || "-"}</span>
                </div>
              ))}

            {!loading && recentLeads.length === 0 && (
              <EmptyState
                compact
                title="No recent activity"
                description="No new form activity in the past 7 days."
              />
            )}
          </section>
        </div>
      </main>
    </section>
  );
}
