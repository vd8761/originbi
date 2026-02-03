// app/student/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';

configureAmplify();
import DashboardLayout from '../../../components/student/DashboardLayout';

export default function StudentDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try { await signOut(); } catch { /* ignore */ }
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
    <RequireStudent>
      <DashboardLayout
        onLogout={handleLogout}
        currentView="dashboard"
        onNavigate={handleNavigate}
      />
    </RequireStudent>
  );
}
