'use client';

import ChatAssistant from '../../../components/admin/ChatAssistant';

export default function AssistantPage() {
    return (
        <div className="w-full h-[calc(100vh-105px)] bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
            {/* Full Screen Chat */}
            <ChatAssistant userRole="ADMIN" />
        </div>
    );
}
