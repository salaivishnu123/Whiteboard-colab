// src/pages/Register.jsx
import React, { useEffect, useState, useMemo } from "react";
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

  // Password Security Criteria
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password || "";
    return [
      { id: "length", label: "At least 8 characters", valid: pwd.length >= 8 },
      { id: "upper", label: "At least one uppercase letter (A-Z)", valid: /[A-Z]/.test(pwd) },
      { id: "lower", label: "At least one lowercase letter (a-z)", valid: /[a-z]/.test(pwd) },
      { id: "number", label: "At least one number (0-9)", valid: /[0-9]/.test(pwd) },
      { id: "special", label: "At least one special character (!@#$%^&*...)", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd) }
    ];
  }, [formData.password]);

  const passedCount = useMemo(() => passwordCriteria.filter((c) => c.valid).length, [passwordCriteria]);
  const isPasswordValid = useMemo(() => passedCount === passwordCriteria.length, [passedCount, passwordCriteria]);

  const strengthMeta = useMemo(() => {
    if (!formData.password) return { label: "", color: "transparent", percent: 0 };
    if (passedCount <= 2) return { label: "Weak", color: "#ef4444", percent: 30 };
    if (passedCount <= 4) return { label: "Medium", color: "#f59e0b", percent: 70 };
    return { label: "Strong & Secure", color: "#22c55e", percent: 100 };
  }, [passedCount, formData.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements before proceeding.");
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
      <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: "440px" }}>
        <h2>Create Account</h2>
        <p style={{ color: "#9ca3af", marginBottom: "1.25rem" }}>
          Start collaborating in real-time with your team.
        </p>

        {error && (
          <div style={{
            background: "rgba(248, 113, 113, 0.18)",
            border: "1px solid rgba(239, 68, 68, 0.45)",
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
            placeholder="Create password"
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

        {/* Password Strength Meter */}
        {formData.password && (
          <div style={{ marginBottom: "0.75rem", marginTop: "-4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", marginBottom: "4px" }}>
              <span style={{ color: "#9ca3af" }}>Security Strength:</span>
              <span style={{ color: strengthMeta.color, fontWeight: "bold" }}>{strengthMeta.label}</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${strengthMeta.percent}%`, height: "100%", background: strengthMeta.color, transition: "all 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Security Requirements Checklist */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "1rem",
          fontSize: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "5px"
        }}>
          <strong style={{ color: "#e2e8f0", marginBottom: "2px" }}>Password Security Requirements:</strong>
          {passwordCriteria.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", color: c.valid ? "#4ade80" : "#94a3b8" }}>
              <span>{c.valid ? "✓" : "○"}</span>
              <span>{c.label}</span>
            </div>
          ))}
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

        <button type="submit" className="auth-btn" disabled={loading || !isPasswordValid}>
          {loading ? "Creating account..." : "Register & Start Collaborating"}
        </button>

        <p style={{ marginTop: "1rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
