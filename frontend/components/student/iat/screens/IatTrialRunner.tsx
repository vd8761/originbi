"use client";

import React from "react";
import { Target, Zap } from "lucide-react";
import {
  CategoryLabel,
  ElapsedClock,
  IatProgressBar,
  StatPill,
  StimulusCard,
} from "../components/primitives";
import IatModuleStepper from "../components/IatModuleStepper";
import type { IatModuleProgress } from "../../../../lib/services/iat.service";

export interface RunnerTrial {
  wordShown: string;
  leftLabel: string | null;
  rightLabel: string | null;
  expectedKey: "E" | "I";
  stepNumber?: number;
}

const splitLabel = (label?: string | null) =>
  String(label || "")
    .split(/\s*\+\s*/)
    .filter(Boolean);

/** Always-on guidance cards shown under the stimulus word. */
function InstructionHints() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Hint
        icon={<Zap className="h-5 w-5" />}
        title="Respond quickly"
        body="Your first reaction is most important."
      />
      <Hint
        icon={<Target className="h-5 w-5" />}
        title="Respond accurately"
        body="Sort the word to the side that fits best."
      />
    </div>
  );
}

function Hint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-light-tertiary bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border-2 border-brand-green/40 text-brand-green">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-brand-text-light-primary dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-brand-text-light-secondary dark:text-white/55">
          {body}
        </p>
      </div>
    </div>
  );
}

export default function IatTrialRunner({
  isPractice,
  trial,
  current,
  total,
  moduleLabel,
  startMs,
  progress,
  flashKey,
  wrong,
  modules,
  currentModuleId,
  onKey,
}: {
  isPractice: boolean;
  trial: RunnerTrial | null;
  current: number;
  total: number;
  moduleLabel: string;
  startMs: number;
  progress: number;
  flashKey: "E" | "I" | null;
  wrong: boolean;
  modules: IatModuleProgress[];
  currentModuleId: number | null;
  onKey: (key: "E" | "I") => void;
}) {
  const leftParts = splitLabel(trial?.leftLabel);
  const rightParts = splitLabel(trial?.rightLabel);
  const step = trial?.stepNumber ?? 1;
  const flash = wrong ? "wrong" : flashKey ? "correct" : null;

  return (
    <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Header + progress (order-1) */}
        <div className="order-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="Module" value={moduleLabel} />
            {!isPractice && <StatPill label="Step" value={`${step} of 7`} />}
            <StatPill label="Trial" value={`${current} / ${total}`} />
            <ElapsedClock startMs={startMs} />
          </div>
          <div className="mt-3">
            <IatProgressBar value={progress} />
          </div>
          {/* Module strip on tablet */}
          <div className="mt-4 lg:hidden">
            <IatModuleStepper
              modules={modules}
              currentModuleId={currentModuleId}
              variant="strip"
            />
          </div>
        </div>

        {/* Stimulus word — always directly under the header (order-2) */}
        <div className="order-2 flex flex-col items-center">
          <div className="mb-3 h-5 text-center text-xs font-semibold text-brand-red">
            {wrong ? "Wrong key — press the other one to continue." : ""}
          </div>
          <StimulusCard
            word={trial?.wordShown}
            flash={flash}
            stimulusKey={`${isPractice ? "p" : "e"}-${current}-${trial?.wordShown}`}
          />
        </div>

        {/*
          E / I controls. On small/medium screens they sit right under the word
          (order-3) so they're never pushed below the fold; on lg+ the hints move
          above them.
        */}
        <div className="order-3 lg:order-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <CategoryLabel
              side="LEFT"
              keyLabel="E"
              parts={leftParts}
              active={flashKey === "E"}
              onClick={() => onKey("E")}
            />
            <CategoryLabel
              side="RIGHT"
              keyLabel="I"
              parts={rightParts}
              active={flashKey === "I"}
              onClick={() => onKey("I")}
            />
          </div>
          <p className="mt-3 text-center text-xs font-medium text-brand-text-light-secondary dark:text-white/45">
            Press <strong className="text-brand-green">E</strong> for the left category,{" "}
            <strong className="text-brand-green">I</strong> for the right — or tap a card.
          </p>
        </div>

        {/* Always-on instructions: below the buttons on small/medium, above on lg+ */}
        <div className="order-4 lg:order-3">
          <InstructionHints />
        </div>
      </div>

      <IatModuleStepper modules={modules} currentModuleId={currentModuleId} variant="sidebar" />
    </div>
  );
}
