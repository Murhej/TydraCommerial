import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import { ApiError, apiGet, apiPost, apiPut } from "../../lib/apiClient";
import usePageMeta from "../../hooks/usePageMeta";
import Header from "./header";
import "./profile.css";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function Profile() {
  usePageMeta("Profile", "Manage your admin profile and account details.");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await apiGet("/profile", { auth: true });
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setMessage(err.message || "Failed to load profile.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiPost("/profile/avatar", formData, { auth: true });
      setProfile((prev) => ({ ...(prev || {}), avatar: data.avatar }));
      setMessage("Profile picture updated.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setMessage(err.message || "Avatar upload failed.");
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setMessage("");

    try {
      await apiPut("/profile", profile, { auth: true });
      setMessage("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setMessage(err.message || "Failed to save profile.");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-wrapper">
          <div className="profile-page">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="profile-wrapper">
          <div className="profile-page">Unable to load profile.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="profile-wrapper">
        <div className="profile-page">
          <div className="profile-header">
            <img
              src={
                preview ||
                (profile.avatar
                  ? `${API_URL}${profile.avatar}`
                  : "https://via.placeholder.com/120")
              }
              alt="avatar"
              className="profile-avatar clickable"
              onClick={handleAvatarClick}
              title="Click to change profile picture"
            />

            <div className="profile-header-text">
              <h2>{profile.fullName}</h2>
              <span>@{profile.username}</span>
              <div className="profile-subinfo">
                Member since {formatDate(profile.created_at)}
              </div>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />

          <div className="profile-card">
            <label>Full Name</label>
            <input
              type="text"
              value={profile.fullName || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, fullName: e.target.value }))
              }
            />

            <label>Username</label>
            <input
              type="text"
              value={profile.username || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, username: e.target.value }))
              }
            />

            <label>Email</label>
            <input type="text" value={profile.email || ""} disabled />
          </div>

          <div className="profile-card account-card">
            <h4>Account Info</h4>

            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="badge admin">Admin</span>
            </div>

            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="status active">Active</span>
            </div>

            <div className="info-row">
              <span className="info-label">Email Verified</span>
              <span className="status verified">Yes</span>
            </div>
          </div>

          <button className="profile-save-btn" onClick={saveProfile}>
            Save Changes
          </button>

          {message && <p>{message}</p>}
        </div>
      </div>
    </>
  );
}
