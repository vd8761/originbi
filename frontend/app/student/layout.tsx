"use client";

import React from 'react';
import Header from '../../components/student/Header';
import { usePathname, useRouter } from 'next/navigation';
import RequireStudent from '../../components/auth/RequireStudent';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../lib/aws-amplify-config';
import { studentService } from '../../lib/services/student.service';
import { useEffect, useState } from 'react';

const REPORT_READY_STORAGE_KEY = 'studentReportReady';

configureAmplify();

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isAssessmentModeFlag, setIsAssessmentModeFlag] = useState(false);
    const [isReportReady, setIsReportReady] = useState(false);

    // Define public routes that do NOT require authentication or Header
    const publicRoutes = [
        '/student/login',
        '/student/forgot-password',
        '/student/reset-password',
        '/student/first-time-reset'
    ];

    const isPublic = publicRoutes.some(route => pathname?.includes(route));

    const syncModeFlags = () => {
        if (typeof window === 'undefined') return;

        const assessmentMode = sessionStorage.getItem('isAssessmentMode') === 'true';
        const reportReady =
            sessionStorage.getItem(REPORT_READY_STORAGE_KEY) === 'true' ||
            localStorage.getItem(REPORT_READY_STORAGE_KEY) === 'true';

        setIsAssessmentModeFlag(assessmentMode);
        setIsReportReady(reportReady);
    };

    useEffect(() => {
        if (isPublic) {
            return;
        }

        syncModeFlags();

        const intervalId = window.setInterval(syncModeFlags, 1000);
        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'isAssessmentMode' || event.key === REPORT_READY_STORAGE_KEY || event.key === null) {
                syncModeFlags();
            }
        };

        window.addEventListener('storage', handleStorage);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('storage', handleStorage);
        };
    }, [isPublic]);

    useEffect(() => {
        if (isPublic) {
            setCheckingStatus(false);
            return;
        }

        const checkStatus = async () => {
            if (pathname?.includes('/student/upgrade')) {
                setCheckingStatus(false);
                return;
            }

            // 1. Check Session Storage Flag (Fastest)
            if (sessionStorage.getItem('isAssessmentMode') === 'true') {
                if (!pathname?.includes('/student/assessment') && !pathname?.includes('/student/metaphor') && !pathname?.includes('/student/iat')) {
                    router.push('/student/assessment');
                    return;
                }
            }

            // 2. Validate with Backend (Robust)
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (email) {
                try {
                    const status = await studentService.checkLoginStatus(email);

                    if (status?.status === 'TECH_ONLY_UPGRADE_REQUIRED') {
                        if (!pathname?.includes('/student/upgrade')) {
                            router.push('/student/upgrade');
                        }
                        setCheckingStatus(false);
                        return;
                    }

                    if (status?.isAssessmentMode) {
                        sessionStorage.setItem('isAssessmentMode', 'true');
                        syncModeFlags();
                        if (!pathname?.includes('/student/assessment') && !pathname?.includes('/student/metaphor') && !pathname?.includes('/student/iat')) {
                            router.push('/student/assessment');
                        }
                    } else {
                        sessionStorage.removeItem('isAssessmentMode');
                        syncModeFlags();
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

    // Detect special modes for Header. The Level 3 metaphor exam lives at
    // /student/metaphor — treat it as an assessment page (full-screen, no nav)
    // so the assessment-mode redirect doesn't bounce the student off it.
    // The IAT and Metaphor exams draw their own full-screen top bar, so the
    // global header stays hidden there to avoid a double header. The standard
    // assessment surfaces (Level 1 runner, assessment dashboard) still get the
    // global header; its hideNav flag strips the nav links so students stay
    // locked in. AssessmentLayout already reserves the header's height, so no
    // extra spacing is needed.
    const isStandardAssessmentPage = pathname?.includes('/student/assessment');
    const isAssessmentPage = isStandardAssessmentPage || pathname?.includes('/student/metaphor') || pathname?.includes('/student/iat');
    const isUpgradePage = pathname?.includes('/student/upgrade');
    const hideNav = (isAssessmentPage && !isReportReady) || isUpgradePage;
    const showAssessmentOnly = isAssessmentModeFlag && !isReportReady;
    const shouldApplyZoom = !isPublic && (!isAssessmentPage || isReportReady);
    const shouldRenderHeader = isStandardAssessmentPage || !isAssessmentPage || isReportReady;
    const pageBaseBackgroundClass = (isAssessmentPage && !isReportReady)
        ? 'bg-transparent dark:bg-transparent'
        : 'bg-transparent dark:bg-[#19211C]';

    return (
        <div className={`relative min-h-screen w-full ${pageBaseBackgroundClass} font-sans selection:bg-brand-green/20 overflow-x-hidden`}>
            <div className={`w-full min-h-screen ${shouldApplyZoom ? 'lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]' : ''}`}>
                {isPublic ? (
                    <div className="relative z-10 w-full min-h-screen transition-all duration-300">
                        {children}
                    </div>
                ) : (
                    <RequireStudent>
                        {shouldRenderHeader && (
                            <div className="fixed top-0 left-0 right-0 z-50">
                                <Header
                                    onLogout={handleLogout}
                                    currentView={currentView}
                                    onNavigate={handleNavigate}
                                    hideNav={hideNav}
                                    showAssessmentOnly={showAssessmentOnly}
                                />
                            </div>
                        )}

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
