"use client";

import PortalHome from '@/components/home';
import PortalHome2 from '@/components/home2';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type ViewMode = 'home1' | 'home2' | 'both';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<ViewMode>('both');

  const handleSelectPortal = (portal: 'student' | 'corporate' | 'admin') => {
    if (portal === 'student') return router.push('/student');
    if (portal === 'corporate') return router.push('/corporate');
    return router.push('/admin');
  };

  return (
    <div className="min-h-screen">
      {/* Temporary switcher for testing both variants */}
      <div className="p-4 max-w-7xl mx-auto flex gap-2 items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">Preview:</span>
        <div className="flex gap-2">
          <button onClick={() => setMode('home1')} className={`px-3 py-1 rounded ${mode==='home1' ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
            Home (v1)
          </button>
          <button onClick={() => setMode('home2')} className={`px-3 py-1 rounded ${mode==='home2' ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
            Home (v2)
          </button>
          <button onClick={() => setMode('both')} className={`px-3 py-1 rounded ${mode==='both' ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
            Both
          </button>
        </div>
        <div className="ml-auto text-xs text-gray-500">Temporary: remove after testing</div>
      </div>

      <div>
        {mode === 'home1' && <PortalHome onSelectPortal={handleSelectPortal} />}
        {mode === 'home2' && <PortalHome2 onSelectPortal={handleSelectPortal} />}

        {mode === 'both' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border-r border-gray-100 dark:border-white/5">
              <PortalHome onSelectPortal={handleSelectPortal} />
            </div>
            <div>
              <PortalHome2 onSelectPortal={handleSelectPortal} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
