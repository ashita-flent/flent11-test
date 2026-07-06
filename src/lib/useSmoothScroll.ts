import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis inertial smooth-scroll, driven by GSAP's ticker and kept in sync
 * with ScrollTrigger. This is what gives the pinned scrub its premium,
 * weighted feel instead of raw wheel steps.
 *
 * Returns a ref to the live Lenis instance so callers can reset the scroll
 * position (e.g. when switching between hero options).
 */
export function useSmoothScroll(): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
