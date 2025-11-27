// app/login/page.tsx
'use client';

import React from 'react';
import Login from '@/components/admin/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/admin/dashboard');
    };

    return (
        <Login onLoginSuccess={handleLoginSuccess} />
    );
}