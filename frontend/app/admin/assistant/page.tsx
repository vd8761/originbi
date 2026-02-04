'use client';

import ChatAssistant from '../../../components/admin/ChatAssistant';

export default function AssistantPage() {
    return (
        <>
            {/* Hide parent layout header and Next.js dev indicators for this full-screen page */}
            <style jsx global>{`
                /* Hide the admin header when on assistant page */
                .fixed.top-0.left-0.right-0.z-50 {
                    display: none !important;
                }
                /* Remove padding from parent content area */
                .pt-\\[90px\\], .pt-\\[98px\\], .pt-\\[105px\\],
                .sm\\:pt-\\[98px\\], .lg\\:pt-\\[105px\\] {
                    padding-top: 0 !important;
                }
            `}</style>
            <ChatAssistant userRole="ADMIN" />
        </>
    );
}
