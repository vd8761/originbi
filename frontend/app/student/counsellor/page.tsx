// app/student/counsellor/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';
import Header from '../../../components/student/Header';
import AiCounsellorChat from '../../../components/student/AiCounsellorChat';
import { studentService } from '../../../lib/services/student.service';
import { Brain, Lock, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

configureAmplify();

export default function StudentCounsellorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
                console.log('[Counsellor] Checking access for email:', email);
                if (!email) {
                    console.warn('[Counsellor] No email found in storage');
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }

                // Try student-service first
                let status: any = null;
                try {
                    status = await studentService.getSubscriptionStatus(email);
                    console.log('[Counsellor] Student-service response:', status);
                } catch (svcErr) {
                    console.warn('[Counsellor] Student-service failed, trying admin-service fallback:', svcErr);
                }

                // Fallback: check via admin-service if student-service failed or returned no access
                if (!status?.hasAiCounsellor) {
                    try {
                        const adminBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || '';
                        const fallbackRes = await fetch(`${adminBase}/admin/registrations/counsellor-access`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                        });
                        if (fallbackRes.ok) {
                            const fallbackData = await fallbackRes.json();
                            console.log('[Counsellor] Admin-service fallback response:', fallbackData);
                            if (fallbackData?.hasAccess) {
                                status = { hasAiCounsellor: true };
                            }
                        }
                    } catch (fbErr) {
                        console.warn('[Counsellor] Admin-service fallback also failed:', fbErr);
                    }
                }

                setHasAccess(status?.hasAiCounsellor === true);
            } catch (err) {
                console.error('[Counsellor] Error checking access:', err);
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        };
        checkAccess();
    }, []);

    const handleLogout = async () => {
        try { await signOut(); } catch { /* ignore */ }
        router.push('/student/login');
    };

    const handleNavigate = (view: 'dashboard' | 'assessment') => {
        if (view === 'dashboard') {
            router.push('/student/dashboard');
        } else if (view === 'assessment') {
            router.push('/student/assessment');
        }
    };

    return (
        <RequireStudent>
            <div className="w-full h-full bg-[url('/Background_Light_Theme.svg')] dark:bg-[url('/Background_Dark_Theme.svg')] bg-cover bg-top bg-no-repeat">
                {/* Content */}
                {loading ? (
                    /* Loading state */
                    <main className="w-full min-h-[60vh] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Checking access...</p>
                        </div>
                    </main>
                ) : hasAccess ? (
                    /* Has access — show the AI Counsellor chat */
                    <AiCounsellorChat />
                ) : (
                    /* No access — show paywall / redirect to dashboard */
                    <main className="w-full min-h-[60vh] flex items-center justify-center px-4">
                        <div className="max-w-md w-full text-center">
                            <div className="relative mb-6 inline-block">
                                <div className="absolute inset-0 bg-brand-green rounded-3xl blur-2xl opacity-20" />
                                <div className="relative w-20 h-20 rounded-3xl bg-brand-green flex items-center justify-center shadow-xl shadow-brand-green/30 dark:shadow-brand-green/20">
                                    <Lock className="w-10 h-10 text-white" />
                                </div>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                AI Counsellor is Locked
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                                Get personalized career guidance powered by AI
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
                                Request the Pro Version to unlock AI-powered career guidance.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/student/dashboard')}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-green hover:bg-[#16b058] text-[#19211C] dark:text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-green/20 dark:shadow-brand-green/10 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Request for Pro Version
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all border border-gray-200 dark:border-white/10"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Back
                                </button>
                            </div>

                            {/* Features preview */}
                            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                                {[
                                    { icon: Brain, label: 'Career Guidance', desc: 'AI-powered career matching' },
                                    { icon: Sparkles, label: 'Skill Analysis', desc: 'Personalized recommendations' },
                                    { icon: Lock, label: 'Private & Secure', desc: 'Your data stays yours' },
                                ].map((f, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                        <f.icon className="w-5 h-5 text-brand-green mb-2" />
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{f.label}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </RequireStudent>
    );
}
