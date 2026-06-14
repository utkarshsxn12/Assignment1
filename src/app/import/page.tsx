"use client";

import { useState, useEffect, Fragment } from "react";
import Navbar from "@/components/Navbar";
import WalkthroughGuide from "@/components/WalkthroughGuide";

interface ImportRowData {
  id: string;
  rowNumber: number;
  rawLine: string;
  status: "clean" | "anomaly" | "imported" | "ignored";
  date: string;
  description: string;
  paidBy: string;
  amount: string;
  currency: string;
  splitType: string;
  splitWith: string;
  splitDetails: string;
  notes: string;
  anomalies: Array<{
    type: string;
    message: string;
    severity: "warning" | "error";
    proposedResolution: string;
    field: string;
  }>;
  resolvedData: {
    date: string;
    description: string;
    paidBy: string;
    amount: number;
    currency: string;
    exchangeRate: number;
    splitType: string;
    splitWith: string[];
    splitDetails: Record<string, number>;
    notes: string;
    isSettlement: boolean;
  };
}

export default function ImportPage() {
  const [csvContent, setCsvContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [session, setSession] = useState<{
    id: string;
    filename: string;
    rows: ImportRowData[];
  } | null>(null);
  
  const [resolutions, setResolutions] = useState<Record<string, { action: "import" | "skip"; resolvedData?: any }>>({});
  const [importReport, setImportReport] = useState<any[] | null>(null);
  const [importStats, setImportStats] = useState<{ imported: number; skipped: number } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Auto-detect duplicate pairs and pre-populate duplicate skips
  // e.g. for row 5 and 6, skip row 6 (default proposal)
  // for row 24 and 25 (Thalassa), skip row 24 (Aisha's wrong entry)
  useEffect(() => {
    if (session) {
      const initialResolutions: Record<string, { action: "import" | "skip" }> = {};
      session.rows.forEach(row => {
        initialResolutions[row.id] = { action: "import" };

        // Propose to skip obvious duplicate row 6 (dinner-marina bites)
        if (row.rowNumber === 6) {
          initialResolutions[row.id] = { action: "skip" };
        }
        // Propose to skip row 24 (Aisha's dinner at Thalassa which has notes saying Aisha logged wrong)
        if (row.rowNumber === 24) {
          initialResolutions[row.id] = { action: "skip" };
        }
      });
      setResolutions(initialResolutions);
    }
  }, [session]);

  const loadDefaultCSV = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/import/load-default");
      const data = await res.json();
      if (data.csvContent) {
        setCsvContent(data.csvContent);
        // Upload and parse it
        uploadCSV(data.csvContent, "expenses_export.csv");
      } else {
        alert("Could not load default CSV file.");
      }
    } catch (e: any) {
      alert("Error loading CSV: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadCSV = async (content: string, filename: string) => {
    setLoading(true);
    setImportReport(null);
    setImportStats(null);
    try {
      const res = await fetch("/api/import/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: content, filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setSession({
          id: data.sessionId,
          filename: data.filename,
          rows: data.rows,
        });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (e: any) {
      alert("Error uploading CSV: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionToggle = (rowId: string) => {
    setResolutions(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        action: prev[rowId]?.action === "import" ? "skip" : "import",
      },
    }));
  };

  const handleValueChange = (rowId: string, field: string, value: any) => {
    // Let user edit resolved values directly (e.g. adjust custom exchange rate or amount!)
    if (session) {
      const row = session.rows.find(r => r.id === rowId);
      if (row) {
        const currentResolved = resolutions[rowId]?.resolvedData || { ...row.resolvedData };
        
        if (field === "exchangeRate") {
          currentResolved.exchangeRate = parseFloat(value);
        } else if (field === "amount") {
          currentResolved.amount = Math.round(parseFloat(value) * 100);
        } else if (field === "paidBy") {
          currentResolved.paidBy = value;
        } else if (field === "description") {
          currentResolved.description = value;
        }

        setResolutions(prev => ({
          ...prev,
          [rowId]: {
            ...prev[rowId],
            resolvedData: currentResolved,
          },
        }));
      }
    }
  };

  const executeImport = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          resolutions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportStats({
          imported: data.importedCount,
          skipped: data.skippedCount,
        });
        setImportReport(data.report);
        setSession(null); // Clear session as it's completed
      } else {
        alert("Import confirmation failed: " + data.error);
      }
    } catch (e: any) {
      alert("Error confirming import: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation for the dashboard
  const totalRows = session?.rows.length || 0;
  const anomalyRows = session?.rows.filter(r => r.status === "anomaly").length || 0;
  const cleanRows = totalRows - anomalyRows;

  return (
    <div className="app-container">
      <Navbar />
      <WalkthroughGuide />
      
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Step 1: Upload / Load CSV */}
        {!session && !importReport && (
          <div className="glass-card" style={{ padding: "3.5rem 2rem", textAlign: "center", borderTop: "4px solid var(--color-primary)" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(79, 70, 229, 0.06)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              marginBottom: "1.5rem"
            }}>
              📥
            </div>
            <h1 style={{ marginBottom: "0.75rem", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Interactive CSV Importer
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: "1.6" }}>
              Upload the flatmate spreadsheet export `expenses_export.csv`. Our evaluation engine will identify 20+ types of data anomalies and let you approve proposed resolutions before writing to the SQLite database.
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button 
                onClick={loadDefaultCSV} 
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.75rem", fontSize: "0.9rem", fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? "Parsing spreadsheet..." : "⚡ Auto-Load & Stage expenses_export.csv"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Interactive Staging Dashboard */}
        {session && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Session Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div className="glass-card" style={{ padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Spreadsheet File</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 750, marginTop: "6px", color: "var(--text-primary)" }}>{session.filename}</div>
              </div>
              <div className="glass-card" style={{ padding: "1.25rem", textAlign: "center", borderLeft: "4px solid var(--color-secondary)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Rows</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>{totalRows}</div>
              </div>
              <div className="glass-card" style={{ padding: "1.25rem", textAlign: "center", borderLeft: "4px solid var(--color-success)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Clean Rows</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)", marginTop: "4px" }}>{cleanRows}</div>
              </div>
              <div className="glass-card" style={{ padding: "1.25rem", textAlign: "center", borderLeft: "4px solid var(--color-warning)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Anomaly Rows</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-warning)", marginTop: "4px" }}>{anomalyRows}</div>
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="glass-card" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Staging Import Area</h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Review parsed transactions, resolve duplicates, verify conversion rates, and import.</p>
                </div>
                <button 
                  onClick={executeImport} 
                  className="btn btn-primary"
                  style={{ fontWeight: 600 }}
                  disabled={loading}
                >
                  {loading ? "Writing to DB..." : "✅ Approve & Ingest Staging"}
                </button>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: "70px" }}>Row</th>
                      <th style={{ width: "80px" }}>Import?</th>
                      <th style={{ width: "110px" }}>Date</th>
                      <th>Description</th>
                      <th>Paid By</th>
                      <th style={{ textAlign: "right", width: "130px" }}>Amount</th>
                      <th>Split Details</th>
                      <th style={{ width: "150px" }}>Status / Anomalies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.rows.map((row) => {
                      const isImporting = resolutions[row.id]?.action === "import";
                      const currentResolved = resolutions[row.id]?.resolvedData || row.resolvedData;
                      const hasAnomalies = row.anomalies.length > 0;
                      const isExpanded = expandedRow === row.id;

                      return (
                        <Fragment key={row.id}>
                          <tr 
                            style={{ 
                              cursor: "pointer",
                              opacity: !isImporting ? 0.45 : 1,
                              textDecoration: !isImporting ? "line-through" : "none",
                              background: isExpanded ? "rgba(99, 102, 241, 0.03)" : "transparent"
                            }}
                            onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                          >
                            <td style={{ fontWeight: 700, color: "var(--text-secondary)" }}>#{row.rowNumber}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={isImporting} 
                                onChange={() => handleActionToggle(row.id)}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                            </td>
                            <td>
                              {hasAnomalies && row.anomalies.some(a => a.field === "date") ? (
                                <span style={{ color: "var(--color-warning)", fontWeight: 700 }}>{currentResolved.date}</span>
                              ) : (
                                currentResolved.date
                              )}
                            </td>
                            <td>
                              <div><strong style={{ color: "var(--text-primary)" }}>{currentResolved.description}</strong></div>
                              {currentResolved.notes && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                  📝 {currentResolved.notes}
                                </div>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {hasAnomalies && row.anomalies.some(a => a.field === "paidBy") ? (
                                <select 
                                  value={currentResolved.paidBy} 
                                  onChange={(e) => handleValueChange(row.id, "paidBy", e.target.value)}
                                  className="form-select"
                                  style={{ width: "95px", padding: "4px 8px", fontSize: "0.8rem", border: "1px solid var(--color-warning)" }}
                                >
                                  <option value="Aisha">Aisha</option>
                                  <option value="Rohan">Rohan</option>
                                  <option value="Priya">Priya</option>
                                  <option value="Meera">Meera</option>
                                  <option value="Dev">Dev</option>
                                  <option value="Sam">Sam</option>
                                </select>
                              ) : (
                                currentResolved.paidBy
                              )}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700 }} onClick={(e) => e.stopPropagation()}>
                              {currentResolved.currency === "USD" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "0.85rem", color: "var(--color-secondary)", fontWeight: 800 }}>
                                    ${(currentResolved.amount / 100).toFixed(2)}
                                  </span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                                    ₹{((currentResolved.amount / 100) * currentResolved.exchangeRate).toFixed(0)}
                                  </span>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", marginTop: "2px" }}>
                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Rate:</span>
                                    <input 
                                      type="number" 
                                      value={currentResolved.exchangeRate}
                                      step="0.1"
                                      onChange={(e) => handleValueChange(row.id, "exchangeRate", e.target.value)}
                                      className="form-input"
                                      style={{ width: "45px", padding: "2px 4px", fontSize: "0.75rem", textAlign: "right" }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-primary)" }}>₹{(currentResolved.amount / 100).toFixed(2)}</span>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{currentResolved.splitType}</span>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                                {currentResolved.splitWith.join(", ")}
                              </div>
                            </td>
                            <td>
                              {hasAnomalies ? (
                                <span className="badge badge-warning" style={{ fontSize: "0.7rem", display: "inline-flex", gap: "4px", padding: "3px 8px" }}>
                                  ⚠️ {row.anomalies.length} Issues {isExpanded ? "▲" : "▼"}
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>Clean Row</span>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Details Sub-Row */}
                          {isExpanded && (
                            <tr style={{ background: "#f8fafc" }}>
                              <td colSpan={8} style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                    <strong>Raw CSV Segment:</strong> <code style={{ fontFamily: "var(--font-mono)", background: "#ffffff", padding: "4px 8px", borderRadius: "6px", color: "var(--color-primary)", border: "1px solid var(--border-color)" }}>{row.rawLine}</code>
                                  </div>
                                  
                                  {hasAnomalies && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Detected Anomaly Alerts</div>
                                      {row.anomalies.map((a, idx) => (
                                        <div 
                                          key={idx} 
                                          style={{ 
                                            fontSize: "0.8rem", 
                                            background: a.severity === "error" ? "var(--color-error-bg)" : "var(--color-warning-bg)",
                                            color: a.severity === "error" ? "var(--color-error)" : "var(--color-warning)",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            border: `1px solid ${a.severity === "error" ? "rgba(225,29,72,0.15)" : "rgba(217,119,6,0.15)"}`
                                          }}
                                        >
                                          <strong>{a.type.toUpperCase()}:</strong> {a.message}
                                          <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "4px", fontWeight: 700 }}>
                                            💡 Proposed Action: {a.proposedResolution}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {row.splitDetails && (
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                      <strong>Raw Split Details:</strong> <code style={{ fontFamily: "var(--font-mono)", background: "#ffffff", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>{row.splitDetails || "None"}</code>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: SUCCESS & IMPORT REPORT DISPLAY */}
        {importReport && importStats && (
          <div className="glass-card" style={{ padding: "3rem 2rem", borderTop: "4px solid var(--color-success)" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <span style={{ fontSize: "3rem" }}>🎉</span>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-success)", marginTop: "0.75rem" }}>
                Import Completed Successfully
              </h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                The relational database splits have been populated with validated and cleaned transactions.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "3rem", marginTop: "2rem" }}>
                <div>
                  <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--color-success)" }}>
                    {importStats.imported}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginTop: "4px" }}>
                    Imported Records
                  </div>
                </div>
                <div style={{ borderRight: "1px solid var(--border-color)" }}></div>
                <div>
                  <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-secondary)" }}>
                    {importStats.skipped}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginTop: "4px" }}>
                    Skipped Duplicates
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderBottom: "1px solid var(--border-color)", marginBottom: "2rem" }} />

            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
                📋 Import Audit Trail Report (JSON Format Available)
              </h2>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
                <button 
                  onClick={() => {
                    const text = JSON.stringify(importReport, null, 2);
                    navigator.clipboard.writeText(text);
                    alert("Import Report copied to clipboard!");
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", fontWeight: 600 }}
                >
                  📋 Copy JSON Log
                </button>
                <button 
                  onClick={() => {
                    const element = document.createElement("a");
                    const file = new Blob([JSON.stringify(importReport, null, 2)], {type: 'application/json'});
                    element.href = URL.createObjectURL(file);
                    element.download = "import_report.json";
                    document.body.appendChild(element);
                    element.click();
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", fontWeight: 600 }}
                >
                  💾 Download JSON Log
                </button>
                <button 
                  onClick={() => {
                    setImportReport(null);
                    setSession(null);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", marginLeft: "auto", fontWeight: 600 }}
                >
                  Import Another CSV
                </button>
              </div>

              <div className="table-container" style={{ maxHeight: "400px" }}>
                <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "70px" }}>Row</th>
                      <th>Description</th>
                      <th>Anomalies Logged</th>
                      <th style={{ width: "200px" }}>Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importReport.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: "var(--text-secondary)" }}>#{row.rowNumber}</td>
                        <td><strong style={{ color: "var(--text-primary)" }}>{row.description}</strong></td>
                        <td>
                          {row.anomalies.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {row.anomalies.map((a: any, aIdx: number) => (
                                <div key={aIdx} style={{ fontSize: "0.75rem", color: a.severity === "error" ? "var(--color-error)" : "var(--color-warning)", fontWeight: 500 }}>
                                  ⚠️ {a.type}: {a.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600 }}>None (Clean Transaction)</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                            {row.actionTaken}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
