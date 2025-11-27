// app/login/page.tsx
'use client';

import React from 'react';
import Login from '@/components/corporate/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/corporate/dashboard');
    };

    return (
        <Login onLoginSuccess={handleLoginSuccess} />
    );
}