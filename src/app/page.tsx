import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="app-container">
      <Navbar />

      {/* Hero Section Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
        gap: "3rem", 
        alignItems: "center",
        padding: "2rem 0 4rem",
        width: "100%"
      }}>
        
        {/* Left Column: Heading & CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "left" }}>
          
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            padding: "6px 14px",
            borderRadius: "99px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--color-primary-hover)",
            width: "fit-content"
          }}>
            ⚡ Roommate Expenses & Audits
          </div>
          
          <h1 style={{ 
            fontSize: "3rem", 
            fontWeight: 900, 
            letterSpacing: "-0.04em",
            lineHeight: "1.15",
            background: "linear-gradient(to right, #ffffff, #9ca3af)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            sharedExpense
          </h1>
          
          <p style={{ 
            fontSize: "1rem", 
            color: "var(--text-secondary)", 
            lineHeight: "1.65"
          }}>
            Clean up messy CSV spreadsheets, track room rent and household utility bills, and manage flatmates joining or leaving the group over time. Trace ledger audit trails instantly with zero magic numbers.
          </p>

          {/* Action CTA Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <Link href="/import" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}>
              📥 Ingest Spreadsheet
            </Link>
            <Link href="/balances" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}>
              ⚖️ Check Balances
            </Link>
          </div>
        </div>

        {/* Right Column: Beautiful Generated Illustration */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          {/* Subtle warm glow behind illustration */}
          <div style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            filter: "blur(20px)",
            zIndex: 0
          }} />
          
          <img 
            src="/home_hero.png" 
            alt="Roommate calculations" 
            style={{
              width: "100%",
              maxWidth: "460px",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              zIndex: 1,
              position: "relative"
            }} 
          />
        </div>

      </div>

      {/* Feature Breakdown Section */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "2rem", textAlign: "center", letterSpacing: "-0.02em" }}>
          Key Features & Sandboxes
        </h2>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "1.5rem", 
          width: "100%"
        }}>
          
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Interactive CSV Importer</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Upload raw spreadsheets. The engine identifies duplicates, cleans dirty numbers, converts foreign currencies, and stages rows for interactive manual approval.
            </p>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(14, 165, 233, 0.08)",
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

          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
      </div>
    </div>
  );
}
