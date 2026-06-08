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
  const [label, setLabel] = useState(() => fmt((Date.now() - startMs) / 1000));
  useEffect(() => {
    const id = window.setInterval(
      () => setLabel(fmt((Date.now() - startMs) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startMs]);
  return <StatPill label="Time" value={label} className="ml-auto" />;
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text-light-secondary dark:text-white/45">
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
  const box = size === "sm" ? "h-9 w-9 text-base" : "h-12 w-12 text-xl";
  return (
    <span
      className={`grid ${box} place-items-center rounded-xl font-black transition ${
        active
          ? "bg-brand-green text-white shadow-lg shadow-brand-green/30"
          : "bg-brand-green/15 text-brand-green dark:bg-brand-green/20"
      }`}
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col rounded-2xl border p-4 text-left transition sm:p-5 ${
        active
          ? "border-brand-green bg-brand-green/10 shadow-lg shadow-brand-green/20"
          : "border-brand-light-tertiary bg-white/60 hover:border-brand-green/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-green/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-light-secondary dark:text-white/45">
          {side}
        </span>
        <KeyHint keyLabel={keyLabel} active={active} size="sm" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xl font-black leading-tight sm:text-2xl">
        {shown.map((part, index) => (
          <React.Fragment key={`${part}-${index}`}>
            {index > 0 && <span className="text-brand-text-light-secondary dark:text-white/35">+</span>}
            <span
              className={
                index > 0
                  ? "text-brand-green"
                  : "text-brand-text-light-primary dark:text-white"
              }
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-medium text-brand-text-light-secondary dark:text-white/40">
        Press {keyLabel} or tap
      </p>
    </button>
  );
}

type FlashState = "correct" | "wrong" | null;

/** Centered stimulus word panel with correct/incorrect ring flash. */
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
  const ring =
    flash === "correct"
      ? "border-brand-green ring-4 ring-brand-green/30"
      : flash === "wrong"
        ? "border-brand-red ring-4 ring-brand-red/25"
        : "border-brand-light-tertiary dark:border-white/10";
  return (
    <div
      className={`flex min-h-[200px] w-full items-center justify-center rounded-3xl border bg-white px-6 shadow-2xl transition-colors duration-100 dark:bg-brand-dark-secondary md:min-h-[300px] ${ring}`}
    >
      {/*
        No entrance animation: in a reaction-time test the word must appear the
        instant the trial changes. A fade-in delays the visual onset and makes
        each question feel laggy (and skews the measured response time).
      */}
      <span
        key={stimulusKey}
        className={`font-bold leading-none text-brand-text-light-primary dark:text-white ${
          isLong ? "text-[clamp(32px,5vw,64px)]" : "text-[clamp(40px,7vw,96px)]"
        }`}
      >
        {word}
      </span>
    </div>
  );
}
