// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./../styles/auth.css";
import { login, acceptInvitation } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("user"));
      if (existing && !location.state?.fromInvitation) {
        const dest = existing.role === "Administrator" ? "/admin-dashboard" : "/workspace";
        navigate(dest, { replace: true });
      }
    } catch (_) {
      // ignore parsing errors
    }
  }, [navigate, location.state]);

  useEffect(() => {
    if (location.state?.invitedEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.invitedEmail }));
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      const user = await login(payload);
      const userWithRole = { ...user, role: user.email === "admin@example.com" ? "Administrator" : "Collaborator" };
      localStorage.setItem("user", JSON.stringify(userWithRole));

      if (location.state?.fromInvitation && location.state?.token) {
        try {
          const acceptRes = await acceptInvitation(location.state.token, userWithRole.email);
          alert("Accepted invitation! Redirecting to whiteboard...");
          navigate(`/whiteboard/${acceptRes.boardId}`, { replace: true });
          return;
        } catch (e) {
          console.error("Acceptance failed", e);
        }
      }

      const destination = location.state?.from?.pathname || (userWithRole.role === "Administrator" ? "/admin-dashboard" : "/workspace");
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      let message = err?.response?.data?.message || err?.message;
      if (status === 401) {
        message = message || "Invalid email or password.";
      } else if (!status) {
        message = message || "Unable to reach the server. Please verify the backend is running.";
      } else {
        message = message || "Login failed. Please try again.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Sign in to continue collaborating.</p>

        {error && (
          <div style={{
            background: "rgba(248, 113, 113, 0.18)",
            border: "1px solid rgba(239, 68, 68, 0.45)",
            color: "#fecaca",
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          minLength={4}
          required
        />

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p style={{ marginTop: "1rem" }}>
          Are you an Admin? <Link to="/admin-login" style={{ color: "var(--color-primary)" }}>Sign in here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
