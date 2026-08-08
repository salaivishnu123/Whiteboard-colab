import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  listWorkspaces, 
  createWorkspace, 
  listWhiteboards, 
  createWhiteboard, 
  updateWhiteboardName, 
  deleteWhiteboard,
  logout 
} from "../services/api";
import "../styles/dashboard.css";

export default function Dashboard({ activeView = "dashboard" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Guest User", email: "guest@example.com", role: "Collaborator" });
  
  // Platform Lists
  const [workspaces, setWorkspaces] = useState([]);
  const [whiteboards, setWhiteboards] = useState([]);
  
  // Interactive UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [newWorkspaceData, setNewWorkspaceData] = useState({ name: "", description: "" });
  const [newBoardData, setNewBoardData] = useState({ name: "", workspaceId: "" });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("••••••••");
  
  // Persisted metadata states
  const [metadata, setMetadata] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [theme, setTheme] = useState("dark");
  
  // Static mock states
  const [onlineMembers] = useState([
    { name: "Alice Jenkins", email: "alice@example.com", status: "online" },
    { name: "Bob Miller", email: "bob@example.com", status: "online" },
    { name: "Charlie Davis", email: "charlie@example.com", status: "offline" },
    { name: "Dave Wilson", email: "dave@example.com", status: "online" }
  ]);

  // Load basic configurations and profile data
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setProfileName(parsed.name || "Active Member");
      }
    } catch (_) {}

    // Theme initialization
    const storedTheme = localStorage.getItem("dashboard_theme") || "dark";
    setTheme(storedTheme);
    if (storedTheme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }

    // Persisted Metadata
    try {
      const storedMeta = localStorage.getItem("board_metadata");
      if (storedMeta) {
        setMetadata(JSON.parse(storedMeta));
      } else {
        setMetadata({});
      }
    } catch (_) {}

    // Mock Notifications init
    try {
      const storedNotifs = localStorage.getItem("dashboard_notifications");
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      } else {
        const defaultNotifs = [
          { id: 1, type: "share", content: "Alice Jenkins shared 'Sprint Planning Board' with you", read: false, time: "2 hours ago" },
          { id: 2, type: "comment", content: "Bob Miller commented on 'Flowchart' whiteboard", read: false, time: "4 hours ago" },
          { id: 3, type: "invite", content: "Charlie Davis invited you to join 'Marketing Workspace'", read: true, time: "Yesterday" },
          { id: 4, type: "system", content: "System: New template 'Kanban Board' added to gallery", read: false, time: "2 days ago" }
        ];
        localStorage.setItem("dashboard_notifications", JSON.stringify(defaultNotifs));
        setNotifications(defaultNotifs);
      }
    } catch (_) {}

    // Mock Activities init
    try {
      const storedActs = localStorage.getItem("dashboard_activities");
      if (storedActs) {
        setActivities(JSON.parse(storedActs));
      } else {
        const defaultActs = [
          { id: 1, user: "Alice Jenkins", action: "edited board", target: "Sprint Planning Board", time: "10m ago" },
          { id: 2, user: "Bob Miller", action: "invited you to", target: "Marketing Workspace", time: "1h ago" },
          { id: 3, user: "Charlie Davis", action: "commented on", target: "Design Wireframes", time: "Yesterday" },
          { id: 4, user: "System", action: "exported board", target: "Flowchart (as PDF)", time: "2 days ago" },
          { id: 5, user: "Dave Wilson", action: "joined workspace", target: "Engineering Hub", time: "3 days ago" }
        ];
        localStorage.setItem("dashboard_activities", JSON.stringify(defaultActs));
        setActivities(defaultActs);
      }
    } catch (_) {}
  }, []);

  // Fetch API resources
  const fetchResources = async () => {
    if (!user.email) return;
    try {
      // 1. Fetch Workspaces
      const res = await listWorkspaces(user.email, 0, 100);
      const wsList = res.content || [];
      setWorkspaces(wsList);

      // 2. Fetch Whiteboards for all workspaces
      const allBoards = await listWhiteboards();
      // Filter whiteboards where workspaceId is one of the workspaces the user has access to
      const wsIds = new Set(wsList.map((w) => w.id));
      const filteredBoards = allBoards.filter((wb) => wsIds.has(wb.workspaceId));
      setWhiteboards(filteredBoards);
    } catch (e) {
      console.error("Failed to load user dashboard resources", e);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user.email]);

  // Redirection checks for admin
  useEffect(() => {
    if (user.role === "Administrator") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Save metadata changes
  const saveMetadata = (updated) => {
    setMetadata(updated);
    localStorage.setItem("board_metadata", JSON.stringify(updated));
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("dashboard_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  // Workspace Creation
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceData.name || !newWorkspaceData.description) {
      alert("Please fill name and description!");
      return;
    }
    try {
      const payload = {
        name: newWorkspaceData.name,
        ownerEmail: user.email,
        members: [user.email]
      };
      await createWorkspace(payload);
      setNewWorkspaceData({ name: "", description: "" });
      setShowWorkspaceModal(false);
      fetchResources();
      
      // Log activity
      addActivity("You created workspace", newWorkspaceData.name);
    } catch (e) {
      console.error("Workspace creation failed", e);
    }
  };

  // Board Creation
  const handleCreateBoard = async (wsId = null, templateName = null) => {
    const targetWorkspaceId = wsId || newBoardData.workspaceId || (workspaces[0] && workspaces[0].id);
    if (!targetWorkspaceId) {
      alert("Please select or create a workspace first!");
      return;
    }
    const name = templateName ? `My ${templateName}` : newBoardData.name || "Untitled Board";

    try {
      const payload = {
        name,
        workspaceId: Number(targetWorkspaceId),
        canvasData: ""
      };
      const created = await createWhiteboard(payload);
      setShowBoardModal(false);
      setNewBoardData({ name: "", workspaceId: "" });
      fetchResources();

      // Set visibility / mock meta
      const updatedMeta = { ...metadata };
      updatedMeta[created.id] = {
        pinned: false,
        favorite: false,
        visibility: "Private",
        lastEdited: "Just now"
      };
      saveMetadata(updatedMeta);

      // Log activity
      addActivity("You created board", name);

      navigate(`/whiteboard/${created.id}`);
    } catch (e) {
      console.error("Whiteboard creation failed", e);
    }
  };

  // Board Metadata Toggles (Pin / Favorite / Visibility / Delete / Rename)
  const handleTogglePin = (id) => {
    const updated = { ...metadata };
    const current = updated[id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "1d ago" };
    updated[id] = { ...current, pinned: !current.pinned };
    saveMetadata(updated);
  };

  const handleToggleFavorite = (id) => {
    const updated = { ...metadata };
    const current = updated[id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "1d ago" };
    updated[id] = { ...current, favorite: !current.favorite };
    saveMetadata(updated);
  };

  const handleRenameBoard = async (id, currentName) => {
    const newName = window.prompt("Enter new board name:", currentName);
    if (!newName || newName.trim() === "") return;
    try {
      await updateWhiteboardName(id, newName);
      fetchResources();
      addActivity("You renamed board to", newName);
    } catch (e) {
      console.error("Failed to rename whiteboard", e);
    }
  };

  const handleDeleteBoard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete board "${name}"?`)) {
      return;
    }
    try {
      await deleteWhiteboard(id);
      fetchResources();
      addActivity("You deleted board", name);
    } catch (e) {
      console.error("Failed to delete whiteboard", e);
    }
  };

  // Workspace Boards count calculation
  const getBoardsCount = (wsId) => {
    return whiteboards.filter((w) => w.workspaceId === wsId).length;
  };

  // Activity logger
  const addActivity = (action, target) => {
    const nextActs = [
      { id: Date.now(), user: user.name, action, target, time: "Just now" },
      ...activities
    ];
    setActivities(nextActs);
    localStorage.setItem("dashboard_activities", JSON.stringify(nextActs));
  };

  // Notifications read toggler
  const markNotificationRead = (id) => {
    const nextNotifs = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(nextNotifs);
    localStorage.setItem("dashboard_notifications", JSON.stringify(nextNotifs));
  };

  const markAllNotificationsRead = () => {
    const nextNotifs = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(nextNotifs);
    localStorage.setItem("dashboard_notifications", JSON.stringify(nextNotifs));
  };

  // Profile Save
  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: profileName };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setEditMode(false);
    alert("Profile saved successfully!");
  };

  // Dynamic searches
  const filteredBoardsList = useMemo(() => {
    return whiteboards.filter(
      (b) => b.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [whiteboards, searchQuery]);

  const filteredWorkspacesList = useMemo(() => {
    return workspaces.filter(
      (w) => w.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaces, searchQuery]);

  // Statistics Computations
  const stats = useMemo(() => {
    // Distinct collaborators count
    const membersSet = new Set();
    workspaces.forEach((w) => {
      w.members?.forEach((m) => membersSet.add(m));
    });
    const collaboratorsCount = membersSet.size > 0 ? membersSet.size : 0;
    
    // Starred count
    const editedCount = Object.keys(metadata).length;

    return [
      { label: "My Boards", value: String(whiteboards.length).padStart(2, "0"), icon: "📋" },
      { label: "My Workspaces", value: String(workspaces.length).padStart(2, "0"), icon: "🗂" },
      { label: "Collaborators", value: String(collaboratorsCount).padStart(2, "0"), icon: "🤝" },
      { label: "Boards Edited This Week", value: String(editedCount).padStart(2, "0"), icon: "📈" }
    ];
  }, [workspaces, whiteboards, metadata]);

  // Templates definition
  const templates = [
    { title: "Blank Canvas", desc: "Start from scratch", icon: "🎨" },
    { title: "Brainstorm Board", desc: "Sticky notes and clusters", icon: "💡" },
    { title: "Flowchart", desc: "Diagram shapes and connectors", icon: "📊" },
    { title: "Storyboard", desc: "Map product storytelling frames", icon: "🎬" },
    { title: "Kanban Board", desc: "Agile task workflow board", icon: "📋" },
    { title: "Mind Map", desc: "Brainstorm tree links", icon: "🧠" },
    { title: "Wireframe", desc: "UI Mockup components", icon: "🖥️" },
    { title: "Meeting Notes", desc: "Collaborative logs & tasks", icon: "📝" }
  ];

  // Unread notifications count
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Favorites/Pinned boards
  const favoriteBoards = useMemo(() => {
    return filteredBoardsList.filter((b) => metadata[b.id]?.favorite || metadata[b.id]?.pinned);
  }, [filteredBoardsList, metadata]);

  // Shared With Me (where owner email is not current user email)
  const sharedBoards = useMemo(() => {
    return filteredBoardsList.filter((b) => {
      const ws = workspaces.find((w) => w.id === b.workspaceId);
      return ws && ws.ownerEmail !== user.email;
    });
  }, [filteredBoardsList, workspaces, user.email]);

  return (
    <div className="dashboard-page" style={{ padding: "1.5rem" }}>
      {/* 1. Header with greeting, search, notification, profile & main CTAs */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem",
        borderBottom: "1px solid var(--glass-border)",
        paddingBottom: "1.25rem"
      }}>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 700, margin: 0 }}>
            Welcome back, <span style={{ color: "var(--color-primary)" }}>{user.name}</span>!
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            Here is what's happening with your canvases today.
          </p>
        </div>

        {/* Global Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          <input
            type="text"
            placeholder="🔍 Search boards & workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ margin: 0, paddingLeft: "2.5rem", height: "42px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Notifications Icon */}
          <div 
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => navigate("/workspace/notifications")}
          >
            <span style={{ fontSize: "1.5rem" }} role="img" aria-label="notifications">🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "var(--color-danger)",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontWeight: "bold"
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          {/* User Profile dropdown */}
          <div style={{ position: "relative" }}>
            <div 
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "white",
                cursor: "pointer",
                border: "2px solid var(--glass-border-hover)"
              }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {user.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
            </div>

            {showProfileDropdown && (
              <div style={{
                position: "absolute",
                top: "50px",
                right: 0,
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border-hover)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                borderRadius: "12px",
                padding: "0.5rem 0",
                width: "200px",
                zIndex: 100,
                backdropFilter: "blur(12px)"
              }}>
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate("/workspace/profile"); }}
                  style={{ display: "block", width: "100%", background: "none", border: "none", color: "var(--color-text-main)", padding: "10px 15px", textAlign: "left", cursor: "pointer" }}
                >
                  👤 View Profile
                </button>
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate("/workspace/settings"); }}
                  style={{ display: "block", width: "100%", background: "none", border: "none", color: "var(--color-text-main)", padding: "10px 15px", textAlign: "left", cursor: "pointer" }}
                >
                  ⚙️ Settings
                </button>
                <button 
                  onClick={() => { setShowProfileDropdown(false); handleToggleTheme(); }}
                  style={{ display: "block", width: "100%", background: "none", border: "none", color: "var(--color-text-main)", padding: "10px 15px", textAlign: "left", cursor: "pointer" }}
                >
                  🌓 Toggle {theme === "dark" ? "Light" : "Dark"} Theme
                </button>
                <hr style={{ border: "0", borderTop: "1px solid var(--glass-border)", margin: "4px 0" }} />
                <button 
                  onClick={handleLogout}
                  style={{ display: "block", width: "100%", background: "none", border: "none", color: "var(--color-danger)", padding: "10px 15px", textAlign: "left", cursor: "pointer", fontWeight: "bold" }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          {activeView === "boards" && (
            <button className="btn" onClick={() => setShowBoardModal(true)}>+ New Board</button>
          )}
          {activeView === "workspaces" && (
            <button className="btn ghost" onClick={() => setShowWorkspaceModal(true)}>+ New Workspace</button>
          )}
        </div>
      </header>

      {/* 2. STATS OVERVIEW SECTION (Only visible on Main Dashboard Overview tab) */}
      {activeView === "dashboard" && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {stats.map((s) => (
            <div key={s.label} className="dash-stat-card" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>{s.label}</span>
                <strong style={{ fontSize: "2rem", display: "block", marginTop: "4px" }}>{s.value}</strong>
              </div>
              <div style={{ fontSize: "2.2rem", opacity: 0.9 }}>{s.icon}</div>
            </div>
          ))}
        </section>
      )}

      {/* 3. DYNAMIC VIEWS INTEGRATED TO TABS */}

      {/* VIEW: OVERVIEW (Main Hub) */}
      {activeView === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "2rem" }} className="dash-grid">
          <div className="dash-main" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Favorites Section */}
            {favoriteBoards.length > 0 && (
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem 0" }}>⭐ Starred & Pinned Boards</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {favoriteBoards.map((b) => (
                    <div key={b.id} className="template-card" style={{ minHeight: "130px", justifyContent: "space-between" }}>
                      <div>
                        <h4 style={{ margin: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{b.name}</span>
                          <span style={{ fontSize: "1rem" }}>📌</span>
                        </h4>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                          Workspace: {workspaces.find((w) => w.id === b.workspaceId)?.name || "Default"}
                        </p>
                      </div>
                      <button className="btn" style={{ padding: "5px 10px", fontSize: "0.75rem", width: "100%", marginTop: "1rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                        Edit Board
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Boards Section */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ margin: 0 }}>Recent Boards</h3>
                <button className="nav-pill" onClick={() => navigate("/workspace/boards")}>View All Boards</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredBoardsList.length > 0 ? (
                  filteredBoardsList.slice(0, 5).map((b) => {
                    const ws = workspaces.find((w) => w.id === b.workspaceId);
                    const meta = metadata[b.id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "1d ago" };
                    
                    return (
                      <div key={b.id} className="recent-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0 }}>{b.name}</h4>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              background: meta.visibility === "Shared" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
                              color: meta.visibility === "Shared" ? "var(--color-primary)" : "var(--color-text-muted)"
                            }}>
                              {meta.visibility}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Workspace: {ws?.name || "Private"} • Owner: {ws?.ownerEmail || "Me"} • Edited: {meta.lastEdited}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Pin */}
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleTogglePin(b.id)}
                            title="Pin Board"
                          >
                            {meta.pinned ? "📌" : "📍"}
                          </button>
                          
                          {/* Favorite */}
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleToggleFavorite(b.id)}
                            title="Favorite Board"
                          >
                            {meta.favorite ? "⭐" : "☆"}
                          </button>

                          {/* Rename */}
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleRenameBoard(b.id, b.name)}
                            title="Rename Board"
                          >
                            ✏️
                          </button>

                          {/* Delete */}
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleDeleteBoard(b.id, b.name)}
                            title="Delete Board"
                          >
                            🗑️
                          </button>

                          <button className="btn" style={{ padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                            Continue Editing
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                    No boards found. Click "New Board" to start mapping your strategy!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="dash-aside" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            

            {/* Short Activity Panel */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0" }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.8rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-primary)", marginTop: "6px" }} />
                    <div>
                      <strong>{act.user}</strong> {act.action} <span>{act.target}</span>
                      <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.7rem", marginTop: "2px" }}>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MY BOARDS */}
      {activeView === "boards" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>My Boards Directory</h3>
              <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Complete inventory of your team whiteboards.</p>
            </div>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filteredBoardsList.length > 0 ? (
              filteredBoardsList.map((b) => {
                const meta = metadata[b.id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "1d ago" };
                const ws = workspaces.find((w) => w.id === b.workspaceId);
                return (
                  <div key={b.id} className="template-card" style={{ padding: "1.25rem", minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{b.name}</h4>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => handleTogglePin(b.id)}>
                            {meta.pinned ? "📌" : "📍"}
                          </button>
                          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => handleToggleFavorite(b.id)}>
                            {meta.favorite ? "⭐" : "☆"}
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                        Workspace: {ws?.name || "N/A"}<br />
                        Last updated: {meta.lastEdited}<br />
                        Access: {meta.visibility}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                      <button className="btn" style={{ flex: 1, padding: "8px", fontSize: "0.8rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                        Open Board
                      </button>
                      <button className="btn ghost" style={{ padding: "8px", fontSize: "0.8rem" }} onClick={() => handleRenameBoard(b.id, b.name)}>
                        Rename
                      </button>
                      <button className="btn ghost" style={{ padding: "8px", fontSize: "0.8rem", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={() => handleDeleteBoard(b.id, b.name)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                No strategy boards found. Create a board to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: WORKSPACES */}
      {activeView === "workspaces" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem 0" }}>Team Workspaces</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {filteredWorkspacesList.length > 0 ? (
              filteredWorkspacesList.map((ws) => (
                <div key={ws.id} className="template-card" style={{ minHeight: "170px", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{ws.name}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                      Owner: {ws.ownerEmail}<br />
                      Collaborators: {ws.members?.length || 0} members<br />
                      Total Whiteboards: {getBoardsCount(ws.id)} boards
                    </p>
                  </div>
                  <button className="btn" style={{ width: "100%", padding: "8px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => navigate(`/workspace/${ws.id}`)}>
                    Open Workspace
                  </button>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                No workspaces created yet. Create a workspace to bundle your whiteboards!
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SHARED WITH ME */}
      {activeView === "shared" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Shared With Me</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Boards created by other members inside workspaces you collaborate on.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {sharedBoards.length > 0 ? (
              sharedBoards.map((b) => {
                const ws = workspaces.find((w) => w.id === b.workspaceId);
                const meta = metadata[b.id] || { lastEdited: "1d ago" };
                return (
                  <div key={b.id} className="template-card" style={{ minHeight: "160px", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{b.name}</h4>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                        Shared By: {ws?.ownerEmail || "N/A"}<br />
                        Permission: Editor<br />
                        Last Updated: {meta.lastEdited}
                      </p>
                    </div>
                    <button className="btn" style={{ width: "100%", padding: "8px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                      Open Board
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                No boards shared with you yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: TEMPLATES */}
      {activeView === "templates" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem 0" }}>Strategy Templates Gallery</h3>
          
          <div className="template-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {templates.map((t) => (
              <div key={t.title} className="template-card" style={{ minHeight: "180px", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{t.icon}</div>
                  <h4 style={{ margin: 0 }}>{t.title}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "4px" }}>{t.desc}</p>
                </div>
                <button className="btn" style={{ width: "100%", padding: "6px 12px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => handleCreateBoard(null, t.title)}>
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ACTIVITY */}
      {activeView === "activity" && (
        <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "700px" }}>
          <h3 style={{ margin: "0 0 1.25rem 0" }}>System Activity Audit</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activities.map((act) => (
              <div key={act.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-secondary)", marginTop: "6px" }} />
                <div>
                  <span style={{ fontSize: "0.95rem" }}><strong>{act.user}</strong> {act.action} <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>{act.target}</span></span>
                  <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NOTIFICATIONS */}
      {activeView === "notifications" && (
        <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "600px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0 }}>Inbox Notifications</h3>
            {unreadCount > 0 && <button className="nav-pill" onClick={markAllNotificationsRead}>Mark all as read</button>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "10px 14px", 
                    borderRadius: "8px",
                    background: n.read ? "rgba(255,255,255,0.02)" : "rgba(99, 102, 241, 0.08)",
                    border: `1px solid ${n.read ? "rgba(255,255,255,0.04)" : "rgba(99, 102, 241, 0.2)"}`
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.9rem", color: "var(--color-text-main)", display: "block" }}>{n.content}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px", display: "block" }}>{n.time}</span>
                  </div>
                  {!n.read && (
                    <button 
                      className="nav-pill" 
                      style={{ padding: "4px 10px", fontSize: "0.72rem" }}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                No notifications inbox.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: PROFILE */}
      {activeView === "profile" && (
        <div className="glass-panel" style={{ padding: "2rem", maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 1.5rem 0" }}>User Account Profile</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Full Name</label>
              {editMode ? (
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ margin: "4px 0 0 0" }} />
              ) : (
                <div style={{ fontSize: "1.1rem", fontWeight: 600, padding: "8px 0" }}>{user.name}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Email Address</label>
              <div style={{ fontSize: "1rem", color: "var(--color-text-muted)", padding: "8px 0" }}>{user.email}</div>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Account Role</label>
              <div style={{ fontSize: "1rem", color: "var(--color-primary)", padding: "8px 0", fontWeight: "bold" }}>{user.role}</div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "12px" }}>
              {editMode ? (
                <>
                  <button className="btn" onClick={handleSaveProfile}>Save Changes</button>
                  <button className="btn ghost" onClick={() => setEditMode(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn" onClick={() => setEditMode(true)}>Edit Profile</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS */}
      {activeView === "settings" && (
        <div className="glass-panel" style={{ padding: "2rem", maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 1.5rem 0" }}>Application Settings</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block" }}>Security Password</label>
              <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} style={{ margin: "6px 0" }} />
              <button className="nav-pill" style={{ marginTop: "4px" }} onClick={() => { alert("Password changed successfully!"); setProfilePassword("••••••••"); }}>
                Change Password
              </button>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid var(--glass-border)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block" }}>Theme Mode</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Toggle Light Mode or Dark Mode theme styles.</span>
              </div>
              <button className="btn ghost" onClick={handleToggleTheme}>
                {theme === "dark" ? "☀️ Switch Light" : "🌙 Switch Dark"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create team workspace</h3>
            <input 
              type="text" 
              placeholder="Workspace Name" 
              value={newWorkspaceData.name} 
              onChange={(e) => setNewWorkspaceData({ ...newWorkspaceData, name: e.target.value })} 
            />
            <input 
              type="text" 
              placeholder="Description" 
              value={newWorkspaceData.description} 
              onChange={(e) => setNewWorkspaceData({ ...newWorkspaceData, description: e.target.value })} 
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={handleCreateWorkspace}>Create</button>
              <button className="btn" onClick={() => setShowWorkspaceModal(false)} style={{ background: "var(--color-danger)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create new whiteboard board</h3>
            <input 
              type="text" 
              placeholder="Board Name" 
              value={newBoardData.name} 
              onChange={(e) => setNewBoardData({ ...newBoardData, name: e.target.value })} 
            />
            <select 
              value={newBoardData.workspaceId} 
              onChange={(e) => setNewBoardData({ ...newBoardData, workspaceId: e.target.value })}
              style={{ padding: "10px", borderRadius: "10px", margin: "8px 0", background: "rgba(15,23,42,0.85)", color: "white" }}
            >
              <option value="">-- Select Workspace --</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={() => handleCreateBoard()}>Create</button>
              <button className="btn" onClick={() => setShowBoardModal(false)} style={{ background: "var(--color-danger)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}