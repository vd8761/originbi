"use client";

import React from "react";
import { Check, Play } from "lucide-react";
import type { IatModuleProgress } from "../../../../lib/services/iat.service";

/**
 * Module progress list. Renders as a sticky sidebar card on lg+, and as a
 * horizontal chip strip on smaller screens (controlled by the `variant` prop).
 */
export default function IatModuleStepper({
  modules,
  currentModuleId,
  variant = "sidebar",
}: {
  modules: IatModuleProgress[];
  currentModuleId: number | null;
  variant?: "sidebar" | "strip";
}) {
  if (!modules.length) return null;

  if (variant === "strip") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {modules.map((m, i) => {
          const state = stateOf(m, currentModuleId);
          return (
            <div
              key={m.id}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${chip(state)}`}
            >
              <StatusIcon state={state} />
              <span>Module {i + 1}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="sticky top-20 hidden h-fit rounded-3xl border border-brand-light-tertiary bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.03] lg:block w-[260px]">
      <p className="px-1 pb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black dark:text-white">
        Modules
      </p>
      <div className="relative pl-1">
        <ol className="space-y-4 relative">
          {modules.map((m, i) => {
            const state = stateOf(m, currentModuleId);
            const isActive = state === "current";
            return (
              <li
                key={m.id}
                className="flex items-start gap-4 group relative min-h-[28px]"
              >
                {/* Timeline connector segment */}
                {i < modules.length - 1 && (
                  <div className={`absolute left-[13px] top-7 bottom-[-16px] w-[2px] z-0 ${
                    state === "done"
                      ? "bg-brand-green"
                      : "bg-brand-light-tertiary dark:bg-white/10"
                  }`} />
                )}

                {/* Icon wrapper with solid background to mask the timeline line */}
                <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
                  state === "done"
                    ? "border-brand-green bg-white dark:bg-[#19211C] text-brand-green"
                    : isActive
                      ? "border-brand-green bg-brand-green text-white animate-pulse"
                      : "border-brand-light-tertiary dark:border-white/15 bg-white dark:bg-[#19211C] text-black dark:text-white"
                }`}>
                  <StatusIcon state={state} />
                </div>
                <span className={`text-sm font-semibold transition-colors duration-150 leading-relaxed ${
                  isActive ? "text-brand-green font-bold" : "text-black dark:text-white"
                }`}>
                  {m.displayName || m.name || `Module ${i + 1}`}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

type State = "done" | "current" | "todo";

function stateOf(m: IatModuleProgress, currentId: number | null): State {
  if (m.status === "COMPLETED") return "done";
  if (String(m.id) === String(currentId)) return "current";
  return "todo";
}

function StatusIcon({ state }: { state: State }) {
  if (state === "done") return <Check className="h-3.5 w-3.5" />;
  if (state === "current")
    return <Play className="h-2.5 w-2.5 fill-current text-white ml-[0.5px]" />;
  return <div className="h-1.5 w-1.5 rounded-full bg-black/40 dark:bg-white/40" />;
}

function chip(state: State) {
  if (state === "current")
    return "border-brand-green bg-brand-green/10 text-brand-green";
  if (state === "done")
    return "border-brand-green/30 bg-brand-green/5 text-black dark:text-white";
  return "border-brand-light-tertiary text-black dark:border-white/10 dark:text-white";
}
