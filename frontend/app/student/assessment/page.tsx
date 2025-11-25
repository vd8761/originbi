// app/student/assessment/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AssessmentLayout from '@/components/AssessmentLayout';
import AssessmentScreen from '@/components/AssessmentScreen';

export default function StudentAssessmentPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/student/login');
  };

  const handleStart = () => {
    router.push('/student/assessment');
  };

  return (
    <AssessmentLayout onLogout={handleLogout}>
      <AssessmentScreen onStartAssessment={handleStart} />
    </AssessmentLayout>
  );
}
