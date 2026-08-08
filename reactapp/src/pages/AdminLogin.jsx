import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "./../styles/auth.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("user"));
      if (existing && existing.email === "admin@example.com") {
        navigate("/admin-dashboard", { replace: true });
      }
    } catch (_) {
      // ignore
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = formData.email.trim().toLowerCase();

    // Verify it is the administrator email
    if (trimmedEmail !== "admin@example.com") {
      setError("Access Denied: Only administrators are permitted to log in here.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: trimmedEmail,
        password: formData.password,
      };
      const user = await login(payload);
      localStorage.setItem("user", JSON.stringify({ ...user, role: "Administrator" }));
      
      const destination = location.state?.from?.pathname || "/admin-dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      let message = err?.response?.data?.message || err?.message;
      if (status === 401) {
        message = "Invalid administrator password.";
      } else if (!status) {
        message = "Unable to connect to the backend server.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: "radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.12), transparent 45%), var(--bg-primary)" }}>
      <form className="auth-form" onSubmit={handleSubmit} style={{ border: "1px solid rgba(239, 68, 68, 0.2)" }}>
        <h2 style={{ background: "linear-gradient(135deg, #ffffff 0%, #fecaca 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Admin Portal
        </h2>
        <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
          Sign in to access advanced workspace configurations.
        </p>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fecaca",
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            marginBottom: "1rem",
            fontSize: "0.85rem"
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Admin Email"
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
          required
        />

        <button
          type="submit"
          className="auth-btn"
          disabled={loading}
          style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)", boxShadow: "0 4px 14px 0 rgba(239, 68, 68, 0.3)" }}
        >
          {loading ? "Authorizing..." : "Secure Login"}
        </button>

        <p>
          Standard account? <Link to="/login" style={{ color: "#ef4444" }}>User Login</Link>
        </p>
      </form>
    </div>
  );
}
