"use client";

import React, { useEffect } from "react";
import { ArrowRight, Keyboard } from "lucide-react";

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
  moduleTableData,
  showModuleTable,
  onContinue,
}: {
  moduleNumber: number;
  totalModules: number;
  partNumber: number;
  totalParts: number;
  leftLabel: string | null;
  rightLabel: string | null;
  moduleTableData: BriefingCategory[];
  showModuleTable: boolean;
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
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col justify-center py-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-brand-light-tertiary bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#19211C] dark:shadow-none">
        <div className="flex flex-col gap-4 border-b border-brand-light-tertiary px-5 py-5 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-green/12 text-brand-green">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                Module {moduleNumber} of {totalModules}
              </p>
              <h1 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Part {partNumber} of {totalParts}
              </h1>
            </div>
          </div>
          <div className="rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-2 text-sm font-bold text-brand-green">
            New key mapping
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <p className="max-w-2xl text-sm leading-6 text-black/70 dark:text-white/65">
            Review the two response keys for this part before the words begin.
            Sort each item into the one category it belongs to, moving quickly
            while staying accurate.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <KeySide keyLabel="E" parts={leftParts} />
            <KeySide keyLabel="I" parts={rightParts} />
          </div>

          {showModuleTable && moduleTableData.length > 0 && (
            <ModuleCategoryTable rows={moduleTableData} />
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-brand-light-tertiary pt-5 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-sm font-medium text-black/60 dark:text-white/55 sm:block">
              Press <strong className="text-brand-green">Spacebar</strong> when you are ready.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Start this part
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
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

function KeySide({
  keyLabel,
  parts,
}: {
  keyLabel: "E" | "I";
  parts: string[];
}) {
  return (
    <div className="grid min-h-[150px] gap-5 rounded-2xl border border-brand-light-tertiary bg-brand-light-primary/40 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:p-6">
      <div className="flex items-center gap-3 sm:flex-col sm:items-start">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-brand-green/30 bg-white font-black text-brand-green shadow-[0_3px_0_#1A8A47] dark:border-brand-green/40 dark:bg-white/10 sm:h-16 sm:w-16 sm:text-xl">
          {keyLabel}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
            Press key
          </p>
          <p className="text-sm font-semibold text-black dark:text-white">
            Use {keyLabel} for
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center">
        {parts.map((part, index) => (
          <React.Fragment key={`${keyLabel}-${part}-${index}`}>
            {index > 0 && (
              <span className="text-sm font-bold lowercase text-black/45 dark:text-white/45 sm:text-base">
                or
              </span>
            )}
            <span
              className={`min-w-0 break-words text-[clamp(24px,3.2vw,42px)] font-black leading-tight ${
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

function ModuleCategoryTable({ rows }: { rows: BriefingCategory[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-brand-light-tertiary dark:border-white/10">
      <div className="border-b border-brand-light-tertiary bg-brand-light-primary/50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
          Module word table
        </p>
      </div>

      <div className="divide-y divide-brand-light-tertiary dark:divide-white/[0.08]">
        {rows.map((row) => (
          <div
            key={row.category}
            className="grid gap-2 px-4 py-3 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-start"
          >
            <p className="text-sm font-bold text-black dark:text-white">{row.category}</p>
            <p className="text-sm font-medium leading-6 text-black/70 dark:text-white/70">
              {row.words.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
