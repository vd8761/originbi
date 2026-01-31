"use client";

import React from 'react';
import Header from '@/components/admin/Header';
import FloatingChatBot from '@/components/admin/FloatingChatBot';
import { usePathname, useRouter } from 'next/navigation';
import RequireAdmin from '@/components/auth/RequireAdmin';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config';

configureAmplify();

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Define public routes that do NOT require authentication
    const publicRoutes = [
        '/admin/login',
        '/admin/forgot-password',
        '/admin/reset-password'
    ];

    // Check if the current path is one of the public routes
    const isPublic = publicRoutes.some(route => pathname.includes(route));

    const handleNavigate = (view: string) => {
        switch (view) {
            case 'dashboard':
                router.push('/admin/dashboard');
                break;
            case 'programs':
                router.push('/admin/programs');
                break;
            case 'corporate':
                router.push('/admin/corporate');
                break;
            case 'registrations':
                router.push('/admin/registrations');
                break;
            default:
                router.push(`/admin/${view}`);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out: ', error);
        }

        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        router.push('/admin/login');
    };

    return (
        <div className="relative min-h-screen w-full bg-transparent dark:bg-black font-sans selection:bg-brand-green/20 overflow-x-hidden">

            {/* BACKGROUND LAYERS - Only Show on Protected Pages */}
            {!isPublic && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[url('/Background_Light_Theme.png')] bg-cover bg-center bg-no-repeat opacity-100 dark:hidden" />
                    <div className="absolute inset-0 bg-[url('/Background_Dark_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 hidden dark:block" />
                </div>
            )}

            {/* Zoom Wrapper - Only zoom on protected pages */}
            <div className={`w-full min-h-screen ${!isPublic ? 'lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]' : ''}`}>

                {/* Logic Branch: Public vs Protected */}
                {isPublic ? (
                    /* --- PUBLIC LAYOUT (No Header, No Auth Check) --- */
                    <div className="relative z-10 w-full min-h-screen">
                        <div className="w-full h-full px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-[2000px] mx-auto transition-all duration-300 relative">
                            {children}
                        </div>
                    </div>
                ) : (
                    /* --- PROTECTED LAYOUT (Header + Auth Check) --- */
                    <RequireAdmin>
                        {/* Header is now inside Auth Check - won't flash */}
                        <div className="fixed top-0 left-0 right-0 z-50">
                            <Header
                                portalMode="admin"
                                onNavigate={handleNavigate}
                                onLogout={handleLogout}
                            />
                        </div>

                        {/* Content Layer with Top Padding */}
                        <div className="relative z-10 w-full min-h-screen pt-[90px] sm:pt-[98px] lg:pt-[105px]">
                            <div className="w-full h-full px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-[2000px] mx-auto transition-all duration-300 relative">
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
                        <FloatingChatBot userRole="ADMIN" />
                    </RequireAdmin>
                )}
            </div>
        </div>
    );
}
