'use client';

import ChatAssistant from '../../../components/admin/ChatAssistant';

export default function StudentAssistantPage() {
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
                <ChatAssistant userRole="STUDENT" />
            </div>
        </>
    );
}
