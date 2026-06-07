"use client";

import React from "react";
import { Check, Loader2, Circle } from "lucide-react";
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
    <aside className="sticky top-20 hidden h-fit rounded-3xl border border-brand-light-tertiary bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03] lg:block">
      <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-text-light-secondary dark:text-white/45">
        Modules
      </p>
      <ol className="space-y-1.5">
        {modules.map((m, i) => {
          const state = stateOf(m, currentModuleId);
          return (
            <li
              key={m.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${row(state)}`}
            >
              <StatusIcon state={state} />
              <span className="truncate text-sm font-semibold">
                {m.displayName || m.name || `Module ${i + 1}`}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

type State = "done" | "current" | "todo";

function stateOf(m: IatModuleProgress, currentId: number | null): State {
  if (m.status === "COMPLETED") return "done";
  // currentId may be a bigint string while m.id is a number — compare loosely.
  if (String(m.id) === String(currentId)) return "current";
  return "todo";
}

function StatusIcon({ state }: { state: State }) {
  if (state === "done") return <Check className="h-4 w-4 shrink-0 text-brand-green" />;
  if (state === "current")
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-green" />;
  return <Circle className="h-4 w-4 shrink-0 text-brand-text-light-secondary dark:text-white/30" />;
}

function row(state: State) {
  if (state === "current")
    return "border-brand-green bg-brand-green/10 text-brand-text-light-primary dark:text-white";
  if (state === "done")
    return "border-brand-green/30 bg-brand-green/5 text-brand-text-light-secondary dark:text-white/70";
  return "border-transparent text-brand-text-light-secondary dark:text-white/45";
}

function chip(state: State) {
  if (state === "current")
    return "border-brand-green bg-brand-green/10 text-brand-green";
  if (state === "done")
    return "border-brand-green/30 bg-brand-green/5 text-brand-text-light-secondary dark:text-white/70";
  return "border-brand-light-tertiary text-brand-text-light-secondary dark:border-white/10 dark:text-white/45";
}
