import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <>
      <SEO title="404 — Page Not Found" />
      <div className="not-found">
        <div className="not-found__orb" aria-hidden="true" />
        <div className="container not-found__inner">
          <div className="not-found__code" aria-hidden="true">404</div>
          <h1 className="not-found__title">Page not found</h1>
          <p className="not-found__desc">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="not-found__actions">
            <Link to="/" className="not-found__home">← Back to homepage</Link>
          </div>
        </div>
      </div>
    </>
  );
}
