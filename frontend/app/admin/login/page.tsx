// app/login/page.tsx
'use client';

import React from 'react';
import Login from '@/components/admin/AdminLogin';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/admin/dashboard');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <Login onLoginSuccess={handleLoginSuccess} onBack={handleBack} />
    );
}