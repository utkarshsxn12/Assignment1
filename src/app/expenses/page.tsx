"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

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

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Page Title & Quick Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>💸 Group Expenses</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Log rent, dynamic utilities, trips, and payments</p>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              ➕ Add Expense
            </button>
            <button onClick={() => setShowSettleModal(true)} className="btn btn-secondary">
              🤝 Settle Debt
            </button>
            <button onClick={() => setShowMemberSettings(prev => !prev)} className="btn btn-secondary">
              ⚙️ Manage Membership
            </button>
          </div>
        </div>

        {/* Dynamic Member Settings Panel (Sam / Meera join/leave tests) */}
        {showMemberSettings && (
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              ⚙️ House Membership Timelines (Dynamic Splits)
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
              Edit dates to simulate Meera leaving or Sam moving in. Balances and split eligibility will automatically recalculate.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              
              {/* Member List */}
              <div>
                <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Join Date</th>
                      <th>Leave Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.user.name}</strong></td>
                        <td>{m.joinDate.split("T")[0]}</td>
                        <td>{m.leaveDate ? m.leaveDate.split("T")[0] : <span style={{ color: "var(--color-success)" }}>Active</span>}</td>
                        <td>
                          <button 
                            onClick={() => handleEditMemberClick(m)}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Form */}
              {editingMemberId && (
                <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(255,255,255,0.01)" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>
                    Edit Timeline: {members.find(m => m.id === editingMemberId)?.user.name}
                  </h3>
                  <form onSubmit={submitMemberUpdate}>
                    <div className="form-group">
                      <label className="form-label">Join Date</label>
                      <input 
                        type="date" 
                        value={editJoinDate}
                        onChange={(e) => setEditJoinDate(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Leave Date (Optional)</label>
                      <input 
                        type="date" 
                        value={editLeaveDate}
                        onChange={(e) => setEditLeaveDate(e.target.value)}
                        className="form-input"
                      />
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Leave blank if currently active.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                        Save Timeline
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingMemberId("")} 
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
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
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <span style={{ fontSize: "2rem" }}>⏳</span> Loading Expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
            <span style={{ fontSize: "3rem" }}>💸</span>
            <p style={{ marginTop: "1rem" }}>No expenses logged yet. Go ahead and log one, or import the CSV in the Import tab!</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>Date</th>
                    <th>Description</th>
                    <th>Paid By</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                    <th>Split Details</th>
                    <th>Participant Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    return (
                      <tr 
                        key={expense.id}
                        style={expense.isSettlement ? { background: "rgba(16, 185, 129, 0.02)" } : {}}
                      >
                        <td style={{ color: "var(--color-text-secondary)" }}>
                          {expense.date.split("T")[0]}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {expense.isSettlement && <span className="badge badge-success">Payment</span>}
                            <strong style={{ fontSize: "0.95rem" }}>{expense.description}</strong>
                          </div>
                          {expense.notes && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                              {expense.notes}
                            </div>
                          )}
                        </td>
                        <td><strong>{expense.paidBy.name}</strong></td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          ₹{(expense.amount / 100).toFixed(2)}
                        </td>
                        <td>
                          <span className="badge badge-info">{expense.splitType}</span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {expense.splits.map(s => (
                              <span 
                                key={s.id}
                                style={{
                                  background: "rgba(255,255,255,0.03)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border-glass)"
                                }}
                              >
                                {s.user.name}: ₹{(s.amount / 100).toFixed(2)}
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
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="glass-card" style={{ padding: "2rem", width: "100%", maxWidth: "550px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>➕ Add New Group Expense</h2>
            
            <form onSubmit={submitExpense}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Electricity bill, Groceries, Dinner"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
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
                <div className="form-group">
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
                <div className="form-group">
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
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
                <div className="form-group">
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

              <div className="form-group">
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
              <div className="form-group" style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                <label className="form-label" style={{ marginBottom: "0.75rem", fontWeight: 700 }}>
                  👥 Split With (Active Members on {date})
                </label>
                
                {activeMembers.length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-error)" }}>
                    ⚠️ No active group members on this date! Adjust member settings.
                  </span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activeMembers.map(m => {
                      const isChecked = !!selectedSplits[m.userId];
                      return (
                        <div key={m.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleSplitCheckboxChange(m.userId)}
                              style={{ width: "16px", height: "16px" }}
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
                                style={{ width: "80px", padding: "4px 8px", fontSize: "0.8rem", textAlign: "right" }}
                                required
                              />
                              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
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

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. details, trip itinerary info"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
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
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="glass-card" style={{ padding: "2rem", width: "100%", maxWidth: "450px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>🤝 Log Debt Payment</h2>
            
            <form onSubmit={submitSettlement}>
              <div className="form-group">
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

              <div className="form-group">
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

              <div className="form-group">
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

              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
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
