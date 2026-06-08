"use client";

import React, { useState, useEffect } from "react";
import {
  StatPill,
} from "../components/primitives";
import IatModuleStepper from "../components/IatModuleStepper";
import type { IatModuleProgress } from "../../../../lib/services/iat.service";

export interface RunnerTrial {
  wordShown: string;
  leftLabel: string | null;
  rightLabel: string | null;
  expectedKey: "E" | "I";
  stepNumber?: number;
}

const splitLabel = (label?: string | null) =>
  String(label || "")
    .split(/\s*\+\s*/)
    .filter(Boolean);

export default function IatTrialRunner({
  isPractice,
  trial,
  current,
  total,
  moduleLabel,
  startMs,
  progress,
  flashKey,
  wrong,
  modules,
  currentModuleId,
  onKey,
}: {
  isPractice: boolean;
  trial: RunnerTrial | null;
  current: number;
  total: number;
  moduleLabel: string;
  startMs: number;
  progress: number;
  flashKey: "E" | "I" | null;
  wrong: boolean;
  modules: IatModuleProgress[];
  currentModuleId: number | null;
  onKey: (key: "E" | "I") => void;
}) {
  const leftParts = splitLabel(trial?.leftLabel);
  const rightParts = splitLabel(trial?.rightLabel);
  const step = trial?.stepNumber ?? 1;
  const flash = wrong ? "wrong" : flashKey ? "correct" : null;

  const [pressedKey, setPressedKey] = useState<"E" | "I" | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "E" || key === "I") setPressedKey(key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "E" || key === "I") setPressedKey(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const leftShown = leftParts.length ? leftParts : ["Left"];
  const rightShown = rightParts.length ? rightParts : ["Right"];

  const isLeftActive = flashKey === "E" || pressedKey === "E";
  const isRightActive = flashKey === "I" || pressedKey === "I";

  /* ── Inline category chip (used inside the container on desktop) ── */
  const categoryChip = (
    side: "left" | "right",
    keyLabel: "E" | "I",
    parts: string[],
    active: boolean,
  ) => (
    <button
      type="button"
      onClick={() => onKey(keyLabel)}
      className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all duration-100 ${
        active
          ? "border-brand-green bg-brand-green/10 scale-[0.97]"
          : "border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm dark:shadow-none hover:border-brand-green/40"
      } ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      <span
        className={`grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg font-black text-xs sm:text-sm shrink-0 transition-all duration-75 ${
          active ? "bg-white text-brand-green" : "bg-brand-green text-white"
        }`}
      >
        {keyLabel}
      </span>
      <div className={`flex flex-wrap items-center gap-1 text-sm sm:text-base font-bold leading-tight ${side === "right" ? "justify-end" : ""}`}>
        {parts.map((part, i) => (
          <React.Fragment key={`${part}-${i}`}>
            {i > 0 && <span className="text-[11px] font-bold text-black/40 dark:text-white/35 px-0.5 lowercase">or</span>}
            <span className={i > 0 ? "text-brand-green" : "text-black dark:text-white"}>
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    </button>
  );

  return (
    <div className={`grid grid-cols-1 gap-0 ${isPractice ? "" : "lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8"}`}>
      {/* Main trial area */}
      <div className="flex flex-col gap-0 pt-4">

        {/* ═══ Single unified container ═══ */}
        <div className="w-full rounded-3xl border border-brand-light-tertiary dark:border-white/10 bg-white/50 dark:bg-white/[0.02] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">

          {/* Top section: Module + Questions + Module strip */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 sm:py-4">
            <StatPill label="Module" value={moduleLabel} />
            {!isPractice && <StatPill label="Step" value={`${step} of 7`} />}
            {isPractice && <StatPill label="Questions" value={`${current} / ${total}`} />}
            {!isPractice && (
              <div className="lg:hidden ml-auto">
                <IatModuleStepper
                  modules={modules}
                  currentModuleId={currentModuleId}
                  variant="strip"
                />
              </div>
            )}
          </div>

          {/* Separator line */}
          <div className="h-px bg-brand-light-tertiary dark:bg-white/[0.06]" />

          {/* Content section */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">

            {/* Desktop: Categories at top */}
            <div className="hidden sm:flex items-start justify-between gap-3">
              {categoryChip("left", "E", leftShown, isLeftActive)}
              {categoryChip("right", "I", rightShown, isRightActive)}
            </div>

            {/* Error message — persistent until correct */}
            {wrong && (
              <div className="mt-3 sm:mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-red/10 border border-brand-red/20">
                <svg className="h-4 w-4 text-brand-red shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-semibold text-brand-red">
                  Wrong key — press the correct one to continue
                </span>
              </div>
            )}

            {/* Stimulus word */}
            <div
              className={`mt-4 sm:mt-4 flex items-center justify-center w-full rounded-2xl border px-6 py-10 sm:py-14 transition-all duration-150 shadow-[0_1px_6px_rgba(0,0,0,0.04)] dark:shadow-none ${
                flash === "correct"
                  ? "border-brand-green bg-brand-green/5 dark:bg-brand-green/[0.04]"
                  : flash === "wrong"
                    ? "border-brand-red bg-brand-red/5 dark:bg-brand-red/[0.04] iat-animate-shake"
                    : "border-brand-light-tertiary dark:border-white/[0.06] bg-white/80 dark:bg-[#1A1D21]/60"
              }`}
            >
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
                key={`${isPractice ? "p" : "e"}-${current}-${trial?.wordShown}`}
                className={`animate-fade-in-fast font-bold leading-none text-center text-black dark:text-white ${
                  String(trial?.wordShown || "").length > 18
                    ? "text-[clamp(28px,5vw,56px)]"
                    : "text-[clamp(36px,7vw,80px)]"
                }`}
              >
                {trial?.wordShown}
              </span>
            </div>

            {/* Desktop: Bottom hint text */}
            <p className="mt-3 text-center text-xs font-medium text-black/40 dark:text-white/30 hidden sm:block">
              Press <strong className="text-brand-green">E</strong> for left,{" "}
              <strong className="text-brand-green">I</strong> for right — or tap a category.
            </p>
          </div>
        </div>

        {/* ═══ Mobile: Large category buttons OUTSIDE the container ═══ */}
        <div className="flex sm:hidden items-stretch gap-3 mt-4 px-1">
          <button
            type="button"
            onClick={() => onKey("E")}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-100 ${
              isLeftActive
                ? "border-brand-green bg-brand-green text-white scale-[0.97]"
                : "border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-white/[0.04] text-black dark:text-white shadow-sm dark:shadow-none active:scale-[0.97]"
            }`}
          >
            <span className="text-sm font-bold">{leftShown[0]}</span>
            {leftShown.length > 1 && (
              <>
                <span className="text-[10px] font-bold uppercase my-0.5 text-black/50 dark:text-white/40">or</span>
                <span className={`text-sm font-bold ${isLeftActive ? "text-white" : "text-brand-green"}`}>
                  {leftShown[1]}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onKey("I")}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-100 ${
              isRightActive
                ? "border-brand-green bg-brand-green text-white scale-[0.97]"
                : "border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-white/[0.04] text-black dark:text-white shadow-sm dark:shadow-none active:scale-[0.97]"
            }`}
          >
            <span className="text-sm font-bold">{rightShown[0]}</span>
            {rightShown.length > 1 && (
              <>
                <span className="text-[10px] font-bold uppercase my-0.5 text-black/50 dark:text-white/40">or</span>
                <span className={`text-sm font-bold ${isRightActive ? "text-white" : "text-brand-green"}`}>
                  {rightShown[1]}
                </span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Sidebar module stepper — only for non-practice */}
      {!isPractice && (
        <IatModuleStepper modules={modules} currentModuleId={currentModuleId} variant="sidebar" />
      )}
    </div>
  );
}
