'use client';

import React from 'react';
import ForgotPasswordForm from '@/components/admin/ForgotPasswordForm';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';

export default function AdminForgotPasswordPage() {
    return (
        <AdminAuthLayout
            heroTitle={<>Password Recovery<br /><span className="text-brand-green">Secure Protocol</span></>}
            heroSubtitle="Initiate identity verification to restore access to the administrative console. A secure code will be sent to your registered channel."
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your email to receive a secure reset code.</p>
            </div>

            <ForgotPasswordForm />
        </AdminAuthLayout>
    );
}
