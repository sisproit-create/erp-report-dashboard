import { useEffect, useState } from "react";

interface SplashScreenProps {
  duration?: number;
  onComplete: () => void;
}

export default function SplashScreen({
  duration = 2800,
  onComplete,
}: SplashScreenProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeDuration = 500;
    const exitTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, Math.max(duration - fadeDuration, 0));

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`splash-screen ${
        isLeaving ? "splash-screen--leaving" : ""
      }`}
      role="status"
      aria-label="Iniciando SmartPlant Portal"
    >
      <img
        src="/og-smartplant-whatsapp-v7.jpg"
        alt="SmartPlant Portal · Resumen Ejecutivo"
        className="splash-screen__image"
        fetchPriority="high"
      />

      <div className="splash-screen__overlay" aria-hidden="true" />

      <div className="splash-screen__loader">
        <span className="splash-screen__spinner" aria-hidden="true" />
        <span>Iniciando SmartPlant Portal...</span>
      </div>
    </div>
  );
}
