"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function IatModuleBreakScreen({
  moduleNumber,
  totalModules,
  answered,
  accuracy,
  elapsedLabel,
  onContinue,
  saving,
}: {
  moduleNumber: number;
  totalModules: number;
  answered: number;
  accuracy: number;
  elapsedLabel: string;
  onContinue: () => void;
  saving?: boolean;
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
        <p className="mt-2 text-sm text-brand-text-light-secondary dark:text-white/60">
          Nice work. Take a breath before the next one.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat value={String(answered)} label="Answered" />
          <Stat value={`${Math.round(accuracy)}%`} label="Accuracy" />
          <Stat value={elapsedLabel} label="Time" />
        </div>

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
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text-light-secondary dark:text-white/45">
        {label}
      </p>
    </div>
  );
}
