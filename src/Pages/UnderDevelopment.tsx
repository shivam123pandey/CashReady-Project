type UnderDevelopmentProps = { title: string };

export default function UnderDevelopment({ title }: UnderDevelopmentProps) {
  const isReports = title === "Reports";
  const isCombined = title === "Operations Center & Reports";

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
            <>
              <article><strong>Priority queue</strong><p>12 terminals need attention before the next operating window.</p><button type="button">View queue</button></article>
              <article><strong>Field activity</strong><p>Track cash runs, service visits, and ownership across the network.</p><button type="button">Track activity</button></article>
              <article><strong>Network alerts</strong><p>4 live alerts are ready for review by the operations team.</p><button type="button">Review alerts</button></article>
              <article><strong>Daily network summary</strong><p>Cash availability, withdrawals, and terminal uptime in one report.</p><button type="button">Open report</button></article>
              <article><strong>Cash movement report</strong><p>Compare replenishment activity with demand across locations.</p><button type="button">View report</button></article>
              <article><strong>Export center</strong><p>Prepare scheduled CSV and PDF exports for your banking team.</p><button type="button">Manage exports</button></article>
            </>
          ) : isReports ? (
            <>
              <article><strong>Daily network summary</strong><p>Cash availability, withdrawals, and terminal uptime in one report.</p><button type="button">Open report</button></article>
              <article><strong>Cash movement report</strong><p>Compare replenishment activity with demand across locations.</p><button type="button">View report</button></article>
              <article><strong>Export center</strong><p>Prepare scheduled CSV and PDF exports for your banking team.</p><button type="button">Manage exports</button></article>
            </>
          ) : (
            <>
              <article><strong>Priority queue</strong><p>12 terminals need attention before the next operating window.</p><button type="button">View queue</button></article>
              <article><strong>Field activity</strong><p>Track cash runs, service visits, and ownership across the network.</p><button type="button">Track activity</button></article>
              <article><strong>Network alerts</strong><p>4 live alerts are ready for review by the operations team.</p><button type="button">Review alerts</button></article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}