// app/student/assessment/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';

configureAmplify();
import AssessmentLayout from '../../../components/student/AssessmentLayout';
import AssessmentScreen from '../../../components/student/AssessmentScreen';

export default function StudentAssessmentPage() {
  const router = useRouter();
  const [showAssessmentOnly, setShowAssessmentOnly] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const isMode = sessionStorage.getItem('isAssessmentMode') === 'true';
    return isMode;
  });

  // Keep the assessment-only header state synced on this route.
  React.useEffect(() => {
    const checkAssessmentMode = () => {
      const isMode = sessionStorage.getItem('isAssessmentMode') === 'true';
      if (isMode) {
        setShowAssessmentOnly(true);
      } else {
        setShowAssessmentOnly(false);
      }
    };

    // Initial check
    checkAssessmentMode();

    // Poll every 2s to catch changes from AssessmentScreen setting the flag
    const interval = setInterval(checkAssessmentMode, 2000);

    // Also listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'isAssessmentMode') {
        setShowAssessmentOnly(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogout = async () => {
    try { await signOut(); } catch { /* ignore */ }
    sessionStorage.removeItem('isAssessmentMode');
    router.push('/student/login');
  };

  const handleStart = () => {
    // No-op or handle specific logic
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
      <AssessmentLayout
        onLogout={handleLogout}
        showAssessmentOnly={showAssessmentOnly}
        onNavigate={handleNavigate}
      >
        <AssessmentScreen onStartAssessment={handleStart} />
      </AssessmentLayout>
    </RequireStudent>
  );
}
