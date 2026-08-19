'use client';

import React, { useState, useEffect } from 'react';
import { dosmembershipService } from '../../../lib/services/dosmembership.service';

export default function DOSPaymentPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [token, setToken] = useState('');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    useEffect(() => {
        // Read URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const tokenParam = searchParams.get('token');

        if (!tokenParam) {
            setError('Missing secure payment token. Please initiate the payment from the source platform.');
            setLoading(false);
            return;
        }

        setToken(tokenParam);

        // Decode token securely from backend to get order details
        dosmembershipService.decodeToken(tokenParam)
            .then((result) => {
                if (result.success && result.details) {
                    setPaymentDetails(result.details);
                } else {
                    setError('Invalid or expired payment token.');
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to verify secure payment token.');
                setLoading(false);
            });
    }, []);

    const handlePaymentSubmit = async () => {
        if (!paymentDetails || !token) return;
        
        setError('');
        setSubmitting(true);

        try {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: paymentDetails.keyId,
                    amount: paymentDetails.amount,
                    currency: paymentDetails.currency,
                    name: 'DOS Membership',
                    description: `Payment for ${paymentDetails.plan}`,
                    order_id: paymentDetails.orderId,
                    handler: async (response: any) => {
                        try {
                            setSubmitting(true);
                            const result = await dosmembershipService.verifyPayment({
                                token,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });

                            if (result.success) {
                                setSuccess(true);
                                setTimeout(() => {
                                    if (result.redirectUrl) {
                                        // Append payment success info to redirect URL
                                        const redirect = new URL(result.redirectUrl);
                                        redirect.searchParams.append('status', 'success');
                                        redirect.searchParams.append('payment_id', response.razorpay_payment_id);
                                        redirect.searchParams.append('order_id', response.razorpay_order_id);
                                        window.location.href = redirect.toString();
                                    }
                                }, 2000);
                            } else {
                                setError(result.message || 'Verification failed. Please contact support.');
                            }
                        } catch (err: any) {
                            setError('Failed to verify payment. Please contact support.');
                            console.error(err);
                        } finally {
                            setSubmitting(false);
                        }
                    },
                    theme: { color: '#1ED36A' }, // OriginBI / DOS theme color
                    modal: {
                        ondismiss: () => setSubmitting(false),
                    },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            };
            script.onerror = () => {
                setError('Failed to load Razorpay payment window. Check your internet connection.');
                setSubmitting(false);
            };
            document.body.appendChild(script);
        } catch (err: any) {
            setError(err.message || 'Failed to start payment process.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#121212]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
                    <p className="text-black dark:text-white text-sm font-medium animate-pulse">
                        Loading payment details...
                    </p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9FAFB] dark:bg-[#121212] animate-fade-in">
                <div className="relative z-10 w-full max-w-[480px] bg-white dark:bg-[#19211C] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl p-8 md:p-10 flex flex-col items-center text-center space-y-8">
                    <div className="relative">
                        <div className="relative w-24 h-24 bg-brand-green/20 rounded-full flex items-center justify-center shadow-inner shadow-brand-green/30">
                            <svg className="w-12 h-12 text-brand-green animate-[bounce_1s_ease-in-out_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-base font-medium">
                            Your payment for <span className="font-bold text-brand-green">{paymentDetails?.plan}</span> has been processed.
                        </p>
                    </div>
                    {paymentDetails?.redirectUrl && (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-green uppercase tracking-widest animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-green"></span>
                            Redirecting you back...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#F9FAFB] dark:bg-[#121212] relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg bg-white/80 dark:bg-[#19211C]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300">
                <div className="px-6 py-8 md:p-10 border-b border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-tr from-brand-green to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-green/30 mb-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Complete Payment
                    </h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Securely process your membership payment
                    </p>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in shadow-sm">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 space-y-4 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Description</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{paymentDetails?.plan}</span>
                            </div>
                            {paymentDetails?.userId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Account ID</span>
                                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{paymentDetails.userId}</span>
                                </div>
                            )}
                            <div className="w-full h-[1px] bg-gray-200 dark:bg-white/10"></div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount</span>
                                <span className="text-3xl font-extrabold text-brand-green drop-shadow-sm">₹{paymentDetails?.amount ? paymentDetails.amount / 100 : 0}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePaymentSubmit}
                        disabled={submitting || error !== ''}
                        className="group relative w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-green to-emerald-500 hover:from-brand-green hover:to-emerald-400 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-xl shadow-brand-green/20 hover:shadow-brand-green/40 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:animate-[shimmer_2s_infinite] -translate-x-full group-hover:translate-x-full transition-transform ease-in-out"></div>
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Processing Securely...</span>
                            </>
                        ) : (
                            <>
                                <span>Pay Now</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400 dark:text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                        </svg>
                        Secured by Razorpay. 100% Safe & Secure.
                    </div>
                </div>
            </div>
        </div>
    );
}
