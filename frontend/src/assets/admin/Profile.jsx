import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../config";
import "./profile.css";
import Header from "./header";

export default function Profile() {
  const [profile, setProfile] = useState(null);
    const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");
    const fileInputRef = useRef(null);

  function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

  useEffect(() => {
    fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      });
  }, []);
    const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setProfile((p) => ({ ...p, avatar: data.avatar }));
      setMessage("✅ Profile picture updated");
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

  const saveProfile = async () => {
    setMessage("");
    const res = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Profile updated");
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

    if (loading) return <p>Loading...</p>;

return (
  <>
    <Header /> {/* ✅ FULL-WIDTH HEADER */}

    <div className="profile-wrapper">
      <div className="profile-page">

        {/* ===== Profile Header ===== */}
        <div className="profile-header">
          <img
            src={
              preview ||
              (profile.avatar
                ? `${API_URL}/${profile.avatar}`
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

            {/* Sub info */}
          <div className="profile-subinfo">
            Member since {formatDate(profile.created_at)}
            </div>

          </div>
        </div>

        {/* ===== Hidden file input ===== */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        {/* ===== Editable Info ===== */}
        <div className="profile-card">
          <label>Full Name</label>
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) =>
              setProfile({ ...profile, fullName: e.target.value })
            }
          />

          <label>Username</label>
          <input
            type="text"
            value={profile.username}
            onChange={(e) =>
              setProfile({ ...profile, username: e.target.value })
            }
          />

          <label>Email</label>
          <input type="text" value={profile.email} disabled />
        </div>

        {/* ===== Account Info (Read-only) ===== */}
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


        {/* ===== Save ===== */}
        <button className="profile-save-btn" onClick={saveProfile}>
          Save Changes
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  </>
);

}
