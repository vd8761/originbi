"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { iatService, IatState } from "../../../lib/services/iat.service";
import IatShell from "./components/IatShell";
import IatInstructionsScreen from "./screens/IatInstructionsScreen";
import IatTrialRunner, { RunnerTrial } from "./screens/IatTrialRunner";
import IatModuleBriefingScreen, { extractBriefingData } from "./screens/IatModuleBriefingScreen";
import IatModuleBreakScreen from "./screens/IatModuleBreakScreen";
import IatCompletionScreen from "./screens/IatCompletionScreen";
import { ElapsedClock } from "./components/primitives";

type Screen = "instructions" | "practice" | "briefing" | "exam" | "break" | "done";

const practiceTrials: RunnerTrial[] = [
  { wordShown: "Cloud", expectedKey: "E", leftLabel: "Sky", rightLabel: "Ground" },
  { wordShown: "Stone", expectedKey: "I", leftLabel: "Sky", rightLabel: "Ground" },
  { wordShown: "Rain", expectedKey: "E", leftLabel: "Sky", rightLabel: "Ground" },
  { wordShown: "Soil", expectedKey: "I", leftLabel: "Sky", rightLabel: "Ground" },
  { wordShown: "Wind", expectedKey: "E", leftLabel: "Sky", rightLabel: "Ground" },
];

