'use client';

import ChatAssistant from '../../../components/admin/ChatAssistant';

export default function CorporateAssistantPage() {
    return (
        <>
            {/* Hide parent layout header for this full-screen page */}
            <style jsx global>{`
                /* Hide the header when on assistant page */
                .fixed.top-0.left-0.right-0.z-50,
                header.fixed {
                    display: none !important;
                }
                /* Remove padding from parent content area */
                .pt-\\[90px\\], .pt-\\[98px\\], .pt-\\[105px\\],
                .sm\\:pt-\\[98px\\], .lg\\:pt-\\[105px\\] {
                    padding-top: 0 !important;
                }
                /* Hide any sidebar */
                aside, .sidebar {
                    display: none !important;
                }
                main {
                    margin-left: 0 !important;
                    padding: 0 !important;
                }
            `}</style>
            <ChatAssistant userRole="CORPORATE" />
        </>
    );
}
