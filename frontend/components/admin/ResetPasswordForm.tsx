'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { confirmResetPassword } from 'aws-amplify/auth';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

const ResetPasswordForm: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(pwd)) return 'Must contain an uppercase letter';
        if (!/[a-z]/.test(pwd)) return 'Must contain a lowercase letter';
        if (!/[0-9]/.test(pwd)) return 'Must contain a number';
        if (!/[\W_]/.test(pwd)) return 'Must contain a special character';
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email) {
            setError('Email is required.');
            return;
        }
        if (!otp) {
            setError('Verification Code (OTP) is required.');
            return;
        }

        const pwdError = validatePassword(newPassword);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setIsSubmitting(true);
            await confirmResetPassword({
                username: email,
                confirmationCode: otp,
                newPassword: newPassword
            });
            setSuccessMessage('Password reset successful. Please login to continue.');
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to reset password. Please check the code and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const iconColorClass = 'text-brand-green';

    if (successMessage) {
        return (
            <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#1E2124] rounded-2xl shadow-xl text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-brand-text-primary dark:text-white">Success!</h2>
                <p className="text-green-600 dark:text-green-400 font-medium">{successMessage}</p>
                <Link
                    href="/admin/login"
                    className="block w-full text-white bg-brand-green hover:bg-brand-green/90 font-bold rounded-full text-base px-5 py-4 transition-all duration-300 shadow-lg"
                >
                    Go to Admin Login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#1E2124] rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-2 text-brand-text-primary dark:text-white">
                Reset Password
            </h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
                Enter the OTP sent to your email and set a new password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
                        Admin Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-50 dark:bg-[#24272B] border border-gray-200 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm rounded-full block w-full p-4 outline-none focus:ring-1 focus:ring-brand-green"
                        placeholder="admin@company.com"
                        required
                    />
                </div>

                {/* OTP Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
                        OTP / Verification Code
                    </label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm rounded-full block w-full p-4 outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                        placeholder="Enter code"
                        required
                    />
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={passwordVisible ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm rounded-full block w-full p-4 pr-12 outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                            placeholder="Enter new password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4"
                        >
                            {passwordVisible ? (
                                <EyeIcon className={`h-5 w-5 ${iconColorClass}`} />
                            ) : (
                                <EyeOffIcon className={`h-5 w-5 ${iconColorClass}`} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            type={confirmPasswordVisible ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm rounded-full block w-full p-4 pr-12 outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                            placeholder="Confirm new password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4"
                        >
                            {confirmPasswordVisible ? (
                                <EyeIcon className={`h-5 w-5 ${iconColorClass}`} />
                            ) : (
                                <EyeOffIcon className={`h-5 w-5 ${iconColorClass}`} />
                            )}
                        </button>
                    </div>
                    {/* Password Hint */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30 font-bold rounded-full text-base px-5 py-4 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] flex justify-center items-center"
                >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>

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

export default ResetPasswordForm;
