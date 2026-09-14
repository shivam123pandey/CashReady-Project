import { useNavigate } from "react-router-dom";

type UnderDevelopmentProps = { title: string; pageKey?: string };

type DetailPage = {
  heading: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  summary: string;
  primaryAction: string;
  primaryRoute: string;
};

const detailPages: Record<string, DetailPage> = {
  "priority-queue": {
    heading: "Priority queue",
    subtitle: "12 terminals need attention before the next operating window.",
    metrics: [
      { label: "Critical", value: "4", detail: "ATMs need cash replenishment" },
      { label: "Field teams", value: "8", detail: "Assigned for same-day service" },
      { label: "Resolution time", value: "2.4h", detail: "Average completion target" },
    ],
    summary: "CashReady flagged high-risk terminals based on low stock, service errors, and unusually high withdrawal demand.",
    primaryAction: "Back to operations center",
    primaryRoute: "/operations-reports",
  },
  "field-activity": {
    heading: "Field activity",
    subtitle: "Track cash runs, service visits, and ownership across the network.",
    metrics: [
      { label: "Active runs", value: "17", detail: "Cash and service assignments" },
      { label: "On-site visits", value: "9", detail: "Completed in the last 12 hours" },
      { label: "Ownership updates", value: "3", detail: "Pending confirmation" },
    ],
    summary: "Field teams are coordinating auditor checks, cash transfers, and branch ownership updates across the network.",
    primaryAction: "Return to workspace",
    primaryRoute: "/operations-reports",
  },
  "network-alerts": {
    heading: "Network alerts",
    subtitle: "4 live alerts are ready for review by the operations team.",
    metrics: [
      { label: "Open alerts", value: "4", detail: "Across terminals and branches" },
      { label: "Escalated", value: "2", detail: "Requires executive review" },
      { label: "Resolved today", value: "11", detail: "Events cleared in the last 24h" },
    ],
    summary: "Live alert monitoring is identifying connectivity drops, cash shortages, and maintenance exceptions across the ATM network.",
    primaryAction: "View operations overview",
    primaryRoute: "/operations-reports",
  },
  "daily-network-summary": {
    heading: "Daily network summary",
    subtitle: "Cash availability, withdrawals, and terminal uptime in one report.",
    metrics: [
      { label: "Cash availability", value: "94%", detail: "Across monitored terminals" },
      { label: "Withdrawals", value: "₹12.4M", detail: "24-hour demand estimate" },
      { label: "Uptime", value: "99.3%", detail: "Network availability" },
    ],
    summary: "Network health remained stable with strong cash coverage and minimal downtime, supporting normal withdrawal activity throughout the day.",
    primaryAction: "Open report center",
    primaryRoute: "/reports",
  },
  "cash-movement-report": {
    heading: "Cash movement report",
    subtitle: "Compare replenishment activity with demand across locations.",
    metrics: [
      { label: "Cash in", value: "₹18.6M", detail: "This week’s replenishment" },
      { label: "Cash out", value: "₹16.2M", detail: "Withdrawals and service demand" },
      { label: "Variance", value: "+12%", detail: "Above expectation" },
    ],
    summary: "Movement trends show strong demand in urban locations while peripheral branches remain within expected cash levels.",
    primaryAction: "Back to reports",
    primaryRoute: "/reports",
  },
  "export-center": {
    heading: "Export center",
    subtitle: "Prepare scheduled CSV and PDF exports for your banking team.",
    metrics: [
      { label: "Scheduled jobs", value: "6", detail: "Reports queued for delivery" },
      { label: "Formats", value: "CSV + PDF", detail: "Ready for distribution" },
      { label: "Last export", value: "08:45", detail: "Operations snapshot" },
    ],
    summary: "Export jobs are ready for branch managers, network teams, and executive reporting across the banking operational cycle.",
    primaryAction: "Return to reports",
    primaryRoute: "/reports",
  },
};

export default function UnderDevelopment({ title, pageKey }: UnderDevelopmentProps) {
  const navigate = useNavigate();
  const isReports = title === "Reports";
  const isCombined = title === "Operations Center & Reports";
  const detail = pageKey ? detailPages[pageKey] : undefined;

  if (detail) {
    return (
      <main className="development-page reports-page">
        <h1>{detail.heading}</h1>
        <p className="page-subtitle">{detail.subtitle}</p>

        <section className="development-workspace">
          <div className="development-status"><span />{detail.heading} overview</div>
          <div className="development-grid">
            {detail.metrics.map((metric) => (
              <article key={metric.label}>
                <strong>{metric.label}</strong>
                <p>{metric.detail}</p>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f766e" }}>{metric.value}</div>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", maxWidth: 520 }}>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>{detail.summary}</p>
            <button type="button" onClick={() => navigate(detail.primaryRoute)}>{detail.primaryAction}</button>
          </div>
        </section>
      </main>
    );
  }

  const combinedItems = [
    { title: "Priority queue", description: "12 terminals need attention before the next operating window.", action: "View queue", route: "/priority-queue" },
    { title: "Field activity", description: "Track cash runs, service visits, and ownership across the network.", action: "Track activity", route: "/field-activity" },
    { title: "Network alerts", description: "4 live alerts are ready for review by the operations team.", action: "Review alerts", route: "/network-alerts" },
    { title: "Daily network summary", description: "Cash availability, withdrawals, and terminal uptime in one report.", action: "Open report", route: "/daily-network-summary" },
    { title: "Cash movement report", description: "Compare replenishment activity with demand across locations.", action: "View report", route: "/cash-movement-report" },
    { title: "Export center", description: "Prepare scheduled CSV and PDF exports for your banking team.", action: "Manage exports", route: "/export-center" },
  ];

  const reportItems = combinedItems.slice(3);
  const operationsItems = combinedItems.slice(0, 3);

  return (
    <main className={`development-page ${isReports || isCombined ? "reports-page" : "operations-page"}`}>
      <h1>{title}</h1>
      <p className="page-subtitle">
        {isCombined
          ? "Coordinate ATM operations and turn network activity into clear banking reports."
          : isReports
          ? "Review network performance and prepare decision-ready banking reports."
          : "Coordinate replenishment, alerts, and field work across the ATM network."}
      </p>
      <section className="development-workspace">
        <div className="development-status"><span />{isCombined ? "Operations and reporting workspace" : isReports ? "Reporting workspace" : "Operations live"}</div>
        <div className="development-grid">
          {isCombined ? (
            combinedItems.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <button type="button" onClick={() => navigate(item.route)}>{item.action}</button>
              </article>
            ))
          ) : isReports ? (
            reportItems.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <button type="button" onClick={() => navigate(item.route)}>{item.action}</button>
              </article>
            ))
          ) : (
            operationsItems.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <button type="button" onClick={() => navigate(item.route)}>{item.action}</button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}