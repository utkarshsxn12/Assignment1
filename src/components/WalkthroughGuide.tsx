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
          step: "Step 1 of 6",
          problem: "Meera wants to clean up duplicate entries in the CSV export but wants to review and approve them first instead of letting the app silently delete them.",
          resolution: "We implemented an interactive CSV Staging Importer. When you auto-load the spreadsheet, the app detects 20+ anomalies and displays them in a table. It automatically flags duplicate rows (like Row 6 and Row 24) with 'Skip' suggestions, allowing you to review them before writing to the database.",
          verification: "Click '⚡ Auto-Load & Stage expenses_export.csv' below. Observe that Row 6 (duplicate dinner) and Row 24 (wrong entry note) are automatically set to 'Skip' (strikethrough). Click 'Approve & Ingest Staging' to write the clean data.",
          color: "var(--color-primary)",
          icon: "📥"
        };
      case "Aisha":
        return {
          step: "Step 2 of 6",
          problem: "Aisha wants a single consolidated summary showing who pays whom and how much, minimizing the number of payments required.",
          resolution: "We implemented a Splitwise-style debt minimization algorithm. It aggregates all expenses and splits, computes net balances, and runs a flow-reduction engine to produce the absolute minimal number of direct transfers.",
          verification: "Look at the 'Settlement Summary' card below. It displays direct payments (e.g., 'Sam pays Aisha') calculated dynamically to clear all house debts in the fewest transactions.",
          color: "var(--color-secondary)",
          icon: "🤝"
        };
      case "Rohan":
        return {
          step: "Step 3 of 6",
          problem: "Rohan hates 'magic numbers' and demands a transparent, transaction-by-transaction audit trail showing exactly where his balance comes from.",
          resolution: "We created a full Balance Audit Trail ledger. For any selected user, it traces and lists every single bill they paid and every split they participated in, complete with currency conversions and net contributions.",
          verification: "Select 'Rohan' in the dropdown in the 'Balance Audit Trail' card below. You will see a detailed ledger. Verify that the sum of Rohan's 'User Paid' minus 'User Share' equals his exact net balance (₹-3,219.00). No magic numbers!",
          color: "#10b981",
          icon: "🔍"
        };
      case "Priya":
        return {
          step: "Step 4 of 6",
          problem: "Priya pointed out that the Goa trip was in USD, but the raw CSV logged it as $1 = 1 INR, which breaks splits.",
          resolution: "Our CSV parser detects currency codes. For USD expenses (like the Goa Villa Booking), it applies a historical exchange rate of 1 USD = 83.0 INR to calculate the correct rupee amount.",
          verification: "Select 'Priya' in the 'Balance Audit Trail' card. Find the Goa Villa Booking expense. Observe that the total USD amount ($120.00) is converted at 83.0 INR to ₹9,960.00, and split correctly.",
          color: "#f59e0b",
          icon: "💵"
        };
      case "Sam":
        return {
          step: "Step 5 of 6",
          problem: "Sam moved in on April 15 and shouldn't be charged for utility bills or rent from March (before he lived in the flat).",
          resolution: "We programmed membership timelines. Each member has a join and leave date. The split calculation engine automatically checks if a member was active on the expense date; if not, they are excluded from the split.",
          verification: "Verify that Sam's net balance is calculated correctly. Go to the 'Balances' card below. Sam's balance is ₹-16,400.00, which consists only of April rent and deposit splits. He is charged ₹0 for the March electricity bill.",
          color: "#8b5cf6",
          icon: "📅"
        };
      case "Dev":
        return {
          step: "Step 6 of 6",
          problem: "Dev invited his external friend Kabir on the Goa trip. Kabir is not a flatmate, so his split share must be charged to Dev's balance.",
          resolution: "Our split engine supports guest redirection rules. Any split attributed to a non-member guest (like Kabir) is automatically added to the balance of their host (Dev).",
          verification: "Select 'Dev' in the 'Balance Audit Trail' card. Under the Parasailing trip expense, observe that Dev is charged for his own share plus Kabir's guest share, ensuring the group doesn't absorb the cost.",
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
          Walkthrough: {details.step}
        </span>
      </div>

      <h3 style={{ fontSize: "1.1rem", fontWeight: 750, color: "white" }}>
        Resolved {currentUser}'s Problem!
      </h3>

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <strong style={{ color: "white" }}>Problem:</strong> "{details.problem}"
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <strong style={{ color: "white" }}>How We Resolved It:</strong> {details.resolution}
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
