import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/common.css";

const NavItem = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
  >
    <span className="sidebar-icon" aria-hidden>{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "Administrator";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">✦</span>
        <div>
          <strong>Whiteboard Pro</strong>
          <span>Collaboration Suite</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Overview</div>
        {isAdmin ? (
          <NavItem to="/admin-dashboard" icon="🛡" label="Admin Console" />
        ) : (
          <>
            <NavItem to="/workspace" icon="🏠" label="Dashboard" end />
            <NavItem to="/workspace/boards" icon="📋" label="My Boards" />
            <NavItem to="/workspace/workspaces" icon="🗂" label="Workspaces" />
            <NavItem to="/workspace/shared" icon="🤝" label="Shared With Me" />
            <NavItem to="/workspace/templates" icon="🎨" label="Templates" />
            <NavItem to="/workspace/activity" icon="📈" label="Activity" />
            <NavItem to="/workspace/notifications" icon="🔔" label="Notifications" />
            <NavItem to="/workspace/profile" icon="👤" label="Profile" />
            <NavItem to="/workspace/settings" icon="⚙️" label="Settings" />
          </>
        )}
      </nav>

      {!isAdmin && (
        <div className="sidebar-footer">
          <p>Need inspiration?</p>
          <button className="sidebar-footer-btn" onClick={() => navigate("/workspace/templates")}>Browse templates</button>
        </div>
      )}
    </aside>
  );
}