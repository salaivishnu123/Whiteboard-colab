import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import "../styles/common.css";

const buildInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ME";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ME";
};

export default function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" role="presentation" onClick={() => navigate(user?.role === "Administrator" ? "/admin-dashboard" : "/workspace")}>
        <div className="navbar-logo">WB</div>
        <div>
          <h1 className="logo-text">Whiteboard Collab</h1>
          <span className="navbar-tagline">Design. Ideate. Collaborate without friction.</span>
        </div>
      </div>

      <div className="nav-actions">

        <div className="nav-user">
          <div className="nav-user-meta">
            <span className="nav-user-name">{user?.name || "Guest"}</span>
            <span className="nav-user-email">{user?.email}</span>
          </div>
          <div className="nav-user-avatar" aria-hidden>{buildInitials(user?.name)}</div>
        </div>

        <button className="nav-pill danger" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}