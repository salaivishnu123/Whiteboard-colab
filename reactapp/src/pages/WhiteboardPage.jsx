import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import { 
  getBoardMembers, 
  inviteCollaborator, 
  updateBoardMemberRole, 
  removeBoardMember, 
  updateBoardShareSettings,
  listWhiteboards,
  listWorkspaces
} from "../services/api";
import "../styles/dashboard.css";

export default function WhiteboardPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // whiteboardId
  
  const [board, setBoard] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [user, setUser] = useState({ name: "User", email: "user@example.com", role: "Collaborator" });
  
  // Collaboration lists
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("Viewer");
  
  // Modals / Panels
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState({ text: "", type: "" });
  
  // Presentation Mode
  const [isPresenting, setIsPresenting] = useState(false);

  // Load user data
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  // Fetch Board, Workspace & Members data
  const fetchData = async () => {
    if (!id) return;
    try {
      setLoadingMembers(true);
      
      // 1. Fetch Whiteboard Details
      const boards = await listWhiteboards();
      const currentBoard = boards.find((b) => b.id === Number(id));
      if (currentBoard) {
        setBoard(currentBoard);
        
        // 2. Fetch Workspace Name
        const workspaces = await listWorkspaces(user.email || "admin@example.com", 0, 100);
        const currentWs = workspaces.content?.find((w) => w.id === currentBoard.workspaceId);
        setWorkspace(currentWs || { name: "Collaborative Workspace" });
      }

      // 3. Fetch Board Members
      const membersList = await getBoardMembers(Number(id));
      setMembers(membersList || []);

      // Determine current user's role on this board
      const myMemberRecord = membersList.find((m) => m.userEmail.toLowerCase() === user.email?.toLowerCase());
      if (myMemberRecord) {
        setCurrentUserRole(myMemberRecord.role);
      } else if (currentBoard && currentBoard.ownerEmail?.toLowerCase() === user.email?.toLowerCase()) {
        setCurrentUserRole("Owner");
      } else {
        // Fallback default editor
        setCurrentUserRole("Editor");
      }
    } catch (e) {
      console.error("Failed to load collaboration data", e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user.email]);

  // Invite handler
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSubmittingInvite(true);
    setInviteMessage({ text: "", type: "" });

    try {
      const payload = {
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedByEmail: user.email || "admin@example.com"
      };
      const res = await inviteCollaborator(Number(id), payload);
      const generatedLink = `${window.location.origin}/invite/${res.token}`;
      setInviteMessage({ 
        text: "✓ Invitation created successfully! Share this link to join:", 
        link: generatedLink,
        type: "success" 
      });
      setInviteEmail("");
      fetchData(); // reload members
    } catch (err) {
      setInviteMessage({ text: err.response?.data?.message || "Failed to send invitation.", type: "danger" });
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Change Role handler
  const handleChangeRole = async (memberEmail, newRole) => {
    try {
      await updateBoardMemberRole(Number(id), memberEmail, newRole);
      fetchData();
    } catch (e) {
      alert("Failed to change role.");
    }
  };

  // Remove member handler
  const handleRemoveMember = async (memberEmail) => {
    if (!window.confirm(`Are you sure you want to remove user "${memberEmail}" from this board?`)) return;
    try {
      await removeBoardMember(Number(id), memberEmail);
      fetchData();
    } catch (e) {
      alert("Failed to remove member.");
    }
  };

  // Transfer Ownership
  const handleTransferOwnership = async (memberEmail) => {
    if (!window.confirm(`Are you sure you want to transfer primary ownership to "${memberEmail}"?`)) return;
    try {
      // Transfer by setting their role to Owner, and our role to Editor
      await updateBoardMemberRole(Number(id), memberEmail, "Owner");
      await updateBoardMemberRole(Number(id), user.email, "Editor");
      fetchData();
      alert("Ownership successfully transferred.");
    } catch (e) {
      alert("Failed to transfer ownership.");
    }
  };

  // Share Settings Link Visibility Change
  const handleShareSettingsChange = async (visibility) => {
    try {
      await updateBoardShareSettings(Number(id), visibility);
      setBoard((prev) => ({ ...prev, visibility }));
    } catch (e) {
      alert("Failed to update share settings.");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/invite/sample-token-123`;
    navigator.clipboard.writeText(link);
    alert("Shareable invite link copied to clipboard:\n" + link);
  };

  // Online indicators list computed from members
  const activeCollaborators = useMemo(() => {
    return members.filter((m) => m.online);
  }, [members]);

  const isOwner = currentUserRole === "Owner";

  return (
    <div className={`whiteboard-page ${isPresenting ? "presenting-mode" : ""}`} style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg-primary)",
      overflow: "hidden"
    }}>
      
      {/* COLLABORATIVE HEADER */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        background: "rgba(8, 13, 26, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--glass-border)",
        zIndex: 50
      }}>
        
        {/* Left Side: Board Name, Workspace Name, Back arrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button 
            className="nav-pill" 
            style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => navigate("/workspace")}
          >
            ← Dashboard
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "white" }}>
                {board?.name || `Whiteboard #${id}`}
              </h1>
              <span style={{
                fontSize: "0.65rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--color-text-muted)"
              }}>
                {board?.visibility || "Private"}
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
              Workspace: {workspace?.name || "Collaborative Workspace"}
            </span>
          </div>
        </div>

        {/* Center Side: Online Collaborator Avatars */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {members.map((m) => {
            const initials = m.name?.slice(0, 2).toUpperCase() || "ME";
            return (
              <div 
                key={m.userEmail}
                className="avatar-item"
                style={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: m.online ? "linear-gradient(135deg, var(--color-success), #10b981)" : "rgba(255,255,255,0.06)",
                  border: `2px solid ${m.online ? "var(--color-success)" : "rgba(255,255,255,0.15)"}`,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                title={`${m.name} (${m.role}) - ${m.online ? "Online" : "Offline"}`}
              >
                {initials}
                {/* Dot */}
                <div style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: m.online ? "var(--color-success)" : "#94a3b8",
                  border: "1px solid var(--bg-primary)"
                }} />
              </div>
            );
          })}
        </div>

        {/* Right Side: Collaboration Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Active Collaborator Counter */}
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            🟢 {activeCollaborators.length} online
          </span>

          <button className="btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => setShowInviteModal(true)}>
            ＋ Invite
          </button>
          
          <button className="nav-pill" onClick={() => setShowMembersPanel(!showMembersPanel)}>
            🤝 Members ({members.length})
          </button>

          <button className="nav-pill" onClick={() => setIsPresenting(!isPresenting)}>
            {isPresenting ? "⏹ Stop Presenting" : "▶ Present"}
          </button>

          <button className="nav-pill danger" onClick={() => handleShareSettingsChange(board?.visibility === "Private" ? "Edit" : "Private")}>
            🔒 {board?.visibility === "Private" ? "Make Public" : "Make Private"}
          </button>
        </div>
      </header>

      {/* WORKSPACE CANVAS STAGE */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
        
        {/* Main Canvas */}
        <div style={{ flex: 1, height: "100%", position: "relative" }}>
          <WhiteboardCanvas whiteboardId={id} role={currentUserRole} />
        </div>

        {/* RIGHT PANEL: COLLABORATORS LIST PANEL */}
        {showMembersPanel && (
          <aside className="glass-panel" style={{
            width: "300px",
            height: "100%",
            borderLeft: "1px solid var(--glass-border)",
            borderRadius: 0,
            background: "rgba(12, 21, 43, 0.95)",
            backdropFilter: "blur(16px)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            zIndex: 40,
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Collaborators</h3>
              <button 
                onClick={() => setShowMembersPanel(false)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {members.map((m) => {
                const isSelf = m.userEmail.toLowerCase() === user.email?.toLowerCase();
                return (
                  <div key={m.userEmail} style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "10px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        color: "white"
                      }}>
                        {m.name?.slice(0, 2).toUpperCase() || "ME"}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {m.name} {isSelf && "(You)"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {m.userEmail}
                        </div>
                      </div>

                      {/* Dot */}
                      <span style={{ color: m.online ? "var(--color-success)" : "var(--color-text-dim)" }}>
                        {m.online ? "🟢" : "⚪"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--color-text-muted)"
                      }}>
                        {m.role}
                      </span>

                      {/* Actions */}
                      {isOwner && !isSelf && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.userEmail, e.target.value)}
                            style={{ padding: "2px 6px", fontSize: "0.7rem", margin: 0, width: "90px", height: "24px" }}
                          >
                            <option value="Editor">Editor</option>
                            <option value="Commenter">Commenter</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                          <button 
                            className="nav-pill danger"
                            style={{ padding: "2px 6px", fontSize: "0.7rem", height: "24px" }}
                            onClick={() => handleRemoveMember(m.userEmail)}
                          >
                            Remove
                          </button>
                          <button 
                            className="nav-pill"
                            style={{ padding: "2px 6px", fontSize: "0.7rem", height: "24px" }}
                            onClick={() => handleTransferOwnership(m.userEmail)}
                          >
                            Transfer Owner
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* INVITE COLLABORATION MODAL */}
      {showInviteModal && (
        <div className="modal">
          <div className="modal-content" style={{ width: "min(520px, 95%)", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Invite People</h3>
              <button 
                onClick={() => { setShowInviteModal(false); setInviteMessage({ text: "", type: "" }); }}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Email Address</label>
              <input 
                type="email" 
                placeholder="collaborator@example.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ margin: "4px 0 0 0" }}
                  >
                    <option value="Editor">Editor</option>
                    <option value="Commenter">Commenter</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={submittingInvite} 
                  style={{ marginTop: "1.2rem", height: "42px" }}
                >
                  {submittingInvite ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>

            {inviteMessage.text && (
              <div style={{
                background: inviteMessage.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${inviteMessage.type === "success" ? "var(--color-success)" : "var(--color-danger)"}`,
                color: inviteMessage.type === "success" ? "#d1fae5" : "#fecaca",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "0.8rem"
              }}>
                <div>{inviteMessage.text}</div>
                
                {inviteMessage.link && (
                  <div style={{
                    marginTop: "12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    background: "#080d1a",
                    overflow: "hidden",
                    textAlign: "left"
                  }}>
                    {/* Simulated Header */}
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: "6px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      fontSize: "0.7rem",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>✉️ Simulated Outbound Email</span>
                      <span style={{ color: "var(--color-success)" }}>To: collaborator</span>
                    </div>

                    {/* Email preview container */}
                    <div style={{ padding: "12px", background: "#f8fafc", color: "#334155" }}>
                      <div style={{
                        background: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: "1px solid #e2e8f0"
                      }}>
                        <h5 style={{ margin: "0 0 4px 0", color: "#1e3a8a", fontSize: "0.85rem" }}>
                          ✦ Whiteboard Pro Invite
                        </h5>
                        <p style={{ fontSize: "0.75rem", margin: "4px 0 8px 0", lineHeight: "1.3" }}>
                          You have been invited by <strong>{user.email}</strong> to collaborate on <strong>{board?.name}</strong> as an <strong>{inviteRole}</strong>.
                        </p>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          <a 
                            href={inviteMessage.link}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#4f46e5",
                              color: "white",
                              padding: "6px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              textDecoration: "none"
                            }}
                          >
                            Accept Invitation
                          </a>
                          <button 
                            type="button"
                            onClick={() => {
                              alert("Invitation declined.");
                              setInviteMessage({ text: "", type: "" });
                            }}
                            style={{
                              background: "#e2e8f0",
                              color: "#475569",
                              padding: "6px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr style={{ border: "0", borderTop: "1px solid var(--glass-border)", margin: "1.5rem 0" }} />

            {/* People with Access */}
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem" }}>People with Access</h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {members.map((m) => (
                <div key={m.userEmail} style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", fontSize: "0.85rem", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <strong>{m.name}</strong> <span style={{ color: "var(--color-text-dim)" }}>({m.userEmail})</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <hr style={{ border: "0", borderTop: "1px solid var(--glass-border)", margin: "1.5rem 0" }} />

            {/* Share Link Settings */}
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem" }}>Share Link Settings</h4>
            <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", gap: "10px" }}>
              <select
                value={board?.visibility || "Private"}
                onChange={(e) => handleShareSettingsChange(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              >
                <option value="Private">Private Board</option>
                <option value="View">Anyone with link can View</option>
                <option value="Comment">Anyone with link can Comment</option>
                <option value="Edit">Anyone with link can Edit</option>
              </select>
              <button className="btn ghost" onClick={handleCopyLink} style={{ margin: 0, height: "42px" }}>
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
