"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Compass } from "lucide-react";

const STAMPS = ["Learn", "Explore", "Discover", "Thrive"];
const INTRO_KEY = "ema-intro-played";

export function CinematicIntro() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const played = sessionStorage.getItem(INTRO_KEY);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played || reducedMotion) return;

    queueMicrotask(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!visible || skipped) return;

    document.body.style.overflow = "hidden";

    const overlay = overlayRef.current;
    if (!overlay) return;

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem(INTRO_KEY, "1");
        setVisible(false);
        document.body.style.overflow = "";
      },
    });

    tl.fromTo(".intro-compass", { rotation: -180, opacity: 0 }, { rotation: 0, opacity: 1, duration: 0.8, ease: "power2.out" })
      .fromTo(".intro-trail", { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, "-=0.3")
      .fromTo(".intro-stamp", { scale: 0, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.3, stagger: 0.15, ease: "back.out(2)" }, "-=0.5")
      .fromTo(".intro-logo", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" })
      .fromTo(".intro-tagline", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
      .to(".intro-map-fold", { scaleY: 0, transformOrigin: "top center", duration: 0.8, ease: "power2.inOut" }, "+=0.3")
      .to(overlay, { opacity: 0, duration: 0.4 }, "-=0.2");

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [visible, skipped]);

  const handleSkip = () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setSkipped(true);
    setVisible(false);
    document.body.style.overflow = "";
  };

  if (!visible || skipped) return null;

  return (
    <div
      ref={overlayRef}
      className="intro-map-fold fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-explore-black px-4"
      role="dialog"
      aria-label="Welcome animation"
    >
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-10 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors"
      >
        Skip Intro
      </button>

      <div className="relative flex w-full max-w-sm flex-col items-center sm:max-w-none">
        <svg className="absolute -top-20 hidden w-64 max-w-full opacity-30 sm:block h-32" viewBox="0 0 300 120">
          <path
            className="intro-trail"
            d="M10,60 Q80,20 150,60 T290,40"
            fill="none"
            stroke="#B8EF24"
            strokeWidth="2"
            strokeDasharray="600"
            strokeDashoffset="600"
          />
        </svg>

        <div className="intro-compass mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-explore-lime/30 bg-explore-forest/50">
          <Compass className="h-10 w-10 text-explore-lime" />
        </div>

        <div className="mb-8 flex max-w-full flex-wrap justify-center gap-2 px-1 sm:gap-3">
          {STAMPS.map((stamp) => (
            <span
              key={stamp}
              className="intro-stamp rounded-full border-2 border-dashed border-explore-orange/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-explore-orange opacity-0 sm:px-3 sm:text-xs sm:tracking-wider"
            >
              {stamp}
            </span>
          ))}
        </div>

        <div className="intro-logo text-center opacity-0">
          <h1 className="break-anywhere font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Explore More <span className="text-explore-lime">Academy</span>
          </h1>
          <p className="intro-tagline mt-2 text-explore-sky text-lg font-medium opacity-0">
            Learn Wild.
            <br />
            Live Big.
          </p>
        </div>
      </div>
    </div>
  );
}
