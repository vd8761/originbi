"use client";

import React, { useEffect, useState } from "react";

const fmt = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Self-contained elapsed-time pill. It owns its own 1s interval and local state
 * so ticking only re-renders THIS leaf — not the whole exam tree (which would
 * otherwise force the stimulus/cards to repaint every second).
 */
export function ElapsedClock({ startMs }: { startMs: number }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.floor((Date.now() - startMs) / 1000)));

  useEffect(() => {
    const id = window.setInterval(
      () => setSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000))),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startMs]);

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-2 px-3 rounded-full bg-brand-light-primary/30 dark:bg-white/5 border border-brand-light-tertiary dark:border-white/10 text-brand-text-light-primary dark:text-white font-mono text-sm shrink-0 h-9">
      <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{m}:{s}</span>
    </div>
  );
}

/** Small KPI pill used in the trial-runner header (time, trial count, etc). */
export function StatPill({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-light-tertiary bg-white/70 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black dark:text-white">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold text-brand-text-light-primary dark:text-white">
        {value}
      </p>
    </div>
  );
}

/** Brand-green linear progress bar. */
export function IatProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-light-tertiary dark:bg-white/10">
      <div
        className="h-full rounded-full bg-brand-green transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** A keycap visual for the E / I keys. */
export function KeyHint({
  keyLabel,
  active,
  size = "md",
}: {
  keyLabel: "E" | "I";
  active?: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";
  
  // 3D mechanical keycap styling
  const activeClass = active
    ? "translate-y-[3px] shadow-none bg-brand-green text-white border-brand-green"
    : "bg-gradient-to-b from-white to-gray-100 dark:from-white/10 dark:to-white/[0.02] border-gray-300 dark:border-white/10 text-brand-green shadow-[0_3px_0_#1A8A47] hover:brightness-105 active:translate-y-[1px]";

  return (
    <span
      className={`grid ${box} place-items-center rounded-xl border font-black select-none transition-all duration-75 ${activeClass}`}
    >
      {keyLabel}
    </span>
  );
}

/**
 * One side's concept card (left = E, right = I). Labels may be compound
 * ("Self + Sky") and are split on "+" with the joining concept highlighted.
 */
export function CategoryLabel({
  side,
  keyLabel,
  parts,
  active,
  onClick,
}: {
  side: "LEFT" | "RIGHT";
  keyLabel: "E" | "I";
  parts: string[];
  active?: boolean;
  onClick?: () => void;
}) {
  const shown = parts.length ? parts : [side === "LEFT" ? "Left" : "Right"];

  // Glassmorphic interactive cards with depressed scale on active key press
  const activeClass = active
    ? "border-brand-green bg-brand-green/10 shadow-[0_0_30px_rgba(30,211,106,0.15)] scale-[0.98] translate-y-[2px]"
    : "border-brand-light-tertiary dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md shadow-lg hover:border-brand-green/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-px";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-100 ease-out ${activeClass}`}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-black dark:text-white">
          {side}
        </span>
        <KeyHint keyLabel={keyLabel} active={active} size="sm" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xl font-black leading-tight sm:text-2xl">
        {shown.map((part, index) => (
          <React.Fragment key={`${part}-${index}`}>
            {index > 0 && <span className="text-[14px] font-bold text-black dark:text-white px-1 lowercase">or</span>}
            <span
              className={
                index > 0
                  ? "text-brand-green"
                  : "text-black dark:text-white"
              }
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-medium text-black dark:text-white">
        Press {keyLabel} or tap
      </p>
    </button>
  );
}

type FlashState = "correct" | "wrong" | null;

/** Centered stimulus word panel with correct/incorrect ring flash and shake. */
export function StimulusCard({
  word,
  flash,
  stimulusKey,
}: {
  word?: string;
  flash: FlashState;
  stimulusKey: string;
}) {
  const isLong = String(word || "").length > 18;

  // Ambient glow styles based on correct / wrong feedback
  const ring =
    flash === "correct"
      ? "border-brand-green shadow-[0_0_50px_rgba(30,211,106,0.25)] dark:shadow-[0_0_60px_rgba(30,211,106,0.18)] scale-[1.01]"
      : flash === "wrong"
        ? "border-brand-red shadow-[0_0_50px_rgba(239,68,68,0.25)] dark:shadow-[0_0_60px_rgba(239,68,68,0.18)] iat-animate-shake"
        : "border-brand-light-tertiary dark:border-white/10 bg-white/95 dark:bg-[#1A1D21]/95 shadow-xl hover:shadow-2xl";

  return (
    <div
      className={`flex min-h-[200px] w-full items-center justify-center rounded-3xl border px-6 transition-all duration-150 md:min-h-[300px] relative overflow-hidden ${ring}`}
    >
      {/* CSS Keyframes for Wrong Shake animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes iat-shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-8px); }
          30%, 60%, 90% { transform: translateX(8px); }
        }
        .iat-animate-shake {
          animation: iat-shake 0.35s ease-in-out;
        }
      `}} />

      <span
        key={stimulusKey}
        className={`animate-fade-in-fast font-bold leading-none text-center text-black dark:text-white ${
          isLong ? "text-[clamp(32px,5vw,64px)]" : "text-[clamp(40px,7vw,96px)]"
        }`}
      >
        {word}
      </span>
    </div>
  );
}
