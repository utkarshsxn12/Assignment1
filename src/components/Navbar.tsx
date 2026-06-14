"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    const savedUser = localStorage.getItem("current_user");
    if (!savedUser && pathname !== "/login") {
      router.push("/login");
    } else if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, [pathname, router]);

  const handleUserChange = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem("current_user", user);
    window.dispatchEvent(new Event("user-login-change"));
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    router.push("/login");
  };

  if (pathname === "/login") {
    return (
      <nav className="app-navbar glass-card" style={{ display: "flex", justifyContent: "center" }}>
        <div className="app-logo">
          ⚡ SplitSync Evaluation Gateway
        </div>
      </nav>
    );
  }

  return (
    <nav className="app-navbar glass-card">
      <div className="app-logo">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          ⚡ SplitSync
        </Link>
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

      {currentUser && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Persona:</span>
          <select 
            value={currentUser} 
            onChange={(e) => handleUserChange(e.target.value)}
            className="form-select"
            style={{ width: "100px", padding: "4px 8px", fontSize: "0.85rem" }}
          >
            <option value="Aisha">Aisha</option>
            <option value="Rohan">Rohan</option>
            <option value="Priya">Priya</option>
            <option value="Meera">Meera</option>
            <option value="Sam">Sam</option>
            <option value="Dev">Dev</option>
          </select>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", gap: "2px" }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
}
