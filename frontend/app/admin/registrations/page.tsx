"use client";

import React from 'react';
import Header from '@/components/admin/Sidebar';
import RegistrationManagement from '@/components/admin/RegistrationManagement';
import { useRouter } from 'next/navigation';

export default function RegistrationsPage() {
    const router = useRouter();

    const handleLogout = () => {
        // Redirect to student login as a safe default
        router.push('/admin/login');
    };

    const handleNavigate = (view: 'dashboard' | 'registrations') => {
        if (view === 'dashboard') router.push('/admin');
        if (view === 'registrations') router.push('/admin/registrations');
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Header onLogout={handleLogout} currentView="registrations" portalMode="admin" />
            <main className="p-6">
                <RegistrationManagement />
            </main>
        </div>
    );
}