import { categories } from "../data/articles";
import "./Footer.css";

const footerLinks = {
  Company: ["About Us", "Careers", "Advertise", "Press Kit", "Contact"],
  Resources: ["Research Database", "Psychedelic Guide", "Integration Resources", "Safety Info", "FAQ"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">&#9674;</span>
              <span className="footer__logo-text">PsyNews</span>
            </div>
            <p className="footer__tagline">
              Independent journalism covering the psychedelic renaissance. Science,
              policy, culture — rigorously reported.
            </p>
            <div className="footer__social">
              {["Twitter / X", "Substack", "LinkedIn", "Instagram"].map((s) => (
                <a key={s} href="#" className="footer__social-link" aria-label={s}>
                  <span>{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="footer__col">
            <h4 className="footer__col-title">Topics</h4>
            <ul className="footer__links">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a href={`#${cat.id}`} className="footer__link" style={{ "--link-color": cat.color }}>
                    {cat.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Other links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="footer__col">
              <h4 className="footer__col-title">{group}</h4>
              <ul className="footer__links">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer__link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__divider" />

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} PsyNews. All rights reserved. PsyNews is an
            independent publication not affiliated with any pharmaceutical, clinical, or advocacy organization.
          </p>
          <p className="footer__disclaimer">
            Content is for informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
