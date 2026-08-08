import React, { useMemo } from "react";
import "../styles/workspaceCard.css";

const WorkspaceCard = ({ workspace, onSelect, onCardClick, onDelete }) => {
  const memberInitials = useMemo(() => {
    if (!workspace?.members?.length) return [];
    return workspace.members.slice(0, 3).map((email) => email.charAt(0).toUpperCase());
  }, [workspace]);

  const memberOverflow = Math.max((workspace?.members?.length || 0) - 3, 0);

  return (
    <article className="workspace-card" onClick={onCardClick}>
      <div className="workspace-card__badge">{workspace?.members?.length || 0} collaborators</div>
      <header className="workspace-card__header">
        <div className="workspace-card__icon">{workspace.name?.charAt(0)?.toUpperCase() || "W"}</div>
        <div>
          <h3>{workspace.name}</h3>
          <p>Organize canvases, align teammates, and keep progress visible.</p>
        </div>
      </header>

      <div className="workspace-card__meta">
        <div className="workspace-card__members">
          {memberInitials.length > 0 ? (
            memberInitials.map((initial, index) => (
              <span key={index} className="workspace-card__chip">
                {initial}
              </span>
            ))
          ) : (
            <span className="workspace-card__empty">No members yet</span>
          )}
          {memberOverflow > 0 && <span className="workspace-card__chip">+{memberOverflow}</span>}
        </div>
        <small>Owner: {workspace.ownerEmail || "—"}</small>
      </div>

      <div className="workspace-card__actions">
        <button className="btn" onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>Open workspace</button>
        <button
          className="workspace-card__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
};

export default WorkspaceCard;
