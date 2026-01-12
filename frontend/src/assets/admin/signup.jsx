import React, { useState } from "react";
import { motion } from "framer-motion";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [referral, setReferral] = useState(""); // invite code
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function readResponse(res) {
    // Works even if backend returns HTML/plain text
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { json, text };
    } catch {
      return { json: null, text };
    }
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (username.includes(" ")) {
    setMessage("❌ Username cannot contain spaces");
    return;
  }

  if (password !== confirmPassword) {
    setMessage("❌ Passwords do not match");
    return;
  }

  const invite = referral.trim();
  if (!invite) {
    setMessage("❌ Invite code is required");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        referral: invite,
      }),
    });

    const { json, text } = await readResponse(res);

    if (res.ok) {
      setMessage("✅ Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } else {
      setMessage(`❌ ${json?.error || "Signup failed"}`);
    }
  } catch {
    setMessage("❌ Backend not reachable");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-page">
      {/* ✅ Removed the floating emoji/motion images */}
      
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
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

        

          <motion.button
            type="submit"
            className="login-btn"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating..." : "Sign Up"}
          </motion.button>
        </form>

        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}

        <p className="signup-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </motion.div>
    </div>
  );
}
