'use client';

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { confirmResetPassword } from 'aws-amplify/auth';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import Logo from '@/components/ui/Logo';

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

    // Refs for OTP inputs
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter (A-Z).';
        if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter (a-z).';
        if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number (0-9).';
        if (!/[\W_]/.test(pwd)) return 'Password must contain at least one special character (!@#$).';
        return '';
    };

    // OTP Handlers
    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (isNaN(Number(value))) return;

        const otpArray = otp.split('');
        while (otpArray.length < 6) otpArray.push('');

        // Take the last character entered
        otpArray[index] = value.substring(value.length - 1);
        const newOtp = otpArray.join('').slice(0, 6);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5 && otpInputRefs.current[index + 1]) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
            // Move back on backspace if current is empty
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setOtp(pastedData);
        // Focus the input corresponding to the length of pasted data
        if (pastedData.length > 0) {
            const focusIndex = Math.min(pastedData.length, 5);
            otpInputRefs.current[focusIndex]?.focus();
        }
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email) {
            setError('Email address is required.');
            return;
        }
        if (otp.length !== 6) {
            setError('Please enter the full 6-digit Verification Code.');
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

    // 3️⃣ Password Reset Success Screen (Cyber Portal Overlay)
    if (successMessage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/80 dark:bg-black/80 backdrop-blur-xl animate-fade-in p-4 transition-all duration-500">
                {/* Floating Card */}
                <div className="w-full max-w-sm bg-white/95 dark:bg-[#050505]/90 backdrop-blur-md p-10 rounded-[32px] shadow-2xl dark:shadow-[0_0_50px_rgba(34,197,94,0.1)] border border-brand-green/20 ring-1 ring-black/5 dark:ring-white/5 flex flex-col items-center text-center space-y-8 transform hover:scale-[1.01] transition-transform duration-500 relative overflow-hidden">

                    {/* Animated grid effect */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-10" />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-green to-transparent animate-pulse-slow" />

                    <div className="relative z-10">
                        <div className="absolute inset-0 bg-brand-green blur-3xl opacity-20 rounded-full animate-pulse"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-brand-green/10 to-transparent rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-brand-green/40 relative">
                            <svg className="w-10 h-10 text-brand-green drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-widest uppercase font-mono">
                            Success
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed px-2 font-mono">
                            {successMessage}
                        </p>
                    </div>

                    <Link
                        href="/admin/login"
                        className="relative z-10 w-full group overflow-hidden text-black bg-brand-green font-bold rounded-lg text-base px-5 py-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] flex justify-center items-center gap-2 uppercase tracking-wider"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Return to Login
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    // 2️⃣ Reset Password Screen (Form Only - Clean Pill Style)
    return (
        <div className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5" noValidate>
                {/* Email Field (ReadOnly) */}
                <div className="group opacity-60 pointer-events-none">
                    <label className="block font-sans text-sm font-semibold text-brand-text-light-secondary dark:text-gray-300 mb-2 pl-2">
                        Target Account
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            readOnly
                            className="bg-brand-light-secondary dark:bg-[#1E2124] border border-transparent text-gray-500 dark:text-gray-400 font-sans text-sm rounded-full block w-full px-5 py-3.5 outline-none"
                        />
                    </div>
                </div>

                {/* OTP Field - 6 Digit Grid */}
                <div className="group">
                    <label className="block font-sans text-sm font-semibold text-brand-text-light-secondary dark:text-gray-300 mb-2 pl-2">
                        Security Token (OTP)
                    </label>
                    <div className="flex gap-2 justify-between">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                                key={index}
                                ref={(el: HTMLInputElement | null) => { otpInputRefs.current[index] = el; }} // Note: void return
                                type="text"
                                maxLength={1}
                                value={otp[index] || ''}
                                onChange={(e) => handleOtpChange(e, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                onPaste={handleOtpPaste}
                                className="w-full aspect-square bg-brand-light-secondary dark:bg-[#1E2124] border border-transparent text-brand-text-light-primary dark:text-white font-mono text-xl text-center rounded-2xl outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/50 hover:bg-brand-light-tertiary dark:hover:bg-[#25282C] transition-all"
                                placeholder="•"
                            />
                        ))}
                    </div>
                </div>

                {/* New Password Field */}
                <div className="group">
                    <label className="block font-sans text-sm font-semibold text-brand-text-light-secondary dark:text-gray-300 mb-2 pl-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={passwordVisible ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-brand-light-secondary dark:bg-[#1E2124] border border-transparent text-brand-text-light-primary dark:text-white placeholder:text-gray-400 font-sans text-sm rounded-full block w-full px-5 py-3.5 pr-12 transition-all duration-300 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/50 hover:bg-brand-light-tertiary dark:hover:bg-[#25282C]"
                            placeholder="Min 8 chars, mixed case"
                            required
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="absolute inset-y-0 right-0 cursor-pointer flex items-center pr-4 text-brand-green hover:text-brand-green/80 transition-colors duration-300"
                            tabIndex={-1}
                        >
                            {passwordVisible ? (
                                <EyeIcon className="h-5 w-5" />
                            ) : (
                                <EyeOffIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                    <label className="block font-sans text-sm font-semibold text-brand-text-light-secondary dark:text-gray-300 mb-2 pl-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={confirmPasswordVisible ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-brand-light-secondary dark:bg-[#1E2124] border border-transparent text-brand-text-light-primary dark:text-white placeholder:text-gray-400 font-sans text-sm rounded-full block w-full px-5 py-3.5 pr-12 transition-all duration-300 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/50 hover:bg-brand-light-tertiary dark:hover:bg-[#25282C]"
                            placeholder="Repeat new password"
                            required
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className="absolute inset-y-0 right-0 cursor-pointer flex items-center pr-4 text-brand-green hover:text-brand-green/80 transition-colors duration-300"
                            tabIndex={-1}
                        >
                            {confirmPasswordVisible ? (
                                <EyeIcon className="h-5 w-5" />
                            ) : (
                                <EyeOffIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-xs pl-3 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-black font-bold h-12 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] border-none rounded-full text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center relative overflow-hidden group hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span className="flex items-center gap-2">
                        {isSubmitting ? 'Processing...' : 'Reset Password'}
                        {!isSubmitting && <span className="text-xl">›</span>}
                    </span>
                </button>

                <div className="text-center pt-2">
                    <Link
                        href="/admin/login"
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        Cancel Process
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ResetPasswordForm;
