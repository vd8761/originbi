// app/student/assessment/page.tsx
'use client';

import AssessmentLayout from '../../../components/student/AssessmentLayout';
import AssessmentScreen from '../../../components/student/AssessmentScreen';

export default function StudentAssessmentPage() {
  return (
    <AssessmentLayout>
      <AssessmentScreen />
    </AssessmentLayout>
  );
}
