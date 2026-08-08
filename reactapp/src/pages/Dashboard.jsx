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

// Helper function to draw template shapes on an off-screen canvas and return dataUrl
const generateTemplateCanvasData = (templateTitle) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.textBaseline = "top";

  if (templateTitle === "Kanban Board") {
    const cols = [
      { title: "📌 TO DO", x: 100, color: "#e0f2fe", border: "#38bdf8", cards: ["Research Competitors", "User Interviews", "Draft Wireframes"] },
      { title: "⚡ IN PROGRESS", x: 600, color: "#fef3c7", border: "#f59e0b", cards: ["Setup Architecture", "API Integration"] },
      { title: "✅ DONE", x: 1100, color: "#dcfce7", border: "#22c55e", cards: ["Project Kickoff", "Requirement Spec"] }
    ];

    // Main header
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Sprint Kanban Board", 100, 40);

    cols.forEach((col) => {
      // Column Header Box
      ctx.fillStyle = col.color;
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(col.x, 100, 400, 800, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText(col.title, col.x + 20, 120);

      // Cards
      col.cards.forEach((card, idx) => {
        const cardY = 170 + idx * 110;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.roundRect(col.x + 15, cardY, 370, 90, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.font = "16px Inter, sans-serif";
        ctx.fillText(card, col.x + 30, cardY + 20);

        ctx.fillStyle = "#64748b";
        ctx.font = "12px Inter, sans-serif";
        ctx.fillText("High Priority • Assignee: Team", col.x + 30, cardY + 55);
      });
    });
  } else if (templateTitle === "Flowchart") {
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("User Authentication Flowchart", 100, 40);

    // Node 1: Start (Oval)
    ctx.fillStyle = "#e0e7ff";
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(650, 120, 300, 70, 35);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("User visits Login Page", 800, 145);

    // Arrow 1
    drawArrow(ctx, 800, 190, 800, 260);

    // Node 2: Process (Rect)
    ctx.fillStyle = "#f1f5f9";
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.roundRect(650, 260, 300, 70, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Enters Credentials", 800, 285);

    // Arrow 2
    drawArrow(ctx, 800, 330, 800, 400);

    // Node 3: Decision (Diamond)
    ctx.fillStyle = "#fef3c7";
    ctx.strokeStyle = "#d97706";
    ctx.beginPath();
    ctx.moveTo(800, 400);
    ctx.lineTo(950, 475);
    ctx.lineTo(800, 550);
    ctx.lineTo(650, 475);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#78350f";
    ctx.fillText("Credentials Valid?", 800, 465);

    // Arrow YES
    drawArrow(ctx, 800, 550, 800, 630);
    ctx.fillStyle = "#15803d";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText("YES", 820, 580);

    // Node 4: End Success
    ctx.fillStyle = "#dcfce7";
    ctx.strokeStyle = "#16a34a";
    ctx.beginPath();
    ctx.roundRect(650, 630, 300, 70, 35);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#14532d";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("Access Granted → Dashboard", 800, 655);

    // Arrow NO
    drawArrow(ctx, 950, 475, 1100, 475);
    ctx.fillStyle = "#b91c1c";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText("NO", 1020, 455);

    // Node 5: Error Box
    ctx.fillStyle = "#fee2e2";
    ctx.strokeStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(1100, 440, 220, 70, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#7f1d1d";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("Show Error Message", 1210, 465);

    ctx.textAlign = "left";
  } else if (templateTitle === "Brainstorm Board") {
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Brainstorming & Ideas Cluster", 100, 40);

    const notes = [
      { x: 150, y: 120, color: "#fef08a", title: "💡 Core Innovation", text: "AI-assisted canvas shapes & diagram suggestions" },
      { x: 500, y: 120, color: "#fed7aa", title: "🎯 Target Audience", text: "Designers, agile teams, and classroom educators" },
      { x: 850, y: 120, color: "#bbf7d0", title: "🚀 Growth Loops", text: "One-click shareable board links with view/edit rights" },
      { x: 1200, y: 120, color: "#e9d5ff", title: "⚡ Tech Upgrades", text: "WebSocket bidirectional real-time synchronization" },
      { x: 150, y: 400, color: "#bae6fd", title: "🎨 UI Polish", text: "Dark mode glassmorphic interface with crisp canvas" },
      { x: 500, y: 400, color: "#fbcfe8", title: "🔒 Security", text: "Workspace access roles (Admin, Editor, Viewer)" },
      { x: 850, y: 400, color: "#fef08a", title: "📂 Templates", text: "Pre-built Kanban, Flowchart, Wireframe galleries" },
      { x: 1200, y: 400, color: "#fed7aa", title: "📊 Export Options", text: "Export canvas as high-res PNG, PDF, or JSON data" }
    ];

    notes.forEach((n) => {
      ctx.fillStyle = n.color;
      ctx.strokeStyle = "#d1d5db";
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, 290, 200, 10);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText(n.title, n.x + 20, n.y + 25);

      ctx.font = "15px Inter, sans-serif";
      ctx.fillStyle = "#334155";
      wrapText(ctx, n.text, n.x + 20, n.y + 70, 250, 24);
    });
  } else if (templateTitle === "Mind Map") {
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Product Strategy Mind Map", 100, 40);

    const centerX = 800;
    const centerY = 500;

    const branches = [
      { label: "User Experience", x: 350, y: 250, color: "#38bdf8" },
      { label: "Backend Scalability", x: 1250, y: 250, color: "#a855f7" },
      { label: "Collaboration Engine", x: 350, y: 750, color: "#22c55e" },
      { label: "Security & Auth", x: 1250, y: 750, color: "#f97316" }
    ];

    // Radiating branch lines
    branches.forEach((b) => {
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.quadraticCurveTo((centerX + b.x) / 2, (centerY + b.y) / 2 - 50, b.x, b.y);
      ctx.stroke();

      // Branch node box
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(b.x - 130, b.y - 40, 260, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.label, b.x, b.y - 10);
    });

    // Central Node
    ctx.fillStyle = "#6366f1";
    ctx.strokeStyle = "#4338ca";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Whiteboard", centerX, centerY - 20);
    ctx.fillText("Collab App", centerX, centerY + 15);

    ctx.textAlign = "left";
  } else if (templateTitle === "Wireframe") {
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Web Application Wireframe Layout", 100, 40);

    // Browser Window Frame
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(150, 100, 1300, 800, 12);
    ctx.fill();
    ctx.stroke();

    // Browser Header bar
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(150, 100, 1300, 50, [12, 12, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Window dots
    ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(180, 125, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eab308"; ctx.beginPath(); ctx.arc(200, 125, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(220, 125, 6, 0, Math.PI * 2); ctx.fill();

    // App Navigation Bar
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(150, 150, 1300, 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("✦ Brand Logo", 180, 170);
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText("Features     Pricing     Docs     Contact", 400, 172);

    // Hero Banner
    ctx.fillStyle = "#ede9fe";
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(200, 240, 1200, 220, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#4c1d95";
    ctx.font = "bold 26px Inter, sans-serif";
    ctx.fillText("Supercharge Team Brainstorming", 240, 280);
    ctx.font = "16px Inter, sans-serif";
    ctx.fillStyle = "#6d28d9";
    ctx.fillText("Create, collaborate, and share dynamic whiteboards with your global team in real-time.", 240, 325);

    // Cards Grid
    [0, 1, 2].forEach((i) => {
      const cardX = 200 + i * 420;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.roundRect(cardX, 490, 360, 360, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText(`Feature 0${i + 1}`, cardX + 25, 520);
      ctx.fillStyle = "#475569";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText("Intuitive drag-and-drop workspace components with seamless synchronization.", cardX + 25, 560);
    });
  } else if (templateTitle === "Sprint Retrospective") {
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Sprint Retrospective Board", 100, 40);

    const cols = [
      { title: "🎉 WHAT WENT WELL", x: 100, bg: "#ecfdf5", border: "#10b981", notes: ["Delivered feature on time", "Great team communication", "High test coverage"] },
      { title: "⚠️ WHAT CAN BE IMPROVED", x: 600, bg: "#fffbeb", border: "#f59e0b", notes: ["Reduce build time", "Better API error reporting", "Clearer task ownership"] },
      { title: "🎯 ACTION ITEMS", x: 1100, bg: "#eff6ff", border: "#3b82f6", notes: ["Set up automated CI/CD", "Refactor canvas rendering", "Schedule team demo"] }
    ];

    cols.forEach((col) => {
      ctx.fillStyle = col.bg;
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(col.x, 100, 400, 800, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText(col.title, col.x + 20, 120);

      col.notes.forEach((text, idx) => {
        const noteY = 170 + idx * 120;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.roundRect(col.x + 15, noteY, 370, 95, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.font = "16px Inter, sans-serif";
        ctx.fillText(text, col.x + 30, noteY + 25);
        ctx.fillStyle = "#64748b";
        ctx.font = "13px Inter, sans-serif";
        ctx.fillText("Vote count: 👍 4", col.x + 30, noteY + 60);
      });
    });
  }

  return canvas.toDataURL("image/png");
};

// Helper for drawing arrows
function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headlen = 12;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// Helper for word wrapping
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

export default function Dashboard({ activeView = "dashboard" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "User", email: "user@example.com", role: "Collaborator" });
  
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
  const [passwordChangeData, setPasswordChangeData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordChangeMsg, setPasswordChangeMsg] = useState({ type: "", text: "" });
  
  // Persisted metadata states
  const [metadata, setMetadata] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

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

    // Persisted Metadata
    try {
      const storedMeta = localStorage.getItem("board_metadata");
      if (storedMeta) {
        setMetadata(JSON.parse(storedMeta));
      } else {
        setMetadata({});
      }
    } catch (_) {}

    // Real Notifications init (clean out any old hardcoded mock items)
    try {
      const storedNotifs = localStorage.getItem("dashboard_notifications");
      if (storedNotifs) {
        const parsed = JSON.parse(storedNotifs);
        const cleaned = Array.isArray(parsed) ? parsed.filter(n => !n.content?.includes("Alice Jenkins") && !n.content?.includes("Bob Miller")) : [];
        setNotifications(cleaned);
        localStorage.setItem("dashboard_notifications", JSON.stringify(cleaned));
      } else {
        setNotifications([]);
      }
    } catch (_) {
      setNotifications([]);
    }

    // Real Activities init (clean out any old hardcoded mock items)
    try {
      const storedActs = localStorage.getItem("dashboard_activities");
      if (storedActs) {
        const parsed = JSON.parse(storedActs);
        const cleaned = Array.isArray(parsed) ? parsed.filter(a => a.user !== "Alice Jenkins" && a.user !== "Bob Miller" && a.user !== "Charlie Davis" && a.user !== "Dave Wilson" && a.user !== "System") : [];
        setActivities(cleaned);
        localStorage.setItem("dashboard_activities", JSON.stringify(cleaned));
      } else {
        setActivities([]);
      }
    } catch (_) {
      setActivities([]);
    }
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

  // Activity logger
  const addActivity = (action, target) => {
    const nextActs = [
      { id: Date.now(), user: user.name || "You", action, target, time: "Just now" },
      ...activities
    ];
    setActivities(nextActs);
    localStorage.setItem("dashboard_activities", JSON.stringify(nextActs));
  };

  // Workspace Creation
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceData.name) {
      alert("Please enter a workspace name!");
      return;
    }
    try {
      const payload = {
        name: newWorkspaceData.name,
        description: newWorkspaceData.description || "General team collaboration workspace",
        ownerEmail: user.email,
        members: [user.email]
      };
      await createWorkspace(payload);
      setNewWorkspaceData({ name: "", description: "" });
      setShowWorkspaceModal(false);
      await fetchResources();
      addActivity("created workspace", payload.name);
    } catch (e) {
      console.error("Workspace creation failed", e);
    }
  };

  // Board Creation (supports pre-rendered template canvas)
  const handleCreateBoard = async (wsId = null, templateName = null) => {
    let targetWorkspaceId = wsId || newBoardData.workspaceId;
    
    // If user has no workspace yet, automatically create a Default Workspace for them
    if (!targetWorkspaceId) {
      if (workspaces.length > 0) {
        targetWorkspaceId = workspaces[0].id;
      } else {
        try {
          const newWs = await createWorkspace({
            name: "My Workspace",
            description: "Default workspace for my whiteboards",
            ownerEmail: user.email,
            members: [user.email]
          });
          targetWorkspaceId = newWs.id;
          await fetchResources();
        } catch (err) {
          console.error("Error creating default workspace", err);
        }
      }
    }

    if (!targetWorkspaceId) {
      alert("Please select or create a workspace first!");
      return;
    }

    const name = templateName ? (templateName === "Blank Canvas" ? "Untitled Board" : `${templateName}`) : (newBoardData.name || "Untitled Board");
    const initialCanvasData = templateName && templateName !== "Blank Canvas" ? generateTemplateCanvasData(templateName) : "";

    try {
      const payload = {
        name,
        workspaceId: Number(targetWorkspaceId),
        canvasData: initialCanvasData
      };
      const created = await createWhiteboard(payload);
      setShowBoardModal(false);
      setNewBoardData({ name: "", workspaceId: "" });
      await fetchResources();

      // Set visibility / mock meta
      const updatedMeta = { ...metadata };
      updatedMeta[created.id] = {
        pinned: false,
        favorite: false,
        visibility: "Private",
        lastEdited: "Just now"
      };
      saveMetadata(updatedMeta);

      addActivity("created board", name);
      navigate(`/whiteboard/${created.id}`);
    } catch (e) {
      console.error("Whiteboard creation failed", e);
    }
  };

  // Board Metadata Toggles
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
      addActivity("renamed board to", newName);
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
      addActivity("deleted board", name);
    } catch (e) {
      console.error("Failed to delete whiteboard", e);
    }
  };

  // Workspace Boards count calculation
  const getBoardsCount = (wsId) => {
    return whiteboards.filter((w) => w.workspaceId === wsId).length;
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
    const membersSet = new Set();
    workspaces.forEach((w) => {
      w.members?.forEach((m) => membersSet.add(m));
    });
    const collaboratorsCount = membersSet.size > 0 ? membersSet.size : 1;
    const editedCount = whiteboards.length;

    return [
      { label: "My Boards", value: String(whiteboards.length).padStart(2, "0"), icon: "📋" },
      { label: "My Workspaces", value: String(workspaces.length).padStart(2, "0"), icon: "🗂" },
      { label: "Collaborators", value: String(collaboratorsCount).padStart(2, "0"), icon: "🤝" },
      { label: "Active Canvases", value: String(editedCount).padStart(2, "0"), icon: "📈" }
    ];
  }, [workspaces, whiteboards]);

  // Visual Rich Templates definition with custom SVG preview illustrations
  const templates = [
    { 
      title: "Kanban Board", 
      desc: "3-column agile workflow board with task cards", 
      icon: "📋",
      category: "Agile & Project Management",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <rect x="10" y="10" width="55" height="100" rx="4" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1" />
          <rect x="15" y="22" width="45" height="18" rx="2" fill="#38bdf8" fillOpacity="0.5" />
          <rect x="15" y="45" width="45" height="18" rx="2" fill="#38bdf8" fillOpacity="0.5" />
          <rect x="72" y="10" width="55" height="100" rx="4" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" />
          <rect x="77" y="22" width="45" height="18" rx="2" fill="#f59e0b" fillOpacity="0.5" />
          <rect x="135" y="10" width="55" height="100" rx="4" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1" />
          <rect x="140" y="22" width="45" height="18" rx="2" fill="#22c55e" fillOpacity="0.5" />
          <rect x="140" y="45" width="45" height="18" rx="2" fill="#22c55e" fillOpacity="0.5" />
        </svg>
      )
    },
    { 
      title: "Flowchart", 
      desc: "Process diagram with decisions, actions, and arrows", 
      icon: "📊",
      category: "Architecture & Diagrams",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <rect x="70" y="10" width="60" height="20" rx="10" fill="#6366f1" fillOpacity="0.3" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="100" y1="30" x2="100" y2="45" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          <polygon points="100,45 135,62 100,80 65,62" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="100" y1="80" x2="100" y2="95" stroke="#94a3b8" strokeWidth="2" />
          <rect x="70" y="95" width="60" height="20" rx="10" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="135" y1="62" x2="165" y2="62" stroke="#94a3b8" strokeWidth="2" />
          <rect x="165" y="52" width="28" height="20" rx="3" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1" />
        </svg>
      )
    },
    { 
      title: "Brainstorm Board", 
      desc: "Multi-colored sticky notes for idea clustering", 
      icon: "💡",
      category: "Brainstorming & Ideation",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <rect x="15" y="15" width="48" height="42" rx="3" fill="#fef08a" transform="rotate(-3 39 36)" stroke="#eab308" strokeWidth="1" />
          <rect x="75" y="12" width="48" height="42" rx="3" fill="#fed7aa" transform="rotate(2 99 33)" stroke="#f97316" strokeWidth="1" />
          <rect x="135" y="16" width="48" height="42" rx="3" fill="#bbf7d0" transform="rotate(-2 159 37)" stroke="#22c55e" strokeWidth="1" />
          <rect x="35" y="66" width="48" height="42" rx="3" fill="#bae6fd" transform="rotate(3 59 87)" stroke="#38bdf8" strokeWidth="1" />
          <rect x="105" y="64" width="48" height="42" rx="3" fill="#fbcfe8" transform="rotate(-4 129 85)" stroke="#ec4899" strokeWidth="1" />
        </svg>
      )
    },
    { 
      title: "Mind Map", 
      desc: "Central concept with radiating topic branches", 
      icon: "🧠",
      category: "Strategy & Exploration",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <circle cx="100" cy="60" r="20" fill="#6366f1" stroke="#818cf8" strokeWidth="2" />
          <path d="M 85 45 Q 50 30 30 25" stroke="#38bdf8" strokeWidth="2" fill="none" />
          <rect x="15" y="15" width="30" height="15" rx="3" fill="#38bdf8" fillOpacity="0.4" />
          <path d="M 85 75 Q 50 90 30 95" stroke="#22c55e" strokeWidth="2" fill="none" />
          <rect x="15" y="85" width="30" height="15" rx="3" fill="#22c55e" fillOpacity="0.4" />
          <path d="M 115 45 Q 150 30 170 25" stroke="#a855f7" strokeWidth="2" fill="none" />
          <rect x="155" y="15" width="30" height="15" rx="3" fill="#a855f7" fillOpacity="0.4" />
          <path d="M 115 75 Q 150 90 170 95" stroke="#f97316" strokeWidth="2" fill="none" />
          <rect x="155" y="85" width="30" height="15" rx="3" fill="#f97316" fillOpacity="0.4" />
        </svg>
      )
    },
    { 
      title: "Wireframe", 
      desc: "Clean website mockup with nav, hero banner & cards", 
      icon: "🖥️",
      category: "UI & Product Design",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <rect x="10" y="10" width="180" height="100" rx="4" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <rect x="10" y="10" width="180" height="15" fill="#334155" />
          <rect x="18" y="32" width="164" height="28" rx="2" fill="#818cf8" fillOpacity="0.2" stroke="#818cf8" strokeWidth="1" />
          <rect x="18" y="66" width="48" height="38" rx="2" fill="#94a3b8" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1" />
          <rect x="76" y="66" width="48" height="38" rx="2" fill="#94a3b8" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1" />
          <rect x="134" y="66" width="48" height="38" rx="2" fill="#94a3b8" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      )
    },
    { 
      title: "Sprint Retrospective", 
      desc: "Went Well, To Improve, and Action Items columns", 
      icon: "🔄",
      category: "Agile & Team Reviews",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <rect x="10" y="10" width="55" height="100" rx="4" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1" />
          <line x1="20" y1="20" x2="55" y2="20" stroke="#10b981" strokeWidth="3" />
          <rect x="16" y="30" width="43" height="22" rx="2" fill="#ffffff" fillOpacity="0.1" />
          <rect x="72" y="10" width="55" height="100" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1" />
          <line x1="82" y1="20" x2="117" y2="20" stroke="#f59e0b" strokeWidth="3" />
          <rect x="78" y="30" width="43" height="22" rx="2" fill="#ffffff" fillOpacity="0.1" />
          <rect x="135" y="10" width="55" height="100" rx="4" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="1" />
          <line x1="145" y1="20" x2="180" y2="20" stroke="#3b82f6" strokeWidth="3" />
          <rect x="141" y="30" width="43" height="22" rx="2" fill="#ffffff" fillOpacity="0.1" />
        </svg>
      )
    },
    { 
      title: "Blank Canvas", 
      desc: "Start with a clean slate for freeform sketching", 
      icon: "🎨",
      category: "Freeform",
      renderPreview: () => (
        <svg viewBox="0 0 200 120" style={{ width: "100%", height: "110px", borderRadius: "8px", background: "rgba(15,23,42,0.6)" }}>
          <line x1="20" y1="20" x2="180" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="20" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <path d="M 40 80 Q 90 20 120 70 T 170 40" stroke="#a855f7" strokeWidth="2.5" fill="none" />
          <circle cx="170" cy="40" r="4" fill="#a855f7" />
        </svg>
      )
    }
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
      return ws && ws.ownerEmail && ws.ownerEmail.toLowerCase() !== user.email?.toLowerCase();
    });
  }, [filteredBoardsList, workspaces, user.email]);

  const sharedWorkspaces = useMemo(() => {
    return filteredWorkspacesList.filter((w) => {
      return w.ownerEmail && w.ownerEmail.toLowerCase() !== user.email?.toLowerCase();
    });
  }, [filteredWorkspacesList, user.email]);

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
            Real-time whiteboard collaboration & workspace manager.
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
          <button className="btn" onClick={() => setShowBoardModal(true)}>+ New Board</button>
          <button className="btn ghost" onClick={() => setShowWorkspaceModal(true)}>+ New Workspace</button>
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
            
            {/* Quick Templates Strip */}
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>✨ Start with a Pre-Built Template</h3>
                <button className="nav-pill" onClick={() => navigate("/workspace/templates")}>View All Templates →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
                {templates.slice(0, 4).map((t) => (
                  <div 
                    key={t.title} 
                    onClick={() => handleCreateBoard(null, t.title)}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      padding: "10px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{t.icon}</div>
                    <strong style={{ fontSize: "0.8rem", display: "block" }}>{t.title}</strong>
                  </div>
                ))}
              </div>
            </div>

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
                <div>
                  <h3 style={{ margin: 0 }}>Recent Whiteboards (Canvases)</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Interactive canvases where you and your team draw, design, and collaborate.</p>
                </div>
                <button className="nav-pill" onClick={() => navigate("/workspace/boards")}>View All Boards</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredBoardsList.length > 0 ? (
                  filteredBoardsList.slice(0, 6).map((b) => {
                    const ws = workspaces.find((w) => w.id === b.workspaceId);
                    const meta = metadata[b.id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "Just now" };
                    
                    return (
                      <div key={b.id} className="recent-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0 }}>{b.name}</h4>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "var(--color-primary)"
                            }}>
                              🎨 Canvas
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                            In Workspace: <strong>{ws?.name || "My Workspace"}</strong>
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleTogglePin(b.id)}
                            title="Pin Board"
                          >
                            {meta.pinned ? "📌" : "📍"}
                          </button>
                          
                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleToggleFavorite(b.id)}
                            title="Favorite Board"
                          >
                            {meta.favorite ? "⭐" : "☆"}
                          </button>

                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleRenameBoard(b.id, b.name)}
                            title="Rename Board"
                          >
                            ✏️
                          </button>

                          <button 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                            onClick={() => handleDeleteBoard(b.id, b.name)}
                            title="Delete Board"
                          >
                            🗑️
                          </button>

                          <button className="btn" style={{ padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                            Open Canvas
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                    <p style={{ margin: 0, fontSize: "0.95rem" }}>No whiteboards created yet.</p>
                    <button className="btn" style={{ marginTop: "1rem", padding: "8px 16px" }} onClick={() => setShowBoardModal(true)}>
                      + Create Your First Board
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="dash-aside" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Quick Workspaces Section */}
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🗂 My Workspaces</h3>
                <button className="nav-pill" onClick={() => setShowWorkspaceModal(true)}>+ New</button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 1rem 0" }}>
                Workspaces are project folders that group your boards and team collaborators together.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {workspaces.map((ws) => (
                  <div 
                    key={ws.id}
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--glass-border)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", display: "block" }}>{ws.name}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        {getBoardsCount(ws.id)} {getBoardsCount(ws.id) === 1 ? "board" : "boards"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-primary)" }}>Open →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real Activity Panel */}
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>📈 Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((act) => (
                    <div key={act.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.8rem" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-primary)", marginTop: "6px" }} />
                      <div>
                        <strong>{act.user}</strong> {act.action} <span style={{ color: "var(--color-primary)" }}>{act.target}</span>
                        <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.7rem", marginTop: "2px" }}>{act.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                    No recent activity yet. Actions you take on boards and workspaces will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MY BOARDS */}
      {activeView === "boards" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.3rem" }}>📋 My Whiteboards (Canvases)</h3>
              <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Individual drawing canvases where you draw, sketch, add sticky notes, and brainstorm.
              </p>
            </div>
            <button className="btn" onClick={() => setShowBoardModal(true)}>+ Create New Board</button>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filteredBoardsList.length > 0 ? (
              filteredBoardsList.map((b) => {
                const meta = metadata[b.id] || { pinned: false, favorite: false, visibility: "Private", lastEdited: "Just now" };
                const ws = workspaces.find((w) => w.id === b.workspaceId);
                return (
                  <div key={b.id} className="template-card" style={{ padding: "1.25rem", minHeight: "190px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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
                      <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: "1.6" }}>
                        <div>📂 Belongs to Workspace: <strong style={{ color: "var(--color-text-main)" }}>{ws?.name || "Personal Workspace"}</strong></div>
                        <div>🕒 Last Updated: {meta.lastEdited}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
                      <button className="btn" style={{ flex: 1, padding: "8px", fontSize: "0.8rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                        Open Canvas
                      </button>
                      <button className="btn ghost" style={{ padding: "8px 12px", fontSize: "0.8rem" }} onClick={() => handleRenameBoard(b.id, b.name)}>
                        Rename
                      </button>
                      <button className="btn ghost" style={{ padding: "8px 12px", fontSize: "0.8rem", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={() => handleDeleteBoard(b.id, b.name)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                No whiteboards found. Click "+ Create New Board" or choose a template to begin!
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: WORKSPACES */}
      {activeView === "workspaces" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.3rem" }}>🗂 Team Workspaces (Project Folders)</h3>
              <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Workspaces are organizational hubs. Each workspace contains multiple whiteboards and team members.
              </p>
            </div>
            <button className="btn" onClick={() => setShowWorkspaceModal(true)}>+ Create New Workspace</button>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {filteredWorkspacesList.length > 0 ? (
              filteredWorkspacesList.map((ws) => (
                <div key={ws.id} className="template-card" style={{ minHeight: "190px", justifyContent: "space-between", padding: "1.25rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.15rem" }}>{ws.name}</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "6px 0 12px 0" }}>
                      {ws.description || "Team workspace for organizing whiteboards"}
                    </p>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                      <div>👑 Owner: <strong>{ws.ownerEmail}</strong></div>
                      <div>👥 Members: {ws.members?.length || 1} collaborator(s)</div>
                      <div>📋 Contained Boards: <strong>{getBoardsCount(ws.id)}</strong> whiteboards</div>
                    </div>
                  </div>
                  <button className="btn" style={{ width: "100%", padding: "8px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => navigate(`/workspace/${ws.id}`)}>
                    Open Workspace Hub →
                  </button>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                No workspaces created yet. Create a workspace to organize your team whiteboards!
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SHARED WITH ME */}
      {activeView === "shared" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>🤝 Shared With Me</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Whiteboards and Workspaces that other team members invited you to collaborate on.
          </p>

          {/* Guide Banner */}
          <div style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "12px",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "1.8rem" }}>💡</span>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-main)" }}>
              <strong>How Sharing Works:</strong> When another user adds your email (<strong>{user.email}</strong>) to their workspace or board, or sends you an invitation link, it will automatically appear here with full collaboration access!
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {sharedWorkspaces.map((ws) => (
              <div key={ws.id} className="template-card" style={{ minHeight: "170px", justifyContent: "space-between", padding: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0 }}>{ws.name}</h4>
                    <span style={{ fontSize: "0.7rem", background: "rgba(59, 130, 246, 0.15)", color: "var(--color-primary)", padding: "2px 6px", borderRadius: "4px" }}>
                      Shared Workspace
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px", lineHeight: "1.5" }}>
                    <div>👤 Owner: <strong>{ws.ownerEmail}</strong></div>
                    <div>📋 Boards: {getBoardsCount(ws.id)}</div>
                    <div>👥 Members: {ws.members?.length || 1}</div>
                  </div>
                </div>
                <button className="btn" style={{ width: "100%", padding: "8px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => navigate(`/workspace/${ws.id}`)}>
                  Open Workspace →
                </button>
              </div>
            ))}

            {sharedBoards.map((b) => {
              const ws = workspaces.find((w) => w.id === b.workspaceId);
              return (
                <div key={b.id} className="template-card" style={{ minHeight: "170px", justifyContent: "space-between", padding: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0 }}>{b.name}</h4>
                      <span style={{ fontSize: "0.7rem", background: "rgba(34, 197, 94, 0.15)", color: "var(--color-accent)", padding: "2px 6px", borderRadius: "4px" }}>
                        Shared Canvas
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px", lineHeight: "1.5" }}>
                      <div>👤 Shared By: <strong>{ws?.ownerEmail || "Collaborator"}</strong></div>
                      <div>🗂 Workspace: {ws?.name || "Shared Workspace"}</div>
                      <div>🔑 Role: Editor</div>
                    </div>
                  </div>
                  <button className="btn" style={{ width: "100%", padding: "8px", fontSize: "0.8rem", marginTop: "1rem" }} onClick={() => navigate(`/whiteboard/${b.id}`)}>
                    Join & Edit Canvas
                  </button>
                </div>
              );
            })}

            {sharedBoards.length === 0 && sharedWorkspaces.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                <p style={{ margin: 0, fontSize: "1rem" }}>No shared boards or workspaces yet.</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                  Ask your team members to invite <strong>{user.email}</strong> to their workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: TEMPLATES */}
      {activeView === "templates" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.3rem" }}>🎨 Strategy & Diagram Templates Gallery</h3>
            <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Choose a template below to automatically launch a pre-populated whiteboard with diagrams, sticky notes, and frameworks ready to use.
            </p>
          </div>
          
          <div className="template-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {templates.map((t) => (
              <div 
                key={t.title} 
                className="template-card" 
                style={{ 
                  minHeight: "280px", 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.45)"
                }}
              >
                <div>
                  {/* Visual SVG Diagram Preview */}
                  <div style={{ marginBottom: "12px" }}>
                    {t.renderPreview()}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{t.icon}</span>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{t.title}</h4>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-primary)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginTop: "2px" }}>
                    {t.category}
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>{t.desc}</p>
                </div>

                <button 
                  className="btn" 
                  style={{ width: "100%", padding: "8px 12px", fontSize: "0.82rem", marginTop: "1.25rem" }} 
                  onClick={() => handleCreateBoard(null, t.title)}
                >
                  🚀 Use This Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ACTIVITY */}
      {activeView === "activity" && (
        <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "700px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>📈 System Activity Log</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Real-time audit log of your board edits, creations, renames, and workspace changes.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "10px", alignItems: "center" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-secondary)" }} />
                  <div>
                    <span style={{ fontSize: "0.95rem" }}>
                      <strong>{act.user}</strong> {act.action} <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>{act.target}</span>
                    </span>
                    <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                No activity recorded yet. Edits and creations will show up here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: NOTIFICATIONS */}
      {activeView === "notifications" && (
        <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "600px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.3rem" }}>🔔 Inbox Notifications</h3>
              <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Alerts for shares, invitations, and board updates.</p>
            </div>
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
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                No notifications in your inbox.
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
        <div className="glass-panel" style={{ padding: "2rem", maxWidth: "560px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>🔒 Account & Password Security</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Protect your account by ensuring your password meets the security requirements.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {passwordChangeMsg.text && (
              <div style={{
                background: passwordChangeMsg.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                border: `1px solid ${passwordChangeMsg.type === "success" ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                color: passwordChangeMsg.type === "success" ? "#86efac" : "#fca5a5",
                padding: "0.65rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem"
              }}>
                {passwordChangeMsg.text}
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Current Password</label>
              <input 
                type="password" 
                placeholder="Enter current password" 
                value={passwordChangeData.currentPassword} 
                onChange={(e) => setPasswordChangeData({ ...passwordChangeData, currentPassword: e.target.value })} 
                style={{ margin: "6px 0 0 0" }} 
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>New Password</label>
              <input 
                type="password" 
                placeholder="Enter new strong password" 
                value={passwordChangeData.newPassword} 
                onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })} 
                style={{ margin: "6px 0 0 0" }} 
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Confirm New Password</label>
              <input 
                type="password" 
                placeholder="Re-enter new password" 
                value={passwordChangeData.confirmPassword} 
                onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })} 
                style={{ margin: "6px 0 0 0" }} 
              />
            </div>

            <button 
              className="btn" 
              style={{ marginTop: "0.5rem", padding: "10px" }}
              onClick={() => {
                const pwd = passwordChangeData.newPassword || "";
                const hasMinLength = pwd.length >= 8;
                const hasUpper = /[A-Z]/.test(pwd);
                const hasLower = /[a-z]/.test(pwd);
                const hasNumber = /[0-9]/.test(pwd);
                const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
                
                if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                  setPasswordChangeMsg({ 
                    type: "error", 
                    text: "Password must be at least 8 characters long and include an uppercase letter (A-Z), a lowercase letter (a-z), a number (0-9), and a special character (!@#$%^&*)." 
                  });
                  return;
                }
                if (pwd !== passwordChangeData.confirmPassword) {
                  setPasswordChangeMsg({ type: "error", text: "New passwords do not match. Please verify." });
                  return;
                }

                setPasswordChangeMsg({ type: "success", text: "Your password has been updated securely!" });
                setPasswordChangeData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                addActivity("updated security password", "Account Security");
              }}
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create Team Workspace</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
              A workspace groups your team members and whiteboard canvases together.
            </p>
            <input 
              type="text" 
              placeholder="Workspace Name (e.g. Marketing Team, Sprint 24)" 
              value={newWorkspaceData.name} 
              onChange={(e) => setNewWorkspaceData({ ...newWorkspaceData, name: e.target.value })} 
            />
            <input 
              type="text" 
              placeholder="Description (optional)" 
              value={newWorkspaceData.description} 
              onChange={(e) => setNewWorkspaceData({ ...newWorkspaceData, description: e.target.value })} 
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={handleCreateWorkspace}>Create Workspace</button>
              <button className="btn" onClick={() => setShowWorkspaceModal(false)} style={{ background: "var(--color-danger)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Whiteboard Canvas</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
              Select a workspace where this whiteboard will be saved.
            </p>
            <input 
              type="text" 
              placeholder="Board Name (e.g. System Architecture, Brainstorming)" 
              value={newBoardData.name} 
              onChange={(e) => setNewBoardData({ ...newBoardData, name: e.target.value })} 
            />
            <select 
              value={newBoardData.workspaceId} 
              onChange={(e) => setNewBoardData({ ...newBoardData, workspaceId: e.target.value })}
              style={{ padding: "10px", borderRadius: "10px", margin: "8px 0", background: "rgba(15,23,42,0.85)", color: "white", width: "100%" }}
            >
              <option value="">-- Choose Workspace --</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={() => handleCreateBoard()}>Launch Board</button>
              <button className="btn" onClick={() => setShowBoardModal(false)} style={{ background: "var(--color-danger)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}