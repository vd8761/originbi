"use client";

import React from 'react';
import Header from '@/components/admin/Header';
import RegistrationManagement from '@/components/admin/RegistrationManagement';
import { useRouter } from 'next/navigation';

export default function RegistrationsPage() {
    const router = useRouter();

    const handleLogout = () => {
        // Redirect to student login as a safe default
        router.push('/student/login');
    };

    const handleNavigate = (view: 'dashboard' | 'assessment' | 'registrations') => {
        if (view === 'dashboard') router.push('/admin');
        if (view === 'assessment') router.push('/student/assessment');
        if (view === 'registrations') router.push('/admin/registrations');
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Header onLogout={handleLogout} currentView="registrations" portalMode="corporate" onNavigate={handleNavigate} />
            <main className="p-6">
                <RegistrationManagement />
            </main>
        </div>
    );
}