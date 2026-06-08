"use client";

import React, { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { KeyHint } from "../components/primitives";

export interface BriefingCategory {
  category: string;
  words: string[];
}

type BriefingTrial = {
  wordShown: string;
  leftLabel: string | null;
  rightLabel: string | null;
  expectedKey: "E" | "I";
};

export function extractBriefingData(trials: BriefingTrial[]): BriefingCategory[] {
  const categories = new Map<string, Set<string>>();
  const simpleCategories = new Set<string>();

  const addWord = (category: string, word: string) => {
    if (!category || !word) return;
    if (!categories.has(category)) categories.set(category, new Set());
    categories.get(category)!.add(word);
  };

  for (const trial of trials) {
    const leftParts = splitLabelParts(trial.leftLabel);
    const rightParts = splitLabelParts(trial.rightLabel);
    if (leftParts.length !== 1 || rightParts.length !== 1) continue;

    const category = trial.expectedKey === "E" ? leftParts[0] : rightParts[0];
    simpleCategories.add(category);
    addWord(category, trial.wordShown);
  }

  for (const trial of trials) {
    const parts =
      trial.expectedKey === "E"
        ? splitLabelParts(trial.leftLabel)
        : splitLabelParts(trial.rightLabel);
    if (!parts.length) continue;

    const existingCategory = parts.find((part) => categories.get(part)?.has(trial.wordShown));
    const inferredCategory =
      existingCategory ||
      (parts.length > 1 ? parts.find((part) => !simpleCategories.has(part)) : undefined) ||
      parts[0];

    addWord(inferredCategory, trial.wordShown);
  }

  return Array.from(categories.entries()).map(([category, words]) => ({
    category,
    words: Array.from(words),
  }));
}

export default function IatModuleBriefingScreen({
  moduleNumber,
  totalModules,
  partNumber,
  totalParts,
  leftLabel,
  rightLabel,
  onContinue,
}: {
  moduleNumber: number;
  totalModules: number;
  partNumber: number;
  totalParts: number;
  leftLabel: string | null;
  rightLabel: string | null;
  onContinue: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      onContinue();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onContinue]);

  const leftParts = splitLabel(leftLabel, "Left");
  const rightParts = splitLabel(rightLabel, "Right");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col justify-center pb-28 pt-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-brand-light-tertiary bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#19211C] dark:shadow-none">
        <div className="flex flex-col gap-1 border-b border-brand-light-tertiary px-5 py-5 dark:border-white/[0.08] sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
            Module {moduleNumber} of {totalModules}
          </p>
          <h1 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
            Part {partNumber} of {totalParts}
          </h1>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <KeySide keyLabel="E" side="Left finger" parts={leftParts} />
            <KeySide keyLabel="I" side="Right finger" parts={rightParts} />
          </div>

          {/* Per-part instructions, larger than supporting text. */}
          <div className="mt-6 space-y-3 text-[clamp(15px,2.1vw,18px)] font-semibold leading-7 text-black dark:text-white">
            <p>
              Put a <span className="text-brand-green">left finger on E</span> for items in{" "}
              <CategoryPhrase parts={leftParts} />.
            </p>
            <p>
              Put a <span className="text-brand-green">right finger on I</span> for items in{" "}
              <CategoryPhrase parts={rightParts} />.
            </p>
          </div>

          <ul className="mt-4 space-y-1.5 text-sm leading-6 text-black/70 dark:text-white/65">
            <li>Items appear one at a time.</li>
            <li>If you make a mistake, a red indicator appears — press the other key to continue.</li>
            <li>Go as fast as you can while staying accurate.</li>
          </ul>

          <div className="mt-7 flex flex-col gap-3 border-t border-brand-light-tertiary pt-5 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-sm font-medium text-black/60 dark:text-white/55 sm:block">
              Press <strong className="text-brand-green">Spacebar</strong> when you are ready to
              start.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="hidden items-center justify-center gap-2 rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white transition hover:brightness-105 sm:inline-flex"
            >
              Start this part
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: bottom-anchored Start button (no keyboard available). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-light-tertiary bg-brand-light-primary/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#19211C]/95 sm:hidden">
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3.5 text-base font-bold text-white"
        >
          Start
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function splitLabel(label: string | null | undefined, fallback: string) {
  const parts = splitLabelParts(label);

  return parts.length ? parts : [fallback];
}

function splitLabelParts(label: string | null | undefined) {
  return String(label || "")
    .split(/\s*\+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Renders ["Male", "Family"] as "Male or Family" with category emphasis. */
function CategoryPhrase({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 && <span className="font-medium lowercase text-black/55 dark:text-white/55"> or </span>}
          <span className="font-black text-black dark:text-white">{part}</span>
        </React.Fragment>
      ))}
    </>
  );
}

function KeySide({
  keyLabel,
  side,
  parts,
}: {
  keyLabel: "E" | "I";
  side: string;
  parts: string[];
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-brand-light-tertiary bg-brand-light-primary/40 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-6">
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        <KeyHint keyLabel={keyLabel} />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
          {side}
        </p>
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center sm:items-start sm:text-left">
        {parts.map((part, index) => (
          <React.Fragment key={`${keyLabel}-${part}-${index}`}>
            {index > 0 && (
              <span className="text-sm font-bold lowercase text-black/45 dark:text-white/45">or</span>
            )}
            <span
              className={`min-w-0 break-words text-[clamp(22px,3vw,36px)] font-black leading-tight ${
                index > 0 ? "text-brand-green" : "text-black dark:text-white"
              }`}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
