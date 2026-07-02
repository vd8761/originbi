"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
  CalendarIcon,
} from "../icons";

interface ExtendControlProps {
  /** Called with the new expiry as an ISO string. Should throw on failure. */
  onExtend: (newDateISO: string) => Promise<void> | void;
  /** Fired after the success tick — the parent should swipe-up/remove the row. */
  onExtended?: () => void;
  disabled?: boolean;
}

/** now + n days, keeping the current clock time. */
const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const Spinner = ({ className = "h-4 w-4 border-brand-green" }: { className?: string }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-t-transparent ${className}`} />
);

type Phase = "idle" | "loading" | "success";

const ExtendControl: React.FC<ExtendControlProps> = ({ onExtend, onExtended, disabled }) => {
  const [segPhase, setSegPhase] = useState<Phase>("idle");
  const [modalPhase, setModalPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Calendar + time state (mirrors ExtendAssessmentModal).
  const [selectedDate, setSelectedDate] = useState<Date>(() => daysFromNow(7));
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(daysFromNow(7).getFullYear(), daysFromNow(7).getMonth(), 1),
  );
  const [time, setTime] = useState<{ h: number; m: number; period: "AM" | "PM" }>({
    h: 11,
    m: 45,
    period: "PM",
  });

  const busy = segPhase !== "idle" || modalPhase !== "idle";

  const apply = async (iso: string, from: "segment" | "modal") => {
    setError(null);
    if (from === "segment") setSegPhase("loading");
    else setModalPhase("loading");
    try {
      await onExtend(iso);
      if (from === "modal") {
        setModalPhase("success");
        setTimeout(() => {
          setModalOpen(false);
          setSegPhase("success");
          setTimeout(() => onExtended?.(), 550);
        }, 650);
      } else {
        setSegPhase("success");
        setTimeout(() => onExtended?.(), 850);
      }
    } catch (err: any) {
      if (from === "modal") setModalPhase("idle");
      else setSegPhase("idle");
      setError(err?.message || "Failed to extend");
    }
  };

  const openModal = () => {
    const d = daysFromNow(7);
    setSelectedDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setTime({ h: 11, m: 45, period: "PM" });
    setError(null);
    setModalPhase("idle");
    setModalOpen(true);
  };

  const applyCustom = () => {
    const finalDate = new Date(selectedDate);
    let h = time.h;
    if (time.period === "PM" && h !== 12) h += 12;
    if (time.period === "AM" && h === 12) h = 0;
    finalDate.setHours(h, time.m, 0, 0);
    if (finalDate.getTime() <= Date.now()) {
      setError("New expiry must be in the future");
      return;
    }
    apply(finalDate.toISOString(), "modal");
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days: React.ReactNode[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      const isToday = date.toDateString() === new Date().toDateString();
      days.push(
        <button
          key={d}
          type="button"
          disabled={isPast}
          onClick={() => !isPast && setSelectedDate(date)}
          className={`h-9 w-9 text-xs font-medium flex flex-col items-center justify-center transition-all relative rounded-full
            ${isPast ? "opacity-20 cursor-not-allowed text-gray-400" : "cursor-pointer"}
            ${isSelected && !isPast ? "bg-brand-green text-white z-10" : ""}
            ${!isSelected && !isPast ? "text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5" : ""}`}
        >
          <span className="leading-none">{d}</span>
          {isToday && !isSelected && !isPast && (
            <div className="w-1 h-1 bg-brand-green rounded-full mt-1" />
          )}
        </button>,
      );
    }
    return days;
  };

  const TimeInput = ({
    value,
    onChange,
    max,
  }: {
    value: number;
    onChange: (v: number) => void;
    max: number;
  }) => (
    <div className="flex bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 w-[52px] h-[42px] relative overflow-hidden">
      <input
        type="text"
        value={value.toString().padStart(2, "0")}
        readOnly
        className="bg-transparent text-gray-900 dark:text-white text-center text-sm font-medium w-full h-full focus:outline-none"
      />
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center border-l border-gray-200 dark:border-white/5 w-4 bg-gray-100 dark:bg-[#2A2D32]">
        <button
          type="button"
          onClick={() => onChange(value >= max ? (max === 12 ? 1 : 0) : value + 1)}
          className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
        >
          ▲
        </button>
        <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
        <button
          type="button"
          onClick={() => onChange(value <= (max === 12 ? 1 : 0) ? max : value - 1)}
          className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
        >
          ▼
        </button>
      </div>
    </div>
  );

  const segBtn =
    "px-2.5 py-1 text-[11px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => modalPhase === "idle" && setModalOpen(false)}
      />
      <div className="relative w-full max-w-[380px] bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-5 animate-fade-in max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Custom Extension</h3>
          <button
            onClick={() => modalPhase === "idle" && setModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          Quick extend (from now)
        </p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              disabled={modalPhase !== "idle"}
              onClick={() => apply(daysFromNow(n).toISOString(), "modal")}
              className="py-2 text-xs font-bold rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-brand-green hover:bg-brand-green hover:text-white transition-all disabled:opacity-50"
            >
              {n}d
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          Pick a date &amp; time
        </p>

        {/* Calendar */}
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5 p-3 mb-3">
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
              }
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
            >
              <ArrowLeftWithoutLineIcon className="w-2 h-3 text-gray-400 dark:text-white/70" />
            </button>
            <span className="text-sm font-bold text-gray-800 dark:text-white capitalize">
              {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
              }
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
            >
              <ArrowRightWithoutLineIcon className="w-2 h-3 text-gray-400 dark:text-white/70" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center border-b border-gray-100 dark:border-white/5 pb-2">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center mt-2">{renderCalendar()}</div>
        </div>

        {/* Selected + time */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
            <CalendarIcon className="w-3.5 h-3.5 text-brand-green" />
            {selectedDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2">
            <TimeInput value={time.h} max={12} onChange={(v) => setTime({ ...time, h: v })} />
            <span className="text-gray-400 font-bold">:</span>
            <TimeInput value={time.m} max={59} onChange={(v) => setTime({ ...time, m: v })} />
            <div className="flex bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden h-[42px] shrink-0">
              <button
                type="button"
                onClick={() => setTime({ ...time, period: "AM" })}
                className={`px-3 text-[11px] font-bold transition-all ${
                  time.period === "AM" ? "bg-brand-green text-white" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setTime({ ...time, period: "PM" })}
                className={`px-3 text-[11px] font-bold transition-all ${
                  time.period === "PM" ? "bg-brand-green text-white" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-[11px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => modalPhase === "idle" && setModalOpen(false)}
            disabled={modalPhase !== "idle"}
            className="px-4 py-2 rounded-full text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyCustom}
            disabled={modalPhase !== "idle"}
            className={`px-6 py-2 rounded-full text-white text-xs font-bold transition-all flex items-center justify-center min-w-[92px] ${
              modalPhase === "success" ? "bg-brand-green" : "bg-brand-green hover:bg-brand-green/90"
            } disabled:opacity-100`}
          >
            {modalPhase === "loading" ? (
              <Spinner className="h-4 w-4 border-white" />
            ) : modalPhase === "success" ? (
              <CheckIcon />
            ) : (
              "Apply"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="inline-flex items-center justify-center rounded-lg border border-brand-green/30 bg-brand-green/5 dark:bg-brand-green/10 overflow-hidden min-w-[92px] h-[28px]">
        {segPhase === "loading" ? (
          <Spinner />
        ) : segPhase === "success" ? (
          <div className="flex items-center justify-center w-full h-full bg-brand-green text-white">
            <CheckIcon />
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => apply(daysFromNow(1).toISOString(), "segment")}
              className={`${segBtn} text-brand-green hover:bg-brand-green hover:text-white border-r border-brand-green/30`}
              title="Extend by 1 day from now"
            >
              1d
            </button>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => apply(daysFromNow(3).toISOString(), "segment")}
              className={`${segBtn} text-brand-green hover:bg-brand-green hover:text-white border-r border-brand-green/30`}
              title="Extend by 3 days from now"
            >
              3d
            </button>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={openModal}
              className={`${segBtn} text-brand-green hover:bg-brand-green hover:text-white flex items-center justify-center`}
              title="Custom extension"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.51l-3 .857a.5.5 0 01-.618-.618l.857-3a2 2 0 01.51-.878l8.5-8.5z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {modalOpen && typeof document !== "undefined"
        ? createPortal(modal, document.body)
        : null}

      {error && !modalOpen && segPhase === "idle" && (
        <div className="mt-1 text-[10px] font-bold text-red-500">{error}</div>
      )}
    </>
  );
};

export default ExtendControl;
