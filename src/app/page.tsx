"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    setCurrentUser(localStorage.getItem("current_user") || "");
    const handleLoginChange = () => {
      setCurrentUser(localStorage.getItem("current_user") || "");
    };
    window.addEventListener("user-login-change", handleLoginChange);
    return () => {
      window.removeEventListener("user-login-change", handleLoginChange);
    };
  }, []);

  const handleLogin = (name: string, redirectTo: string) => {
    localStorage.setItem("current_user", name);
    window.dispatchEvent(new Event("user-login-change"));
    router.push(redirectTo);
  };

  const personas = [
    {
      name: "Meera",
      role: "CSV Importer",
      assignmentQuery: "Meera: 'Clean up duplicates — but I want to approve changes.'",
      guideline: "Perform CSV import of `expenses_export.csv`. Resolve, inspect, and approve 20 detected data anomalies, and check duplicate skip proposals before writing to DB.",
      redirectTo: "/import",
      icon: "📥",
      badgeColor: "var(--color-primary)",
    },
    {
      name: "Aisha",
      role: "Settlement Manager",
      assignmentQuery: "Aisha: 'I just want one number per person. Who pays whom, how much.'",
      guideline: "Check room settlement balances. Verify that Splitwise-style debt simplification has reduced transactions to the minimum path.",
      redirectTo: "/balances",
      icon: "🤝",
      badgeColor: "var(--color-secondary)",
    },
    {
      name: "Rohan",
      role: "Auditor",
      assignmentQuery: "Rohan: 'No magic numbers. I want to see exactly which expenses make that up.'",
      guideline: "Inspect the detailed Balance Audit Trail for Rohan. Confirm that every single rupee he paid or owes matches back to a real transaction (zero magic numbers).",
      redirectTo: "/balances",
      icon: "🔍",
      badgeColor: "#10b981",
    },
    {
      name: "Priya",
      role: "Trip Auditor",
      assignmentQuery: "Priya: 'Half the trip was in dollars. The sheet pretends 1 USD = 1 INR.'",
      guideline: "Verify USD currency conversions. Inspect Priya's audit log to confirm foreign expenses (Goa Villa Booking) are parsed and converted at 83.0 INR.",
      redirectTo: "/balances",
      icon: "💵",
      badgeColor: "#f59e0b",
    },
    {
      name: "Sam",
      role: "Dynamic Member",
      assignmentQuery: "Sam: 'I moved in mid-April. Why would March electricity affect my balance?'",
      guideline: "Verify Sam's ledger. Confirm that rent and bills logged in March (before his join date) do not affect his balance or calculations.",
      redirectTo: "/balances",
      icon: "📅",
      badgeColor: "#8b5cf6",
    },
    {
      name: "Dev",
      role: "Trip Guest Host",
      assignmentQuery: "Dev: 'Trip participant. Dev's friend Kabir joined trip split.'",
      guideline: "Verify Dev's guest rules. Ensure Kabir's (external friend) split shares are mapped as a direct debt under Dev (who hosted him).",
      redirectTo: "/balances",
      icon: "👤",
      badgeColor: "#ec4899",
    },
  ];

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
            background: "linear-gradient(to right, var(--text-primary), #475569)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            SplitSync
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

      {/* Flatmate Persona Logins Gateway Section */}
      <div style={{ marginTop: "2rem", marginBottom: "4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            Select Flatmate Persona to Begin
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "6px" }}>
            Each persona is configured to inspect, resolve, and audit a specific problem as requested in the assignment guidelines.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem"
        }}>
          {personas.map((p) => {
            const isActive = currentUser === p.name;
            return (
              <div 
                key={p.name}
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  cursor: "pointer",
                  position: "relative",
                  border: isActive ? `2px solid ${p.badgeColor}` : "1px solid var(--border-color)",
                  boxShadow: isActive ? `0 8px 30px rgba(0, 0, 0, 0.5), 0 0 12px ${p.badgeColor}22` : "none"
                }}
                onClick={() => handleLogin(p.name, p.redirectTo)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = p.badgeColor;
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${p.badgeColor}1a`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Role Indicator Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                    {p.role}
                  </span>
                  {isActive && (
                    <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                      Active
                    </span>
                  )}
                </div>

                {/* Persona Identification */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "var(--bg-card-header)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem"
                  }}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {p.name}
                    </h3>
                  </div>
                </div>

                {/* Assignment request quote */}
                <div style={{ 
                  fontSize: "0.8rem", 
                  fontStyle: "italic", 
                  color: "var(--text-secondary)",
                  background: "var(--bg-card-header)",
                  border: "1px solid var(--border-color)",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  borderLeft: `3px solid ${p.badgeColor}`,
                  lineHeight: "1.4"
                }}>
                  "{p.assignmentQuery}"
                </div>

                {/* Walkthrough instruction */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Evaluation Goal
                  </span>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {p.guideline}
                  </p>
                </div>

                {/* Action button */}
                <button 
                  className="btn"
                  style={{ 
                    width: "100%", 
                    fontSize: "0.8rem", 
                    fontWeight: 600,
                    padding: "8px 12px", 
                    marginTop: "auto",
                    backgroundColor: isActive ? p.badgeColor : "var(--bg-card-header)",
                    borderColor: isActive ? p.badgeColor : "var(--border-color)",
                    color: isActive ? "white" : "var(--text-primary)",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? `0 2px 8px ${p.badgeColor}33` : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = p.badgeColor;
                      e.currentTarget.style.borderColor = p.badgeColor;
                      e.currentTarget.style.boxShadow = `0 2px 8px ${p.badgeColor}33`;
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--bg-card-header)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                >
                  {isActive ? "Active Persona" : `Log in as ${p.name} →`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Breakdown Section */}
      <div>
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
