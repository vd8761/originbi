'use client';

import Link from 'next/link';
import ChatAssistant from '../../../components/admin/ChatAssistant';

const isCorporateAssistantEnabled =
    process.env.NEXT_PUBLIC_ENABLE_CORPORATE_RAG_CHAT === 'true';

export default function CorporateAssistantPage() {
    if (!isCorporateAssistantEnabled) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center px-6 py-10">
                <div className="max-w-xl w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#2A302C]">
                    <h1 className="text-2xl font-semibold text-[#19211C] dark:text-white">AI Assistant Is Temporarily Disabled</h1>
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
                        Corporate RAG chat is currently switched off in production while testing is in progress.
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
