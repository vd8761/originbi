"use client";

import React from 'react';
import ProgramsManagement from '@/components/admin/ProgramsManagement';
import RequireAdmin from '@/components/auth/RequireAdmin';

export default function ProgramsPage() {
  return (
    <RequireAdmin>
      <div className="h-full">
        <ProgramsManagement />
      </div>
    </RequireAdmin>
  );
}
