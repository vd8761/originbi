'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './ui/Logo';
import ThemeToggle from './ui/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

const EXAM_INSTRUCTIONS_VIDEO_ID = 'nOzACax1IHA';

const ExamInstructionsVideo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const embedSrc = `https://www.youtube-nocookie.com/embed/${EXAM_INSTRUCTIONS_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <main className="min-h-[100dvh] w-full bg-brand-light-secondary dark:bg-brand-dark-primary text-brand-text-light-primary dark:text-brand-text-primary flex flex-col">
      <header className="flex-shrink-0 w-full flex items-center justify-between px-4 md:px-10 py-3 md:py-5">
        <Link href="/" aria-label="Go to OriginBI home">
          <Logo className="h-7 md:h-10" />
        </Link>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      <section className="flex-1 w-full flex flex-col items-center justify-center px-4 md:px-8 pb-4 md:pb-8">
        <div className="text-center mb-3 md:mb-6">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            How to Take Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-500">
              Assessment
            </span>
          </h1>
          <p className="mt-2 md:mt-3 text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Watch this short walkthrough before you start. It covers everything
            you need to know to complete your OriginBI assessment with confidence.
          </p>
        </div>

        <div className="w-full max-w-5xl aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-white/10 bg-black">
          <iframe
            src={embedSrc}
            title="OriginBI assessment instructions"
            className="w-full h-full"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <Link
          href="/"
          className="mt-6 md:mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-brand-green text-white hover:bg-emerald-500 transition-colors shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Home
        </Link>
      </section>
    </main>
  );
};

export default ExamInstructionsVideo;
