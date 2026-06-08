"use client";

import React, { useEffect, useState } from "react";
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

function isAttributeWord(word: string, moduleLabel: string): boolean {
  const cleanWord = word.trim();
  const match = moduleLabel.match(/(\d+)\s+of/);
  const moduleNum = match ? parseInt(match[1], 10) : 1;

  if (moduleNum === 1) {
    const strategic = ["Visionary", "Decision-maker", "Innovative", "Autonomy", "Architect"];
    const dependent = ["Assistant", "Implementer", "Follower", "Execution", "Trainee"];
    return strategic.includes(cleanWord) || dependent.includes(cleanWord);
  }
  if (moduleNum === 2) {
    const high = ["Exceptional", "Top-performer", "Strategic Asset", "Visionary", "High-potential"];
    const average = ["Ordinary", "Mediocre", "Standard", "Replaceable", "Baseline"];
    return high.includes(cleanWord) || average.includes(cleanWord);
  }
  if (moduleNum === 3) {
    const executive = ["Boardroom", "P&L Owner", "Global Project", "Scale", "Strategy"];
    const domestic = ["Childcare", "Household", "Marriage", "Leave", "Maternity"];
    return executive.includes(cleanWord) || domestic.includes(cleanWord);
  }
  if (moduleNum === 4) {
    const leader = ["Authority", "Strategist", "Key Thinker", "Decision-maker", "Director"];
    const backOffice = ["Executor", "Coder", "Data Entry", "Support", "Support-staff"];
    return leader.includes(cleanWord) || backOffice.includes(cleanWord);
  }
  if (moduleNum === 5) {
    const alwaysCorrect = ["Infallible", "Absolute", "Command", "Final Word", "Definite"];
    const openToCritique = ["Feedback", "Disagreement", "Debate", "Challenged", "Questioned"];
    return alwaysCorrect.includes(cleanWord) || openToCritique.includes(cleanWord);
  }
  if (moduleNum === 6) {
    const leadership = ["Director", "Founder", "Manager", "Strategist", "Leader"];
    const support = ["Helper", "Cleaner", "Assistant", "Attendant", "Labourer"];
    return leadership.includes(cleanWord) || support.includes(cleanWord);
  }
  return false;
}

