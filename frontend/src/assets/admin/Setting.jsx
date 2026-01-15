import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import Header from "./header";
import "./settings.css";


const DEFAULT_SETTINGS = {
  // Company
  company_name: "Tydra Commercial Cleaning",
  company_phone: "",
  company_email: "",
  company_address: "",
  city: "",
  province: "ON",
  postal_code: "",
  website: "",

  // Preferences
  timezone: "America/Toronto",
  theme: "system", // system | light | dark
  compactMode: false,
  emailNotifications: true,
  smsNotifications: false,

  // Internal
  lastSavedAt: "",
};

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem("tydra_settings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveLocalSettings(payload) {
  localStorage.setItem("tydra_settings", JSON.stringify(payload));
}

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile from backend
  const [profile, setProfile] = useState(null);

  // Local settings for Company + Prefs
  const [settings, setSettings] = useState(loadLocalSettings());

  const [status, setStatus] = useState({ type: "", message: "" });

  // Avatar upload
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Password state (optional backend endpoint)
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setStatus({ type: "", message: "" });

      // load local first
      setSettings(loadLocalSettings());

      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load profile");

        setProfile(data);
        setStatus({ type: "ok", message: "Settings loaded." });
      } catch (err) {
        setProfile(null);
        setStatus({ type: "err", message: err.message || "Load failed" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, navigate]);

  const setProfileField = (key, val) =>
    setProfile((p) => ({ ...(p || {}), [key]: val }));

  const setSettingsField = (key, val) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const saveAll = async () => {
    setSaving(true);
    setStatus({ type: "", message: "" });

    // 1) save local settings (company + prefs)
    const localPayload = {
      ...settings,
      lastSavedAt: new Date().toISOString(),
    };
    saveLocalSettings(localPayload);
    setSettings(localPayload);

    // 2) save profile (account tab fields)
    try {
      if (profile) {
        const res = await fetch(`${API_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save profile");
      }

      setStatus({ type: "ok", message: "Saved successfully." });
    } catch (err) {
      setStatus({
        type: "warn",
        message:
          (err && err.message) ||
          "Saved locally, but profile save failed. Check backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Avatar upload failed");

      setProfile((p) => ({ ...p, avatar: data.avatar }));
      setStatus({ type: "ok", message: "✅ Profile picture updated" });
    } catch (err) {
      setStatus({ type: "err", message: err.message || "Upload failed" });
    }
  };

  const changePassword = async () => {
    setStatus({ type: "", message: "" });

    if (!pw.current_password || !pw.new_password || !pw.confirm_new_password) {
      setStatus({ type: "err", message: "Fill in all password fields." });
      return;
    }
    if (pw.new_password.length < 8) {
      setStatus({
        type: "err",
        message: "New password must be at least 8 characters.",
      });
      return;
    }
    if (pw.new_password !== pw.confirm_new_password) {
      setStatus({ type: "err", message: "New passwords do not match." });
      return;
    }

    // If you don’t have this endpoint yet, it will show a warning.
    try {
      const res = await fetch(`${API_URL}/change_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: pw.current_password,
          new_password: pw.new_password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Password change failed");

      setPw({ current_password: "", new_password: "", confirm_new_password: "" });
      setStatus({ type: "ok", message: "Password updated." });
    } catch (err) {
      setStatus({
        type: "warn",
        message:
          "Password endpoint not available yet. Add POST /change_password in backend.",
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Header />

      <div className="settings-page">
        <div className="settings-card">
          <div className="settings-top">
            <div className="settings-title">
              <h1>Settings</h1>
              <p>Manage your account, company, and app preferences.</p>
            </div>

            <div className="settings-actions">
              <button className="btn secondary" onClick={logout}>
                Log out
              </button>
              <button
                className="btn primary"
                onClick={saveAll}
                disabled={saving || loading}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {status.message && (
            <div className={`settings-status ${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="settings-body">
            {/* Left Nav */}
            <aside className="settings-nav">
              <button
                className={activeTab === "account" ? "active" : ""}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
              <button
                className={activeTab === "company" ? "active" : ""}
                onClick={() => setActiveTab("company")}
              >
                Company
              </button>
              <button
                className={activeTab === "prefs" ? "active" : ""}
                onClick={() => setActiveTab("prefs")}
              >
                Preferences
              </button>
              <button
                className={activeTab === "security" ? "active" : ""}
                onClick={() => setActiveTab("security")}
              >
                Security
              </button>
            </aside>

            {/* Content */}
            <section className="settings-content">
              {loading ? (
                <div className="settings-loading">Loading...</div>
              ) : (
                <>
                  {/* ACCOUNT */}
                  {activeTab === "account" && (
                    <div className="panel">
                      <h2>Account</h2>

                      <div className="settings-avatar-row">
                        <img
                          className="settings-avatar"
                          src={
                            preview ||
                            (profile?.avatar
                              ? `${API_BASE}${profile.avatar}`
                              : "https://via.placeholder.com/120")
                          }
                          alt="avatar"
                          onClick={handleAvatarClick}
                          title="Click to change profile picture"
                        />
                        <div>
                          <button className="btn secondary" onClick={handleAvatarClick}>
                            Change photo
                          </button>
                          <div className="muted">Click the photo or button</div>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                      />

                      <div className="grid two">
                        <div className="field">
                          <label>Full Name</label>
                          <input
                            value={profile?.fullName || ""}
                            onChange={(e) => setProfileField("fullName", e.target.value)}
                            placeholder="Murhej Hantoush"
                          />
                        </div>

                        <div className="field">
                          <label>Username</label>
                          <input
                            value={profile?.username || ""}
                            onChange={(e) => setProfileField("username", e.target.value)}
                            placeholder="murhej"
                          />
                        </div>

                        <div className="field wide">
                          <label>Email</label>
                          <input value={profile?.email || ""} disabled />
                          <small>Email is read-only.</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPANY (localStorage) */}
                  {activeTab === "company" && (
                    <div className="panel">
                      <h2>Company</h2>

                      <div className="grid two">
                        <div className="field">
                          <label>Company Name</label>
                          <input
                            value={settings.company_name}
                            onChange={(e) => setSettingsField("company_name", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>Website</label>
                          <input
                            value={settings.website}
                            onChange={(e) => setSettingsField("website", e.target.value)}
                            placeholder="https://tydra.ca"
                          />
                        </div>

                        <div className="field">
                          <label>Company Email</label>
                          <input
                            value={settings.company_email}
                            onChange={(e) => setSettingsField("company_email", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>Company Phone</label>
                          <input
                            value={settings.company_phone}
                            onChange={(e) => setSettingsField("company_phone", e.target.value)}
                          />
                        </div>

                        <div className="field wide">
                          <label>Address</label>
                          <input
                            value={settings.company_address}
                            onChange={(e) => setSettingsField("company_address", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>City</label>
                          <input
                            value={settings.city}
                            onChange={(e) => setSettingsField("city", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>Province</label>
                          <input
                            value={settings.province}
                            onChange={(e) => setSettingsField("province", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>Postal Code</label>
                          <input
                            value={settings.postal_code}
                            onChange={(e) => setSettingsField("postal_code", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PREFERENCES (localStorage) */}
                  {activeTab === "prefs" && (
                    <div className="panel">
                      <h2>Preferences</h2>

                      <div className="grid two">
                        <div className="field">
                          <label>Timezone</label>
                          <input
                            value={settings.timezone}
                            onChange={(e) => setSettingsField("timezone", e.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label>Theme</label>
                          <select
                            value={settings.theme}
                            onChange={(e) => setSettingsField("theme", e.target.value)}
                          >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>

                        <div className="field">
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={!!settings.compactMode}
                              onChange={(e) => setSettingsField("compactMode", e.target.checked)}
                            />
                            Compact mode
                          </label>
                        </div>

                        <div className="field">
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={!!settings.emailNotifications}
                              onChange={(e) =>
                                setSettingsField("emailNotifications", e.target.checked)
                              }
                            />
                            Email notifications
                          </label>

                          <label className="check">
                            <input
                              type="checkbox"
                              checked={!!settings.smsNotifications}
                              onChange={(e) =>
                                setSettingsField("smsNotifications", e.target.checked)
                              }
                            />
                            SMS notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECURITY */}
                  {activeTab === "security" && (
                    <div className="panel">
                      <h2>Security</h2>

                      <div className="grid two">
                        <div className="field wide">
                          <label>Current Password</label>
                          <input
                            type="password"
                            value={pw.current_password}
                            onChange={(e) =>
                              setPw((p) => ({ ...p, current_password: e.target.value }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>New Password</label>
                          <input
                            type="password"
                            value={pw.new_password}
                            onChange={(e) =>
                              setPw((p) => ({ ...p, new_password: e.target.value }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Confirm New Password</label>
                          <input
                            type="password"
                            value={pw.confirm_new_password}
                            onChange={(e) =>
                              setPw((p) => ({ ...p, confirm_new_password: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="row">
                        <button className="btn primary" onClick={changePassword}>
                          Update password
                        </button>
                      </div>

                      <div className="danger">
                        <h3>Danger zone</h3>
                        <p>Sign out of this device.</p>
                        <button className="btn danger" onClick={logout}>
                          Log out
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="settings-foot">
                    <small>
                      Last saved:{" "}
                      {settings.lastSavedAt
                        ? new Date(settings.lastSavedAt).toLocaleString()
                        : "—"}
                    </small>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
