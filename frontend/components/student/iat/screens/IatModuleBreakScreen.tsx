"use client";

import React from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export interface WrongTrial {
  word: string;
  correctKey: "E" | "I";
  leftLabel: string;
  rightLabel: string;
}

export default function IatModuleBreakScreen({
  moduleNumber,
  totalModules,
  answered,
  accuracy,
  elapsedLabel,
  onContinue,
  saving,
  wrongTrials = [],
}: {
  moduleNumber: number;
  totalModules: number;
  answered: number;
  accuracy: number;
  elapsedLabel: string;
  onContinue: () => void;
  saving?: boolean;
  wrongTrials?: WrongTrial[];
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center py-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-brand-light-tertiary bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#19211C] sm:p-10">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-green/15 text-brand-green">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-[clamp(20px,2.6vw,28px)] font-bold">
          Module {moduleNumber} complete
        </h1>
        <p className="mt-2 text-sm text-black dark:text-white">
          Nice work. Take a breath before the next one.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat value={String(answered)} label="Answered" />
          <Stat value={`${Math.round(accuracy)}%`} label="Accuracy" />
          <Stat value={elapsedLabel} label="Time" />
        </div>

        {/* Wrong answers review section */}
        {wrongTrials.length > 0 && (
          <div className="mt-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-brand-red" />
              <span className="text-sm font-bold text-brand-red">
                {wrongTrials.length} incorrect {wrongTrials.length === 1 ? "response" : "responses"}
              </span>
            </div>
            <div className="rounded-2xl border border-brand-red/15 bg-brand-red/[0.04] dark:bg-brand-red/[0.06] overflow-hidden">
              {wrongTrials.map((wt, idx) => (
                <div
                  key={`${wt.word}-${idx}`}
                  className={`flex items-center justify-between px-4 py-3 ${
                    idx > 0 ? "border-t border-brand-red/10 dark:border-brand-red/15" : ""
                  }`}
                >
                  <span className="text-sm font-bold text-black dark:text-white">
                    {wt.word}
                  </span>
                  <span className="text-xs font-semibold text-black dark:text-white">
                    Correct: <strong className="text-brand-green">{wt.correctKey}</strong>{" "}
                    ({wt.correctKey === "E" ? wt.leftLabel : wt.rightLabel})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={onContinue}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {saving ? "Loading…" : `Continue to module ${moduleNumber + 1} of ${totalModules}`}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-brand-light-tertiary bg-white/60 px-3 py-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-lg font-bold text-brand-text-light-primary dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black dark:text-white">
        {label}
      </p>
    </div>
  );
}
