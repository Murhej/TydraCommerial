import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import frontlogo from "../../../public/frontlogo.png";
import logoDisplay from "../../../public/logoDisplay.png";
import hamburger from "../../../public/hamburger.gif";
import "./dashboard.css";

/* ---------------- Dashboard Navigation ---------------- */
function DashboardNav({ onNavigate }) {
  const navigate = useNavigate();

  const go = (path) => {
    onNavigate?.(); // closes burger if provided
    navigate(path);
  };

  return (
    <nav className="dashboard-nav">
      <button className="site-btn" onClick={() => go("/payments")}>
        Payment
      </button>
      <button className="site-btn" onClick={() => go("/calendar")}>
        Calendar
      </button>
      <button className="site-btn" onClick={() => go("/todo")}>
        To-Do
      </button>
    </nav>
  );
}

/* ---------------- Profile Menu ---------------- */
function ProfileNav({
  menuRef,
  showProfile,
  toggleProfile,
  onLogout,
  navigate,
  profile,
  closeBurger, // ✅ added for mobile
}) {
  const go = (path) => {
    toggleProfile?.();     // close the dropdown
    closeBurger?.();       // close the side menu on mobile
    navigate(path);
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="site-btn-10" onClick={toggleProfile}>
        <img
          src={
            profile?.avatar
              ? `${API_URL}${profile.avatar}`
              : logoDisplay
          }
          alt="profile"
          className="header-avatar"
        />
      </button>

      {showProfile && (
        <div className="burgerView">
          <div className="profile-summary">
            <img
              src={
                profile?.avatar
                  ? `${API_URL}${profile.avatar}`
                  : logoDisplay
              }
              alt="avatar"
            />
            <div>
              <strong>{profile?.fullName || "User"}</strong>
              <span>@{profile?.username || "username"}</span>
            </div>
          </div>

          <button className="Probutton" onClick={() => go("/profile")}>
            Profile
          </button>

          {/* ✅ FIXED: navigate to settings */}
          <button className="Probutton" onClick={() => go("/settings")}>
            Settings
          </button>

          <button className="logoutbutton" onClick={onLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Header Component ---------------- */
export default function Header() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showProfile, setShowProfile] = useState(false);
  const [showBurger, setShowBurger] = useState(false);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setProfileData(null);
    setShowProfile(false);
    setShowBurger(false);
    navigate("/login", { replace: true });
  };

  const menuRef = useRef(null);

  const toggleProfile = () => setShowProfile((p) => !p);
  const toggleBurger = () => setShowBurger((b) => !b);

  /* Close profile when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Track screen resize */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* ---------------- Top Header ---------------- */}
      <header className="dashboard-header">
        <div className="logo">
          <img
            src={frontlogo}
            alt="logo"
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* Mobile hamburger */}
        {isMobile && (
          <img
            className="burgermeanu"
            src={hamburger}
            alt="menu"
            onClick={toggleBurger}
          />
        )}

        {/* Desktop navigation */}
        {!isMobile && <DashboardNav />}

        {/* Desktop profile */}
        {!isMobile && (
          <ProfileNav
            menuRef={menuRef}
            showProfile={showProfile}
            toggleProfile={toggleProfile}
            navigate={navigate}
            profile={profileData}
            onLogout={handleLogout}
          />
        )}
      </header>

      {/* ---------------- Mobile Side Panel ---------------- */}
      {isMobile && showBurger && (
        <div className="smallerwindowReview">
          <button className="close-burger" onClick={toggleBurger}>
            X
          </button>

          <DashboardNav onNavigate={() => setShowBurger(false)} />

          {/* ✅ FIXED: pass all required props for mobile too */}
          <ProfileNav
            menuRef={menuRef}
            showProfile={showProfile}
            toggleProfile={toggleProfile}
            navigate={navigate}
            profile={profileData}
            onLogout={handleLogout}
            closeBurger={() => setShowBurger(false)}
          />
        </div>
      )}
    </>
  );
}
