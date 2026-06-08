"use client";

import React from "react";
import { ArrowRight, Keyboard } from "lucide-react";
import { KeyHint } from "../components/primitives";

export default function IatInstructionsScreen({
  title,
  description,
  ctaLabel,
  onStart,
  onBack,
  saving,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onStart: () => void;
  onBack?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-brand-light-tertiary bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#19211C] sm:p-10">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
          <Keyboard className="h-6 w-6" />
        </div>
        <h1 className="text-[clamp(22px,3vw,32px)] font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-black dark:text-white">
          {description}
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-brand-light-tertiary bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <KeyHint keyLabel="E" />
            <span className="text-sm font-semibold">Left category</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-light-tertiary bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <KeyHint keyLabel="I" />
            <span className="text-sm font-semibold">Right category</span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-6 text-black dark:text-white">
          Respond as quickly and accurately as you can. If you press the wrong key, just press the
          correct one to continue.
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-full border border-brand-light-tertiary px-6 py-3 text-sm font-semibold text-black transition hover:brightness-95 dark:border-white/10 dark:text-white"
            >
              Back to dashboard
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
