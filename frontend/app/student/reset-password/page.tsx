'use client';

import React, { Suspense } from 'react';
import ResetPasswordForm from '@/components/student/ResetPasswordForm';

export default function StudentResetPasswordPage() {
    return (
        <main className="min-h-[100dvh] flex items-center justify-center bg-brand-light-primary dark:bg-brand-dark-primary p-4">
            <Suspense fallback={<div className="text-brand-green animate-pulse font-bold">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
