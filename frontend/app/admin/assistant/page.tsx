'use client';

import ChatAssistant from '@/components/admin/ChatAssistant';

export default function AssistantPage() {
    return (
        <div className="h-full w-full bg-white flex flex-col overflow-hidden">
            {/* Full Screen Chat - No extra header needed */}
            <div className="flex-1 overflow-hidden">
                <ChatAssistant userRole="ADMIN" />
            </div>
        </div>
    );
}
