import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface SplashScreenProps {
  duration?: number;
  onComplete: () => void;
}

export default function SplashScreen({
  duration = 1800,
  onComplete,
}: SplashScreenProps) {
  const fadeDuration = 280;
  const [isLeaving, setIsLeaving] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    onComplete();
  }, [clearTimers, onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setIsLeaving(false);

    const fadeDelay = Math.max(duration - fadeDuration, 0);
    fadeTimerRef.current = window.setTimeout(() => setIsLeaving(true), fadeDelay);
    completeTimerRef.current = window.setTimeout(finish, duration);

    return clearTimers;
  }, [clearTimers, duration, fadeDuration, finish]);

  const skipSplash = useCallback(() => {
    if (completedRef.current || isLeaving) return;
    clearTimers();
    setIsLeaving(true);
    completeTimerRef.current = window.setTimeout(finish, fadeDuration);
  }, [clearTimers, fadeDuration, finish, isLeaving]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      skipSplash();
    }
  };

  const style = {
    "--splash-duration": `${duration}ms`,
  } as CSSProperties;

  return (
    <div
      className={`splash-screen splash-screen--v9${isLeaving ? " splash-screen--leaving" : ""}`}
      style={style}
      role="button"
      tabIndex={0}
      aria-label="Iniciando SmartPlant Portal. Toque para continuar."
      onClick={skipSplash}
      onKeyDown={handleKeyDown}
    >
      <picture className="splash-screen__picture">
        <source
          media="(orientation: portrait)"
          srcSet="/og-smartplant-whatsapp-v8.jpg"
        />
        <img
          src="/og-smartplant-whatsapp-v7.jpg"
          alt="SmartPlant Portal · Resumen Ejecutivo"
          className="splash-screen__image"
          fetchPriority="high"
          draggable={false}
        />
      </picture>

      <div className="splash-screen__shade" aria-hidden="true" />

      <div className="splash-screen__brand" aria-hidden="true">
        <strong>SMARTPLANT PORTAL</strong>
        <span>Inteligencia Operativa Industrial</span>
      </div>

      <div className="splash-screen__status">
        <div className="splash-screen__status-row">
          <span className="splash-screen__pulse" aria-hidden="true" />
          <strong>Iniciando SmartPlant Portal</strong>
        </div>
        <span className="splash-screen__instruction">Toque para continuar</span>
        <div className="splash-screen__progress" aria-hidden="true">
          <span className="splash-screen__progress-bar" />
        </div>
      </div>
    </div>
  );
}
