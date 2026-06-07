"use client";

import React from "react";
import { X } from "lucide-react";
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
}: {
  children: React.ReactNode;
  onExit?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-brand-light-primary font-sans text-brand-text-light-primary dark:bg-brand-dark-primary dark:text-white">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-[#E0E0E0] bg-white/95 px-4 dark:border-white/[0.08] dark:bg-[#19211C]/95 sm:px-6 lg:px-8">
        <Logo className="h-7 w-auto sm:h-8" />
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit assessment"
              className="grid h-9 w-9 place-items-center rounded-full border border-brand-light-tertiary bg-gray-50 text-brand-text-light-secondary transition hover:text-brand-red dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-brand-red"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
