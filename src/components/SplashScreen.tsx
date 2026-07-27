import { useCallback, useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  duration?: number;
  onComplete: () => void;
}

export default function SplashScreen({
  duration = 2800,
  onComplete,
}: SplashScreenProps) {
  const fadeDuration = 500;
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const completeSplash = useCallback(() => {
    if (completedRef.current) return;

    completedRef.current = true;
    clearTimers();
    onComplete();
  }, [clearTimers, onComplete]);

  const startTimers = useCallback(
    (remaining: number) => {
      clearTimers();

      if (remaining <= 0) {
        completeSplash();
        return;
      }

      startedAtRef.current = performance.now();

      const timeUntilFade = Math.max(remaining - fadeDuration, 0);

      if (timeUntilFade === 0) {
        setIsLeaving(true);
      } else {
        exitTimerRef.current = window.setTimeout(() => {
          setIsLeaving(true);
        }, timeUntilFade);
      }

      completeTimerRef.current = window.setTimeout(
        completeSplash,
        remaining,
      );
    },
    [clearTimers, completeSplash],
  );

  useEffect(() => {
    remainingRef.current = duration;
    completedRef.current = false;
    setIsLeaving(false);
    setIsPaused(false);
    startTimers(duration);

    return clearTimers;
  }, [duration, startTimers, clearTimers]);

  const togglePause = useCallback(() => {
    if (completedRef.current || isLeaving) return;

    if (!isPaused) {
      const elapsed =
        startedAtRef.current === null
          ? 0
          : performance.now() - startedAtRef.current;

      remainingRef.current = Math.max(
        remainingRef.current - elapsed,
        0,
      );

      clearTimers();
      setIsPaused(true);
      return;
    }

    setIsPaused(false);
    startTimers(remainingRef.current);
  }, [clearTimers, isLeaving, isPaused, startTimers]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePause();
    }
  };

  return (
    <div
      className={`splash-screen ${
        isLeaving ? "splash-screen--leaving" : ""
      } ${isPaused ? "splash-screen--paused" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={
        isPaused
          ? "Vista ampliada. Toque nuevamente para continuar."
          : "Iniciando SmartPlant Portal. Toque para pausar y ampliar."
      }
      aria-pressed={isPaused}
      onClick={togglePause}
      onKeyDown={handleKeyDown}
    >
      <img
        src="/og-smartplant-whatsapp-v7.jpg"
        alt="SmartPlant Portal · Resumen Ejecutivo"
        className="splash-screen__image"
        fetchPriority="high"
        draggable={false}
      />

      <div className="splash-screen__overlay" aria-hidden="true" />

      <div className="splash-screen__loader">
        <span
          className="splash-screen__spinner"
          aria-hidden="true"
        />
        <span>
          {isPaused
            ? "Pausado · toque para continuar"
            : "Iniciando SmartPlant Portal..."}
        </span>
      </div>

      <div className="splash-screen__tap-hint" aria-hidden="true">
        {isPaused
          ? "Toque nuevamente para continuar"
          : "Toque para pausar y ampliar"}
      </div>
    </div>
  );
}
