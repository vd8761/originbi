'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ChatAssistant from '../../../components/admin/ChatAssistant';
import { corporateDashboardService } from '../../../lib/services';

export default function CorporateAssistantPage() {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;

        const checkAccess = async () => {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');

            if (!email) {
                if (mounted) setHasAccess(false);
                return;
            }

            try {
                const profile = await corporateDashboardService.getProfile(email);
                if (mounted) setHasAccess(!!profile?.ask_bi_enabled);
            } catch (error) {
                console.error('Failed to check Ask BI access', error);
                if (mounted) setHasAccess(false);
            }
        };

        checkAccess();

        return () => {
            mounted = false;
        };
    }, []);

    if (hasAccess === null) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center px-6 py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center px-6 py-10">
                <div className="max-w-xl w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#2A302C]">
                    <h1 className="text-2xl font-semibold text-[#19211C] dark:text-white">AI Assistant Is Temporarily Disabled</h1>
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
                        Ask BI access is turned off for your corporate account.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/corporate/dashboard"
                            className="inline-flex items-center rounded-full bg-[#13C065] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#10A958]"
                        >
                            Back To Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                .assistant-active-wrapper {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    max-width: none !important;
                }
            `}</style>
            <div className="assistant-active-wrapper">
                <ChatAssistant userRole="CORPORATE" />
            </div>
        </>
    );
}
