import { useState, useEffect } from "react";
import { categories } from "../data/articles";
import "./Navbar.css";

export default function Navbar({ onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchVal);
    setSearchOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        {/* Left: logo */}
        <div className="navbar__logo">
          <span className="navbar__logo-icon">&#9674;</span>
          <span className="navbar__logo-text">PsyNews</span>
        </div>

        {/* Center: nav links */}
        <nav className={`navbar__nav ${menuOpen ? "navbar__nav--open" : ""}`}>
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="navbar__link"
              style={{ "--cat-color": cat.color }}
              onClick={() => setMenuOpen(false)}
            >
              {cat.label}
            </a>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="navbar__actions">
          <button
            className="navbar__icon-btn"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <a href="#newsletter" className="navbar__cta">Subscribe</a>
          <button
            className={`navbar__burger ${menuOpen ? "navbar__burger--open" : ""}`}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Search bar dropdown */}
      {searchOpen && (
        <div className="navbar__search-bar">
          <div className="container">
            <form onSubmit={handleSearch} className="navbar__search-form">
              <input
                autoFocus
                type="text"
                placeholder="Search articles, topics, authors…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="navbar__search-input"
              />
              <button type="submit" className="navbar__search-submit">Search</button>
              <button type="button" className="navbar__icon-btn" onClick={() => setSearchOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
