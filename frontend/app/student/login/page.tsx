// app/login/page.tsx
'use client';

import React from 'react';
import Login from '@/components/student/Login';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/student/assessment');
    };

    return (
        <Login onLoginSuccess={handleLoginSuccess} />
    );
}