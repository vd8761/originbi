"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { iatService, IatState } from "../../../lib/services/iat.service";
import IatShell from "./components/IatShell";
import IatStudyIntroScreen from "./screens/IatStudyIntroScreen";
import IatModuleIntroScreen from "./screens/IatModuleIntroScreen";
import IatTrialRunner, { RunnerTrial } from "./screens/IatTrialRunner";
import IatModuleBriefingScreen, { extractBriefingData } from "./screens/IatModuleBriefingScreen";
import IatCompletionScreen from "./screens/IatCompletionScreen";
import { ElapsedClock } from "./components/primitives";

type Screen = "study-intro" | "module-intro" | "part-briefing" | "exam" | "done";

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
  const [screen, setScreen] = useState<Screen>("study-intro");
  const [trialIndex, setTrialIndex] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correctFlash, setCorrectFlash] = useState<"E" | "I" | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishError, setFinishError] = useState("");
  // Words passed (answered correctly on a fresh press) in the current part.
  // Progress is driven by this, not by raw position, so a wrong answer holds
  // the bar back until it's re-asked and answered correctly.
  const [partPassed, setPartPassed] = useState(0);

  // Re-ask gate: a part only completes once every word missed in it has been
  // answered correctly on the first press. Misses are queued here and re-asked
  // at the end of the part. Re-ask presses are NOT sent to the server, so they
  // never affect the scored first-presentation timings.
  const [retryTrial, setRetryTrial] = useState<RunnerTrial | null>(null);
  const retryQueueRef = useRef<RunnerTrial[]>([]);
  const pendingTransitionRef = useRef<{ type: "next-part" | "finish" } | null>(null);
  // True while a missed re-ask word is waiting for its corrective key press.
  const awaitingCorrectionRef = useRef(false);

  const finishingRef = useRef(false);
  const shownAtRef = useRef<number>(Date.now());
  const keyCountRef = useRef<Record<number, number>>({});
  const moduleTimingStartedRef = useRef(false);
  // Overall elapsed-time anchor; the visible clock ticks inside <ElapsedClock>
  // so the heavy exam tree never re-renders just to advance the timer.
  const assessmentStartRef = useRef<number>(Date.now());
  const moduleStartRef = useRef<number>(Date.now());
  const loadingRef = useRef(false);
  // Keypress events are buffered and flushed to the server in the background so
  // the runner never blocks on a network round-trip between trials (that lag
  // was causing presses to bleed into the next trial on slow connections).
  type BufferedEvent = {
    trialId: number;
    keyPressed: "E" | "I";
    responseTimeMs: number;
    eventSequence: number;
    shownAt?: string;
    answeredAt?: string;
  };
  const eventBufferRef = useRef<BufferedEvent[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const flushingRef = useRef(false);

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

      const firstPending = next.trials.findIndex((t) => t.status !== "ANSWERED");
      setTrialIndex(firstPending >= 0 ? firstPending : next.trials.length);
      const hasSavedTrialProgress = next.trials.some((t) => t.status === "ANSWERED");

      if (next.attempt.status === "COMPLETED") {
        setScreen("done");
      } else if (hasSavedTrialProgress) {
        // Resuming mid-module: drop the student back onto the current part's
        // instructions so they re-read the (changed) key mapping before going on.
        moduleTimingStartedRef.current = false;
        setScreen("part-briefing");
      } else {
        setScreen("study-intro");
      }

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
  const briefingData = useMemo(() => extractBriefingData(trials), [trials]);
  const moduleStepNumbers = useMemo(() => {
    const seen = new Set<number>();
    return trials.reduce<number[]>((steps, trial) => {
      if (!seen.has(trial.stepNumber)) {
        seen.add(trial.stepNumber);
        steps.push(trial.stepNumber);
      }
      return steps;
    }, []);
  }, [trials]);
  const completedModules = modules.filter((m) => m.status === "COMPLETED").length;
  const currentModule = useMemo(
    // currentModuleId arrives as a bigint string while module DTO ids are
    // numbers - compare as strings so the lookup actually matches.
    () => modules.find((m) => String(m.id) === String(state?.currentModuleId)) || null,
    [modules, state?.currentModuleId],
  );
  const currentTrial = trials[trialIndex] || null;

  const totalParts = moduleStepNumbers.length || 7;
  const activeStep = retryTrial?.stepNumber ?? currentTrial?.stepNumber ?? moduleStepNumbers[0] ?? 1;
  const partIndex = moduleStepNumbers.indexOf(activeStep);
  const partNumber = partIndex >= 0 ? partIndex + 1 : 1;
  const partCount = useMemo(
    () => trials.filter((t) => t.stepNumber === activeStep).length,
    [trials, activeStep],
  );
  // Total questions for this part includes the words that have to be re-asked
  // because they were missed - so the bar only fills once everything (misses
  // included) has been answered correctly.
  const partTotal = partCount + retryQueueRef.current.length + (retryTrial ? 1 : 0);
  const partProgress = partTotal ? Math.min(100, (partPassed / partTotal) * 100) : 0;

  const resetClock = () => {
    shownAtRef.current = Date.now();
  };

  const startModuleExam = useCallback(() => {
    if (!moduleTimingStartedRef.current) {
      moduleStartRef.current = Date.now();
      moduleTimingStartedRef.current = true;
    }
    // Each part starts with a clean re-ask gate and progress counter.
    retryQueueRef.current = [];
    pendingTransitionRef.current = null;
    awaitingCorrectionRef.current = false;
    setRetryTrial(null);
    setPartPassed(0);
    setScreen("exam");
    resetClock();
  }, []);

  // Send any buffered keypress events to the server. Safe to call repeatedly;
  // on failure the batch is requeued so nothing is lost.
  const flushEvents = useCallback(async () => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (flushingRef.current) return;
    const batch = eventBufferRef.current;
    if (batch.length === 0) return;
    eventBufferRef.current = [];
    flushingRef.current = true;
    try {
      await iatService.saveTrialEvents(attemptId, batch);
    } catch {
      // Re-queue so a transient failure doesn't drop the responses.
      eventBufferRef.current = [...batch, ...eventBufferRef.current];
    } finally {
      flushingRef.current = false;
    }
  }, [attemptId]);

  // Debounced background flush: send when the buffer grows or after a short idle.
  const scheduleFlush = useCallback(() => {
    if (eventBufferRef.current.length >= 12) {
      void flushEvents();
      return;
    }
    if (flushTimerRef.current !== null) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      void flushEvents();
    }, 700);
  }, [flushEvents]);

  const finishModuleOrAttempt = useCallback(async () => {
    if (!state || !currentModule) return;
    if (finishingRef.current) return;
    finishingRef.current = true;
    setSaving(true);
    setFinishError("");
    try {
      // Make sure every buffered keypress is persisted before the module is scored.
      await flushEvents();
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
        // Next module starts with its own intro screen and a fresh timer.
        moduleTimingStartedRef.current = false;
        const firstPending = nextState.trials.findIndex((t) => t.status !== "ANSWERED");
        setTrialIndex(firstPending >= 0 ? firstPending : 0);
        setScreen("module-intro");
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
  }, [attemptId, currentModule, flushEvents, state]);

  // Move to the next queued re-ask word, or - when the queue is empty - run the
  // transition that was deferred while the student cleared their misses.
  const advanceRetry = useCallback(() => {
    awaitingCorrectionRef.current = false;
    setWrongFlash(false);
    const next = retryQueueRef.current.shift();
    if (next) {
      setRetryTrial(next);
      resetClock();
      return;
    }
    setRetryTrial(null);
    const pending = pendingTransitionRef.current;
    pendingTransitionRef.current = null;
    if (pending?.type === "finish") {
      setTrialIndex(trials.length);
      void finishModuleOrAttempt();
    } else if (pending?.type === "next-part") {
      setScreen("part-briefing");
      resetClock();
    }
  }, [finishModuleOrAttempt, trials.length]);

  // Begin re-asking the words missed in the part that just ended. The part can
  // only complete once this queue is fully cleared.
  const startRetryPhase = useCallback(() => {
    awaitingCorrectionRef.current = false;
    setWrongFlash(false);
    const first = retryQueueRef.current.shift();
    if (!first) {
      advanceRetry();
      return;
    }
    setRetryTrial(first);
    resetClock();
  }, [advanceRetry]);

  const handleCorrect = useCallback(async () => {
    if (screen !== "exam" || !currentTrial) return;

    // End of this module's trials: re-ask any words missed in this final part
    // before scoring, otherwise complete the module.
    if (trialIndex >= trials.length - 1) {
      if (retryQueueRef.current.length > 0) {
        pendingTransitionRef.current = { type: "finish" };
        startRetryPhase();
      } else {
        setTrialIndex(trials.length);
        await finishModuleOrAttempt();
      }
      return;
    }

    const nextIndex = trialIndex + 1;
    const nextTrial = trials[nextIndex];
    const crossesPart = !!nextTrial && nextTrial.stepNumber !== currentTrial.stepNumber;

    // Crossing into a new part: gate on re-asking this part's misses first.
    if (crossesPart) {
      setTrialIndex(nextIndex); // point the next briefing at the upcoming part
      if (retryQueueRef.current.length > 0) {
        pendingTransitionRef.current = { type: "next-part" };
        startRetryPhase();
      } else {
        setWrongFlash(false);
        resetClock();
        setScreen("part-briefing");
      }
      return;
    }

    // Normal advance within the same part.
    setTrialIndex(nextIndex);
    setWrongFlash(false);
    resetClock();
  }, [currentTrial, finishModuleOrAttempt, screen, startRetryPhase, trialIndex, trials]);

  // Drives the re-ask rounds at the end of a part. Nothing here is persisted -
  // it only enforces that every missed word is eventually answered correctly.
  const handleRetryKey = useCallback(
    (key: "E" | "I") => {
      const trial = retryTrial;
      if (!trial) return;
      const isCorrect = key === trial.expectedKey;

      // After a wrong re-ask the word has already been requeued; the student
      // must press the correct key to move on, but it still counts as a miss.
      if (awaitingCorrectionRef.current) {
        if (!isCorrect) {
          setWrongFlash(true);
          return;
        }
        setCorrectFlash(key);
        window.setTimeout(() => setCorrectFlash(null), 180);
        advanceRetry();
        return;
      }

      if (isCorrect) {
        // Cleared on the first press of the re-ask: this word is done.
        setPartPassed((p) => p + 1);
        setCorrectFlash(key);
        window.setTimeout(() => setCorrectFlash(null), 180);
        advanceRetry();
      } else {
        // Missed again: send it to the back of the queue to be asked once more.
        setWrongFlash(true);
        awaitingCorrectionRef.current = true;
        retryQueueRef.current.push(trial);
      }
    },
    [retryTrial, advanceRetry],
  );

  const handleKey = useCallback(
    (key: "E" | "I") => {
      if (saving) return;
      if (retryTrial) {
        handleRetryKey(key);
        return;
      }
      const trial = currentTrial;
      if (screen !== "exam" || !trial) return;

      const isCorrect = key === trial.expectedKey;
      const elapsed = Math.max(1, Math.round(Date.now() - shownAtRef.current));

      const count = (keyCountRef.current[trial.id] || 0) + 1;
      keyCountRef.current[trial.id] = count;
      // Buffer the event and save in the background - never block the advance
      // on the network. This is what keeps fast/repeated key presses snappy
      // and stops them from spilling into the next trial.
      eventBufferRef.current.push({
        trialId: trial.id,
        keyPressed: key,
        responseTimeMs: elapsed,
        eventSequence: count,
        shownAt: new Date(shownAtRef.current).toISOString(),
        answeredAt: new Date().toISOString(),
      });
      scheduleFlush();

      if (!isCorrect) {
        setWrongFlash(true);
        // Queue this word to be re-asked at the end of the part. The part
        // won't complete until it's answered correctly on the first press.
        if (!retryQueueRef.current.some((w) => w.wordShown === trial.wordShown)) {
          retryQueueRef.current.push({
            wordShown: trial.wordShown,
            leftLabel: trial.leftLabel,
            rightLabel: trial.rightLabel,
            expectedKey: trial.expectedKey,
            stepNumber: trial.stepNumber,
          });
        }
        return;
      }

      // Count as passed only when the very first press on this word is correct;
      // a corrective press after a miss does not count (it'll be re-asked).
      if (count === 1) setPartPassed((p) => p + 1);
      setCorrectFlash(key);
      window.setTimeout(() => setCorrectFlash(null), 180);
      void handleCorrect();
    },
    [currentTrial, handleCorrect, handleRetryKey, retryTrial, saving, scheduleFlush, screen],
  );

  useEffect(() => {
    if (screen !== "exam") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      if (key !== "E" && key !== "I") return;
      event.preventDefault();
      void handleKey(key as "E" | "I");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey, screen]);

  // Flush any buffered events when leaving the exam (navigation / unmount).
  useEffect(() => {
    return () => {
      void flushEvents();
    };
  }, [flushEvents]);

  // Safety net: if we're in the exam with every trial answered but the module
  // hasn't been completed yet (e.g. the completion call failed earlier), kick
  // it off automatically so we never sit on an empty stimulus.
  useEffect(() => {
    if (
      screen === "exam" &&
      !retryTrial &&
      trials.length > 0 &&
      trialIndex >= trials.length &&
      !saving &&
      !finishError
    ) {
      void finishModuleOrAttempt();
    }
  }, [screen, retryTrial, trials.length, trialIndex, saving, finishError, finishModuleOrAttempt]);

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

  if (screen === "study-intro") {
    return (
      <IatShell onExit={onExit}>
        <IatStudyIntroScreen onContinue={() => setScreen("module-intro")} onBack={onExit} />
      </IatShell>
    );
  }

  if (screen === "module-intro") {
    return (
      <IatShell onExit={onExit}>
        <IatModuleIntroScreen
          moduleNumber={completedModules + 1}
          totalModules={modules.length || completedModules + 1}
          moduleName={currentModule?.displayName || currentModule?.name || "This module"}
          totalParts={totalParts}
          moduleTableData={briefingData}
          onContinue={() => {
            moduleTimingStartedRef.current = false;
            setScreen("part-briefing");
          }}
        />
      </IatShell>
    );
  }

  if (screen === "part-briefing") {
    return (
      <IatShell onExit={onExit}>
        <IatModuleBriefingScreen
          moduleNumber={completedModules + 1}
          totalModules={modules.length || completedModules + 1}
          partNumber={partNumber}
          totalParts={totalParts}
          leftLabel={currentTrial?.leftLabel || "Left"}
          rightLabel={currentTrial?.rightLabel || "Right"}
          onContinue={startModuleExam}
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
  if (screen === "exam" && !retryTrial && trials.length > 0 && trialIndex >= trials.length) {
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

  const displayTrial: RunnerTrial | null = retryTrial
    ? retryTrial
    : currentTrial
      ? {
          wordShown: currentTrial.wordShown,
          leftLabel: currentTrial.leftLabel,
          rightLabel: currentTrial.rightLabel,
          expectedKey: currentTrial.expectedKey,
          stepNumber: currentTrial.stepNumber,
        }
      : null;
  const moduleLabel = `${completedModules + 1} of ${modules.length || 6}`;

  return (
    <IatShell
      onExit={onExit}
      headerContent={<ElapsedClock startMs={assessmentStartRef.current} />}
    >
      <IatTrialRunner
        isPractice={false}
        trial={displayTrial}
        moduleLabel={moduleLabel}
        partNumber={partNumber}
        totalParts={totalParts}
        partProgress={partProgress}
        startMs={assessmentStartRef.current}
        flashKey={correctFlash}
        wrong={wrongFlash}
        modules={modules}
        currentModuleId={state?.currentModuleId || null}
        onKey={(key) => void handleKey(key)}
      />
    </IatShell>
  );
}
