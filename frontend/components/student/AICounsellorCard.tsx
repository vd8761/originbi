'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentService } from '../../lib/services/student.service';

const AiCounsellorCard: React.FC = () => {
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        const checkAccess = async () => {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (email) {
                try {
                    const status = await studentService.getSubscriptionStatus(email);
                    setHasAccess(status.hasAiCounsellor);
                    if (status.daysRemaining !== undefined) {
                        setDaysRemaining(status.daysRemaining);
                    }
                } catch (e) {
                    console.error('Error checking AI Counsellor access', e);
                }
            }
            setLoading(false);
        };
        checkAccess();
    }, []);

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (!email) return;

            const order = await studentService.createCounsellorOrder(email);

            // Load Razorpay script dynamically
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'OriginBI',
                    description: 'AI Career Counsellor - 90 Day Access',
                    order_id: order.orderId,
                    handler: async (response: any) => {
                        try {
                            const result = await studentService.verifyCounsellorPayment({
                                email: email!,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            if (result.success) {
                                setHasAccess(true);
                            }
                        } catch (e) {
                            console.error('Payment verification failed', e);
                        }
                        setPurchasing(false);
                    },
                    prefill: { email },
                    theme: { color: '#1ED36A' },
                    modal: {
                        ondismiss: () => setPurchasing(false),
                    },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            };
            document.body.appendChild(script);
        } catch (e) {
            console.error('Purchase initiation failed', e);
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-glass-card h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    // ── UNLOCKED: Has AI Counsellor Access ──
    if (hasAccess) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-700/30 rounded-2xl h-full flex flex-col backdrop-blur-sm overflow-hidden group">
                <div className="px-6 pt-6 pb-3 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.625vw]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 lg:w-[1.66vw] lg:h-[1.66vw] rounded-full bg-brand-green/10 flex items-center justify-center">
                            <svg className="w-4 h-4 lg:w-[0.83vw] lg:h-[0.83vw] text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw] leading-tight">
                            AI Career Counsellor
                        </h3>
                    </div>
                    <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw] leading-relaxed">
                        Your personalized AI guide for career decisions, roadmaps, and growth strategies based on your assessment results.
                    </p>
                </div>

                <div className="px-6 pb-6 lg:px-[1.25vw] lg:pb-[1.25vw] mt-auto">
                    <button
                        onClick={() => router.push('/student/counsellor')}
                        className="w-full py-3 lg:py-[0.625vw] rounded-xl bg-brand-green text-white font-semibold text-sm lg:text-[0.833vw] hover:bg-brand-green/90 transition-all duration-300 shadow-[0_4px_14px_0_rgba(30,211,106,0.3)] hover:shadow-[0_6px_20px_0_rgba(30,211,106,0.4)] group-hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4 lg:w-[0.83vw] lg:h-[0.83vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Start Counselling Session
                    </button>

                    <div className="mt-3 flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></div>
                        <span className="text-[10px] lg:text-[0.625vw] text-brand-green font-medium">
                            {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ── LOCKED: No Access — Show Purchase CTA ──
    return (
        <div className="dashboard-glass-card h-full flex flex-col relative overflow-hidden group">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="px-6 pt-6 pb-3 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.625vw] relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 lg:w-[1.66vw] lg:h-[1.66vw] rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-[0.83vw] lg:h-[0.83vw] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw] leading-tight">
                        AI Career Counsellor
                    </h3>
                </div>
                <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw] leading-relaxed mb-3 lg:mb-[0.625vw]">
                    Get personalized career guidance powered by AI, based on your unique assessment profile.
                </p>

                {/* Feature highlights */}
                <div className="space-y-2 lg:space-y-[0.41vw]">
                    {[
                        'Personalized career path recommendations',
                        'Step-by-step skill roadmaps',
                        'Role readiness analysis',
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <svg className="w-3 h-3 lg:w-[0.625vw] lg:h-[0.625vw] text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[11px] lg:text-[0.729vw] text-[#19211C]/70 dark:text-brand-text-secondary">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-6 pb-6 lg:px-[1.25vw] lg:pb-[1.25vw] mt-auto relative z-10">
                <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full py-3 lg:py-[0.625vw] rounded-xl bg-gradient-to-r from-brand-green to-emerald-500 text-white font-semibold text-sm lg:text-[0.833vw] hover:from-brand-green/90 hover:to-emerald-500/90 transition-all duration-300 shadow-[0_4px_14px_0_rgba(30,211,106,0.25)] hover:shadow-[0_6px_20px_0_rgba(30,211,106,0.35)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {purchasing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 lg:w-[0.83vw] lg:h-[0.83vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Unlock AI Counsellor — ₹350
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] lg:text-[0.52vw] text-[#19211C]/40 dark:text-brand-text-secondary/60 mt-2">
                    90-day access • Personalized AI guidance
                </p>
            </div>
        </div>
    );
};

export default AiCounsellorCard;
