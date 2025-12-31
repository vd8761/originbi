// app/student/assessment/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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

  const handleLogout = () => {
    sessionStorage.removeItem('isAssessmentMode');
    router.push('/student/login');
  };

  const handleStart = () => {
    // No-op or handle specific logic
  };

  return (
    // Update: Passing hideNav={true} to remove the menu from the Assessment Listing screen aswell
    <AssessmentLayout onLogout={handleLogout} showAssessmentOnly={showAssessmentOnly} hideNav={true}>
      <AssessmentScreen onStartAssessment={handleStart} />
    </AssessmentLayout>
  );
}
