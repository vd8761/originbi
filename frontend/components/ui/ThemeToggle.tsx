'use client';

import React from 'react';
import { LightModeIcon, DarkModeIcon } from '@/components/icons';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-20 h-10 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary cursor-pointer shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
      aria-label="Toggle theme"
    >
      {/* Background icons */}
      <div className="flex justify-between w-full px-3 text-gray-500 dark:text-gray-400">
        <LightModeIcon className="w-5 h-5" />
        <DarkModeIcon className="w-5 h-5" />
      </div>

      {/* Switch thumb */}
      <div
        className={`absolute top-1 left-1 flex items-center justify-center w-8 h-8 bg-brand-green rounded-full transform transition-transform duration-300 ease-in-out ${
          theme === 'dark' ? 'translate-x-10' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <DarkModeIcon className="w-5 h-5 text-white" />
        ) : (
          <LightModeIcon className="w-5 h-5 text-white" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
