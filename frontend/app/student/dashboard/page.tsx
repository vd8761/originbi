// app/student/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/student/DashboardLayout';

export default function StudentDashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Later you can clear auth, etc.
    router.push('/student/login');
  };

  const handleNavigate = (view: 'dashboard' | 'assessment') => {
    if (view === 'dashboard') {
      router.push('/student/dashboard');
    } else if (view === 'assessment') {
      router.push('/student/assessment');
    }
  };

  return (
    <DashboardLayout
      onLogout={handleLogout}
      currentView="dashboard"
      onNavigate={handleNavigate}
    />
  );
}