export default function IatTrialRunner({
  isPractice,
  trial,
  current,
  total,
  moduleLabel,
  progress: _progress,
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
  const currentModule = modules.find((m) => String(m.id) === String(currentModuleId));
  const activeModuleName = currentModule ? (currentModule.displayName || currentModule.name) : "";
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

  return (
    <div className={`grid grid-cols-1 gap-0 ${isPractice ? "" : "lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8"}`}>
      <div className="flex flex-col gap-0 pb-28 pt-[5vh] sm:pb-0 sm:pt-4">
        <div className="w-full overflow-hidden rounded-3xl border border-brand-light-tertiary bg-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none">
          <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold leading-none text-black dark:text-white">
              <span>{isPractice ? "Practice Block" : `Module: ${moduleLabel}`}</span>
              {isPractice ? (
                <span className="font-medium text-gray-400 dark:text-white/30">({current} / {total})</span>
              ) : (
                <>
                  <span className="font-medium text-gray-400 dark:text-white/30 sm:hidden">|</span>
                  <span className="max-w-[200px] truncate font-bold text-brand-green sm:hidden">
                    {activeModuleName}
                  </span>
                </>
              )}
            </div>

            {!isPractice && modules.length > 0 && (
              <div className="mt-1 flex w-full gap-1.5 lg:hidden">
                {modules.map((m) => {
                  const isCompleted = m.status === "COMPLETED";
                  const isCurrent = String(m.id) === String(currentModuleId);
                  return (
                    <div
                      key={m.id}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-brand-green"
                          : isCurrent
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-brand-light-tertiary dark:bg-white/10"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-brand-light-tertiary dark:bg-white/[0.06]" />

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {wrong && (
              <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-brand-red/10 px-4 py-2">
                <svg className="h-4 w-4 shrink-0 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-semibold text-brand-red">
                  You made a mistake, click the other one to continue
                </span>
              </div>
            )}

            <div
              className={`transition-all duration-150 ${
                flash === "correct"
                  ? "rounded-2xl bg-brand-green/5 dark:bg-brand-green/[0.04]"
                  : flash === "wrong"
                    ? "rounded-2xl bg-brand-red/5 dark:bg-brand-red/[0.04] iat-animate-shake"
                    : ""
              }`}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes iat-shake {
                  0%, 100% { transform: translateX(0); }
                  15%, 45%, 75% { transform: translateX(-8px); }
                  30%, 60%, 90% { transform: translateX(8px); }
                }
                .iat-animate-shake {
                  animation: iat-shake 0.35s ease-in-out;
                }
              ` }} />

              <div className="grid grid-cols-2 gap-4 px-1 pt-1 sm:gap-8 sm:px-2 sm:pt-2">
                <CategoryPrompt
                  side="left"
                  keyLabel="E"
                  parts={leftShown}
                  active={isLeftActive}
                  onClick={() => onKey("E")}
                />
                <CategoryPrompt
                  side="right"
                  keyLabel="I"
                  parts={rightShown}
                  active={isRightActive}
                  onClick={() => onKey("I")}
                />
              </div>

              <div className="flex min-h-[190px] w-full items-center justify-center px-2 py-8 sm:min-h-[250px] sm:py-12">
                <span
                  key={`${isPractice ? "p" : "e"}-${current}-${trial?.wordShown}`}
                  className={`animate-fade-in-fast text-center font-bold leading-none ${
                    isAttributeWord(trial?.wordShown || "", moduleLabel)
                      ? "text-brand-green"
                      : "text-black dark:text-white"
                  } ${
                    String(trial?.wordShown || "").length > 18
                      ? "text-[clamp(34px,6vw,68px)]"
                      : "text-[clamp(48px,8vw,96px)]"
                  }`}
                >
                  {trial?.wordShown}
                </span>
              </div>
            </div>

            <p className="mt-3 hidden text-center text-xs font-medium text-black/40 dark:text-white/30 sm:block">
              If you make a mistake, a red indicator will appear. Press the other option to proceed.
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-brand-light-tertiary bg-brand-light-primary/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#19211C]/95 sm:hidden">
          <MobileKeyButton
            keyLabel="E"
            parts={leftShown}
            active={isLeftActive}
            onClick={() => onKey("E")}
          />
          <MobileKeyButton
            keyLabel="I"
            parts={rightShown}
            active={isRightActive}
            onClick={() => onKey("I")}
          />
        </div>
      </div>

      {!isPractice && (
        <IatModuleStepper modules={modules} currentModuleId={currentModuleId} variant="sidebar" />
      )}
    </div>
  );
}

function CategoryPrompt({
  side,
  keyLabel,
  parts,
  active,
  onClick,
}: {
  side: "left" | "right";
  keyLabel: "E" | "I";
  parts: string[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[88px] flex-col items-center text-center transition-all duration-100 sm:min-h-[110px] ${
        active
          ? "scale-[0.98]"
          : "hover:text-brand-green"
      } ${side === "right" ? "ml-auto" : "mr-auto"}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/45 dark:text-white/45 sm:text-xs">
        Press <span className="text-brand-green">{keyLabel}</span> for
      </p>
      <div className="mt-2 flex flex-col items-center gap-1">
        {parts.map((part, index) => (
          <React.Fragment key={`${keyLabel}-${part}-${index}`}>
            {index > 0 && (
              <span className="text-xs font-bold lowercase text-black/45 dark:text-white/45 sm:text-sm">
                or
              </span>
            )}
            <span
              className={`max-w-full break-words text-[clamp(18px,3vw,34px)] font-black leading-tight ${
                index > 0 ? "text-brand-green" : "text-black dark:text-white"
              }`}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    </button>
  );
}

function MobileKeyButton({
  keyLabel,
  parts,
  active,
  onClick,
}: {
  keyLabel: "E" | "I";
  parts: string[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 flex-1 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition-all duration-100 ${
        active
          ? "border-brand-green bg-brand-green text-white scale-[0.98]"
          : "border-brand-light-tertiary bg-white text-black shadow-sm active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-black ${
          active ? "bg-white text-brand-green" : "bg-brand-green text-white"
        }`}
      >
        {keyLabel}
      </span>
      <span className="min-w-0 text-sm font-black leading-tight">
        {parts.join(" / ")}
      </span>
    </button>
  );
}
