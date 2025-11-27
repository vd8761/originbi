"use client";

import PortalHome from '@/components/home';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function HomePage() {
  const router = useRouter();

  const handleSelectPortal = (portal: 'student' | 'corporate' | 'admin') => {
    if (portal === 'student') return router.push('/student');
    if (portal === 'corporate') return router.push('/corporate');
    return router.push('/admin');
  };

  return <PortalHome onSelectPortal={handleSelectPortal} />;
}
