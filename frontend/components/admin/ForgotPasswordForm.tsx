'use client';

import React, { useState, FormEvent } from 'react';
import { resetPassword } from 'aws-amplify/auth';
import Link from 'next/link';

const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const validateEmail = (email: string) => {
        if (!email) return 'Admin Email ID is required.';
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
            const output = await resetPassword({ username: email });
            const { nextStep } = output;

            if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
                setSuccessMessage('Password reset code has been sent to your registered email.');
                // Optionally redirect to reset page after a delay or let user click a link
                // For now, per requirements, we show success message.
                // We could also auto-redirect: 
                // window.location.href = `/admin/reset-password?email=${encodeURIComponent(email)}`;
            } else {
                setSuccessMessage('Password reset initiated. Please check your email.');
            }

        } catch (err: any) {
            console.error('Forgot password error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#1E2124] rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-2 text-brand-text-primary dark:text-white">
                Forgot Password
            </h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
                Enter your email to receive a password reset code
            </p>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1"
                    >
                        Admin Email ID
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
                        placeholder="admin@company.com"
                        required
                        disabled={isSubmitting}
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
                    <div className="space-y-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800">
                            {successMessage}
                        </div>
                        <Link
                            href={`/admin/reset-password?email=${encodeURIComponent(email)}`}
                            className="block w-full text-center text-brand-green font-semibold hover:underline"
                        >
                            Proceed to Reset Password &rarr;
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
                        ) : 'Send OTP'}
                    </button>
                )}

                <div className="text-center">
                    <Link
                        href="/admin/login"
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
                    >
                        Back to Admin Login
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
