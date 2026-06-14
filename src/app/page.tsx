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
        padding: "3rem 0",
        gap: "1.25rem"
      }}>
        {/* Top Feature Tag */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          padding: "6px 12px",
          borderRadius: "99px",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--color-primary-hover)",
          marginBottom: "0.5rem"
        }}>
          💡 Evaluation Sandbox Ready
        </div>
        
        <h1 style={{ 
          fontSize: "2.75rem", 
          fontWeight: 900, 
          letterSpacing: "-0.035em",
          lineHeight: "1.2",
          background: "linear-gradient(to right, #ffffff, #9ca3af)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          SplitSync Flatmate Expenses
        </h1>
        
        <p style={{ 
          fontSize: "0.95rem", 
          color: "var(--text-secondary)", 
          maxWidth: "600px",
          marginBottom: "2rem",
          lineHeight: "1.6"
        }}>
          Clean up messy CSV spreadsheets, track room rent and household bills, and manage flatmates joining or leaving the group over time. Verify audit logs instantly with zero magic numbers.
        </p>

        {/* Structured Dashboard Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "1.5rem", 
          width: "100%", 
          maxWidth: "960px",
          marginBottom: "2.5rem"
        }}>
          
          <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem"
            }}>
              📥
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>CSV Import Staging</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Upload raw spreadsheets. The engine identifies duplicates, cleans dirty numbers, converts foreign currencies, and stages rows for interactive manual approval.
            </p>
          </div>

          <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem"
            }}>
              ⚖️
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Balance Audit Trails</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Provides detailed ledger audit trails showing exactly which shared bills make up every member's balance. Full transparency with zero magic numbers.
            </p>
          </div>

          <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem"
            }}>
              📅
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Dynamic Timelines</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Restricts bill eligibility to active flatmate membership periods. Members only pay for expenses logged while they actually lived in the household.
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/import" className="btn btn-primary" style={{ padding: "0.7rem 1.4rem", fontSize: "0.9rem" }}>
            📥 Import Spreadsheet CSV
          </Link>
          <Link href="/balances" className="btn btn-secondary" style={{ padding: "0.7rem 1.4rem", fontSize: "0.9rem" }}>
            ⚖️ Check Room Balances
          </Link>
          <Link href="/expenses" className="btn btn-secondary" style={{ padding: "0.7rem 1.4rem", fontSize: "0.9rem" }}>
            💸 View Logged Expenses
          </Link>
        </div>

      </div>
    </div>
  );
}
