"use client";

import React, { useEffect, useState } from 'react';
import Header from '../../components/corporate/Header';
import FloatingChatBot from '../../components/admin/FloatingChatBot';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../lib/aws-amplify-config';
import RequireCorporate from '../../components/auth/RequireCorporate';
import { corporateDashboardService } from '../../lib/services';

configureAmplify();

export default function CorporateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [showAssistant, setShowAssistant] = useState(false);

    // Show header only if NOT on auth pages (login, register, forgot-password, reset-password)
    const hideHeaderRoutes = [
        '/corporate/login',
        '/corporate/register',
        '/corporate/forgot-password',
        '/corporate/reset-password'
    ];

    // Check if current path starts with any of the hide routes (to cover subpaths if any)
    // Or simpler exact match if routes are exact.
    const showHeader = !hideHeaderRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    useEffect(() => {
        let mounted = true;

        const loadAssistantAccess = async () => {
            if (!showHeader) {
                if (mounted) setShowAssistant(false);
                return;
            }

            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (!email) {
                if (mounted) setShowAssistant(false);
                return;
            }

            try {
                const profile = await corporateDashboardService.getProfile(email);
                if (mounted) {
                    setShowAssistant(!!profile?.ask_bi_enabled);
                }
            } catch (error) {
                console.error('Failed to load Ask BI access', error);
                if (mounted) setShowAssistant(false);
            }
        };

        loadAssistantAccess();

        return () => {
            mounted = false;
        };
    }, [showHeader, pathname]);

    const handleNavigate = (view: string) => {
        // Map view ID to route
        switch (view) {
            case 'dashboard':
                router.push('/corporate/dashboard');
                break;
            case 'registrations': // Mapped to My Employees
                router.push('/corporate/registrations');
                break;
            case 'jobs':
                router.push('/corporate/jobs');
                break;
            case 'candidates':
                router.push('/corporate/candidates');
                break;
            case 'origindata':
                router.push('/corporate/origindata');
                break;
            case 'settings':
                router.push('/corporate/settings');
                break;
            default:
                router.push(`/corporate/${view}`);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out: ', error);
        }

        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        router.push('/corporate/login');
    };

    const handleSwitchPortal = () => {
        // Example logic for switching or viewing profile
        router.push('/corporate/profile');
    };

    return (
        <div className="relative min-h-screen w-full bg-transparent dark:bg-[#19211C] font-sans selection:bg-brand-green/20 overflow-x-hidden">

            {/* --- HEADER (Persistent) --- */}
            {/* Zoom Wrapper - Only zoom on protected dashboard pages */}
            <div className={`w-full min-h-screen ${showHeader ? 'lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]' : ''}`}>

                {/* --- PROTECTED LAYOUT (Header + Content) --- */}
                {showHeader ? (
                    <RequireCorporate>
                        <div className="fixed top-0 left-0 right-0 z-50">
                            <Header
                                portalMode="corporate"
                                onNavigate={handleNavigate}
                                onLogout={handleLogout}
                                onSwitchPortal={handleSwitchPortal}
                            />
                        </div>

                        <div className="relative z-10 w-full min-h-screen pt-[clamp(70px,7.6vh,100px)] portal-bg">
                            <div className="w-full h-full max-w-[2000px] mx-auto transition-all duration-300 relative">
                                {/* --- DEV GRID OVERLAY --- */}
                                <div className="absolute inset-x-4 sm:inset-x-6 lg:inset-x-8 2xl:inset-x-12 top-0 bottom-0 grid grid-cols-4 lg:grid-cols-12 gap-4 lg:gap-6 pointer-events-none z-0 opacity-0" aria-hidden="true">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="bg-red-500/10 h-full w-full border-x border-red-500/20"></div>
                                    ))}
                                </div>
                                {children}
                            </div>
                        </div>

                        {/* Floating AI Chat Bot */}
                        {showAssistant && <FloatingChatBot userRole="CORPORATE" />}
                    </RequireCorporate>
                ) : (
                    /* --- PUBLIC LAYOUT (No Header, No Guard) --- */
                    <div className="relative z-10 w-full min-h-screen">
                        <div className="w-full h-full max-w-[2000px] mx-auto transition-all duration-300 relative">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
