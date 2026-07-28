import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";

import App from "./App";
import SplashScreen from "./components/SplashScreen";
import "./styles.css";

function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem("smartplant-splash-seen") !== "true";
    } catch {
      return true;
    }
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem("smartplant-splash-seen", "true");
    } catch {
      // El portal continúa aunque sessionStorage no esté disponible.
    }

    setShowSplash(false);
  }, []);

  return (
    <>
      <App />

      {showSplash && (
        <SplashScreen
          duration={1800}
          onComplete={handleSplashComplete}
        />
      )}

      <Analytics />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
