'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function OriginBiIntelligentWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    window.open('/corporate/ask-ai', '_blank');
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 99999 }}
        initial={{ opacity: 0, scale: 0.4, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.4, y: 60 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Outer pulse ring */}
        <motion.span
          style={{
            position: 'absolute', inset: 0,
            borderRadius: '9999px',
            background: 'rgba(28, 197, 91, 0.35)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.button
          onClick={handleOpen}
          whileHover={{ scale: 1.06, boxShadow: '0 8px 32px rgba(28,197,91,0.45)' }}
          whileTap={{ scale: 0.94 }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 22px',
            background: 'linear-gradient(135deg, #1cc55b 0%, #16a34a 100%)',
            color: '#fff',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 20px rgba(28,197,91,0.35)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          aria-label="Open Ask AI"
        >
          {/* Sparkles icon */}
          <motion.div
            animate={{ opacity: [1, 0.6, 1], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </motion.div>

          <span>Ask AI</span>

          {/* Shimmer overlay */}
          <motion.span
            style={{
              position: 'absolute', inset: 0, borderRadius: '9999px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.button>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
