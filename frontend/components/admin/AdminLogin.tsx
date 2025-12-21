'use client';

import React from 'react';
import LoginForm from '@/components/admin/LoginForm';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  portalMode?: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  return (
    <AdminAuthLayout
      heroTitle={<>Central Administration<br /><span className="text-brand-green">Origin BI Console</span></>}
      heroSubtitle="Manage users, configure system parameters, and monitor platform health from a centralized secure dashboard."
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Welcome Back</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your credentials to access the secure node.</p>
      </div>

      <LoginForm
        onLoginSuccess={onLoginSuccess}
        portalMode="admin"
        buttonClass="bg-brand-green hover:bg-brand-green/90 text-black font-bold h-12 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-brand-green/50"
      />

      <div className="mt-0 text-center">
        <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
          ← Return to Portal Entry
        </button>
      </div>
    </AdminAuthLayout>
  );
};

export default AdminLogin;
