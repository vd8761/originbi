'use client';

import React from 'react';
import ForgotPasswordForm from '@/components/admin/ForgotPasswordForm';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminForgotPasswordPage() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex h-[100dvh] w-full bg-brand-light-primary dark:bg-brand-dark-primary font-sans transition-colors duration-300 overflow-hidden relative">
            {/* Background Image for style */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block">
                <img
                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-5 dark:opacity-10 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-light-primary dark:from-brand-dark-primary via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8">
                {/* Header Actions */}
                <div className="absolute top-6 right-6 lg:top-8 lg:right-12">
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>

                <div className="mb-8 scale-110">
                    <Logo />
                </div>

                <div className="w-full max-w-md">
                    <ForgotPasswordForm />
                </div>

                <div className="mt-8 text-center text-xs text-gray-500">
                    &copy; 2025 Origin BI. Secure Admin Portal.
                </div>
            </div>
        </div>
    );
}
