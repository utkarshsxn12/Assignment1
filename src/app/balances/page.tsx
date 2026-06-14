"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import WalkthroughGuide from "@/components/WalkthroughGuide";

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
    return "var(--text-secondary)";
  };

  const formatMoney = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const selectedAuditTrail = selectedAuditUser ? auditTrails[selectedAuditUser] || [] : [];
  const selectedUserBalance = balances.find(b => b.userId === selectedAuditUser);

  return (
    <div className="app-container">
      <Navbar />
      <WalkthroughGuide />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: "1rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--border-color)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
            Loading Room Balances & Audit Ledger...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Main Layout Grid: Debts + Net Balances */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
            
            {/* AISHA'S REQUEST: Simplified Debts (Who pays whom) */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(14, 165, 233, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem"
                }}>
                  🤝
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Settlement Summary</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Simplified net direct payments (Splitwise algorithm)</p>
                </div>
              </div>

              {debts.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "3rem 1.5rem", 
                  background: "var(--color-success-bg)", 
                  borderRadius: "12px",
                  color: "var(--color-success)",
                  border: "1px dashed rgba(16, 185, 129, 0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  flexGrow: 1
                }}>
                  <span style={{ fontSize: "2rem" }}>🎉</span>
                  All debts settled! No payments required.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
                  {debts.map((debt, idx) => {
                    const isRelevant = debt.fromUser === currentUser || debt.toUser === currentUser;
                    return (
                      <div 
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "10px",
                          background: isRelevant ? "rgba(99, 102, 241, 0.04)" : "var(--bg-card)",
                          border: isRelevant ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid var(--border-color)",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: "0.9rem",
                            color: debt.fromUser === currentUser ? "var(--color-error)" : "var(--text-primary)" 
                          }}>
                            {debt.fromUser}
                          </span>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "var(--text-secondary)", 
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "var(--bg-card-header)",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            pays
                          </span>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: "0.9rem",
                            color: debt.toUser === currentUser ? "var(--color-success)" : "var(--text-primary)" 
                          }}>
                            {debt.toUser}
                          </span>
                        </div>
                        <div style={{ 
                          fontWeight: 800, 
                          fontSize: "1.1rem", 
                          color: debt.fromUser === currentUser ? "var(--color-error)" : "var(--color-success)" 
                        }}>
                          {formatMoney(debt.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Net Balances Grid */}
            <div className="glass-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem"
                }}>
                  📊
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Group Balances</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Individual net standing across all expenses</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {balances.map((b) => {
                  const isCurrent = b.name === currentUser;
                  return (
                    <div 
                      key={b.userId}
                      className="glass-card"
                      style={{ 
                        padding: "14px 16px", 
                        background: isCurrent ? "rgba(99, 102, 241, 0.02)" : "var(--bg-card)",
                        border: isCurrent ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                        boxShadow: isCurrent ? "0 4px 12px rgba(99, 102, 241, 0.05)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{b.name}</span>
                        {isCurrent && (
                          <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Logged In</span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: getBalanceColor(b.netBalance), letterSpacing: "-0.02em" }}>
                        {b.netBalance > 0 ? "+" : ""}{formatMoney(b.netBalance)}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                        <span>Paid: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatMoney(b.totalPaid)}</span></span>
                        <span>Owed: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatMoney(b.totalOwed)}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ROHAN'S REQUEST: Balance Audit Trail (No Magic Numbers) */}
          <div className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem"
                }}>
                  🔍
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>Balance Audit Trail</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Trace every single rupee back to source expenses (Rohan's request)</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card-header)", padding: "4px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Audit Member:</span>
                <select 
                  value={selectedAuditUser}
                  onChange={(e) => setSelectedAuditUser(e.target.value)}
                  className="form-select"
                  style={{ 
                    width: "110px", 
                    padding: "4px 0", 
                    fontSize: "0.85rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  {balances.map(b => (
                    <option key={b.userId} value={b.userId} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedUserBalance && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                padding: "1rem 1.25rem", 
                background: "var(--bg-card-header)", 
                borderRadius: "10px", 
                marginBottom: "1.5rem",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                gap: "1rem"
              }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Audited Member</div>
                  <strong style={{ color: "var(--color-primary)", fontSize: "1rem", fontWeight: 700 }}>{selectedUserBalance.name}</strong>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Group Paid</div>
                  <strong style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700 }}>{formatMoney(selectedUserBalance.totalPaid)}</strong>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Share Owed</div>
                  <strong style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700 }}>{formatMoney(selectedUserBalance.totalOwed)}</strong>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Net Balance Status</div>
                  <strong style={{ color: getBalanceColor(selectedUserBalance.netBalance), fontSize: "1rem", fontWeight: 800 }}>
                    {selectedUserBalance.netBalance > 0 ? "+" : ""}{formatMoney(selectedUserBalance.netBalance)}
                  </strong>
                </div>
              </div>
            )}

            {selectedAuditTrail.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
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
                      <tr key={idx} style={entry.isSettlement ? { background: "var(--color-success-bg)" } : {}}>
                        <td style={{ color: "var(--text-secondary)" }}>{entry.date}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {entry.isSettlement && <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "1px 5px" }}>Settlement</span>}
                            <strong style={{ color: "var(--text-primary)" }}>{entry.description}</strong>
                          </div>
                          {entry.currency === "USD" && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", marginTop: "2px", fontWeight: 500 }}>
                              Original: ${ (entry.totalAmount / entry.exchangeRate / 100).toFixed(2) } USD (Exchange Rate: {entry.exchangeRate})
                            </div>
                          )}
                        </td>
                        <td>{entry.paidBy}</td>
                        <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                          {formatMoney(entry.totalAmount)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: entry.userPaid > 0 ? "var(--color-success)" : "var(--text-muted)" }}>
                          {entry.userPaid > 0 ? formatMoney(entry.userPaid) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: entry.userShare > 0 ? "var(--color-error)" : "var(--text-muted)" }}>
                          {entry.userShare > 0 ? formatMoney(entry.userShare) : "—"}
                        </td>
                        <td style={{ 
                          textAlign: "right", 
                          fontWeight: 800, 
                          color: getBalanceColor(entry.netContribution)
                        }}>
                          {entry.netContribution > 0 ? "+" : ""}{formatMoney(entry.netContribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg-card-header)", fontWeight: 700, borderTop: "2px solid var(--border-color)" }}>
                      <td colSpan={4} style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.85rem" }}>Balance Check Sum (Σ Net Contribution)</td>
                      <td style={{ textAlign: "right", color: "var(--color-success)" }}>
                        {formatMoney(selectedAuditTrail.reduce((sum, e) => sum + e.userPaid, 0))}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-error)" }}>
                        {formatMoney(selectedAuditTrail.reduce((sum, e) => sum + e.userShare, 0))}
                      </td>
                      <td style={{ 
                        textAlign: "right", 
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: selectedUserBalance ? getBalanceColor(selectedUserBalance.netBalance) : "var(--text-primary)"
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
