// app/student/assessment/runner/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AssessmentLayout from '../../../../components/student/AssessmentLayout';
import AssessmentRunner from '../../../../components/student/AssessmentStarter';
import { Suspense } from 'react';

function AssessmentRunnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt_id') || undefined;

  const handleBackToAssessments = () => {
    router.push('/student/assessment');
  };

  const handleGoToDashboard = () => {
    sessionStorage.setItem('studentReportReady', 'true');
    localStorage.setItem('studentReportReady', 'true');
    sessionStorage.removeItem('isAssessmentMode');
    router.push('/student/assessment');
  };

  return (
    <AssessmentLayout>
      <AssessmentRunner
        onBack={handleBackToAssessments}
        onGoToDashboard={handleGoToDashboard}
        attemptId={attemptId}
      />
    </AssessmentLayout>
  );
}

export default function AssessmentRunnerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssessmentRunnerContent />
    </Suspense>
  );
}
