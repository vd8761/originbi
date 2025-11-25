// app/student/assessment/runner/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AssessmentLayout from '@/components/AssessmentLayout';
import AssessmentRunner from '@/components/AssessmentStarter';

export default function AssessmentRunnerPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/student/login');
  };

  const handleBackToAssessments = () => {
    router.push('/student/assessment');
  };

  const handleGoToDashboard = () => {
    router.push('/student/dashboard');
  };

  return (
    <AssessmentLayout onLogout={handleLogout}>
      <AssessmentRunner
        onBack={handleBackToAssessments}
        onGoToDashboard={handleGoToDashboard}
      />
    </AssessmentLayout>
  );
}