const formatTime = (seconds: number) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export default function IatExam({
  attemptId,
  onExit,
}: {
  attemptId: number | string;
  onExit?: () => void;
}) {
  const [state, setState] = useState<IatState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState<Screen>("instructions");
  const [trialIndex, setTrialIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correctFlash, setCorrectFlash] = useState<"E" | "I" | null>(null);
  const [saving, setSaving] = useState(false);
  const [breakInfo, setBreakInfo] = useState<{
    moduleNumber: number;
    answered: number;
    accuracy: number;
    elapsedLabel: string;
  } | null>(null);
  const [finishError, setFinishError] = useState("");
  // Track wrong answers in the current module to re-show at module break
  const [wrongTrials, setWrongTrials] = useState<{ word: string; correctKey: "E" | "I"; leftLabel: string; rightLabel: string }[]>([]);

  const finishingRef = useRef(false);
  const shownAtRef = useRef<number>(Date.now());
  const keyCountRef = useRef<Record<number, number>>({});
  const moduleStatsRef = useRef({ answered: 0, correct: 0 });
  // Overall elapsed-time anchor; the visible clock ticks inside <ElapsedClock>
  // so the heavy exam tree never re-renders just to advance the timer.
  const assessmentStartRef = useRef<number>(Date.now());
  const moduleStartRef = useRef<number>(Date.now());
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    // Guard against concurrent loads (React StrictMode invokes the effect
    // twice in dev, which would otherwise fire two parallel getState pipelines
    // and race the server-side first-time row creation).
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      setLoadError("");
      let next = await iatService.getState(attemptId);

      // Self-heal: if the current module's trials are all answered but it was
      // never marked complete (e.g. a completeModule call was lost mid-flow),
      // advance it here instead of dead-ending on an empty stimulus. getState
      // only returns the current module's trials, so this loop runs at most
      // once per fully-answered module; the guard caps it regardless.
      for (let guard = 0; guard < 8; guard++) {
        const moduleId = next.currentModuleId;
        const allAnswered =
          next.trials.length > 0 && next.trials.every((t) => t.status === "ANSWERED");
        if (next.attempt.status === "COMPLETED" || moduleId == null || !allAnswered) break;

        await iatService.completeModule(attemptId, moduleId);
        next = await iatService.getState(attemptId);
        if (next.modules.length && next.modules.every((m) => m.status === "COMPLETED")) {
          await iatService.finish(attemptId);
          next = await iatService.getState(attemptId);
          break;
        }
      }

      setState(next);

      // Intake collection was removed — go straight to the practice briefing.
      if (next.attempt.status === "COMPLETED") setScreen("done");
      else setScreen("instructions");

      const firstPending = next.trials.findIndex((t) => t.status !== "ANSWERED");
      setTrialIndex(firstPending >= 0 ? firstPending : next.trials.length);
      shownAtRef.current = Date.now();
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load the IAT assessment.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  const modules = state?.modules || [];
  const trials = state?.trials || [];
  const briefingData = useMemo(() => {
    return extractBriefingData(trials);
  }, [trials]);
  const completedModules = modules.filter((m) => m.status === "COMPLETED").length;
  const currentModule = useMemo(
    // currentModuleId arrives as a bigint string while module DTO ids are
    // numbers — compare as strings so the lookup actually matches.
    () => modules.find((m) => String(m.id) === String(state?.currentModuleId)) || null,
    [modules, state?.currentModuleId],
  );
  const currentTrial = trials[trialIndex] || null;
  const activePractice = practiceTrials[practiceIndex] || null;

  const resetClock = () => {
    shownAtRef.current = Date.now();
  };

  const beginExam = useCallback(() => {
    moduleStatsRef.current = { answered: 0, correct: 0 };
    setWrongTrials([]);
    setScreen("briefing");
  }, []);

  const startModuleExam = useCallback(() => {
    moduleStartRef.current = Date.now();
    setScreen("exam");
    resetClock();
  }, []);

  const finishModuleOrAttempt = useCallback(async () => {
    if (!state || !currentModule) return;
    if (finishingRef.current) return;
    finishingRef.current = true;
    setSaving(true);
    setFinishError("");
    try {
      const moduleNumber = completedModules + 1;
      const stats = moduleStatsRef.current;
      const moduleElapsedSec = Math.round((Date.now() - moduleStartRef.current) / 1000);
      await iatService.completeModule(attemptId, currentModule.id);
      const nextState = await iatService.getState(attemptId);
      setState(nextState);
      const allComplete = nextState.modules.every((m) => m.status === "COMPLETED");
      if (allComplete) {
        await iatService.finish(attemptId);
        const finalState = await iatService.getState(attemptId).catch(() => nextState);
        setState(finalState);
        setScreen("done");
      } else {
        const firstPending = nextState.trials.findIndex((t) => t.status !== "ANSWERED");
        setTrialIndex(firstPending >= 0 ? firstPending : 0);
        setBreakInfo({
          moduleNumber,
          answered: stats.answered,
          accuracy: stats.answered ? (stats.correct / stats.answered) * 100 : 100,
          elapsedLabel: formatTime(Math.max(0, moduleElapsedSec)),
        });
        setScreen("break");
      }
    } catch (err: any) {
      // Don't dead-end on a network blip (e.g. backend restarting): surface a
      // retryable error instead of leaving the runner on an empty stimulus.
      setFinishError(
        err?.message || "Couldn't save your responses. Check your connection and retry.",
      );
    } finally {
      setSaving(false);
      finishingRef.current = false;
    }
  }, [attemptId, completedModules, currentModule, state]);

  const handleCorrect = useCallback(async () => {
    if (screen === "practice") {
      if (practiceIndex >= practiceTrials.length - 1) {
        setPracticeIndex(0);
        beginExam();
      } else {
        setPracticeIndex((i) => i + 1);
        resetClock();
      }
      setWrongFlash(false);
      return;
    }

    if (screen !== "exam" || !currentTrial) return;
    if (trialIndex >= trials.length - 1) {
      setTrialIndex(trials.length);
      await finishModuleOrAttempt();
    } else {
      setTrialIndex((i) => i + 1);
      setWrongFlash(false);
      resetClock();
    }
  }, [beginExam, currentTrial, finishModuleOrAttempt, practiceIndex, screen, trialIndex, trials.length]);

  const handleKey = useCallback(
    async (key: "E" | "I") => {
      if (saving) return;
      const trial = screen === "practice" ? activePractice : currentTrial;
      if (!trial) return;

      const isCorrect = key === trial.expectedKey;
      const elapsed = Math.max(1, Math.round(Date.now() - shownAtRef.current));

      if (screen === "exam" && currentTrial) {
        const count = (keyCountRef.current[currentTrial.id] || 0) + 1;
        keyCountRef.current[currentTrial.id] = count;
        if (count === 1) {
          moduleStatsRef.current.answered += 1;
          if (isCorrect) moduleStatsRef.current.correct += 1;
        }
        await iatService.saveTrialEvents(attemptId, [
          {
            trialId: currentTrial.id,
            keyPressed: key,
            responseTimeMs: elapsed,
            eventSequence: count,
            shownAt: new Date(shownAtRef.current).toISOString(),
            answeredAt: new Date().toISOString(),
          },
        ]);
      }

      if (!isCorrect) {
        setWrongFlash(true);
        // Track this wrong answer for module-end review (only first wrong press per trial)
        if (screen === "exam" && currentTrial) {
          setWrongTrials((prev) => {
            if (prev.some((w) => w.word === currentTrial.wordShown)) return prev;
            return [...prev, {
              word: currentTrial.wordShown,
              correctKey: trial.expectedKey,
              leftLabel: String(trial.leftLabel || ""),
              rightLabel: String(trial.rightLabel || ""),
            }];
          });
        }
        return;
      }

      setCorrectFlash(key);
      window.setTimeout(() => setCorrectFlash(null), 180);
      await handleCorrect();
    },
    [activePractice, attemptId, currentTrial, handleCorrect, saving, screen],
  );

  useEffect(() => {
    if (screen !== "practice" && screen !== "exam") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      if (key !== "E" && key !== "I") return;
      event.preventDefault();
      void handleKey(key as "E" | "I");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey, screen]);

  // Safety net: if we're in the exam with every trial answered but the module
  // hasn't been completed yet (e.g. the completion call failed earlier), kick
  // it off automatically so we never sit on an empty stimulus.
  useEffect(() => {
    if (
      screen === "exam" &&
      trials.length > 0 &&
      trialIndex >= trials.length &&
      !saving &&
      !finishError
    ) {
      void finishModuleOrAttempt();
    }
  }, [screen, trials.length, trialIndex, saving, finishError, finishModuleOrAttempt]);

  // ---- Render ----

  if (loading) {
    return (
      <IatShell onExit={onExit}>
        <div className="grid min-h-[70vh] place-items-center text-sm text-brand-text-light-secondary dark:text-white/60">
          Loading assessment…
        </div>
      </IatShell>
    );
  }

  if (loadError) {
    return (
      <IatShell onExit={onExit}>
        <div className="grid min-h-[70vh] place-items-center text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-brand-red">Unable to open assessment</h1>
            <p className="mt-3 text-sm text-brand-text-light-secondary dark:text-white/60">
              {loadError}
            </p>
            <button
              onClick={() => void load()}
              className="mt-6 rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </IatShell>
    );
  }

  if (screen === "instructions") {
    return (
      <IatShell onExit={onExit}>
        <IatInstructionsScreen
          title="Practice round"
          description="We'll start with a short, unscored practice block so you get comfortable with the keys. Match each word to the correct category as fast as you can."
          ctaLabel="Start practice"
          onStart={() => {
            setPracticeIndex(0);
            setScreen("practice");
            resetClock();
          }}
          onBack={onExit}
        />
      </IatShell>
    );
  }

  if (screen === "briefing") {
    return (
      <IatShell onExit={onExit}>
        <IatModuleBriefingScreen
          moduleNumber={completedModules + 1}
          totalModules={modules.length || completedModules + 1}
          data={briefingData}
          onContinue={startModuleExam}
        />
      </IatShell>
    );
  }

  if (screen === "break" && breakInfo) {
    return (
      <IatShell onExit={onExit}>
        <IatModuleBreakScreen
          moduleNumber={breakInfo.moduleNumber}
          totalModules={modules.length || breakInfo.moduleNumber + 1}
          answered={breakInfo.answered}
          accuracy={breakInfo.accuracy}
          elapsedLabel={breakInfo.elapsedLabel}
          saving={saving}
          wrongTrials={wrongTrials}
          onContinue={() => {
            setBreakInfo(null);
            beginExam();
          }}
        />
      </IatShell>
    );
  }

  if (screen === "done") {
    return (
      <IatShell onExit={onExit}>
        <IatCompletionScreen onExit={onExit} />
      </IatShell>
    );
  }

  // Exam module is finishing (all trials answered, completion in flight or failed).
  if (screen === "exam" && trials.length > 0 && trialIndex >= trials.length) {
    return (
      <IatShell onExit={onExit}>
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center py-8">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-brand-light-tertiary bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#19211C]">
            {finishError ? (
              <>
                <h2 className="text-lg font-bold text-brand-red">Couldn&apos;t save this module</h2>
                <p className="mt-2 text-sm leading-6 text-brand-text-light-secondary dark:text-white/60">
                  {finishError}
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finishModuleOrAttempt()}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Retrying…" : "Retry"}
                </button>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-green" />
                <h2 className="text-lg font-bold">Scoring your responses…</h2>
                <p className="mt-2 text-sm text-brand-text-light-secondary dark:text-white/60">
                  Please wait a moment.
                </p>
              </>
            )}
          </div>
        </div>
      </IatShell>
    );
  }

  // practice | exam
  const isPractice = screen === "practice";
  const total = isPractice ? practiceTrials.length : trials.length;
  const current = isPractice
    ? practiceIndex + 1
    : Math.min(trialIndex + 1, trials.length);
  const progress = total ? Math.round((current / total) * 100) : 0;
  const displayTrial: RunnerTrial | null = isPractice
    ? activePractice
    : currentTrial
      ? {
          wordShown: currentTrial.wordShown,
          leftLabel: currentTrial.leftLabel,
          rightLabel: currentTrial.rightLabel,
          expectedKey: currentTrial.expectedKey,
          stepNumber: currentTrial.stepNumber,
        }
      : null;
  const moduleLabel = isPractice
    ? "Practice"
    : `${completedModules + 1} of ${modules.length || 6}`;

  return (
    <IatShell
      onExit={onExit}
      headerContent={<ElapsedClock startMs={assessmentStartRef.current} />}
    >
      <IatTrialRunner
        isPractice={isPractice}
        trial={displayTrial}
        current={current}
        total={total}
        moduleLabel={moduleLabel}
        startMs={assessmentStartRef.current}
        progress={progress}
        flashKey={correctFlash}
        wrong={wrongFlash}
        modules={modules}
        currentModuleId={state?.currentModuleId || null}
        onKey={(key) => void handleKey(key)}
      />
    </IatShell>
  );
}
