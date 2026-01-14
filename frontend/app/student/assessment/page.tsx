// app/student/assessment/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config';
import RequireStudent from '@/components/auth/RequireStudent';

configureAmplify();
import AssessmentLayout from '@/components/student/AssessmentLayout';
import AssessmentScreen from '@/components/student/AssessmentScreen';

export default function StudentAssessmentPage() {
  const router = useRouter();
  const [showAssessmentOnly, setShowAssessmentOnly] = React.useState(false);

  React.useEffect(() => {
    const isMode = sessionStorage.getItem('isAssessmentMode') === 'true';
    if (isMode) {
      setShowAssessmentOnly(true);
    }
  }, []);

  const handleLogout = async () => {
    try { await signOut(); } catch { /* ignore */ }
    sessionStorage.removeItem('isAssessmentMode');
    router.push('/student/login');
  };

  const handleStart = () => {
    // No-op or handle specific logic
  };

  return (
    // Update: Passing hideNav={true} to remove the menu from the Assessment Listing screen aswell
    <RequireStudent>
      <AssessmentLayout onLogout={handleLogout} showAssessmentOnly={showAssessmentOnly} hideNav={true}>
        <AssessmentScreen onStartAssessment={handleStart} />
      </AssessmentLayout>
    </RequireStudent>
  );
}
