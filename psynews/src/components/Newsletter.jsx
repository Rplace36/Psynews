import { useState } from "react";
import "./Newsletter.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <section id="newsletter" className="newsletter">
      {/* decorative bg */}
      <div className="newsletter__bg" aria-hidden="true">
        <div className="newsletter__orb newsletter__orb--1" />
        <div className="newsletter__orb newsletter__orb--2" />
      </div>

      <div className="container newsletter__inner">
        <div className="newsletter__content">
          <div className="newsletter__icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="newsletter__title">Stay Ahead of the Psychedelic Renaissance</h2>
          <p className="newsletter__desc">
            Join 40,000+ researchers, clinicians, and curious minds. Get the week's most important
            psychedelic science, policy, and culture stories — delivered every Friday.
          </p>

          {status === "success" ? (
            <div className="newsletter__success">
              <span className="newsletter__success-icon">&#10003;</span>
              <span>You're in! Check your inbox to confirm your subscription.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter__form">
              <div className="newsletter__input-wrap">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                  }}
                  className={`newsletter__input ${status === "error" ? "newsletter__input--error" : ""}`}
                />
                <button type="submit" className="newsletter__btn">
                  Subscribe Free
                </button>
              </div>
              {status === "error" && (
                <p className="newsletter__error">Please enter a valid email address.</p>
              )}
              <p className="newsletter__fine-print">
                No spam. Unsubscribe anytime. By subscribing, you agree to our{" "}
                <a href="#">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>

        <div className="newsletter__stats">
          <div className="newsletter__stat">
            <span className="newsletter__stat-number">40K+</span>
            <span className="newsletter__stat-label">Subscribers</span>
          </div>
          <div className="newsletter__stat-divider" />
          <div className="newsletter__stat">
            <span className="newsletter__stat-number">Weekly</span>
            <span className="newsletter__stat-label">Digest</span>
          </div>
          <div className="newsletter__stat-divider" />
          <div className="newsletter__stat">
            <span className="newsletter__stat-number">Free</span>
            <span className="newsletter__stat-label">Always</span>
          </div>
        </div>
      </div>
    </section>
  );
}
