'use client';

import ChatAssistant from '../../../components/admin/ChatAssistant';

export default function AssistantPage() {
    return (
        <>
            <style jsx global>{`
                /* Remove parent content padding so chat fills edge-to-edge */
                .assistant-active-wrapper {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    max-width: none !important;
                }
            `}</style>
            <div className="assistant-active-wrapper">
                <ChatAssistant userRole="ADMIN" />
            </div>
        </>
    );
}
