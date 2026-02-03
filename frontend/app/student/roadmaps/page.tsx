// app/student/roadmaps/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';
import Header from '../../../components/student/Header';
import RoadmapsPage from '../../../components/student/RoadmapsPage';

configureAmplify();

export default function StudentRoadmapsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        try { await signOut(); } catch { /* ignore */ }
        router.push('/student/login');
    };

    const handleNavigate = (view: 'dashboard' | 'assessment') => {
        if (view === 'dashboard') {
            router.push('/student/dashboard');
        } else if (view === 'assessment') {
            router.push('/student/assessment');
        }
    };

    return (
        <RequireStudent>
            <div className="min-h-screen bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat bg-fixed dark:bg-none dark:bg-brand-dark-primary flex flex-col">
                {/* Header */}
                <div className="z-50">
                    <Header
                        onLogout={handleLogout}
                        currentView="roadmaps"
                        onNavigate={handleNavigate}
                    />
                </div>

                {/* Content Area with Top Padding for Fixed Header */}
                <main className="flex-1 pt-[65px] sm:pt-[68px] lg:pt-[50px]">
                    <RoadmapsPage />
                </main>
            </div>
        </RequireStudent>
    );
}
