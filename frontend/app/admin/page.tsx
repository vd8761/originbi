// app/admin_portal/page.tsx

import React from 'react';

export default function AdminPortalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <p className="text-slate-300">
          This is a placeholder for the Admin portal UI.
        </p>
        <p className="text-sm text-slate-500">
          URL: <code className="bg-slate-800 px-2 py-1 rounded">/admin_portal</code>
        </p>
      </div>
    </main>
  );
}
