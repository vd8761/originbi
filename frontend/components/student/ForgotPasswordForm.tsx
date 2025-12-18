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

            // 1. Initiate Reset via Student Backend
            const studentServiceUrl = process.env.NEXT_PUBLIC_STUDENT_SERVICE_URL || 'http://localhost:4004';
            const initiateRes = await fetch(`${studentServiceUrl}/forgot-password/initiate`, {
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
        <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-[#1E2124] rounded-2xl shadow-xl flex flex-col items-center">
            {/* Origin BI Logo */}
            <div className="mb-8">
                <Logo className="h-10 w-auto" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 text-brand-text-primary dark:text-white">
                Forgot Password
            </h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[280px]">
                Enter your registered email address to receive a password reset code.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1"
                    >
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`bg-white dark:bg-[#24272B] border text-brand-text-light-primary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm rounded-full block w-full p-4 transition-all duration-300 outline-none 
                            ${error && error.includes('Email')
                                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-gray-200 dark:border-white/10 focus:ring-brand-green focus:border-brand-green focus:ring-1 focus:ring-opacity-50'
                            }`}
                        placeholder="your@email.com"
                        required
                        disabled={isSubmitting || !!successMessage}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="space-y-6 text-center animate-fade-in">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800">
                            {successMessage}
                        </div>
                        <Link
                            href={`/student/reset-password?email=${encodeURIComponent(email)}`}
                            className="inline-flex items-center text-brand-green font-semibold hover:underline group"
                        >
                            Proceed to Reset Password
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        </Link>
                    </div>
                )}

                {!successMessage && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full text-white bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30 font-bold rounded-full text-base px-5 py-4 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] flex justify-center items-center"
                    >
                        {isSubmitting ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Send Reset Code'}
                    </button>
                )}

                <div className="text-center">
                    <Link
                        href="/student/login"
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
