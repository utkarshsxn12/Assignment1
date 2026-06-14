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
        padding: "2rem 0",
        gap: "1rem"
      }}>
        
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          SplitSync Flatmate Expenses
        </h1>
        
        <p style={{ 
          fontSize: "0.95rem", 
          color: "var(--text-secondary)", 
          maxWidth: "550px",
          marginBottom: "1.5rem"
        }}>
          Clean up messy CSV spreadsheets, track room rent and household bills, and manage flatmates joining or leaving the group over time.
        </p>

        {/* Structured Dashboard Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "1rem", 
          width: "100%", 
          maxWidth: "900px",
          marginBottom: "2rem"
        }}>
          
          <div className="glass-card" style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.375rem" }}>📥 CSV Import Staging</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Upload `expenses_export.csv`. Identifies duplicates, parses irregular dates, converts foreign currency, and stages data for approval.
            </p>
          </div>

          <div className="glass-card" style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.375rem" }}>⚖️ Balance Audit Trails</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Detailed receipts showing exactly which shared bills make up every member's balance. Zero magic numbers.
            </p>
          </div>

          <div className="glass-card" style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.375rem" }}>📅 Dynamic Timeline</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Restricts split calculations to active membership windows. Members only pay for expenses logged while they lived in the flat.
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/import" className="btn btn-primary">
            📥 Import Spreadsheet CSV
          </Link>
          <Link href="/balances" className="btn btn-secondary">
            ⚖️ Check Room Balances
          </Link>
          <Link href="/expenses" className="btn btn-secondary">
            💸 View Logged Expenses
          </Link>
        </div>

      </div>
    </div>
  );
}
