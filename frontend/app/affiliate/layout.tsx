"use client";

import React from 'react';
import AffiliateHeader from '../../components/affiliate/AffiliateHeader';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';

export default function AffiliateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Show header only if NOT on auth pages
    const hideHeaderRoutes = [
        '/affiliate/login',
        '/affiliate/register',
        '/affiliate/forgot-password',
        '/affiliate/reset-password'
    ];

    const showHeader = !hideHeaderRoutes.some(route => pathname.includes(route));

    const handleNavigate = (view: string) => {
        switch (view) {
            case 'dashboard':
                router.push('/affiliate/dashboard');
                break;
            case 'referrals':
                router.push('/affiliate/referrals');
                break;
            case 'earnings':
                router.push('/affiliate/earnings');
                break;
            case 'settings':
                router.push('/affiliate/settings');
                break;
            case 'profile':
                router.push('/affiliate/profile');
                break;
            default:
                router.push(`/affiliate/${view}`);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.removeItem('affiliate_user');
            localStorage.removeItem('affiliate_token');
        }
        router.push('/affiliate/login');
    };

    const handleSwitchPortal = () => {
        router.push('/affiliate/dashboard');
    };

    return (
        <div className="relative min-h-screen w-full bg-transparent dark:bg-black font-sans selection:bg-brand-green/20 overflow-x-hidden">

            {/* BACKGROUND LAYERS - Only Show on Protected Pages */}
            {showHeader && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 dark:hidden" />
                    <div className="absolute inset-0 bg-[url('/Background_Dark_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 hidden dark:block" />
                </div>
            )}

            {/* Zoom Wrapper */}
            <div className={`w-full min-h-screen ${showHeader ? 'lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]' : ''}`}>

                {/* --- PROTECTED LAYOUT (Header + Content) --- */}
                {showHeader ? (
                    <>
                        <div className="fixed top-0 left-0 right-0 z-50">
                            <AffiliateHeader
                                onNavigate={handleNavigate}
                                onLogout={handleLogout}
                            />
                        </div>

                        <div className="relative z-10 w-full min-h-screen pt-[clamp(70px,7.6vh,100px)]">
                            <div className="w-full h-full max-w-[2000px] mx-auto transition-all duration-300 relative">
                                {children}
                            </div>
                        </div>
                    </>
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
