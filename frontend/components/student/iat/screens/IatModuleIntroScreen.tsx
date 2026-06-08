"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Keyboard } from "lucide-react";
import type { BriefingCategory } from "./IatModuleBriefingScreen";

const READ_DELAY_SECONDS = 5;

export default function IatModuleIntroScreen({
  moduleNumber,
  totalModules,
  moduleName,
  totalParts,
  moduleTableData,
  onContinue,
}: {
  moduleNumber: number;
  totalModules: number;
  moduleName: string;
  totalParts: number;
  moduleTableData: BriefingCategory[];
  onContinue: () => void;
}) {
  const [remaining, setRemaining] = useState(READ_DELAY_SECONDS);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    setRemaining(READ_DELAY_SECONDS);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [moduleNumber]);

  const ready = remaining <= 0;

  const handleClick = () => {
    if (!ready) {
      setNudge(true);
      return;
    }
    onContinue();
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col justify-center py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-brand-light-tertiary bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#19211C] dark:shadow-none">
        <div className="flex items-center gap-3 border-b border-brand-light-tertiary px-5 py-5 dark:border-white/[0.08] sm:px-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-green/12 text-brand-green">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
              Module {moduleNumber} of {totalModules}
            </p>
            <h1 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
              {moduleName}
            </h1>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {/* Instructions are deliberately larger/bolder than the table below. */}
          <p className="text-[clamp(17px,2.4vw,22px)] font-bold leading-8 text-black dark:text-white">
            You&apos;ll use the <span className="text-brand-green">E</span> and{" "}
            <span className="text-brand-green">I</span> keys to sort items into groups as fast as you
            can. Here are the four groups for this module and the items in each:
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-brand-light-tertiary dark:border-white/10">
            <div className="border-b border-brand-light-tertiary bg-brand-light-primary/50 px-4 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                Groups in this module
              </p>
            </div>
            <div className="divide-y divide-brand-light-tertiary dark:divide-white/[0.08]">
              {moduleTableData.map((row) => (
                <div
                  key={row.category}
                  className="grid gap-1 px-4 py-2.5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-start"
                >
                  <p className="text-[13px] font-bold text-black dark:text-white">{row.category}</p>
                  <p className="text-[13px] font-medium leading-6 text-black/60 dark:text-white/60">
                    {row.words.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[clamp(16px,2.2vw,20px)] font-bold leading-7 text-black dark:text-white">
            This module has <span className="text-brand-green">{totalParts} parts</span>, and the
            rules change for each one. Read each part&apos;s instructions carefully before you start.
          </p>

          {nudge && !ready && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
              Please take a moment to read the instructions and the groups above carefully.
            </p>
          )}

          <div className="mt-7 flex justify-end border-t border-brand-light-tertiary pt-5 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleClick}
              aria-disabled={!ready}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition ${
                ready
                  ? "bg-brand-green hover:brightness-105"
                  : "cursor-not-allowed bg-brand-green/50"
              }`}
            >
              {ready ? "Continue" : `Read first… ${remaining}s`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
