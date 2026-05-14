import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import App from "./App.jsx";
import { AuthContext, useAuthProvider } from "./lib/auth.js";
import { initPlausible } from "./lib/analytics.js";

// Init Plausible if domain is configured
if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
  initPlausible(import.meta.env.VITE_PLAUSIBLE_DOMAIN);
}

function Root() {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      <App />
      <Analytics />
    </AuthContext.Provider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
