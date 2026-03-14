import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import frontlogo from '../Img/frontlogo.png';
import './header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);

  const navClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const onClickOutside = (event) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target) && !event.target.closest('.menu-toggle')) {
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onClickOutside);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`header-Body ${scrolled ? 'scrolled compact' : ''}`}>
        <div className="logo">
          <Link to="/">
            <img src={frontlogo} alt="Tydra Logo" decoding="async" />
          </Link>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="site-nav"
          ref={navRef}
          className={`avaters ${menuOpen ? 'mobile-open' : ''}`}
        >
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/about" className={navClass}>About Us</NavLink>
          <NavLink to="/services" className={navClass}>Services</NavLink>
          <NavLink to="/contactus" className={({ isActive }) => `contact-btn ui-btn primary md${isActive ? ' active' : ''}`}>
            Contact Us
          </NavLink>
        </nav>
      </header>
      <button
        type="button"
        aria-label="Close menu"
        className={`menu-overlay ${menuOpen ? 'show' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className="header-spacer" />
    </>
  );
}
