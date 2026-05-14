import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCategories } from "../hooks/useArticles";
import "./Navbar.css";

export default function Navbar({ onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const { data: categories } = useCategories();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
    setSearchOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`} role="banner">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="PsyNews — home">
          <span className="navbar__logo-icon" aria-hidden="true">&#9674;</span>
          <span className="navbar__logo-text">PsyNews</span>
        </Link>

        {/* Nav links */}
        <nav
          className={`navbar__nav ${menuOpen ? "navbar__nav--open" : ""}`}
          aria-label="Main navigation"
          id="main-nav"
        >
          {(categories ?? []).map((cat) => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.id}`}
              className={({ isActive }) => `navbar__link${isActive ? " navbar__link--active" : ""}`}
              style={{ "--cat-color": cat.color }}
              onClick={() => setMenuOpen(false)}
            >
              {cat.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          <button
            className="navbar__icon-btn"
            aria-label="Open search"
            aria-expanded={searchOpen}
            aria-controls="navbar-search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <Link to="#newsletter" className="navbar__cta">Subscribe</Link>
          <button
            className={`navbar__burger ${menuOpen ? "navbar__burger--open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search dropdown */}
      {searchOpen && (
        <div className="navbar__search-bar" id="navbar-search" role="search">
          <div className="container">
            <form onSubmit={handleSearch} className="navbar__search-form">
              <label htmlFor="navbar-search-input" className="sr-only">Search articles</label>
              <input
                id="navbar-search-input"
                autoFocus
                type="search"
                placeholder="Search articles, topics, authors…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="navbar__search-input"
              />
              <button type="submit" className="navbar__search-submit">Search</button>
              <button
                type="button"
                className="navbar__icon-btn"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
