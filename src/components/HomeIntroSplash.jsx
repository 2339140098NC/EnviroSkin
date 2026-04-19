import { useEffect, useRef, useState } from "react";
import SplitText from "./SplitText";

const EXIT_DURATION_MS = 760;
const HOLD_DURATION_MS = 520;
const REDUCED_MOTION_HOLD_MS = 900;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function HomeIntroSplash() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const holdTimeoutRef = useRef();
  const removeTimeoutRef = useRef();

  useEffect(() => {
    return () => {
      window.clearTimeout(holdTimeoutRef.current);
      window.clearTimeout(removeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) {
      return undefined;
    }

    holdTimeoutRef.current = window.setTimeout(() => {
      setIsExiting(true);
    }, REDUCED_MOTION_HOLD_MS);
    removeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, REDUCED_MOTION_HOLD_MS + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(holdTimeoutRef.current);
      window.clearTimeout(removeTimeoutRef.current);
    };
  }, [prefersReducedMotion]);

  if (!isVisible) {
    return null;
  }

  const handleTextComplete = () => {
    holdTimeoutRef.current = window.setTimeout(() => {
      setIsExiting(true);
      removeTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, EXIT_DURATION_MS);
    }, HOLD_DURATION_MS);
  };

  return (
    <div
      aria-hidden="true"
      className={`home-intro-splash ${isExiting ? "home-intro-splash--exit" : ""}`}
    >
      <div className="home-intro-splash__ambient" />
      <div className="home-intro-splash__glow home-intro-splash__glow--left" />
      <div className="home-intro-splash__glow home-intro-splash__glow--right" />
      <div className="home-intro-splash__panel glass-panel">
        <div className="home-intro-splash__sheen" />
        <SplitText
          text="Welcome"
          tag="h1"
          animate={!prefersReducedMotion}
          delay={72}
          duration={680}
          className="home-intro-splash__title"
          onAnimationComplete={prefersReducedMotion ? undefined : handleTextComplete}
        />
      </div>
    </div>
  );
}

export default HomeIntroSplash;
