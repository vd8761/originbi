"use client";

import React from "react";
import { ArrowRight, Keyboard } from "lucide-react";

export default function IatStudyIntroScreen({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-brand-light-tertiary bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#19211C] sm:p-10">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
          <Keyboard className="h-6 w-6" />
        </div>

        <h1 className="text-[clamp(22px,3vw,32px)] font-bold text-black dark:text-white">
          Before you begin
        </h1>

        <div className="mt-4 space-y-4 text-[15px] leading-7 text-black dark:text-white">
          <p>
            You&apos;re about to take an <strong>Implicit Association Test (IAT)</strong>. In it,
            you&apos;ll sort words into groups as quickly as you can using two keys on your keyboard.
          </p>
          <p>
            Alongside the sorting task there are a few short questions about your views and some
            basic background details. The whole thing takes roughly <strong>10 minutes</strong>.
          </p>
          <p>
            When you finish, you&apos;ll get your result together with a clear explanation of what it
            means for you.
          </p>
        </div>

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
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
