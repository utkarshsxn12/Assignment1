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
    if (!savedUser && pathname !== "/" && pathname !== "/login") {
      router.push("/");
    } else if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      setCurrentUser("");
    }
  }, [pathname, router]);

  const handleUserChange = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem("current_user", user);
    window.dispatchEvent(new Event("user-login-change"));
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    setCurrentUser("");
    window.dispatchEvent(new Event("user-login-change"));
    router.push("/");
  };

  // If not logged in, show a simplified centered gateway logo navbar
  if (!currentUser) {
    return (
      <nav className="app-navbar glass-card" style={{ display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div className="app-logo" style={{ fontSize: "1.25rem", fontWeight: 900, background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ⚡ SplitSync
        </div>
      </nav>
    );
  }

  return (
    <nav className="app-navbar glass-card">
      <div className="app-logo">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", fontWeight: 800 }}>
          <span style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>⚡ SplitSync</span>
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

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg-card-header)",
          border: "1px solid var(--border-color)",
          padding: "4px 10px",
          borderRadius: "8px"
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>Persona:</span>
          <select 
            value={currentUser} 
            onChange={(e) => handleUserChange(e.target.value)}
            className="form-select"
            style={{ 
              width: "90px", 
              padding: "2px 4px", 
              fontSize: "0.8rem", 
              border: "none", 
              background: "transparent",
              color: "var(--text-primary)",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="Aisha" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Aisha</option>
            <option value="Rohan" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Rohan</option>
            <option value="Priya" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Priya</option>
            <option value="Meera" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Meera</option>
            <option value="Sam" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Sam</option>
            <option value="Dev" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>Dev</option>
          </select>
        </div>
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ 
            padding: "6px 12px", 
            fontSize: "0.75rem", 
            borderRadius: "8px",
            display: "flex", 
            alignItems: "center", 
            gap: "4px" 
          }}
        >
          🚪 Exit
        </button>
      </div>
    </nav>
  );
}
