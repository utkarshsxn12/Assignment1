"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface UserBalance {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

interface SimplifiedDebt {
  fromUser: string;
  fromUserId: string;
  toUser: string;
  toUserId: string;
  amount: number;
}

interface AuditTrailEntry {
  expenseId: string;
  date: string;
  description: string;
  paidBy: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  userPaid: number;
  userShare: number;
  netContribution: number;
  isSettlement: boolean;
}

export default function BalancesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [auditTrails, setAuditTrails] = useState<Record<string, AuditTrailEntry[]>>({});
  
  const [currentUser, setCurrentUser] = useState<string>("Aisha");
  const [selectedAuditUser, setSelectedAuditUser] = useState<string>("");

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/balances");
      const data = await res.json();
      if (res.ok) {
        setBalances(data.balances);
        setDebts(data.simplifiedDebts);
        setAuditTrails(data.auditTrails);
        
        // Find matching userId for selectedAuditUser
        const activeName = localStorage.getItem("current_user") || "Aisha";
        setCurrentUser(activeName);
        
        const activeMember = data.balances.find((b: any) => b.name === activeName);
        if (activeMember) {
          setSelectedAuditUser(activeMember.userId);
        } else if (data.balances.length > 0) {
          setSelectedAuditUser(data.balances[0].userId);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();

    // Listen for login persona changes from navbar
    const handleLoginChange = () => {
      const activeName = localStorage.getItem("current_user") || "Aisha";
      setCurrentUser(activeName);
      
      // Auto-focus audit trail on active user
      if (balances.length > 0) {
        const activeMember = balances.find((b) => b.name === activeName);
        if (activeMember) {
          setSelectedAuditUser(activeMember.userId);
        }
      }
    };

    window.addEventListener("user-login-change", handleLoginChange);
    return () => {
      window.removeEventListener("user-login-change", handleLoginChange);
    };
  }, [balances.length]);

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "var(--color-success)";
    if (amount < 0) return "var(--color-error)";
    return "var(--color-text-secondary)";
  };

  const formatMoney = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const selectedAuditTrail = selectedAuditUser ? auditTrails[selectedAuditUser] || [] : [];
  const selectedUserBalance = balances.find(b => b.userId === selectedAuditUser);

  return (
    <div className="app-container">
      <Navbar />

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <span style={{ fontSize: "2rem" }}>⏳</span> Loading Group Balances...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Main Layout Grid: Debts + Net Balances */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
            
            {/* AISHA'S REQUEST: Simplified Debts (Who pays whom) */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🤝</span>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Settlement Summary</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Simplified direct payments (Splitwise style)</p>
                </div>
              </div>

              {debts.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "2rem", 
                  background: "rgba(255,255,255,0.02)", 
                  borderRadius: "12px",
                  color: "var(--color-success)",
                  border: "1px dashed rgba(16, 185, 129, 0.2)"
                }}>
                  🎉 All debts settled! No payments required.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {debts.map((debt, idx) => {
                    const isRelevant = debt.fromUser === currentUser || debt.toUser === currentUser;
                    return (
                      <div 
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: isRelevant ? "rgba(139, 92, 246, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: isRelevant ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid var(--border-glass)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, color: debt.fromUser === currentUser ? "var(--color-error)" : "var(--color-text-primary)" }}>
                            {debt.fromUser}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>pays</span>
                          <span style={{ fontWeight: 600, color: debt.toUser === currentUser ? "var(--color-success)" : "var(--color-text-primary)" }}>
                            {debt.toUser}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: debt.fromUser === currentUser ? "var(--color-error)" : "var(--color-success)" }}>
                          {formatMoney(debt.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Net Balances Grid */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "1.5rem" }}>📊</span>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Group Balances</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Individual net standing across all expenses</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {balances.map((b) => (
                  <div 
                    key={b.userId}
                    className="glass-card"
                    style={{ 
                      padding: "12px", 
                      border: b.name === currentUser ? "1px solid var(--color-primary)" : "1px solid var(--border-glass)",
                      background: b.name === currentUser ? "rgba(139, 92, 246, 0.04)" : "var(--background-card)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700 }}>{b.name}</span>
                      {b.name === currentUser && (
                        <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>You</span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: getBalanceColor(b.netBalance) }}>
                      {b.netBalance > 0 ? "+" : ""}{formatMoney(b.netBalance)}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "8px" }}>
                      <span>Paid: {formatMoney(b.totalPaid)}</span>
                      <span>Owed: {formatMoney(b.totalOwed)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ROHAN'S REQUEST: Balance Audit Trail (No Magic Numbers) */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>🔍</span>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Balance Audit Trail</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Trace every rupee back to source expenses (Rohan's request)</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Audit Member:</span>
                <select 
                  value={selectedAuditUser}
                  onChange={(e) => setSelectedAuditUser(e.target.value)}
                  className="form-select"
                  style={{ width: "130px", padding: "6px 10px", fontSize: "0.85rem" }}
                >
                  {balances.map(b => (
                    <option key={b.userId} value={b.userId}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedUserBalance && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: "1rem", 
                background: "rgba(255,255,255,0.02)", 
                borderRadius: "10px", 
                marginBottom: "1rem",
                border: "1px solid var(--border-glass)",
                fontSize: "0.85rem",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div>
                  👤 Auditing member: <strong style={{ color: "var(--color-primary-hover)" }}>{selectedUserBalance.name}</strong>
                </div>
                <div>
                  💵 Total Paid: <strong>{formatMoney(selectedUserBalance.totalPaid)}</strong>
                </div>
                <div>
                  💸 Total Owed: <strong>{formatMoney(selectedUserBalance.totalOwed)}</strong>
                </div>
                <div>
                  ⚖️ Net Balance: <strong style={{ color: getBalanceColor(selectedUserBalance.netBalance) }}>{formatMoney(selectedUserBalance.netBalance)}</strong>
                </div>
              </div>
            )}

            {selectedAuditTrail.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
                No recorded transactions for this member yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Date</th>
                      <th>Expense Description</th>
                      <th>Paid By</th>
                      <th style={{ textAlign: "right" }}>Total Amount</th>
                      <th style={{ textAlign: "right" }}>User Paid</th>
                      <th style={{ textAlign: "right" }}>User Share</th>
                      <th style={{ textAlign: "right" }}>Net Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAuditTrail.map((entry, idx) => (
                      <tr key={idx} style={entry.isSettlement ? { background: "rgba(16, 185, 129, 0.03)" } : {}}>
                        <td>{entry.date}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {entry.isSettlement && <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "1px 4px" }}>Settlement</span>}
                            <strong>{entry.description}</strong>
                          </div>
                          {entry.currency === "USD" && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)" }}>
                              Original: ${ (entry.totalAmount / entry.exchangeRate / 100).toFixed(2) } USD (Rate: {entry.exchangeRate})
                            </div>
                          )}
                        </td>
                        <td>{entry.paidBy}</td>
                        <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                          {formatMoney(entry.totalAmount)}
                        </td>
                        <td style={{ textAlign: "right", color: entry.userPaid > 0 ? "var(--color-success)" : "var(--color-text-muted)" }}>
                          {entry.userPaid > 0 ? formatMoney(entry.userPaid) : "—"}
                        </td>
                        <td style={{ textAlign: "right", color: entry.userShare > 0 ? "var(--color-error)" : "var(--color-text-muted)" }}>
                          {entry.userShare > 0 ? formatMoney(entry.userShare) : "—"}
                        </td>
                        <td style={{ 
                          textAlign: "right", 
                          fontWeight: 700, 
                          color: getBalanceColor(entry.netContribution)
                        }}>
                          {entry.netContribution > 0 ? "+" : ""}{formatMoney(entry.netContribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "rgba(255,255,255,0.03)", fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: "14px 16px" }}>Balance Check Sum (Σ Net Contribution)</td>
                      <td style={{ textAlign: "right", color: "var(--color-success)" }}>
                        {formatMoney(selectedAuditTrail.reduce((sum, e) => sum + e.userPaid, 0))}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-error)" }}>
                        {formatMoney(selectedAuditTrail.reduce((sum, e) => sum + e.userShare, 0))}
                      </td>
                      <td style={{ 
                        textAlign: "right", 
                        fontSize: "1rem",
                        color: selectedUserBalance ? getBalanceColor(selectedUserBalance.netBalance) : "white"
                      }}>
                        {selectedUserBalance && selectedUserBalance.netBalance > 0 ? "+" : ""}
                        {selectedUserBalance ? formatMoney(selectedUserBalance.netBalance) : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
