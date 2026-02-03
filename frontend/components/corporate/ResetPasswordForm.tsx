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
        if (pwd.length < 8) return 'Password must be at least 8 characters long.';
        // if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
        // if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
        // if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
        // if (!/[\W_]/.test(pwd)) return 'Password must contain at least one special character.';
        // Simple validation for now to match student portal if needed, or keep strict
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email) {
            setError('Email address is required.');
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
            setSuccessMessage('Your password has been updated successfully. You can now log in using your new password.');
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Unable to reset password. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const iconColorClass = 'text-brand-green';

    // 3️⃣ Password Reset Success Screen (Minimalist for Layout)
    if (successMessage) {
        return (
            <div className="space-y-6 text-center animate-fade-in flex flex-col items-center w-full">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce-short">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-brand-text-primary dark:text-white">Success!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                        {successMessage}
                    </p>
                </div>

                <Link
                    href="/corporate/login"
                    style={{ padding: 'clamp(14px,1vw,20px)' }}
                    className="w-full text-white bg-brand-green hover:bg-brand-green/90 font-bold rounded-full text-[clamp(16px,1vw,20px)] transition-all duration-300 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-center block"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    // 2️⃣ Reset Password Form
    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
            {/* Email Field (ReadOnly for context) */}
            <div>
                <label className="block font-sans text-[clamp(14px,0.9vw,18px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none tracking-[0px]">
                    Email Address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary text-[clamp(14px,0.83vw,16px)] rounded-full block w-full outline-none focus:ring-1 focus:ring-brand-green opacity-70 cursor-not-allowed"
                    style={{ padding: 'clamp(14px,1vw,20px)' }}
                    placeholder="your@email.com"
                    readOnly
                />
            </div>

            {/* OTP Field */}
            <div>
                <label className="block font-sans text-[clamp(14px,0.9vw,18px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none tracking-[0px]">
                    Verification Code (OTP)
                </label>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary text-[clamp(14px,0.83vw,16px)] rounded-full block w-full outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green text-center tracking-widest font-bold"
                    style={{ padding: 'clamp(14px,1vw,20px)' }}
                    placeholder="------"
                    required
                    disabled={isSubmitting}
                />
            </div>

            {/* New Password Field */}
            <div>
                <label className="block font-sans text-[clamp(14px,0.9vw,18px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none tracking-[0px]">
                    New Password
                </label>
                <div className="relative">
                    <input
                        type={passwordVisible ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary text-[clamp(14px,0.83vw,16px)] rounded-full block w-full pr-12 outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                        style={{ padding: 'clamp(14px,1vw,20px)' }}
                        placeholder="Min 8 chars, mixed case"
                        required
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4"
                        tabIndex={-1}
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
            <div>
                <label className="block font-sans text-[clamp(14px,0.9vw,18px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none tracking-[0px]">
                    Confirm New Password
                </label>
                <div className="relative">
                    <input
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary text-[clamp(14px,0.83vw,16px)] rounded-full block w-full pr-12 outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                        style={{ padding: 'clamp(14px,1vw,20px)' }}
                        placeholder="Repeat new password"
                        required
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4"
                        tabIndex={-1}
                    >
                        {confirmPasswordVisible ? (
                            <EyeIcon className={`h-5 w-5 ${iconColorClass}`} />
                        ) : (
                            <EyeOffIcon className={`h-5 w-5 ${iconColorClass}`} />
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 animate-shake">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: 'clamp(14px,1vw,20px)' }}
                className="w-full text-white bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30 font-bold rounded-full text-[clamp(16px,1vw,20px)] text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] flex justify-center items-center"
            >
                {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Reset Password'}
            </button>

            <div className="text-center pt-2">
                <Link
                    href="/corporate/login"
                    className="text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green transition-colors"
                >
                    Back to Login
                </Link>
            </div>
        </form>
    );
};

export default ResetPasswordForm;
