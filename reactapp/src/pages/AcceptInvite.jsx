import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvitationDetails, acceptInvitation } from "../services/api";
import "../styles/auth.css";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const data = await getInvitationDetails(token);
        setInviteData(data);
      } catch (err) {
        setError(err.response?.data?.message || "This invitation link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAction = (mode) => {
    // Navigate to Login or Register, passing the token in state so that 
    // after auth succeeds, they are auto-routed back to accept and join.
    navigate(`/${mode}`, { 
      state: { 
        fromInvitation: true, 
        token: token,
        invitedEmail: inviteData.invitation.email 
      } 
    });
  };

  const handleImmediateAccept = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      const currentUser = stored ? JSON.parse(stored) : null;
      if (!currentUser || currentUser.email !== inviteData.invitation.email) {
        setError("Please sign in with the invited email address to accept this invitation.");
        setLoading(false);
        return;
      }
      await acceptInvitation(token, currentUser.email);
      alert("Successfully joined board: " + inviteData.board.name);
      navigate(`/whiteboard/${inviteData.board.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept invitation");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-form" style={{ textAlign: "center" }}>
          <h2>Verifying Invitation...</h2>
          <p style={{ color: "#9ca3af" }}>Checking secure token metadata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-form" style={{ textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <h2 style={{ color: "#ef4444" }}>Invitation Error</h2>
          <p style={{ color: "#9ca3af", margin: "1.5rem 0" }}>{error}</p>
          <button className="btn" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : null;
  const isCorrectUserLoggedIn = currentUser && currentUser.email === inviteData.invitation.email;

  return (
    <div className="auth-container" style={{ background: "radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.12), transparent 45%), var(--bg-primary)" }}>
      <div className="auth-form" style={{ border: "1px solid rgba(99, 102, 241, 0.2)" }}>
        <h2>Board Invitation</h2>
        <p style={{ color: "#9ca3af", margin: "0.5rem 0 1.5rem" }}>
          You have been invited to join and collaborate!
        </p>

        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--glass-border)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          textAlign: "left"
        }}>
          <p style={{ margin: "4px 0" }}><strong>Board Name:</strong> {inviteData.board.name}</p>
          <p style={{ margin: "4px 0" }}><strong>Email Invited:</strong> {inviteData.invitation.email}</p>
          <p style={{ margin: "4px 0" }}><strong>Assigned Role:</strong> {inviteData.invitation.role}</p>
        </div>

        {isCorrectUserLoggedIn ? (
          <div>
            <p style={{ color: "var(--color-success)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              ✓ You are logged in as {currentUser.email}
            </p>
            <button className="btn" style={{ width: "100%" }} onClick={handleImmediateAccept}>
              Accept Invitation & Join Board
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1rem" }}>
              To accept this invitation, please log in or register using the invited email.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => handleAction("login")}>
                Sign In
              </button>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => handleAction("register")}>
                Register
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
