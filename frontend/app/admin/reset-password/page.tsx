'use client';

import React from 'react';
import ResetPasswordForm from '@/components/admin/ResetPasswordForm';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';

export default function AdminResetPasswordPage() {
    return (
        <AdminAuthLayout
            heroTitle={<>Security Protocol<br /><span className="text-brand-green">Credentials Management</span></>}
            heroSubtitle="Complete the security protocol by updating your access credentials. Ensure strong password hygiene for system integrity."
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Choose a new password to secure your account.</p>
            </div>

            <ResetPasswordForm />
        </AdminAuthLayout>
    );
}
