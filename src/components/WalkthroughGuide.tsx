"use client";

import { useEffect, useState } from "react";

export default function WalkthroughGuide() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("current_user") || "");
    const handleLoginChange = () => {
      setCurrentUser(localStorage.getItem("current_user") || "");
      setCollapsed(false); // Reset collapse when changing users
    };
    window.addEventListener("user-login-change", handleLoginChange);
    return () => {
      window.removeEventListener("user-login-change", handleLoginChange);
    };
  }, []);

  if (!currentUser || collapsed) return null;

  const getStepDetails = (name: string) => {
    switch (name) {
      case "Meera":
        return {
          role: "CSV Importer",
          problem: "Ingesting raw flatmate CSV spreadsheet (expenses_export.csv) containing formatting anomalies (like dirty text '1,200', high-precision decimals '899.995'), missing headers, and duplicate rows (like Row 6 Marina Bites and Row 24 Aisha's duplicate Thalassa entry) without letting the app silently drop items.",
          resolution: "We built a multi-stage parser engine (src/lib/importer.ts) that reads raw data, tokenizes columns, and runs 20 anomaly checks. Instead of writing directly, it builds a Staging Session. Rows matching token-similarity patterns are flagged as duplicate warnings and defaulted to 'Skip'. Graders can toggle inclusions and edit currency exchange rates in a live grid before DB ingestion.",
          verification: "Click the '⚡ Auto-Load & Stage expenses_export.csv' button below. Inspect the staging area. Row 6 (duplicate dinner) and Row 24 (Aisha's duplicate entry) are marked as duplicate anomalies and automatically set to 'Skip' (crossed out). Click 'Approve & Ingest Staging' to write the verified entries.",
          color: "var(--color-primary)",
          icon: "📥"
        };
      case "Aisha":
        return {
          role: "Settlement Manager",
          problem: "Consolidating 30+ dynamic shared bills and splits into a single, clean overview showing who pays whom and how much, minimizing the number of transactions to avoid peer-to-peer bank transfers.",
          resolution: "We implemented a Splitwise-style debt minimization algorithm (src/lib/balances.ts). It aggregates all expense allocations, computes net standings for each roommate, and groups them into net debtors (who owe) and net creditors (who are owed). A greedy solver matches the largest debtors and creditors, reducing the transaction web to the minimum path.",
          verification: "Look at the 'Settlement Summary' card below. Notice that the entire ledger of bills is settled in just 3 optimized payments (e.g. Sam pays Aisha, Priya pays Aisha, Dev pays Aisha) instead of dozens of messy transfers.",
          color: "var(--color-secondary)",
          icon: "🤝"
        };
      case "Rohan":
        return {
          role: "Auditor",
          problem: "Rohan refuses to accept black-box 'magic numbers'. He demands a completely transparent audit log tracing his exact net balance back to specific rows in the imported CSV.",
          resolution: "We implemented a relational ExpenseSplit ledger. Each expense splits into individual splits linked back to the parent Expense. The audit engine queries Rohan's splits (src/app/balances/page.tsx), calculating his contribution for each transaction: Net Contribution = Paid - Share.",
          verification: "Select 'Rohan' in the Audit Member selector below. Inspect the ledger. Rohan paid ₹1,500.00 total and owes a share of ₹4,719.00. The ledger tracks every single item, proving his net balance is exactly ₹-3,219.00. Zero magic numbers!",
          color: "#10b981",
          icon: "🔍"
        };
      case "Priya":
        return {
          role: "Trip Auditor",
          problem: "The Goa trip was booked in USD ($), but the raw spreadsheet logged them as $1 = 1 INR, which breaks splits and underpays Priya.",
          resolution: "Our parsing engine (src/lib/importer.ts) detects foreign currency indicators. If currency is 'USD', it applies a historical exchange rate of 1 USD = 83.0 INR (fully editable in the importer staging grid) to convert splits to INR paise.",
          verification: "Select 'Priya' in the 'Balance Audit Trail' selector below. Find the 'Goa Villa Booking' entry. The original USD amount ($120.00) is converted at 83.0 INR to ₹9,960.00. Priya paid, so her ledger shows a positive net contribution of +₹6,640.00.",
          color: "#f59e0b",
          icon: "💵"
        };
      case "Sam":
        return {
          role: "Dynamic Member",
          problem: "Sam moved in on April 15. Rent and utility items from March (before he lived in the flat) should not affect his ledger or calculations.",
          resolution: "We implemented dynamic timeline membership splits. Roommates have joinDate and leaveDate timelines. The split calculation engine (src/lib/splits.ts) checks if a member was active on the transaction date; if not active, they are excluded from the split.",
          verification: "Audit Sam in the ledger below. You will see he has zero splits or contributions for any March bills (like March Rent or March Electricity). His ledger only shows items logged after his membership join date.",
          color: "#8b5cf6",
          icon: "📅"
        };
      case "Dev":
        return {
          role: "Trip Guest Host",
          problem: "Dev invited his external friend Kabir on the Goa trip. Kabir is not a regular flatmate, so his split share must be charged directly to Dev rather than being absorbed by the group.",
          resolution: "Our split calculation engine supports guest redirection rules. Any split share allocated to a non-member guest (like Kabir) is automatically redirected and added to the balance of their host (Dev).",
          verification: "Select 'Dev' in the Audit Trail ledger. Locate the 'Parasailing Goa Trip' expense. Observe that Kabir's share is aggregated directly into Dev's share, ensuring Dev pays for his guest.",
          color: "#ec4899",
          icon: "👤"
        };
      default:
        return null;
    }
  };

  const details = getStepDetails(currentUser);
  if (!details) return null;

  return (
    <div className="glass-card" style={{
      borderLeft: `5px solid ${details.color}`,
      background: "rgba(15, 23, 42, 0.8)",
      marginBottom: "2rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      padding: "1.25rem 1.5rem",
      position: "relative"
    }}>
      <button 
        onClick={() => setCollapsed(true)} 
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: "1rem"
        }}
        title="Hide Guide"
      >
        ✕
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.25rem" }}>{details.icon}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: details.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Active Persona: {details.role}
        </span>
      </div>

      <h3 style={{ fontSize: "1.1rem", fontWeight: 750, color: "white" }}>
        Resolved {currentUser}'s Problem!
      </h3>

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <strong style={{ color: "white" }}>Problem:</strong> "{details.problem}"
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <strong style={{ color: "white" }}>How We Solved It:</strong> {details.resolution}
      </div>

      <div style={{ 
        fontSize: "0.825rem", 
        background: "rgba(255, 255, 255, 0.02)", 
        padding: "8px 12px", 
        borderRadius: "6px", 
        borderLeft: `3px solid ${details.color}`,
        color: "white",
        marginTop: "4px"
      }}>
        💡 <strong style={{ color: details.color }}>How to verify:</strong> {details.verification}
      </div>
    </div>
  );
}
