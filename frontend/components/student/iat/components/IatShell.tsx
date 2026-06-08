"use client";

import React, { useState } from "react";
import Logo from "../../../ui/Logo";
import ThemeToggle from "../../../ui/ThemeToggle";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Page chrome shared by every IAT screen. Styled to match the global student
 * portal header (same bar colours/border and the shared ThemeToggle pill) so
 * the IATGen exam feels consistent with the rest of the app.
 */
export default function IatShell({
  children,
  onExit,
  headerContent,
}: {
  children: React.ReactNode;
  onExit?: () => void;
  headerContent?: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const [showExitModal, setShowExitModal] = useState(false);

  return (
    <div className="min-h-screen bg-brand-light-primary font-sans text-brand-text-light-primary dark:bg-brand-dark-primary dark:text-white">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-[#E0E0E0] bg-white/95 px-4 dark:border-white/[0.08] dark:bg-[#19211C]/95 sm:px-6 lg:px-8">
        <Logo className="h-7 w-auto sm:h-8" />

        <div className="ml-auto flex items-center gap-3">
          {headerContent}
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          {onExit && (
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="px-4 py-1.5 rounded-full border border-brand-red/30 bg-brand-red/10 text-brand-red text-xs font-bold transition hover:bg-brand-red hover:text-white focus:outline-none h-9 flex items-center justify-center shrink-0"
            >
              Leave
            </button>
          )}
        </div>
      </header>

      {/* Custom Exit Warning Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExitModal(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-sm rounded-3xl border border-brand-light-tertiary bg-white p-6 text-center shadow-lg dark:border-white/10 dark:bg-[#1C1F22] z-10">
            {/* Red Warning Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red shrink-0">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Warning Text */}
            <h3 className="text-xl font-bold text-brand-red">Are you sure?</h3>
            <p className="mt-3 text-sm leading-relaxed text-black dark:text-white">
              Leaving the assessment now will pause your session. Do you want to exit?
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 rounded-full border border-gray-300 dark:border-white/20 py-2.5 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  if (onExit) onExit();
                }}
                className="flex-1 rounded-full bg-brand-red py-2.5 text-sm font-bold text-white hover:bg-brand-red/90 transition-colors focus:outline-none"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
