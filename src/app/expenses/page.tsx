"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import WalkthroughGuide from "@/components/WalkthroughGuide";

interface User {
  id: string;
  name: string;
}

interface GroupMember {
  id: string;
  userId: string;
  joinDate: string;
  leaveDate: string | null;
  user: User;
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  shareValue: number | null;
  percentageValue: number | null;
  user: User;
}

interface Expense {
  id: string;
  description: string;
  amount: number; // in INR paise
  currency: string;
  exchangeRate: number;
  splitType: string;
  date: string;
  paidById: string;
  notes: string | null;
  isSettlement: boolean;
  paidBy: User;
  splits: ExpenseSplit[];
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [showMemberSettings, setShowMemberSettings] = useState<boolean>(false);

  // Form states: New Expense
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidById, setPaidById] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [notes, setNotes] = useState("");
  const [selectedSplits, setSelectedSplits] = useState<Record<string, boolean>>({});
  const [splitValues, setSplitValues] = useState<Record<string, string>>({}); // Stores percentages, shares, or unequal amounts

  // Form states: New Settlement
  const [settlePayer, setSettlePayer] = useState("");
  const [settleRecipient, setSettleRecipient] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split("T")[0]);

  // Form states: Editing Membership
  const [editingMemberId, setEditingMemberId] = useState("");
  const [editJoinDate, setEditJoinDate] = useState("");
  const [editLeaveDate, setEditLeaveDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const expRes = await fetch("/api/expenses");
      const expData = await expRes.json();
      
      const memRes = await fetch("/api/members");
      const memData = await memRes.json();

      if (expRes.ok && memRes.ok) {
        setExpenses(expData);
        setMembers(memData);
        
        // Default paidById to first member
        if (memData.length > 0) {
          setPaidById(memData[0].userId);
          setSettlePayer(memData[0].userId);
          setSettleRecipient(memData.length > 1 ? memData[1].userId : memData[0].userId);
        }
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update exchange rate proposal based on currency
  useEffect(() => {
    if (currency === "USD") {
      setExchangeRate("83.0");
    } else {
      setExchangeRate("1.0");
    }
  }, [currency]);

  // Calculate active members for the currently selected date in the form
  const getActiveMembersForDate = (dateStr: string) => {
    if (!dateStr) return [];
    const checkDate = new Date(dateStr);
    return members.filter(m => {
      const join = new Date(m.joinDate);
      const leave = m.leaveDate ? new Date(m.leaveDate) : null;
      return checkDate >= join && (!leave || checkDate <= leave);
    });
  };

  const activeMembers = getActiveMembersForDate(date);

  // Initialize selected participants on date changes
  useEffect(() => {
    const active = getActiveMembersForDate(date);
    const initialSelection: Record<string, boolean> = {};
    active.forEach(m => {
      initialSelection[m.userId] = true;
    });
    setSelectedSplits(initialSelection);
  }, [date, members]);

  const handleSplitCheckboxChange = (userId: string) => {
    setSelectedSplits(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSplitValueChange = (userId: string, val: string) => {
    setSplitValues(prev => ({
      ...prev,
      [userId]: val,
    }));
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedIds = Object.keys(selectedSplits).filter(id => selectedSplits[id]);
    if (selectedIds.length === 0) {
      alert("Please select at least one person to split the expense with.");
      return;
    }

    // Convert splitValues map to floats
    const details: Record<string, number> = {};
    selectedIds.forEach(id => {
      const val = parseFloat(splitValues[id] || "0");
      details[id] = val;
    });

    const payload = {
      description,
      amount: parseFloat(amount),
      currency,
      exchangeRate: parseFloat(exchangeRate),
      splitType,
      paidById,
      date,
      splitWith: selectedIds,
      splitDetails: details,
      notes,
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setDescription("");
        setAmount("");
        setNotes("");
        setSplitValues({});
        fetchData(); // Reload expenses and balances
      } else {
        const err = await res.json();
        alert("Error saving expense: " + err.error);
      }
    } catch (e: any) {
      alert("Submit failed: " + e.message);
    }
  };

  const submitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settlePayer === settleRecipient) {
      alert("Payer and recipient cannot be the same person.");
      return;
    }

    const payload = {
      description: `${members.find(m => m.userId === settlePayer)?.user.name} paid ${members.find(m => m.userId === settleRecipient)?.user.name} back`,
      amount: parseFloat(settleAmount),
      currency: "INR",
      exchangeRate: 1.0,
      splitType: "equal",
      paidById: settlePayer,
      date: settleDate,
      splitWith: [settleRecipient],
      splitDetails: {},
      isSettlement: true,
      notes: "Direct settlement logged manually",
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowSettleModal(false);
        setSettleAmount("");
        fetchData();
      } else {
        const err = await res.json();
        alert("Error logging settlement: " + err.error);
      }
    } catch (e: any) {
      alert("Settlement failed: " + e.message);
    }
  };

  const handleEditMemberClick = (m: GroupMember) => {
    setEditingMemberId(m.id);
    setEditJoinDate(m.joinDate.split("T")[0]);
    setEditLeaveDate(m.leaveDate ? m.leaveDate.split("T")[0] : "");
  };

  const submitMemberUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: editingMemberId,
          joinDate: editJoinDate,
          leaveDate: editLeaveDate || null,
        }),
      });

      if (res.ok) {
        setEditingMemberId("");
        fetchData();
        alert("Membership timeline updated! Balances will recalculate.");
      } else {
        const err = await res.json();
        alert("Failed to update membership: " + err.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <WalkthroughGuide />

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Page Title & Quick Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>💸 Group Expenses</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Log rent, household bills, split vacation bookings, and settle balances
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ fontWeight: 600 }}>
              ➕ Add Expense
            </button>
            <button onClick={() => setShowSettleModal(true)} className="btn btn-secondary" style={{ fontWeight: 600 }}>
              🤝 Settle Debt
            </button>
            <button 
              onClick={() => setShowMemberSettings(prev => !prev)} 
              className="btn btn-secondary"
              style={{ fontWeight: 600, borderColor: showMemberSettings ? "var(--color-primary)" : "var(--border-color)" }}
            >
              ⚙️ Timelines
            </button>
          </div>
        </div>

        {/* Dynamic Member Settings Panel (Sam / Meera join/leave tests) */}
        {showMemberSettings && (
          <div className="glass-card" style={{ padding: "1.75rem", borderLeft: "4px solid var(--color-primary)" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
              ⚙️ House Membership Timelines (Dynamic Splits)
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Edit dates to simulate Meera leaving or Sam moving in. Split eligibility will automatically adjust based on dates.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              
              {/* Member List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Join Date</th>
                        <th>Leave Date</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.user.name}</strong></td>
                          <td>{m.joinDate.split("T")[0]}</td>
                          <td>
                            {m.leaveDate ? (
                              <span style={{ color: "var(--color-warning)", fontWeight: 600 }}>{m.leaveDate.split("T")[0]}</span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Active</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              onClick={() => handleEditMemberClick(m)}
                              className="btn btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px" }}
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Form */}
              {editingMemberId && (
                <div className="glass-card" style={{ padding: "1.5rem", background: "var(--bg-card-header)", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-primary)" }}>
                    Update Timeline: {members.find(m => m.id === editingMemberId)?.user.name}
                  </h3>
                  <form onSubmit={submitMemberUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Join Date</label>
                      <input 
                        type="date" 
                        value={editJoinDate}
                        onChange={(e) => setEditJoinDate(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Leave Date (Optional)</label>
                      <input 
                        type="date" 
                        value={editLeaveDate}
                        onChange={(e) => setEditLeaveDate(e.target.value)}
                        className="form-input"
                      />
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                        Leave blank if flatmate is currently active.
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem", flex: 1 }}>
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingMemberId("")} 
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem", flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Expenses List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: "1rem" }}>
            <div style={{
              width: "32px",
              height: "32px",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--color-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Loading expense ledger...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "2.5rem" }}>💸</span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>No Expenses Logged</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto" }}>
              There are no transactions in the ledger. You can log expenses manually, or head over to the Import page to parse the spreadsheet.
            </p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: "110px" }}>Date</th>
                    <th>Description</th>
                    <th>Paid By</th>
                    <th style={{ textAlign: "right", width: "120px" }}>Total Amount</th>
                    <th style={{ width: "110px" }}>Split Type</th>
                    <th>Participant Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    return (
                      <tr 
                        key={expense.id}
                        style={expense.isSettlement ? { background: "var(--color-success-bg)" } : {}}
                      >
                        <td style={{ color: "var(--text-secondary)" }}>
                          {expense.date.split("T")[0]}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {expense.isSettlement && <span className="badge badge-success" style={{ fontSize: "0.6rem", padding: "1px 5px" }}>Payment</span>}
                            <strong style={{ fontSize: "0.925rem", color: "var(--text-primary)" }}>{expense.description}</strong>
                          </div>
                          {expense.notes && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                              📝 {expense.notes}
                            </div>
                          )}
                        </td>
                        <td><strong>{expense.paidBy.name}</strong></td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.925rem" }}>
                          ₹{(expense.amount / 100).toFixed(2)}
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{expense.splitType}</span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {expense.splits.map(s => (
                              <span 
                                key={s.id}
                                style={{
                                  background: "var(--bg-card-header)",
                                  color: "var(--text-primary)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--border-color)",
                                  fontSize: "0.75rem"
                                }}
                              >
                                {s.user.name}: <span style={{ fontWeight: 700 }}>₹{(s.amount / 100).toFixed(0)}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD EXPENSE */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="glass-card" style={{ 
            padding: "2.25rem", 
            width: "100%", 
            maxWidth: "550px", 
            maxHeight: "90vh", 
            overflowY: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)"
          }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)" }}>➕ Add New Group Expense</h2>
            
            <form onSubmit={submitExpense} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Electricity bill, Rent split, Swiggy dinner"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="form-select"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {currency === "USD" && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Exchange Rate (1 USD = X INR)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Paid By (Payer)</label>
                  <select 
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="form-select"
                  >
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Split Type</label>
                <select 
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value)}
                  className="form-select"
                >
                  <option value="equal">Split Equally</option>
                  <option value="unequal">Split Unequally (Exact amounts)</option>
                  <option value="percentage">Split by Percentage</option>
                  <option value="share">Split by Shares (Ratio)</option>
                </select>
              </div>

              {/* Dynamic split inputs */}
              <div className="form-group" style={{ marginBottom: 0, background: "var(--bg-card-header)", padding: "1.15rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <label className="form-label" style={{ marginBottom: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  👥 Split With (Active Members on {date})
                </label>
                
                {activeMembers.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-error)" }}>
                    ⚠️ No active group members on this date! Adjust member settings.
                  </span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {activeMembers.map(m => {
                      const isChecked = !!selectedSplits[m.userId];
                      return (
                        <div key={m.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-primary)" }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleSplitCheckboxChange(m.userId)}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            {m.user.name}
                          </label>

                          {/* Dynamic extra inputs for percentages, shares, or unequal */}
                          {isChecked && splitType !== "equal" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <input 
                                type="number" 
                                step="any"
                                placeholder={splitType === "unequal" ? "Amount (₹)" : splitType === "percentage" ? "%" : "Weight"}
                                value={splitValues[m.userId] || ""}
                                onChange={(e) => handleSplitValueChange(m.userId, e.target.value)}
                                className="form-input"
                                style={{ width: "85px", padding: "4px 8px", fontSize: "0.8rem", textAlign: "right" }}
                                required
                              />
                              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", minWidth: "45px" }}>
                                {splitType === "unequal" ? "₹" : splitType === "percentage" ? "%" : "shares"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. details, trip itinerary info"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 600 }}>
                  Create Expense
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SETTLE DEBT */}
      {showSettleModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="glass-card" style={{ 
            padding: "2rem", 
            width: "100%", 
            maxWidth: "450px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)"
          }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)" }}>🤝 Log Debt Payment</h2>
            
            <form onSubmit={submitSettlement} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Who Paid? (Payer)</label>
                <select 
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  className="form-select"
                >
                  {members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Who Received? (Recipient)</label>
                <select 
                  value={settleRecipient}
                  onChange={(e) => setSettleRecipient(e.target.value)}
                  className="form-select"
                >
                  {members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 600 }}>
                  Log Payment
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSettleModal(false)} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
