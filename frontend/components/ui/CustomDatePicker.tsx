"use client";

import React, { useState } from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
} from "@/components/icons";

interface CustomDatePickerProps {
  value?: { start: string; end: string };
  onChange: (start: string, end: string) => void;
}

/* ---------------- DATE LIMIT CONFIG ---------------- */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const TODAY = startOfDay(new Date());

// Change these if you want to allow past dates / limit future dates
const MIN_DATE: Date | null = TODAY;
const MAX_DATE: Date | null = null;

const clampDate = (date: Date): Date => {
  let d = startOfDay(date);

  if (MIN_DATE && d.getTime() < startOfDay(MIN_DATE).getTime()) {
    d = startOfDay(MIN_DATE);
  }
  if (MAX_DATE && d.getTime() > startOfDay(MAX_DATE).getTime()) {
    d = startOfDay(MAX_DATE);
  }

  return d;
};

const isDateDisabled = (date: Date): boolean => {
  const d = startOfDay(date);
  const dTime = d.getTime();

  if (MIN_DATE && dTime < startOfDay(MIN_DATE).getTime()) return true;
  if (MAX_DATE && dTime > startOfDay(MAX_DATE).getTime()) return true;

  return false;
};

/* ---------------- COMPONENT ---------------- */

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Clamp initial dates immediately
  const [startDate, setStartDate] = useState<Date>(() => clampDate(TODAY));
  const [endDate, setEndDate] = useState<Date>(() => clampDate(TODAY));

  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;

    const period = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;

    return { h: h12, m: roundedMinutes, period };
  });

  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;

    const period = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;

    return { h: h12, m: roundedMinutes, period };
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  );

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const formatDisplayDate = (
    date: Date,
    time: { h: number; m: number; period: string }
  ) => {
    const d = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    const mStr = time.m.toString().padStart(2, "0");
    return `${d} ${time.h}:${mStr} ${time.period}`;
  };

  const handleApply = () => {
    const startStr = formatDisplayDate(startDate, startTime);
    const endStr = formatDisplayDate(endDate, endTime);
    onChange(startStr, endStr);
    setIsOpen(false);
  };

  const getExactDuration = () => {
    const start = new Date(startDate);
    let startH = startTime.h;
    if (startTime.period === "PM" && startH !== 12) startH += 12;
    if (startTime.period === "AM" && startH === 12) startH = 0;
    start.setHours(startH, startTime.m, 0, 0);

    const end = new Date(endDate);
    let endH = endTime.h;
    if (endTime.period === "PM" && endH !== 12) endH += 12;
    if (endTime.period === "AM" && endH === 12) endH = 0;
    end.setHours(endH, endTime.m, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "Invalid Range";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const label: string[] = [];
    if (diffDays > 0) label.push(`${diffDays} Days`);
    if (diffHours > 0) label.push(`${diffHours} Hours`);
    if (diffMinutes > 0) label.push(`${diffMinutes} Mins`);

    if (label.length === 0) return "0 Mins";
    return label.join(", ");
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const today = new Date();
    const isTodayInView =
      today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const checkDate = new Date(date.toDateString());
      const sDate = new Date(startDate.toDateString());
      const eDate = new Date(endDate.toDateString());

      const checkTime = checkDate.getTime();
      const sTime = sDate.getTime();
      const eTime = eDate.getTime();

      const isStart = checkTime === sTime;
      const isEnd = checkTime === eTime;
      const isInRange = checkTime > sTime && checkTime < eTime;
      const isSelected = isStart || isEnd;
      const isCurrentDate = isTodayInView && d === todayDate;

      const disabled = isDateDisabled(checkDate);

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => {
            if (disabled) return;
            if (checkTime < sTime) setStartDate(clampDate(date));
            else setEndDate(clampDate(date));
          }}
          className={`
            h-9 w-9 text-xs font-medium flex flex-col items-center justify-center rounded-full transition-all relative
            ${
              disabled
                ? "opacity-30 cursor-not-allowed pointer-events-none"
                : "cursor-pointer"
            }
            ${
              isSelected && !disabled
                ? "bg-brand-green text-white shadow-lg shadow-green-900/20 z-10"
                : ""
            }
            ${
              isInRange && !disabled
                ? "bg-brand-green/10 text-brand-green dark:text-white rounded-none"
                : ""
            }
            ${
              !isSelected && !isInRange && !disabled
                ? "text-gray-600 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                : ""
            }
            ${isInRange && !isSelected ? "rounded-none" : ""}
            ${
              isStart && endDate.getTime() > startDate.getTime()
                ? "rounded-r-none"
                : ""
            }
            ${
              isEnd && startDate.getTime() < endDate.getTime()
                ? "rounded-l-none"
                : ""
            }
          `}
        >
          <span className="leading-none">{d}</span>
          {isCurrentDate && !isSelected && !disabled && (
            <div className="w-1 h-1 bg-brand-green rounded-full mt-1" />
          )}
        </button>
      );
    }
    return days;
  };

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const TimeInput = ({
    value,
    onChange,
    max,
  }: {
    value: number;
    onChange: (v: number) => void;
    max: number;
  }) => (
    <div className="flex bg-brand-light-secondary dark:bg-[#24272B] rounded-lg border border-gray-200 dark:border-white/5 w-[52px] h-[42px] relative shrink-0 overflow-hidden group hover:border-brand-green/30 transition-colors">
      <input
        type="text"
        value={value.toString().padStart(2, "0")}
        readOnly
        className="bg-transparent text-brand-text-light-primary dark:text-white text-center text-sm font-medium w-full h-full focus:outline-none cursor-default pr-3"
      />
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center border-l border-gray-200 dark:border-white/5 w-4 bg-gray-100 dark:bg-[#2A2D32]">
        <button
          type="button"
          onClick={() =>
            onChange(value >= max ? (max === 12 ? 1 : 0) : value + 1)
          }
          className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 hover:text-brand-green dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          ▲
        </button>
        <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
        <button
          type="button"
          onClick={() =>
            onChange(value <= (max === 12 ? 1 : 0) ? max : value - 1)
          }
          className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 hover:text-brand-green dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          ▼
        </button>
      </div>
    </div>
  );

  const DateDropdown = ({ date }: { date: Date }) => (
    <div className="bg-brand-light-secondary dark:bg-[#24272B] rounded-lg border border-gray-200 dark:border-white/5 px-3 h-[42px] flex justify-between items-center text-sm text-brand-text-light-primary dark:text-gray-200 min-w-[120px] flex-grow cursor-pointer hover:border-brand-green/30 transition-colors">
      <span className="font-medium">{date.toLocaleDateString("en-GB")}</span>
      <ChevronDownIcon className="w-3 h-3 text-gray-500 shrink-0" />
    </div>
  );

  const AmPmToggle = ({
    period,
    onChange,
  }: {
    period: string;
    onChange: (p: string) => void;
  }) => (
    <div className="flex bg-brand-light-secondary dark:bg-[#24272B] rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden h-[42px] shrink-0">
      <button
        type="button"
        onClick={() => onChange("AM")}
        className={`px-3 text-[11px] font-bold transition-colors flex items-center justify-center ${
          period === "AM"
            ? "bg-brand-green text-white"
            : "text-gray-500 hover:text-brand-text-light-primary dark:hover:text-gray-300"
        }`}
      >
        AM
      </button>
      <div className="w-[1px] bg-gray-200 dark:bg-white/5" />
      <button
        type="button"
        onClick={() => onChange("PM")}
        className={`px-3 text-[11px] font-bold transition-colors flex items-center justify-center ${
          period === "PM"
            ? "bg-brand-green text-white"
            : "text-gray-500 hover:text-brand-text-light-primary dark:hover:text-gray-300"
        }`}
      >
        PM
      </button>
    </div>
  );

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between bg-brand-light-secondary dark:bg-[#24272B] border border-transparent rounded-xl px-4 py-3.5 text-sm text-brand-text-light-primary dark:text-white hover:border-brand-light-tertiary dark:hover:border-[#3E4247] transition-all"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-brand-green shrink-0" />
          <span className="font-medium text-sm truncate">
            {value ? `${value.start} - ${value.end}` : "Select date & time"}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-[740px] bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/5 shrink-0">
              <h3 className="text-brand-text-light-primary dark:text-white font-bold text-sm">
                Select Date and Time
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col md:flex-row overflow-y-auto custom-scrollbar">
              <div className="p-6 md:border-r border-gray-200 dark:border-white/5 flex-1 bg-white dark:bg-[#1A1D21] min-w-[320px]">
                <div className="flex justify-between items-center mb-6 bg-brand-light-secondary dark:bg-[#24272B] p-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
                  >
                    <ArrowLeftWithoutLineIcon className="w-2 h-3" />
                  </button>
                  <span className="text-sm font-bold text-brand-text-light-primary dark:text-white tracking-wide">
                    {monthName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
                  >
                    <ArrowRightWithoutLineIcon className="w-2 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <div
                      key={d}
                      className="text-[10px] text-gray-500 font-bold uppercase tracking-wider"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-1 place-items-center">
                  {renderCalendar()}
                </div>
              </div>

              <div className="p-6 flex flex-col justify-center gap-8 bg-brand-light-secondary dark:bg-[#15171A] w-full md:w-[390px] border-t md:border-t-0 border-gray-200 dark:border-white/5">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-300 font-bold flex gap-1">
                    From <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <DateDropdown date={startDate} />
                    <div className="flex items-center gap-2 shrink-0">
                      <TimeInput
                        value={startTime.h}
                        max={12}
                        onChange={(v) => setStartTime({ ...startTime, h: v })}
                      />
                      <span className="text-gray-500 text-sm font-bold">:</span>
                      <TimeInput
                        value={startTime.m}
                        max={59}
                        onChange={(v) => setStartTime({ ...startTime, m: v })}
                      />
                    </div>
                    <AmPmToggle
                      period={startTime.period}
                      onChange={(p) =>
                        setStartTime({ ...startTime, period: p })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-300 font-bold flex gap-1">
                    To <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <DateDropdown date={endDate} />
                    <div className="flex items-center gap-2 shrink-0">
                      <TimeInput
                        value={endTime.h}
                        max={12}
                        onChange={(v) => setEndTime({ ...endTime, h: v })}
                      />
                      <span className="text-gray-500 text-sm font-bold">:</span>
                      <TimeInput
                        value={endTime.m}
                        max={59}
                        onChange={(v) => setEndTime({ ...endTime, m: v })}
                      />
                    </div>
                    <AmPmToggle
                      period={endTime.period}
                      onChange={(p) =>
                        setEndTime({ ...endTime, period: p })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-brand-light-secondary dark:bg-[#15171A] border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="text-xs text-brand-green font-medium w-full sm:w-auto text-center sm:text-left">
                Duration :{" "}
                <span className="text-brand-green font-bold">
                  {getExactDuration()}
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 sm:flex-none px-8 py-2.5 rounded-full bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90 transition-colors shadow-lg shadow-green-900/20"
                >
                  Apply changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
