"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const LEVELS = [
  { pct: 0, label: "Normal", power: "LAB POWER: WARMING UP..." },
  { pct: 25, label: "Curious", power: "LAB POWER: HEATING UP..." },
  { pct: 50, label: "WACKY!", power: "LAB POWER: GOING WILD!" },
  { pct: 75, label: "WACKY!", power: "LAB POWER: ALMOST BOOM!" },
  { pct: 100, label: "BOOM!", power: "💥 BOOOOM! 100%!" },
];

export function DrBoomExcitementMeter() {
  const [level, setLevel] = useState(0);
  const [running, setRunning] = useState(false);

  const current = LEVELS[level];
  const pct = current.pct;

  function runMeter() {
    if (running) return;
    setRunning(true);
    setLevel(0);

    const steps = LEVELS.length;
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      setLevel(step);
      if (step >= steps - 1) {
        window.clearInterval(interval);
        setRunning(false);
      }
    }, 450);
  }

  useEffect(() => {
    const timer = window.setTimeout(runMeter, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-explore-lime/30 bg-gradient-to-br from-explore-lime/10 to-explore-black/80 p-6 shadow-[0_0_40px_rgba(184,239,36,0.12)]">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-explore-lime">
        ⚡ DR. BOOM EXCITEMENT METER
      </p>

      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="font-display text-4xl font-bold text-explore-orange sm:text-5xl">
          {pct}%
        </span>
        {pct >= 100 && (
          <span className="animate-bounce text-3xl" aria-hidden>💥</span>
        )}
      </div>

      <p className="mt-2 text-center text-sm font-bold text-white">
        {current.power}
      </p>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            pct >= 100
              ? "bg-gradient-to-r from-explore-orange via-explore-lime to-explore-orange animate-pulse"
              : "bg-gradient-to-r from-explore-teal via-explore-lime to-explore-orange"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/40">
        {LEVELS.map((l) => (
          <span key={l.pct} className={pct >= l.pct ? "text-explore-lime" : ""}>
            {l.pct}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {["Normal", "Curious", "WACKY!", "BOOM!"].map((label) => (
          <span
            key={label}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold uppercase",
              current.label === label || (label === "WACKY!" && current.label === "WACKY!")
                ? "bg-explore-lime text-explore-black"
                : "bg-white/10 text-white/50"
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={runMeter}
        disabled={running}
        className="mt-5 w-full rounded-xl border border-explore-lime/40 bg-explore-lime/10 py-3 text-sm font-bold uppercase tracking-wide text-explore-lime transition hover:bg-explore-lime/20 disabled:opacity-50"
      >
        ⚗ RUN THE METER AGAIN!
      </button>
    </div>
  );
}
