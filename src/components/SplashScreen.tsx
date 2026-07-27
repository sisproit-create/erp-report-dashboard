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
  duration = 3600,
  onComplete,
}: SplashScreenProps) {
  const fadeDuration = 450;
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number | null>(null);
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

  const startTimers = useCallback(
    (remaining: number) => {
      clearTimers();

      if (remaining <= 0) {
        finish();
        return;
      }

      startedAtRef.current = performance.now();

      const fadeDelay = Math.max(remaining - fadeDuration, 0);

      if (fadeDelay === 0) {
        setIsLeaving(true);
      } else {
        fadeTimerRef.current = window.setTimeout(() => {
          setIsLeaving(true);
        }, fadeDelay);
      }

      completeTimerRef.current = window.setTimeout(finish, remaining);
    },
    [clearTimers, fadeDuration, finish],
  );

  useEffect(() => {
    remainingRef.current = duration;
    completedRef.current = false;
    setIsLeaving(false);
    setIsPaused(false);
    startTimers(duration);

    return clearTimers;
  }, [clearTimers, duration, startTimers]);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePause();
    }
  };

  const style = {
    "--splash-duration": `${duration}ms`,
  } as CSSProperties;

  return (
    <div
      className={[
        "splash-screen",
        "splash-screen--v9",
        isPaused ? "splash-screen--paused" : "",
        isLeaving ? "splash-screen--leaving" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isPaused}
      aria-label={
        isPaused
          ? "Presentación pausada. Toque nuevamente para continuar."
          : "Iniciando SmartPlant Portal. Toque para pausar."
      }
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

      <div className="splash-screen__shade" aria-hidden="true" />

      <div className="splash-screen__brand" aria-hidden="true">
        <strong>SMARTPLANT PORTAL</strong>
        <span>Inteligencia Operativa Industrial</span>
      </div>

      <div className="splash-screen__status">
        <div className="splash-screen__status-row">
          <span className="splash-screen__pulse" aria-hidden="true" />
          <strong>
            {isPaused
              ? "Presentación pausada"
              : "Iniciando SmartPlant Portal"}
          </strong>
        </div>

        <span className="splash-screen__instruction">
          {isPaused
            ? "Toque nuevamente para continuar"
            : "Toque la pantalla para pausar"}
        </span>

        <div className="splash-screen__progress" aria-hidden="true">
          <span className="splash-screen__progress-bar" />
        </div>
      </div>
    </div>
  );
}
