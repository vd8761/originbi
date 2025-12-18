'use client';

import React from 'react';
import { LightModeIcon, DarkModeIcon } from '@/components/icons';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-16 h-8 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary cursor-pointer shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
      aria-label="Toggle theme"
    >
      {/* Background icons */}
      <div className="flex justify-between w-full px-2 text-gray-500 dark:text-gray-400">
        <LightModeIcon className="w-4 h-4" />
        <DarkModeIcon className="w-4 h-4 text-[#150089] dark:text-gray-400" />
      </div>

      {/* Switch thumb */}
      <div
        className="absolute top-1 left-1 flex items-center justify-center w-6 h-6 bg-brand-green rounded-full transform transition-transform duration-300 ease-in-out translate-x-0 dark:translate-x-8"
      >
        <DarkModeIcon className="w-4 h-4 text-white hidden dark:block" />
        <LightModeIcon className="w-4 h-4 text-white block dark:hidden" />
      </div>
    </button>
  );
};

export default ThemeToggle;
