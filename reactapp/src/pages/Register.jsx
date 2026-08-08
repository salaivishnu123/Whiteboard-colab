// src/pages/Register.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./../styles/auth.css";
import { register, acceptInvitation } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("user"));
      if (existing && !location.state?.fromInvitation) {
        navigate("/workspace", { replace: true });
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
    setError("");

    const pwd = formData.password || "";
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError("Password must be at least 8 characters long and include an uppercase letter (A-Z), a lowercase letter (a-z), a number (0-9), and a special character (!@#$%^&*).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
      const user = await register(payload);
      localStorage.setItem("user", JSON.stringify(user));

      if (location.state?.fromInvitation && location.state?.token) {
        try {
          const acceptRes = await acceptInvitation(location.state.token, user.email);
          alert("Successfully registered and joined board! Redirecting...");
          navigate(`/whiteboard/${acceptRes.boardId}`, { replace: true });
          return;
        } catch (e) {
          console.error("Acceptance failed", e);
        }
      }

      navigate("/workspace", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      let message = err?.response?.data?.message || err?.message;
      if (status === 409) {
        message = message || "Email already registered. Try signing in instead.";
      } else if (!status) {
        message = message || "Unable to reach the server. Please ensure the backend is running.";
      } else {
        message = message || "We couldn't create your account. Please try again.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: "420px" }}>
        <h2>Create Account</h2>
        <p style={{ color: "#9ca3af", marginBottom: "1.25rem" }}>
          Start collaborating in real-time with your team.
        </p>

        {error && (
          <div style={{
            background: "rgba(248, 113, 113, 0.18)",
            border: "1px solid rgba(239, 68, 68, 0.45)",
            color: "#fecaca",
            padding: "0.75rem 0.9rem",
            borderRadius: "10px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            lineHeight: "1.4"
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          minLength={2}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Work email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        {/* Password input with toggle */}
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password (8+ chars, upper, lower, num, special)"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            style={{ paddingRight: "45px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "14px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p style={{ marginTop: "1rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
