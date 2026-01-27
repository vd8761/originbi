'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, Trash2, Sparkles, MessageSquare, Zap, Download } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

interface ChatAssistantProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

// Stable typewriter effect - FAST, works even when tab is in background
const TypeWriter = memo(({ text, speed = 2, onDone }: { text: string; speed?: number; onDone?: () => void }) => {
    const [display, setDisplay] = useState('');
    const onDoneRef = useRef(onDone);
    const textRef = useRef(text);
    const hasCompletedRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number>(0);

    // Update refs when props change
    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    // Only reset when text actually changes
    useEffect(() => {
        if (textRef.current !== text) {
            textRef.current = text;
            hasCompletedRef.current = false;
            startTimeRef.current = 0;
        }
    }, [text]);

    useEffect(() => {
        if (hasCompletedRef.current) return;

        // Use requestAnimationFrame with timestamps - works when tab is in background
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;

            const elapsed = timestamp - startTimeRef.current;
            const charsToShow = Math.min(Math.floor(elapsed / speed), text.length);

            if (charsToShow < text.length) {
                setDisplay(text.slice(0, charsToShow + 1));
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplay(text);
                hasCompletedRef.current = true;
                onDoneRef.current?.();
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [text, speed]);

    return (
        <>
            {display}
            {display.length < text.length && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-cyan-500 animate-pulse" />
            )}
        </>
    );
});

// Enhanced content renderer with markdown and download button support
const RenderContent = ({ content, streaming, onDone, apiUrl }: { content: string; streaming?: boolean; onDone?: () => void; apiUrl?: string }) => {
    if (streaming) return <TypeWriter text={content} onDone={onDone} />;

    const handleDownload = async (reportPath: string) => {
        try {
            const baseUrl = apiUrl || process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
            const url = `${baseUrl}${reportPath}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${reportPath.split('/').pop()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const lines = content.split('\n');
    return (
        <div className="space-y-2 leading-relaxed">
            {lines.map((line, i) => {
                // Check for download link pattern [text](url)
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report'))) {
                    const [, linkText, linkUrl] = downloadMatch;
                    return (
                        <button
                            key={i}
                            onClick={() => handleDownload(linkUrl)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/25 hover:shadow-lg"
                        >
                            <Download className="w-4 h-4" />
                            {linkText.replace(/\[|\]/g, '')}
                        </button>
                    );
                }

                let processed: React.ReactNode = line;

                // Bold text **text**
                if (line.includes('**')) {
                    processed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') ? (
                            <strong key={j} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
                        ) : part
                    );
                }

                // Bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return (
                        <div key={i} className="flex items-start gap-2.5 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-200">{typeof processed === 'string' ? processed.replace(/^[-•]\s*/, '') : processed}</span>
                        </div>
                    );
                }

                // Numbered lists
                const numMatch = line.match(/^(\d+)\.\s/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex items-start gap-2.5 pl-1">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                                {numMatch[1]}
                            </span>
                            <span className="text-gray-700 dark:text-gray-200">{line.replace(/^\d+\.\s/, '')}</span>
                        </div>
                    );
                }

                // Remove plain markdown links from display (they're handled above)
                if (line.includes('📥') && downloadMatch) {
                    return null;
                }

                if (!line.trim()) return <div key={i} className="h-1.5" />;
                return <p key={i} className="text-gray-700 dark:text-gray-200">{processed}</p>;
            }).filter(Boolean)}
        </div>
    );
};

export default function ChatAssistant({
    userRole = 'ADMIN',
    apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
}: ChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const botId = `a-${Date.now()}`;

        try {
            const res = await fetch(`${apiUrl}/rag/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg.content }),
            });

            const data = await res.json();
            // Add assistant message with content directly
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: data.answer || 'Sorry, I could not process that request.',
                timestamp: new Date(),
                isStreaming: true
            }]);
        } catch {
            // Add error message directly
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: 'Unable to connect. Please check your connection and try again.',
                timestamp: new Date(),
                isStreaming: false
            }]);
        } finally {
            setLoading(false);
        }
    };

    const finishStreaming = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
    };

    const clearChat = () => setMessages([]);

    const suggestions = [
        { icon: '👋', text: 'Say hello to ORI' },
        { icon: '🏆', text: 'Show top performers' },
        { icon: '📊', text: 'Generate career report' },
        { icon: '👥', text: 'List all candidates' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#0f1115] overflow-hidden">
            {/* Compact Header - Responsive */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-white dark:bg-[#0f1115] border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-cyan-400 rounded-full border-2 border-white dark:border-[#0f1115]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-gray-900 dark:text-white font-bold text-sm sm:text-base truncate">ORI</h1>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-gray-400 text-[9px] sm:text-[10px] font-medium">Intelligent Assistant</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all text-[10px] sm:text-xs font-medium"
                        >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}
                    <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full">
                        {userRole}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white dark:from-[#0f1115] dark:to-[#0f1115]">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
                        {/* Welcome Section */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center mb-6 sm:mb-8 shadow-2xl shadow-blue-500/40 relative">
                            <Bot className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                            <div className="absolute inset-0 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 animate-pulse opacity-50" />
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 tracking-tight text-center">
                            Hello, I'm <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">ORI</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6 sm:mb-10 text-sm sm:text-base px-4">
                            Your intelligent companion for talent insights. Ask me anything about your data!
                        </p>

                        {/* Suggestion Cards - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-xl w-full px-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(s.text)}
                                    className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 border border-gray-100 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600 text-left transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-cyan-500/10"
                                >
                                    <span className="text-xl sm:text-2xl">{s.icon}</span>
                                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white text-xs sm:text-sm font-medium">{s.text}</span>
                                </button>
                            ))}
                        </div>

                        {/* Feature Pills */}
                        <div className="flex items-center gap-2 mt-6 sm:mt-10">
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Fast Responses
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                                <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Natural Language
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {messages.map(m => (
                            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 ${m.role === 'user' ? 'mt-1' : ''}`}>
                                    {m.role === 'assistant' ? (
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`group flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${m.role === 'user'
                                        ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm'
                                        : 'bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 shadow-sm'
                                        }`}>
                                        {m.role === 'assistant' ? (
                                            <RenderContent
                                                content={m.content}
                                                streaming={m.isStreaming}
                                                onDone={() => finishStreaming(m.id)}
                                                apiUrl={apiUrl}
                                            />
                                        ) : (
                                            <p className="text-[15px] text-gray-900 dark:text-gray-100">{m.content}</p>
                                        )}
                                    </div>

                                    {/* Message Actions */}
                                    {m.role === 'assistant' && m.content && !m.isStreaming && (
                                        <div className="flex items-center gap-3 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => copyText(m.content, m.id)}
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {copied === m.id ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-emerald-500">Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                            <span className="text-xs text-gray-300">
                                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading State */}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-gray-400 dark:text-gray-300 text-sm ml-1">ORI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>
                )}
            </div>

            {/* Input Area - Responsive */}
            <div className="bg-white dark:bg-[#0f1115] px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 border-t border-gray-50 dark:border-gray-800">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-cyan-400 dark:focus-within:border-cyan-500 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:shadow-lg focus-within:shadow-cyan-500/10 transition-all duration-200">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask ORI anything..."
                            rows={1}
                            className="flex-1 bg-transparent px-2 sm:px-3 py-2 sm:py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none text-sm sm:text-[15px]"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 rounded-lg sm:rounded-xl text-white disabled:text-gray-400 transition-all duration-200 shadow-md shadow-blue-500/25 disabled:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3 hidden sm:block">
                        <span className="font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">ORI</span> • OriginBI Intelligent Assistant
                    </p>
                </div>
            </div>
        </div>
    );
}
