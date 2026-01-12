import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
    // ...

    const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem("token", result.token);
      setMessage(`✅ Logged in as ${result.email}`);
      navigate("/dashboard");
    } else {
      setMessage(`❌ ${result.error}`);
    }
  } catch {
    setMessage("❌ Backend not reachable");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="login-page">
      {/* Floating cleaning supplies */}
      <motion.div
        className="sweeper"
        initial={{ x: "-250%", y: "20%", rotate: -5, scale: 3.5 }}
        animate={{
          x: "150%",
          y: ["20%", "22%", "18%", "20%"],
          rotate: [-10, 15, -5, 200],
          scale: [3.5, 3.2, 3.8, 3.5],
        }}
        transition={{ repeat: Infinity, duration: 90, ease: "linear", delay: 0 }}
      >
        🧹
      </motion.div>

      <motion.div
        className="spray"
        initial={{ x: "-250%", y: "45%", rotate: 0, scale: 4 }}
        animate={{
          x: "150%",
          y: ["45%", "47%", "43%", "45%"],
          rotate: [0, -20, 15, 180],
          scale: [4, 3.7, 4.3, 4],
        }}
        transition={{ repeat: Infinity, duration: 110, ease: "linear", delay: 5 }}
      >
        🧴
      </motion.div>

      <motion.div
        className="soap"
        initial={{ x: "-250%", y: "15%", rotate: 1, scale: 4.2 }}
        animate={{
          x: "150%",
          y: ["75%", "77%", "73%", "75%"],
          rotate: [5, -5, 10, 210],
          scale: [4.2, 4, 4.4, 4.2],
        }}
        transition={{ repeat: Infinity, duration: 100, ease: "linear", delay: 1 }}
      >
        🧼
      </motion.div>

      <motion.div
        className="vacuum"
        initial={{ x: "150%", y: "30%", rotate: 0, scale: 4 }}
        animate={{
          x: "-250%",
          y: ["30%", "32%", "28%", "30%"],
          rotate: [0, 10, -15, 190],
          scale: [4, 3.8, 4.2, 4],
        }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear", delay: 3 }}
      >
        🧽
      </motion.div>

      <motion.div
        className="bucket"
        initial={{ x: "150%", y: "65%", rotate: -10, scale: 3.8 }}
        animate={{
          x: "-250%",
          y: ["65%", "67%", "63%", "65%"],
          rotate: [-10, 15, -20, 200],
          scale: [3.8, 3.5, 4, 3.8],
        }}
        transition={{ repeat: Infinity, duration: 130, ease: "linear", delay: 7 }}
      >
        🪣
      </motion.div>

      {/* Login Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to manage your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
            />
          </div>

            <motion.button
              type="submit"
              className="login-btn"
              whileHover={{ scale: loading ? 1 : 1.08 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>

        </form>

        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}

        <p className="signup-link">
          Don’t have an account? <a href="/signup">Sign Up</a>
        </p>
      </motion.div>
    </div>
  );
}
