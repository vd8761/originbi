"use client";

import React from 'react';
import Header from '../../components/student/Header';
import { usePathname, useRouter } from 'next/navigation';
import RequireStudent from '../../components/auth/RequireStudent';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../lib/aws-amplify-config';
import { studentService } from '../../lib/services/student.service';
import { useEffect, useState } from 'react';

configureAmplify();

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Define public routes that do NOT require authentication or Header
    const publicRoutes = [
        '/student/login',
        '/student/forgot-password',
        '/student/reset-password',
        '/student/first-time-reset'
    ];

    const isPublic = publicRoutes.some(route => pathname?.includes(route));

    useEffect(() => {
        if (isPublic) {
            setCheckingStatus(false);
            return;
        }

        const checkStatus = async () => {
            // 1. Check Session Storage Flag (Fastest)
            if (sessionStorage.getItem('isAssessmentMode') === 'true') {
                if (!pathname?.includes('/student/assessment')) {
                    router.push('/student/assessment');
                    return;
                }
            }

            // 2. Validate with Backend (Robust)
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (email) {
                try {
                    const status = await studentService.checkLoginStatus(email);

                    if (status?.isAssessmentMode) {
                        sessionStorage.setItem('isAssessmentMode', 'true');
                        if (!pathname?.includes('/student/assessment')) {
                            router.push('/student/assessment');
                        }
                    } else {
                        sessionStorage.removeItem('isAssessmentMode');
                    }
                } catch (e) {
                    console.error("Error checking assessment status", e);
                }
            }
            setCheckingStatus(false);
        };

        checkStatus();
    }, [pathname, router, isPublic]);

    const handleNavigate = (view: 'dashboard' | 'assessment') => {
        if (view === 'dashboard') {
            router.push('/student/dashboard');
        } else if (view === 'assessment') {
            router.push('/student/assessment');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out: ', error);
        }
        router.push('/student/login');
    };

    // Determine current view for Header highlighting
    let currentView: "dashboard" | "assessment" | "roadmaps" | "profile" | undefined;
    if (pathname?.includes('/student/dashboard')) currentView = "dashboard";
    else if (pathname?.includes('/student/assessment')) currentView = "assessment";
    else if (pathname?.includes('/student/roadmaps')) currentView = "roadmaps";
    else if (pathname?.includes('/student/profile-settings')) currentView = "profile";

    if (checkingStatus && !isPublic) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark-primary">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    // Detect special modes for Header
    const isAssessmentPage = pathname?.includes('/student/assessment');
    // For now, if we are on assessment page, match the behavior in assessment/page.tsx
    const hideNav = isAssessmentPage; 
    const showAssessmentOnly = typeof window !== 'undefined' ? sessionStorage.getItem('isAssessmentMode') === 'true' : false;

    return (
        <div className="relative min-h-screen w-full bg-transparent dark:bg-[#19211C] font-sans selection:bg-brand-green/20 overflow-x-hidden">
            <div className={`w-full min-h-screen ${!isPublic ? 'lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]' : ''}`}>
                {isPublic ? (
                    <div className="relative z-10 w-full min-h-screen px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-[2000px] mx-auto transition-all duration-300 relative">
                        {children}
                    </div>
                ) : (
                    <RequireStudent>
                        {/* Persistent Header */}
                        <div className="fixed top-0 left-0 right-0 z-50">
                            <Header
                                onLogout={handleLogout}
                                currentView={currentView}
                                onNavigate={handleNavigate}
                                hideNav={hideNav}
                                showAssessmentOnly={showAssessmentOnly}
                            />
                        </div>

                        {/* Content Area with Top Padding - Matches AdminLayout structure */}
                        <main className={`relative z-10 w-full min-h-screen ${isAssessmentPage ? '' : 'pt-[clamp(70px,7.6vh,100px)]'} portal-bg`}>
                            <div className={`w-full h-full px-4 sm:px-6 lg:px-8 2xl:px-12 ${isAssessmentPage ? '' : 'pt-6 sm:pt-8'} max-w-[2000px] mx-auto transition-all duration-300 relative`}>
                                {children}
                            </div>
                        </main>
                    </RequireStudent>
                )}
            </div>
        </div>
    );
}
