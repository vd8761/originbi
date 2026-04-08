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
            <div className="relative min-h-screen w-full bg-transparent dark:bg-[#19211C] font-sans selection:bg-brand-green/20 overflow-x-hidden">

                <div className="w-full min-h-screen lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]">
                    {/* Header */}
                    <div className="fixed top-0 left-0 right-0 z-50">
                        <Header
                            onLogout={handleLogout}
                            currentView="roadmaps"
                            onNavigate={handleNavigate}
                        />
                    </div>

                    {/* Content Area with Top Padding for Fixed Header */}
                    <main className="relative z-10 w-full min-h-screen pt-[70px] sm:pt-[78px] lg:pt-[85px] pb-10">
                        <div className="w-full h-full mx-auto transition-all duration-300 relative">
                            <RoadmapsPage />
                        </div>
                    </main>
                </div>
            </div>
        </RequireStudent>
    );
}
