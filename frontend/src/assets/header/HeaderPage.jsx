// src/components/Header/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import frontlogo from '../Img/frontlogo.png';
import './header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`header-Body ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo">
          <Link to="/">
            <img src={frontlogo} alt="Tydra Logo" />
          </Link>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`avaters ${menuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/about" className="nav-item">About Us</Link>
          <a href="/services" className="nav-item">Services</a>
          <Link to="/ContactUs">
            <button className="contact-btn">Contact Us</button>
          </Link>
        </nav>
      </header>

      {/* This spacer prevents content from sliding under the fixed header */}
      <div className="header-spacer" />
    </>
  );
}
