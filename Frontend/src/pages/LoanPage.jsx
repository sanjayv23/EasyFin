import "./LoanPage.css";

const loans = [
  {
    id: 1,
    name: "car loan",
    type: "Car Loan",
    outstanding: "\u20B95,00,000",
    rate: "7.0%",
  },
];

export function LoanPage() {
  const total = 50000;

  return (
    <main className="loan-page">
      <section className="loan-shell">
        <header className="loan-header">
          <div>
            <h1 className="loan-title">Liabilities</h1>
            <p className="loan-subtitle">Track your debts</p>
          </div>

          <button className="add-liability-button" type="button">
            <span className="add-liability-plus">+</span>
            Add Liability
          </button>
        </header>

        

        <section className="loan-summary-card">
          <span className="loan-summary-label">TOTAL LIABILITIES</span>
          <span className="loan-summary-value">{total}</span>
        </section>

        <section className="loan-table-card">
          <div className="loan-table-header">
            <span>NAME</span>
            <span>TYPE</span>
            <span className="loan-header-sort">
              OUTSTANDING
              <span className="loan-sort-arrow">&darr;</span>
            </span>
            <span>RATE</span>
            <span className="loan-actions-column" aria-hidden="true"></span>
          </div>

          {loans.map((loan) => (
            <div className="loan-table-row" key={loan.id}>
              <div className="loan-cell loan-cell-name">
                <span className="loan-mobile-label">Name</span>
                <span className="loan-name">{loan.name}</span>
              </div>
              <div className="loan-cell loan-cell-type">
                <span className="loan-mobile-label">Type</span>
                <span className="loan-type-pill">{loan.type}</span>
              </div>
              <div className="loan-cell loan-cell-outstanding">
                <span className="loan-mobile-label">Outstanding</span>
                <span className="loan-outstanding">{loan.outstanding}</span>
              </div>
              <div className="loan-cell loan-cell-rate">
                <span className="loan-mobile-label">Rate</span>
                <span className="loan-rate">{loan.rate}</span>
              </div>

              <div className="loan-row-actions">
                <button className="icon-button" type="button" aria-label="Edit loan">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                    <path d="M13 7l4 4" />
                  </svg>
                </button>

                <button
                  className="icon-button icon-button-delete"
                  type="button"
                  aria-label="Delete loan"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16" />
                    <path d="M9 7V4h6v3" />
                    <path d="M7 7v13h10V7" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <footer className="loan-table-footer">1/1 liabilities</footer>
        </section>
      </section>
    </main>
  );
}
