"use client";

import React from 'react';
import Header from '@/components/corporate/Header';
import FloatingChatBot from '@/components/admin/FloatingChatBot';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config';
import RequireCorporate from '@/components/auth/RequireCorporate';

configureAmplify();

export default function CorporateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Show header only if NOT on auth pages (login, register, forgot-password, reset-password)
    const hideHeaderRoutes = [
        '/corporate/login',
        '/corporate/register',
        '/corporate/forgot-password',
        '/corporate/reset-password'
    ];

    // Check if current path starts with any of the hide routes (to cover subpaths if any)
    // Or simpler exact match if routes are exact.
    const showHeader = !hideHeaderRoutes.some(route => pathname.includes(route));

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
        <div className="relative min-h-screen w-full bg-transparent dark:bg-black font-sans selection:bg-brand-green/20 overflow-x-hidden">

            {/* BACKGROUND LAYERS - Only Show on Protected Pages (Dashboard, etc.) */}
            {showHeader && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 dark:hidden" />
                    <div className="absolute inset-0 bg-[url('/Background_Dark_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 hidden dark:block" />
                </div>
            )}

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

                        <div className="relative z-10 w-full min-h-screen pt-[clamp(70px,7.6vh,100px)]">
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
                        <FloatingChatBot userRole="CORPORATE" />
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
