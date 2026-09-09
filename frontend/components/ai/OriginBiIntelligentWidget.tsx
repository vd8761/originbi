'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OriginBiIntelligentWidget() {
  const handleOpen = () => {
    window.open('/corporate/ask-ai', '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2"
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-brand-green/25 pointer-events-none" />

        <motion.button
          onClick={handleOpen}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center gap-2.5 px-5 py-3 bg-brand-green hover:bg-brand-green/90 text-white rounded-full shadow-xl shadow-brand-green/30 border border-white/10 transition-colors group"
          aria-label="Open Ask AI"
        >
          {/* Sparkle icon */}
          <svg className="w-[18px] h-[18px] text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17zM19 14l.75 2.25L22 17l-2.25.75L19 22l-.75-2.25L16 19l2.25-.75L19 14z" />
          </svg>
          <span className="font-semibold text-sm tracking-wide">Ask AI</span>
          {/* Shimmer */}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
