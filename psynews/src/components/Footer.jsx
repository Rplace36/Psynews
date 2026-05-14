import { Link } from "react-router-dom";
import { useCategories } from "../hooks/useArticles";
import "./Footer.css";

const footerLinks = {
  Company:   ["About Us", "Careers", "Advertise", "Press Kit", "Contact"],
  Resources: ["Research Database", "Psychedelic Guide", "Integration Resources", "Safety Info", "FAQ"],
  Legal:     ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"],
};

export default function Footer() {
  const { data: categories } = useCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="PsyNews — home">
              <span aria-hidden="true">&#9674;</span>
              <span>PsyNews</span>
            </Link>
            <p className="footer__tagline">
              Independent journalism covering the psychedelic renaissance. Science,
              policy, culture — rigorously reported.
            </p>
            <div className="footer__social" aria-label="Social media links">
              {[
                { label: "X (Twitter)", short: "𝕏", href: "#" },
                { label: "Substack",    short: "S", href: "#" },
                { label: "LinkedIn",    short: "in", href: "#" },
                { label: "Instagram",   short: "IG", href: "#" },
              ].map((s) => (
                <a key={s.label} href={s.href} className="footer__social-link" aria-label={s.label} rel="noopener noreferrer">
                  <span aria-hidden="true">{s.short}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <nav className="footer__col" aria-label="Topic categories">
              <h3 className="footer__col-title">Topics</h3>
              <ul className="footer__links">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/category/${cat.id}`}
                      className="footer__link"
                      style={{ "--link-color": cat.color }}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Other links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <nav key={group} className="footer__col" aria-label={group}>
              <h3 className="footer__col-title">{group}</h3>
              <ul className="footer__links">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer__link">{link}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer__divider" />

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {year} PsyNews. All rights reserved. PsyNews is an independent publication
            not affiliated with any pharmaceutical, clinical, or advocacy organization.
          </p>
          <p className="footer__disclaimer">
            Content is for informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
