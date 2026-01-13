'use client';

import ChatAssistant from '@/components/admin/ChatAssistant';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AssistantPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#150089] to-[#4a00e0] rounded-2xl">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
                            <p className="text-white/60 mt-1">
                                Find suitable candidates, analyze data, and get insights
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Component */}
                <ChatAssistant userRole="ADMIN" />

                {/* Help Text */}
            
            </div>
        </div>
    );
}
