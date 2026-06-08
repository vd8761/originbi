"use client";

import React from "react";
import { ArrowRight, TableProperties } from "lucide-react";

export interface BriefingCategory {
  category: string;
  words: string[];
  side: "left" | "right";
}

/**
 * Extracts the category → words table from the current module's trials.
 * Uses single-label (non-compound) steps to get accurate word-to-category mapping.
 */
export function extractBriefingData(
  trials: { wordShown: string; leftLabel: string | null; rightLabel: string | null; expectedKey: "E" | "I" }[],
): BriefingCategory[] {
  const categories = new Map<string, { words: Set<string>; side: "left" | "right" }>();

  for (const trial of trials) {
    const left = String(trial.leftLabel || "").trim();
    const right = String(trial.rightLabel || "").trim();

    // Only use trials with simple (non-compound) labels for clean grouping
    if (!left.includes("+") && !right.includes("+") && left && right) {
      const isLeft = trial.expectedKey === "E";
      const label = isLeft ? left : right;
      const side: "left" | "right" = isLeft ? "left" : "right";

      if (!categories.has(label)) {
        categories.set(label, { words: new Set(), side });
      }
      categories.get(label)!.words.add(trial.wordShown);
    }
  }

  return Array.from(categories.entries()).map(([category, { words, side }]) => ({
    category,
    words: Array.from(words),
    side,
  }));
}

export default function IatModuleBriefingScreen({
  moduleNumber,
  totalModules,
  data,
  onContinue,
}: {
  moduleNumber: number;
  totalModules: number;
  data: BriefingCategory[];
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-start sm:justify-center py-4 sm:py-8 px-0 sm:px-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-light-tertiary bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#19211C] dark:shadow-none overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-green/15 text-brand-green shrink-0">
              <TableProperties className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-black dark:text-white">
                Module {moduleNumber} of {totalModules}
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                Category Overview
              </h1>
            </div>
          </div>
          <p className="text-sm text-black dark:text-white mt-2 leading-relaxed">
            Review the categories and their associated words below. You will sort each word into the correct category as fast as you can.
          </p>
        </div>

        {/* Separator */}
        <div className="h-px bg-brand-light-tertiary dark:bg-white/[0.06]" />

        {/* Category table */}
        <div className="px-3 py-3 sm:px-6 sm:py-5">
          {data.length > 0 ? (
            <div className="rounded-2xl border border-brand-light-tertiary dark:border-white/10 overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[180px_1fr] bg-brand-light-primary/50 dark:bg-white/[0.03] border-b border-brand-light-tertiary dark:border-white/[0.06]">
                <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black dark:text-white">
                  Category
                </div>
                <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black dark:text-white">
                  Words
                </div>
              </div>

              {/* Table rows */}
              {data.map((row, idx) => (
                <div
                  key={row.category}
                  className={`flex flex-col sm:grid sm:grid-cols-[180px_1fr] ${
                    idx > 0 ? "border-t border-brand-light-tertiary dark:border-white/[0.06]" : ""
                  }`}
                >
                  <div className="px-4 pt-3 pb-1 sm:py-3 flex items-start">
                    <span className="text-xs sm:text-sm font-bold text-black dark:text-white leading-snug">
                      {row.category}
                    </span>
                  </div>
                  <div className="px-4 pb-3 pt-1 sm:py-3 flex flex-wrap items-start gap-1.5">
                    {row.words.map((word) => (
                      <span
                        key={word}
                        className="inline-block px-2.5 py-1 rounded-lg bg-brand-light-primary/60 dark:bg-white/[0.06] text-xs font-semibold text-black dark:text-white border border-brand-light-tertiary/50 dark:border-white/[0.04]"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-black dark:text-white py-6">
              Sort each word into the correct category as fast as you can.
            </p>
          )}
        </div>

        {/* Footer with Continue button */}
        <div className="h-px bg-brand-light-tertiary dark:bg-white/[0.06]" />
        <div className="px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between">
          <p className="text-xs text-black dark:text-white hidden sm:block">
            Press <strong className="text-brand-green">E</strong> for left,{" "}
            <strong className="text-brand-green">I</strong> for right
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
