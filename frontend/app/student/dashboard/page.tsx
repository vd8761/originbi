// app/student/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';

configureAmplify();
import Dashboard from '../../../components/student/Dashboard';

export default function StudentDashboardPage() {
  return (
    <RequireStudent>
      <Dashboard />
    </RequireStudent>
  );
}
