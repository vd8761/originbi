'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const validateEmail = (email: string) => {
        if (!email) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email address.';
        }
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. Initiate Reset via Backend
            const adminServiceUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
            const initiateRes = await fetch(`${adminServiceUrl}/forgot-password/admin/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!initiateRes.ok) {
                const data = await initiateRes.json().catch(() => ({}));
                throw new Error(data.message || 'Unable to initiate password reset.');
            }

            // 2. Success
            setSuccessMessage('If this email is registered, a reset code has been sent.');

        } catch (err: any) {
            console.error('Forgot password error:', err);
            setError(err.message || 'An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5" noValidate>
                {/* Email Field */}
                <div className="group">
                    <label
                        htmlFor="email"
                        className="block font-sans text-sm font-semibold text-brand-text-light-secondary dark:text-gray-300 mb-2 pl-2"
                    >
                        Registered Email Address
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`bg-brand-light-secondary dark:bg-[#1E2124] border border-transparent text-brand-text-light-primary dark:text-white placeholder:text-gray-400 font-sans text-sm rounded-full block w-full px-5 py-3.5 transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green ${error ? 'border-red-500 focus:ring-red-500/30' : 'hover:bg-brand-light-tertiary dark:hover:bg-[#25282C]'}`}
                            placeholder="user@originbi.com"
                            required
                            disabled={isSubmitting || !!successMessage}
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-xs pl-3 font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="space-y-6 text-center animate-fade-in">
                        <div className="flex items-center gap-3 px-5 py-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium border border-green-500/20 rounded-xl">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            {successMessage}
                        </div>
                        {/* Dev-only link preserved */}
                        <Link
                            href={`/admin/reset-password?email=${encodeURIComponent(email)}`}
                            className="hidden inline-flex items-center text-brand-green font-semibold hover:underline group"
                        >
                            Proceed to Reset Password
                        </Link>
                    </div>
                )}

                {!successMessage && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-black font-bold h-12 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] border-none rounded-full text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center relative overflow-hidden group"
                    >
                        <span className="flex items-center gap-2">
                            {isSubmitting ? 'Transmitting...' : 'Send Recovery Code'}
                            {!isSubmitting && <span className="text-lg">›</span>}
                        </span>
                    </button>
                )}

                <div className="text-center pt-0">
                    <Link
                        href="/admin/login"
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
