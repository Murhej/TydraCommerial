import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import { ApiError, apiGet } from "../../lib/apiClient";

import frontlogo from "../Img/frontlogo.png";
import logoDisplay from "../Img/logoDisplay.png";
import "./header.css";

function DashboardNav({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    onNavigate?.();
    navigate(path);
  };

  const navBtnClass = (path) =>
    `site-btn${location.pathname === path ? " active" : ""}`;

  return (
    <nav className="dashboard-nav" aria-label="Admin navigation">
      <button className={navBtnClass("/payments")} onClick={() => go("/payments")}>
        Payments
      </button>
      <button className={navBtnClass("/calendar")} onClick={() => go("/calendar")}>
        Calendar
      </button>
      <button className={navBtnClass("/todo")} onClick={() => go("/todo")}>
        Operations
      </button>
    </nav>
  );
}

function ProfileMenu({
  menuRef,
  profile,
  showProfile,
  setShowProfile,
  onLogout,
  closeBurger,
}) {
  const navigate = useNavigate();

  const go = (path) => {
    setShowProfile(false);
    closeBurger?.();
    navigate(path);
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        className="site-btn-10"
        type="button"
        onClick={() => setShowProfile((p) => !p)}
        aria-expanded={showProfile}
        aria-label="Open profile menu"
      >
        <img
          src={profile?.avatar ? `${API_URL}${profile.avatar}` : logoDisplay}
          alt="profile"
          className="header-avatar"
        />
      </button>

      {showProfile && (
        <div className="profile-popover">
          <div className="profile-summary">
            <img
              src={profile?.avatar ? `${API_URL}${profile.avatar}` : logoDisplay}
              alt="avatar"
            />
            <div>
              <strong>{profile?.fullName || "User"}</strong>
              <span>@{profile?.username || "username"}</span>
            </div>
          </div>

          <button className="profile-item" type="button" onClick={() => go("/dashboard")}>
            Dashboard
          </button>
          <button className="profile-item" type="button" onClick={() => go("/profile")}>
            Profile
          </button>
          <button className="profile-item" type="button" onClick={() => go("/settings")}>
            Settings
          </button>
          <button className="profile-item danger" type="button" onClick={onLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showProfile, setShowProfile] = useState(false);
  const [showBurger, setShowBurger] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setShowBurger(false);
    setShowProfile(false);
  }, [location.pathname]);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await apiGet("/profile", { auth: true });
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setProfile(null);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setShowProfile(false);
    setShowBurger(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <img src={frontlogo} alt="Tydra logo" onClick={() => navigate("/dashboard")} />
        </div>

        {!isMobile && <DashboardNav />}

        <div className="header-actions">
          {isMobile && (
            <button
              type="button"
              className="burger-toggle"
              onClick={() => setShowBurger((b) => !b)}
              aria-expanded={showBurger}
              aria-label="Toggle mobile menu"
            >
              <span />
              <span />
              <span />
            </button>
          )}

          <ProfileMenu
            menuRef={menuRef}
            profile={profile}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            onLogout={handleLogout}
          />
        </div>
      </header>

      {isMobile && showBurger && (
        <aside className="mobile-panel" aria-label="Mobile navigation">
          <DashboardNav onNavigate={() => setShowBurger(false)} />
          <div className="mobile-user-block">
            <button
              type="button"
              className="mobile-user-item"
              onClick={() => {
                setShowBurger(false);
                navigate("/dashboard");
              }}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="mobile-user-item"
              onClick={() => {
                setShowBurger(false);
                navigate("/profile");
              }}
            >
              Profile
            </button>
            <button
              type="button"
              className="mobile-user-item"
              onClick={() => {
                setShowBurger(false);
                navigate("/settings");
              }}
            >
              Settings
            </button>
            <button type="button" className="mobile-user-item danger" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
