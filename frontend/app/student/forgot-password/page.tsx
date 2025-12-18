'use client';

import React, { Suspense } from 'react';
import ForgotPasswordForm from '@/components/student/ForgotPasswordForm';

export default function StudentForgotPasswordPage() {
    return (
        <main className="min-h-[100dvh] flex items-center justify-center bg-brand-light-primary dark:bg-brand-dark-primary p-4">
            <ForgotPasswordForm />
        </main>
    );
}
