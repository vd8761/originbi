"use client";

import React from 'react';
import Header from '@/components/corporate/Header';
import { usePathname, useRouter } from 'next/navigation';

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

    const handleLogout = () => {
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
        <div className="relative min-h-screen w-full bg-cover bg-fixed bg-center bg-no-repeat font-sans selection:bg-brand-green/20 overflow-x-hidden lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]">

            {/* --- HEADER (Persistent) --- */}
            {showHeader && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <Header
                        portalMode="corporate"
                        onNavigate={handleNavigate}
                        onLogout={handleLogout}
                        onSwitchPortal={handleSwitchPortal}
                    />
                </div>
            )}

            {/* --- CONTENT LAYER --- */}
            <div className={`relative z-10 w-full min-h-screen ${showHeader ? 'pt-[90px] sm:pt-[98px] lg:pt-[105px]' : ''}`}>
                {/* Responsive Container */}
                <div className="w-full h-full px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-[2000px] mx-auto transition-all duration-300 relative">
                    {/* --- DEV GRID OVERLAY --- */}
                    {/* Hidden by default, kept for consistency with Admin layout */}
                    <div className="absolute inset-x-4 sm:inset-x-6 lg:inset-x-8 2xl:inset-x-12 top-0 bottom-0 grid grid-cols-4 lg:grid-cols-12 gap-4 lg:gap-6 pointer-events-none z-0 opacity-0" aria-hidden="true">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-red-500/10 h-full w-full border-x border-red-500/20"></div>
                        ))}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
