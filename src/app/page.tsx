import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="app-container">
      <Navbar />

      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        textAlign: "center", 
        padding: "3rem 1rem",
        gap: "1.5rem"
      }}>
        
        <span style={{ fontSize: "4rem" }}>⚡</span>
        
        <h1 style={{ 
          fontSize: "2.75rem", 
          fontWeight: 900, 
          background: "linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-secondary) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          maxWidth: "700px"
        }}>
          SplitSync: Relational Expense & Dynamic Membership Engine
        </h1>
        
        <p style={{ 
          fontSize: "1.1rem", 
          color: "var(--color-text-secondary)", 
          maxWidth: "600px",
          lineHeight: "1.6"
        }}>
          Solve messy spreadsheets, track precise balances, and manage changing flatmate memberships over time. Relational SQLite base.
        </p>

        {/* Feature grid mapping flatmate requests */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "1.25rem", 
          width: "100%", 
          maxWidth: "960px",
          marginTop: "2rem",
          marginBottom: "3rem"
        }}>
          
          <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>📥 Interactive CSV Staging</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              Detect 20+ spreadsheet errors. Preview cleaned dates, decimals, names, and conflicts before importing (Meera's Request).
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>⚖️ Zero-Magic Audit Trails</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              Trace every rupee back to source expenses. See exactly what makes up every member's balance (Rohan's Request).
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>📅 Dynamic Group Timeline</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              Restrict split eligibility to active dates. Sam doesn't pay for March rent, Meera doesn't pay for April groceries.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>💸 Custom Split Math</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              Supports Equal, Unequal, Percentage, and Share split types. Converts USD to INR at trip rates (Priya's Request).
            </p>
          </div>

        </div>

        {/* Call to Actions */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/import" className="btn btn-primary" style={{ padding: "12px 24px" }}>
            📥 Import expenses_export.csv
          </Link>
          <Link href="/balances" className="btn btn-secondary" style={{ padding: "12px 24px" }}>
            ⚖️ Check Group Balances
          </Link>
          <Link href="/expenses" className="btn btn-secondary" style={{ padding: "12px 24px" }}>
            💸 View logged Expenses
          </Link>
        </div>

      </div>
    </div>
  );
}
