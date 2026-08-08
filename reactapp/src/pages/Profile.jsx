import React, { useState, useEffect } from "react";
import "../styles/dashboard.css";

export default function Profile() {
  const [user, setUser] = useState({ name: "Guest User", email: "guest@example.com", role: "Viewer" });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          name: parsed.name || "Active Member",
          email: parsed.email || "",
          role: parsed.email === "admin@example.com" ? "Administrator" : "Collaborator"
        });
      }
    } catch (e) {
      console.error("Failed to parse user profile details:", e);
    }
  }, []);

  return (
    <div className="profile-page fade-in">
      <h2>User Profile</h2>
      <div className="profile-card glass-panel" style={{ padding: "2rem", marginTop: "1.5rem", borderRadius: "16px", maxWidth: "440px" }}>
        <p style={{ margin: "8px 0" }}><strong>Name:</strong> {user.name}</p>
        <p style={{ margin: "8px 0" }}><strong>Email:</strong> {user.email}</p>
        <p style={{ margin: "8px 0" }}><strong>Role:</strong> {user.role}</p>
      </div>
    </div>
  );
}