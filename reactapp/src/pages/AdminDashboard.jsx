import React, { useEffect, useState, useMemo } from "react";
import { getAllUsers, deleteUser, listWorkspaces, deleteWorkspace } from "../services/api";
import "../styles/dashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const fetchUsers = async () => {
    try {
      const stored = localStorage.getItem("user");
      const userObj = stored ? JSON.parse(stored) : {};
      const adminEmail = userObj.email || "admin@example.com";
      const data = await getAllUsers(adminEmail);
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      showNotification("Error loading system users", "danger");
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await listWorkspaces("admin@example.com", 0, 100);
      setWorkspaces(res.content || []);
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
      showNotification("Error loading workspaces", "danger");
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchWorkspaces()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 4000);
  };

  const handleDeleteUser = async (id, name, email) => {
    if (email === "admin@example.com") {
      showNotification("Cannot delete the primary administrator account.", "danger");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}" (${email})?`)) {
      return;
    }

    try {
      const stored = localStorage.getItem("user");
      const userObj = stored ? JSON.parse(stored) : {};
      const adminEmail = userObj.email || "admin@example.com";
      await deleteUser(id, adminEmail);
      showNotification(`Successfully removed user: ${name}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      showNotification("Failed to delete user.", "danger");
    }
  };

  const handleDeleteWorkspace = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete workspace "${name}"?`)) {
      return;
    }

    try {
      await deleteWorkspace(id);
      showNotification(`Successfully deleted workspace: ${name}`);
      fetchWorkspaces();
    } catch (err) {
      console.error("Failed to delete workspace", err);
      showNotification("Failed to delete workspace.", "danger");
    }
  };

  // Search filter
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(
      (w) =>
        w.name?.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
        w.ownerEmail?.toLowerCase().includes(workspaceSearch.toLowerCase())
    );
  }, [workspaces, workspaceSearch]);

  // Statistics
  const totalUsersCount = users.length;
  const totalWorkspacesCount = workspaces.length;
  const activeCollaborators = useMemo(() => {
    return workspaces.reduce((sum, w) => sum + (w.members?.length || 0), 0);
  }, [workspaces]);

  const stats = [
    { label: "Total Platform Users", value: String(totalUsersCount).padStart(2, "0"), color: "rgba(99, 102, 241, 0.2)" },
    { label: "Total Workspaces", value: String(totalWorkspacesCount).padStart(2, "0"), color: "rgba(6, 182, 212, 0.2)" },
    { label: "Total Collaborations", value: String(activeCollaborators).padStart(2, "0"), color: "rgba(59, 130, 246, 0.2)" },
    { label: "System Status", value: "SECURE", color: "rgba(16, 185, 129, 0.2)" },
  ];

  return (
    <div className="dashboard-page" style={{ animation: "fadeIn 0.5s ease-out" }}>
      <section 
        className="dash-hero" 
        style={{ 
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.2)" 
        }}
      >
        <div>
          <h2 style={{ background: "linear-gradient(to right, #ffffff, #fca5a5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Security & Administration Console
          </h2>
          <p>
            Monitor user accounts, control active collaboration workspaces, manage resources, and ensure compliance of the whiteboard strategy workspace system.
          </p>
          <div className="quick-actions">
            <button className="btn" onClick={loadData} disabled={loading}>
              {loading ? "Refreshing..." : "🔄 Refresh Console"}
            </button>
            <button 
              className={`btn ghost ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
              style={activeTab === "users" ? { borderColor: "var(--color-primary)", background: "rgba(99, 102, 241, 0.15)" } : {}}
            >
              👥 Manage Users ({totalUsersCount})
            </button>
            <button 
              className={`btn ghost ${activeTab === "workspaces" ? "active" : ""}`}
              onClick={() => setActiveTab("workspaces")}
              style={activeTab === "workspaces" ? { borderColor: "var(--color-primary)", background: "rgba(99, 102, 241, 0.15)" } : {}}
            >
              🗂 Manage Workspaces ({totalWorkspacesCount})
            </button>
          </div>
        </div>
        <div className="dash-stats">
          {stats.map((card) => (
            <div 
              key={card.label} 
              className="dash-stat-card" 
              style={{ background: card.color, border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {notification.message && (
        <div style={{
          background: notification.type === "danger" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
          border: `1px solid ${notification.type === "danger" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
          color: notification.type === "danger" ? "#fecaca" : "#d1fae5",
          padding: "0.85rem 1.25rem",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          animation: "fadeIn 0.3s ease",
          fontSize: "0.9rem",
          fontWeight: 500
        }}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({ message: "", type: "" })}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ width: "100%", overflow: "hidden" }}>
        {activeTab === "users" ? (
          <div>
            <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>Registered Platform Accounts</h3>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)" }}>View, inspect, and remove user registrations.</p>
              </div>
              <input
                type="text"
                placeholder="🔍 Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ maxWith: "340px", width: "100%", margin: 0 }}
              />
            </header>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--color-text-muted)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>ID</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Full Name</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Email Address</th>
                    <th style={{ padding: "0.85rem 1rem" }}>System Role</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isMainAdmin = u.email === "admin@example.com";
                      return (
                        <tr 
                          key={u.id} 
                          style={{ 
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)", 
                            transition: "background 0.2s" 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.01)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td style={{ padding: "1rem" }}>{String(u.id).padStart(3, "0")}</td>
                          <td style={{ padding: "1rem", fontWeight: 600 }}>{u.name || "N/A"}</td>
                          <td style={{ padding: "1rem", color: "var(--color-text-muted)" }}>{u.email}</td>
                          <td style={{ padding: "1rem" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "99px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: isMainAdmin ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
                              color: isMainAdmin ? "#fca5a5" : "#c7d2fe",
                              border: `1px solid ${isMainAdmin ? "rgba(239, 68, 68, 0.3)" : "rgba(99, 102, 241, 0.3)"}`
                            }}>
                              {isMainAdmin ? "Administrator" : "Collaborator"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            {!isMainAdmin && (
                              <button 
                                className="nav-pill danger"
                                style={{ padding: "5px 12px", fontSize: "0.75rem" }}
                                onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                              >
                                Delete User
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                        No platform accounts found matching "{userSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>Active Team Workspaces</h3>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)" }}>Monitor, audit, and clean up active collaboration workspaces.</p>
              </div>
              <input
                type="text"
                placeholder="🔍 Search workspaces by name or owner email..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                style={{ maxWith: "340px", width: "100%", margin: 0 }}
              />
            </header>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--color-text-muted)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Workspace ID</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Workspace Name</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Creator / Owner</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Members Count</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkspaces.length > 0 ? (
                    filteredWorkspaces.map((w) => (
                      <tr 
                        key={w.id} 
                        style={{ 
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)", 
                          transition: "background 0.2s" 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.01)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "1rem" }}>{String(w.id).padStart(3, "0")}</td>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>{w.name}</td>
                        <td style={{ padding: "1rem", color: "var(--color-text-muted)" }}>{w.ownerEmail}</td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            fontSize: "0.8rem"
                          }}>
                            {w.members?.length || 0} collaborators
                          </span>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <button 
                            className="nav-pill danger"
                            style={{ padding: "5px 12px", fontSize: "0.75rem" }}
                            onClick={() => handleDeleteWorkspace(w.id, w.name)}
                          >
                            Delete Workspace
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                        No workspaces found matching "{workspaceSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
