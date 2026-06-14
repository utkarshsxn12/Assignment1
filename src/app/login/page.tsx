"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (name: string, redirectTo: string) => {
    localStorage.setItem("current_user", name);
    // Dispatch event to update navbar/session if needed
    window.dispatchEvent(new Event("user-login-change"));
    router.push(redirectTo);
  };

  const steps = [
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
    <div style={{
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "4rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "2.5rem"
    }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
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
          marginBottom: "1rem"
        }}>
          ⚡ sharedExpense Evaluation Gateway
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
          Flatmate Persona Portal
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "650px", margin: "0 auto", lineHeight: "1.6" }}>
          To inspect how each person's specific problem is resolved, log in as their persona below to view their active ledger, audits, and custom rules.
        </p>
      </div>

      {/* Grid of Steps */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        marginTop: "1rem"
      }}>
        {steps.map((s) => (
          <div 
            key={s.name}
            className="glass-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            onClick={() => handleLogin(s.name, s.redirectTo)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = s.badgeColor;
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${s.badgeColor}1a`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Role Indicator Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                {s.role}
              </span>
            </div>

            {/* Persona Identification */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                {s.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white" }}>
                  Log in as {s.name}
                </h3>
              </div>
            </div>

            {/* Assignment request quote */}
            <div style={{ 
              fontSize: "0.8rem", 
              fontStyle: "italic", 
              color: "var(--text-secondary)",
              background: "rgba(0,0,0,0.2)",
              padding: "10px 12px",
              borderRadius: "8px",
              borderLeft: `3px solid ${s.badgeColor}`,
              lineHeight: "1.4"
            }}>
              "{s.assignmentQuery}"
            </div>

            {/* Walkthrough instruction */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Evaluation Goal
              </span>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {s.guideline}
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
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = s.badgeColor;
                e.currentTarget.style.borderColor = s.badgeColor;
                e.currentTarget.style.boxShadow = `0 2px 8px ${s.badgeColor}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Log in as {s.name} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
