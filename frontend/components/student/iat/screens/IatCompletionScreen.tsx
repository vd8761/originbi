"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function IatCompletionScreen({ onExit }: { onExit?: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center py-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-brand-light-tertiary bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#19211C] sm:p-10">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-brand-green/15 text-brand-green">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-[clamp(24px,3.2vw,34px)] font-bold">Assessment completed</h1>
        <p className="mt-3 text-sm leading-7 text-brand-text-light-secondary dark:text-white/60">
          Thank you — your responses have been submitted successfully. You can now return to the
          assessment dashboard.
        </p>

        <button
          type="button"
          onClick={onExit}
          className="mt-7 inline-flex items-center justify-center rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Back to Assessments
        </button>
      </div>
    </div>
  );
}
