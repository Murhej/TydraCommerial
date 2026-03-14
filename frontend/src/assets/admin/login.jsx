import React, { useState } from "react";
import { motion as Motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import Button from "../../components/ui/Button";
import { InlineNotice } from "../../components/ui/PageStates";
import "./login.css";

export default function Login() {
  usePageMeta("Admin Login", "Secure login for the Tydra operations dashboard.");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await apiPost("/login", { email, password });
      if (result?.token) {
        localStorage.setItem("token", result.token);
        setMessage(`Logged in as ${result.email}`);
        navigate("/dashboard");
      } else {
        setMessage("Login failed.");
      }
    } catch (err) {
      setMessage(err.message || "Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Motion.div
        className="login-card"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <div className="login-badge">Tydra Admin</div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to manage clients, invoices, and schedules.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Motion.div whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.995 }}>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="login-btn">
              Login
            </Button>
          </Motion.div>
        </form>

        <InlineNotice tone={message.toLowerCase().includes("error") ? "error" : "info"} className="login-message">
          {message}
        </InlineNotice>

        <p className="signup-link">
          Do not have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </Motion.div>
    </div>
  );
}
