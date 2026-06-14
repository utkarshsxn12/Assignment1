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

  const personas = [
    {
      name: "Meera",
      role: "CSV Importer",
      assignmentQuery: "Meera: 'Clean up duplicates — but I want to approve changes.'",
      guideline: "Step 1: Log in as Meera to upload expenses_export.csv. Review the anomalies and duplicates, adjust exchange rates, and authorize database writing.",
      redirectTo: "/import",
      icon: "📥",
    },
    {
      name: "Aisha",
      role: "Settlement Manager",
      assignmentQuery: "Aisha: 'I just want one number per person. Who pays whom, how much.'",
      guideline: "Step 2: Log in as Aisha to view simplified debts. Verify that room balances are settled in the minimal number of direct transactions.",
      redirectTo: "/balances",
      icon: "🤝",
    },
    {
      name: "Rohan",
      role: "Auditor",
      assignmentQuery: "Rohan: 'No magic numbers. I want to see exactly which expenses make that up.'",
      guideline: "Step 3: Log in as Rohan to check the Audit Trail. Verify every rupee Rohan paid or owes back to source CSV rows.",
      redirectTo: "/balances",
      icon: "🔍",
    },
    {
      name: "Priya",
      role: "Trip Auditor",
      assignmentQuery: "Priya: 'Half the trip was in dollars. The sheet pretends 1 USD = 1 INR.'",
      guideline: "Step 4: Log in as Priya to inspect USD trip conversions. Verify that March villa bookings are converted at 83.0 INR.",
      redirectTo: "/balances",
      icon: "💵",
    },
    {
      name: "Sam",
      role: "Dynamic Member",
      assignmentQuery: "Sam: 'I moved in mid-April. Why would March electricity affect my balance?'",
      guideline: "Step 5: Log in as Sam to verify timeline logic. Confirm March rent and bills are completely excluded from Sam's ledger.",
      redirectTo: "/balances",
      icon: "📅",
    },
    {
      name: "Dev",
      role: "Trip Guest Host",
      assignmentQuery: "Dev: 'Trip participant. Dev's friend Kabir joined trip split.'",
      guideline: "Step 6: Log in as Dev to verify guest split rules. Kabir's guest split is correctly mapped as a debt to Dev.",
      redirectTo: "/balances",
      icon: "👤",
    },
  ];

  return (
    <div style={{
      maxWidth: "960px",
      margin: "0 auto",
      padding: "3rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          SplitSync Evaluation Dashboard
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "550px", margin: "0 auto" }}>
          Select a flatmate persona below to log in. Follow the step-by-step walkthrough instructions as requested in the assignment guidelines.
        </p>
      </div>

      {/* Grid of Personas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.25rem",
        marginTop: "1rem"
      }}>
        {personas.map((p) => (
          <div 
            key={p.name}
            className="glass-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              cursor: "pointer",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
            onClick={() => handleLogin(p.name, p.redirectTo)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-primary-hover)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>{p.icon}</span>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{p.name}</h3>
                <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                  {p.role}
                </span>
              </div>
            </div>

            {/* Assignment query */}
            <div style={{ 
              fontSize: "0.8rem", 
              fontStyle: "italic", 
              color: "var(--text-secondary)",
              background: "rgba(0,0,0,0.15)",
              padding: "8px",
              borderRadius: "6px",
              borderLeft: "3px solid var(--color-primary)"
            }}>
              {p.assignmentQuery}
            </div>

            {/* Walkthrough Guideline */}
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flexGrow: 1, lineHeight: "1.4" }}>
              {p.guideline}
            </p>

            {/* Login button */}
            <button 
              className="btn btn-primary"
              style={{ width: "100%", fontSize: "0.8rem", padding: "6px 12px", marginTop: "auto" }}
            >
              Log in as {p.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
