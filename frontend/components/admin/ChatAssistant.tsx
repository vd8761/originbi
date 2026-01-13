'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Loader2, Bot, User, Sparkles } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    candidates?: Candidate[];
    timestamp: Date;
}

interface Candidate {
    name: string;
    score: number;
    suitability: string;
}

interface ChatAssistantProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

export default function ChatAssistant({
    userRole = 'ADMIN',
    apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4001'
}: ChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant. I can help you find suitable candidates for roles, analyze assessment data, and answer questions. What would you like to know?',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/rag/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: userMessage.content }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || 'I apologize, but I couldn\'t process your request.',
                candidates: data.candidates,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const downloadPdf = async (question: string) => {
        try {
            const response = await fetch(`${apiUrl}/rag/query/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF download error:', error);
        }
    };

    const getSuitabilityColor = (suitability: string) => {
        if (suitability.includes('Highly')) return 'text-green-400 bg-green-500/20';
        if (suitability.includes('Suitable')) return 'text-blue-400 bg-blue-500/20';
        if (suitability.includes('Moderate')) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-gray-400 bg-gray-500/20';
    };

    return (
        <div className="flex flex-col h-[600px] bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#150089]/50 to-[#4a00e0]/30 border-b border-white/10">
                <div className="p-2 bg-gradient-to-br from-[#150089] to-[#4a00e0] rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">AI Assistant</h3>
                    <p className="text-white/60 text-xs">
                        Ask about employees, roles, or assessments
                    </p>
                </div>
                <div className="ml-auto px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
                    {userRole}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#150089] to-[#4a00e0] flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-[#150089] to-[#4a00e0] text-white'
                                    : 'bg-white/5 text-white/90 border border-white/10'
                                }`}
                        >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                            </p>

                            {/* Candidates list */}
                            {message.candidates && message.candidates.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs text-white/60 uppercase tracking-wide">
                                        Matching Candidates
                                    </p>
                                    {message.candidates.map((candidate, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                        >
                                            <span className="text-sm font-medium">{candidate.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-green-400">
                                                    {candidate.score}%
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${getSuitabilityColor(candidate.suitability)}`}>
                                                    {candidate.suitability}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Download PDF button */}
                                    <button
                                        onClick={() => downloadPdf(messages[messages.indexOf(message) - 1]?.content || '')}
                                        className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/80 transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download as PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#150089] to-[#4a00e0] flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                            <div className="flex items-center gap-2 text-white/60">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about Team Lead candidates, scores..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#150089] focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-3 bg-gradient-to-r from-[#150089] to-[#4a00e0] rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mt-3 flex-wrap">
                    {[
                        'Who is suitable for Team Lead?',
                        'Find Software Engineers',
                        'Show high performers',
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => setInput(suggestion)}
                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
