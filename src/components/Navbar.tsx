"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<string>("Aisha");

  useEffect(() => {
    const savedUser = localStorage.getItem("current_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      localStorage.setItem("current_user", "Aisha");
    }
  }, []);

  const handleUserChange = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem("current_user", user);
    // Dispatch a custom event to notify other components of the login change
    window.dispatchEvent(new Event("user-login-change"));
  };

  return (
    <nav className="app-navbar glass-card" style={{ marginBottom: "2rem" }}>
      <div className="app-logo">
        <span style={{ fontSize: "1.5rem" }}>⚡</span> SplitSync
      </div>
      
      <div className="nav-links">
        <Link 
          href="/import" 
          className={`nav-link ${pathname === "/import" ? "active" : ""}`}
        >
          📥 Import CSV
        </Link>
        <Link 
          href="/balances" 
          className={`nav-link ${pathname === "/balances" ? "active" : ""}`}
        >
          ⚖️ Balances
        </Link>
        <Link 
          href="/expenses" 
          className={`nav-link ${pathname === "/expenses" ? "active" : ""}`}
        >
          💸 Group Expenses
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>View Persona:</span>
        <select 
          value={currentUser} 
          onChange={(e) => handleUserChange(e.target.value)}
          className="form-select"
          style={{ width: "120px", padding: "6px 10px", fontSize: "0.85rem" }}
        >
          <option value="Aisha">Aisha</option>
          <option value="Rohan">Rohan</option>
          <option value="Priya">Priya</option>
          <option value="Meera">Meera (Left March)</option>
          <option value="Sam">Sam (Joined April)</option>
          <option value="Dev">Dev (Trip Guest)</option>
        </select>
      </div>
    </nav>
  );
}
