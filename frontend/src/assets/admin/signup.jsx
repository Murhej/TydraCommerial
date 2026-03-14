import React, { useState } from "react";
import { motion as Motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import Button from "../../components/ui/Button";
import { InlineNotice } from "../../components/ui/PageStates";
import "./login.css";

export default function Signup() {
  usePageMeta("Admin Sign Up", "Create an authorized Tydra admin account.");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [referral, setReferral] = useState(""); // invite code
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (username.includes(" ")) {
    setMessage("Error: Username cannot contain spaces");
    return;
  }

  if (password !== confirmPassword) {
    setMessage("Error: Passwords do not match");
    return;
  }

  const invite = referral.trim();
  if (!invite) {
    setMessage("Error: Invite code is required");
    return;
  }

  setLoading(true);

  try {
    await apiPost("/register", {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      referral: invite,
    });

    setMessage("Account created. Redirecting to login...");
    setTimeout(() => navigate("/login"), 900);
  } catch (err) {
    setMessage(`Error: ${err.message || "Signup failed"}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-page">
      {/* Removed the floating emoji/motion images */}
      
      <Motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="login-badge">Tydra Admin</div>
        <h2 className="login-title">Sign Up</h2>
        <p className="login-subtitle">Create your account to get started</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
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
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Enter invite code"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            required
          />

        

          <Motion.div whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.995 }}>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="login-btn">
              Sign Up
            </Button>
          </Motion.div>
        </form>

        <InlineNotice tone={message.toLowerCase().includes("error") ? "error" : "success"} className="login-message">
          {message}
        </InlineNotice>

        <p className="signup-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </Motion.div>
    </div>
  );
}

