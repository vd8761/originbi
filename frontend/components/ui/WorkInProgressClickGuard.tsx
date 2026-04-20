"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface WorkInProgressClickGuardProps {
  children: React.ReactNode;
  className?: string;
  message?: string;
  subMessage?: string;
}

export default function WorkInProgressClickGuard({
  children,
  className,
  message = "We're working on it",
  subMessage = "This feature is currently under development.",
}: WorkInProgressClickGuardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showNotification = useCallback(() => {
    setIsVisible(true);
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = null;
    }, 2200);
  }, [clearHideTimer]);

  const handleClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest("button, [role='button']") as HTMLElement | null;
      if (!clickable) return;

      if (clickable instanceof HTMLButtonElement && clickable.disabled) {
        return;
      }

      if (clickable.getAttribute("aria-disabled") === "true") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      showNotification();
    },
    [showNotification]
  );

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  return (
    <div className={className} onClickCapture={handleClickCapture}>
      {children}

      <div
        className={`pointer-events-none fixed right-5 top-20 z-[120] transition-all duration-200 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        aria-live="polite"
      >
        <div className="rounded-xl border border-[#DDE6E1] bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#1D2823]/95">
          <p className="text-sm font-semibold text-[#22302A] dark:text-white">{message}</p>
          <p className="text-xs text-[#5E6E66] dark:text-white/70">{subMessage}</p>
        </div>
      </div>
    </div>
  );
}
