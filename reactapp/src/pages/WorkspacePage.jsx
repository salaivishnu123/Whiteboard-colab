import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceCard from "../components/WorkspaceCard";
import {
  listWorkspaces,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
  listWhiteboards,
  createWhiteboard
} from "../services/api";
import "../styles/workspace.css";

export default function WorkspacePage() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(6);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(false);

  // Dynamic Workspace detail sidebar states
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [whiteboards, setWhiteboards] = useState([]);
  const [newWhiteboardName, setNewWhiteboardName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [sidebarLoading, setSidebarLoading] = useState(false);

  const fetchWorkspaces = useCallback(async (email) => {
    try {
      const response = await listWorkspaces(email, page, size, sortBy, sortDir);
      setWorkspaces(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    }
  }, [page, size, sortBy, sortDir]);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedUser);

    if (loggedUser?.email) {
      fetchWorkspaces(loggedUser.email);
    }
  }, [fetchWorkspaces, page, size, sortBy, sortDir]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      alert("Please enter a workspace name");
      return;
    }

    if (!user?.email) {
      alert("Please log in to create a workspace");
      return;
    }

    try {
      await createWorkspace({
        name: workspaceName.trim(),
        ownerEmail: user.email,
        members: [user.email]
      });

      fetchWorkspaces(user.email);
      setWorkspaceName("");
      alert("Workspace created successfully!");
    } catch (error) {
      console.error("Error creating workspace:", error);
      alert("Failed to create workspace");
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteWorkspace(workspaceId);
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(null);
        setWhiteboards([]);
      }
      fetchWorkspaces(user?.email);
      alert("Workspace deleted successfully!");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = async (workspaceId) => {
    try {
      setLoading(true);
      const workspace = await getWorkspace(workspaceId);
      navigate(`/whiteboard/${workspaceId}`, { state: { workspace } });
    } catch (error) {
      console.error("Error opening workspace:", error);
      alert("Failed to open workspace: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchWhiteboards = async (workspaceId) => {
    try {
      setSidebarLoading(true);
      const res = await listWhiteboards(workspaceId);
      setWhiteboards(res || []);
    } catch (e) {
      console.error("Failed to load whiteboards for workspace:", e);
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleSelectWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    fetchWhiteboards(workspace.id);
  };

  const handleAddCollaborator = async () => {
    if (!newMemberEmail.trim()) {
      alert("Please enter a collaborator email");
      return;
    }
    if (!selectedWorkspace) return;

    const email = newMemberEmail.trim().toLowerCase();
    if (selectedWorkspace.members?.includes(email)) {
      alert("This collaborator is already in the workspace!");
      return;
    }

    try {
      const updatedMembers = [...(selectedWorkspace.members || []), email];
      const payload = {
        ...selectedWorkspace,
        members: updatedMembers
      };
      const updated = await updateWorkspace(selectedWorkspace.id, payload);
      setSelectedWorkspace(updated);
      setNewMemberEmail("");
      if (user?.email) {
        fetchWorkspaces(user.email);
      }
      alert("Collaborator added successfully!");
    } catch (err) {
      console.error("Failed to add collaborator:", err);
      alert("Failed to add collaborator.");
    }
  };

  const handleCreateWhiteboard = async () => {
    if (!newWhiteboardName.trim()) {
      alert("Please enter a whiteboard name");
      return;
    }
    if (!selectedWorkspace) return;

    try {
      const payload = {
        name: newWhiteboardName.trim(),
        workspaceId: selectedWorkspace.id,
        canvasData: ""
      };
      await createWhiteboard(payload);
      setNewWhiteboardName("");
      fetchWhiteboards(selectedWorkspace.id);
      alert("Whiteboard created successfully!");
    } catch (err) {
      console.error("Failed to create whiteboard:", err);
      alert("Failed to create whiteboard.");
    }
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    ws.ownerEmail.toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  return (
    <div className="workspace-page">
      <section className="workspace-hero">
        <div>
          <p className="workspace-kicker">Workspaces</p>
          <h2>Manage Your Creative Spaces</h2>
          <p className="workspace-subtitle">Create, organize, and collaborate in dedicated workspaces.</p>
        </div>
      </section>

      <section className="workspace-body">
        <div className="workspace-left">
          <div className="workspace-actions">
            <div className="workspace-actions-header">
              <h3>Create a new workspace</h3>
              <p>Set up a fresh canvas hub for your next project.</p>
            </div>
            <div className="workspace-create">
              <input
                type="text"
                placeholder="Workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <button className="btn" onClick={handleCreateWorkspace}>
                {loading ? "Creating..." : "Create Workspace"}
              </button>
            </div>
            <div className="workspace-search">
              <input
                type="text"
                placeholder="Search workspaces..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
              />
            </div>

            <div className="workspace-controls">
              <div className="sorting-controls">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="id">ID</option>
                  <option value="name">Name</option>
                  <option value="ownerEmail">Owner</option>
                </select>
                <button 
                  className="sort-direction-btn"
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="page-size-select"
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                </select>
              </div>
            </div>
          </div>

          <div className="workspace-grid">
            {loading && <div className="workspace-loading">Loading...</div>}
            {!loading && filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onSelect={() => handleOpenWorkspace(workspace.id)}
                  onCardClick={() => handleSelectWorkspace(workspace)}
                  onDelete={() => handleDeleteWorkspace(workspace.id)}
                />
              ))
            ) : !loading && (
              <div className="workspace-empty">
                <h4>No workspaces found</h4>
                <p>Try different search terms or create a new workspace.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="workspace-pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <aside className="workspace-right">
          {selectedWorkspace ? (
            <div className="workspace-detail">
              <h3>{selectedWorkspace.name}</h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Owner: {selectedWorkspace.ownerEmail}
              </p>

              <div className="workspace-detail-section">
                <h4 style={{ fontSize: "0.95rem", color: "#e2e8f0" }}>Collaborators</h4>
                <ul className="workspace-tips" style={{ margin: "0.5rem 0" }}>
                  {(selectedWorkspace.members || []).map((email, idx) => (
                    <li key={idx}>{email}</li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
                  <input
                    type="email"
                    placeholder="Collaborator email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{ margin: 0, padding: "8px 12px", fontSize: "0.85rem" }}
                  />
                  <button className="btn" onClick={handleAddCollaborator} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                    + Add
                  </button>
                </div>
              </div>

              <div className="workspace-detail-section" style={{ marginTop: "1rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "#e2e8f0" }}>Whiteboards</h4>
                {sidebarLoading ? (
                  <p style={{ fontSize: "0.85rem" }}>Loading boards...</p>
                ) : whiteboards.length > 0 ? (
                  <div className="whiteboard-list" style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0.5rem 0" }}>
                    {whiteboards.map((board) => (
                      <div
                        key={board.id}
                        className="whiteboard-card"
                        onClick={() => navigate(`/whiteboard/${board.id}`)}
                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{board.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "#06b6d4" }}>Open ↗</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No boards yet. Create one below!</p>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="New Board Name"
                    value={newWhiteboardName}
                    onChange={(e) => setNewWhiteboardName(e.target.value)}
                    style={{ margin: 0, padding: "8px 12px", fontSize: "0.85rem" }}
                  />
                  <button className="btn" onClick={handleCreateWhiteboard} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                    Create
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="workspace-detail">
              <h3>Welcome to Workspaces</h3>
              <p>
                Select a workspace card on the left to view details, create whiteboards, and manage collaborators.
              </p>
              <ul className="workspace-tips">
                <li>Create a new workspace using the form on the left</li>
                <li>Use filters and sorting to organize your spaces</li>
                <li>Click on a workspace card to view its details, manage members, or spin up whiteboard canvases</li>
              </ul>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}