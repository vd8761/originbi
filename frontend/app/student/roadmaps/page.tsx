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
            <main className="pb-10">
                <div className="w-full h-full mx-auto transition-all duration-300 relative">
                    <RoadmapsPage />
                </div>
            </main>
        </RequireStudent>
    );
}
