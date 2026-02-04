'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2, Copy, Check, Trash2, Sparkles, Download, ArrowLeft, Brain, Lightbulb, BarChart3, Users, FileText, Wand2, RotateCcw, MessageSquare } from 'lucide-react';

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

// Typewriter effect
const TypeWriter = memo(({ text, onDone }: { text: string; onDone?: () => void }) => {
    const [display, setDisplay] = useState('');
    const onDoneRef = useRef(onDone);
    const hasCompletedRef = useRef(false);
    const indexRef = useRef(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        const charsPerFrame = 2;
        const animate = () => {
            if (indexRef.current < text.length) {
                indexRef.current = Math.min(indexRef.current + charsPerFrame, text.length);
                setDisplay(text.slice(0, indexRef.current));
                frameRef.current = requestAnimationFrame(animate);
            } else if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onDoneRef.current?.();
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [text]);

    return (
        <span>
            {display}
            {display.length < text.length && (
                <span className="inline-block w-2 h-5 ml-1 align-middle bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full animate-pulse" />
            )}
        </span>
    );
});

// Content renderer
const RenderContent = ({ content, streaming, onDone, apiUrl }: { content: string; streaming?: boolean; onDone?: () => void; apiUrl?: string }) => {
    if (streaming) return <div className="leading-relaxed"><TypeWriter text={content} onDone={onDone} /></div>;

    const handleDownload = async (reportPath: string) => {
        try {
            const baseUrl = apiUrl || process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
            const url = `${baseUrl}${reportPath}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            const contentType = response.headers.get('content-type') || '';
            const ext = contentType.includes('pdf') ? '.pdf' : contentType.includes('text') ? '.txt' : '';
            const filename = reportPath.split('/').pop()?.split('?')[0] || 'report';
            a.download = `${filename}${ext}`;
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
        <div className="space-y-3 leading-relaxed text-[15px]">
            {lines.map((line, i) => {
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report'))) {
                    const [, linkText, linkUrl] = downloadMatch;
                    return (
                        <button
                            key={i}
                            onClick={() => handleDownload(linkUrl)}
                            className="group flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 w-full sm:w-auto"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-semibold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {linkText.replace(/\[|\]/g, '')}
                                </span>
                                <span className="text-xs text-gray-500">Click to download</span>
                            </div>
                        </button>
                    );
                }

                let processed: React.ReactNode = line;

                if (line.includes('**')) {
                    processed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') ? (
                            <strong key={j} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
                        ) : part
                    );
                }

                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return (
                        <div key={i} className="flex items-start gap-3 pl-2 group">
                            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                            <span className="text-gray-600 dark:text-gray-300">{typeof processed === 'string' ? processed.replace(/^[-•]\s*/, '') : processed}</span>
                        </div>
                    );
                }

                if (/^\d+\.\s/.test(line)) {
                    const numMatch = line.match(/^(\d+)\.\s/);
                    return (
                        <div key={i} className="flex items-start gap-3 pl-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5 border border-blue-500/30">
                                {numMatch ? numMatch[1] : ''}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">{line.replace(/^\d+\.\s/, '')}</span>
                        </div>
                    );
                }

                if (line.includes('📥') && downloadMatch) return null;
                if (!line.trim()) return <div key={i} className="h-3" />;
                return <p key={i} className="text-gray-600 dark:text-gray-300">{processed}</p>;
            }).filter(Boolean)}
        </div>
    );
};

export default function ChatAssistant({
    userRole = 'ADMIN',
    apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
}: ChatAssistantProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

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
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: data.answer || 'Sorry, I could not process that request.',
                timestamp: new Date(),
                isStreaming: true
            }]);
        } catch {
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

    const capabilities = [
        { icon: BarChart3, label: 'Analytics', desc: 'Deep performance insights', color: 'from-blue-500 to-indigo-600' },
        { icon: Users, label: 'Talent', desc: 'Candidate analysis', color: 'from-emerald-500 to-teal-600' },
        { icon: FileText, label: 'Reports', desc: 'Generate PDF reports', color: 'from-orange-500 to-red-600' },
        { icon: Lightbulb, label: 'Insights', desc: 'AI recommendations', color: 'from-purple-500 to-pink-600' },
    ];

    const quickPrompts = [
        { text: 'Analyze recent performance trends across all candidates', icon: '📊' },
        { text: 'Generate a comprehensive talent report', icon: '📋' },
        { text: 'Identify top performers in the last assessment', icon: '🏆' },
        { text: 'Recommend career paths based on personality traits', icon: '🎯' },
    ];

    return (
        <>
            <div className="fixed inset-0 w-screen h-screen z-[2147483647] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-[#0a0d14] dark:via-[#0d1117] dark:to-[#0f1419] flex flex-col overflow-hidden" style={{ zIndex: 2147483647 }}>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-purple-400/15 to-pink-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
                </div>

                {/* Header */}
                <header className="relative z-20 flex-shrink-0 border-b border-white/50 dark:border-white/5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 sm:h-20">
                            <div className="flex items-center gap-4">
                                {/* Enhanced Back Button */}
                                <button
                                    onClick={() => router.back()}
                                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/80 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border border-gray-200/80 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600/50 text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-500/10"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
                                    <span className="text-sm font-medium hidden sm:inline">Back</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-500" />
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                            <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-3 border-white dark:border-gray-900 rounded-full shadow-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent tracking-tight">
                                                MITHRA
                                            </h1>
                                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-500/30">
                                                PRO
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">AI-Powered Talent Intelligence</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Enhanced Clear Chat Button */}
                                <button
                                    onClick={clearChat}
                                    disabled={messages.length === 0}
                                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/40 dark:hover:to-orange-900/40 border border-red-200/80 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-red-500/10"
                                    title="Clear conversation"
                                >
                                    <RotateCcw className="w-4 h-4 group-hover:rotate-[-30deg] transition-transform duration-300" />
                                    <span className="text-sm font-medium hidden sm:inline">Clear</span>
                                </button>
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{userRole}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Chat Area */}
                <main className="relative z-10 flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto scroll-smooth">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {messages.length === 0 ? (
                                <div className="min-h-[calc(100vh-280px)] flex flex-col items-center justify-center">
                                    {/* Hero Section */}
                                    <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="relative inline-block mb-8">
                                            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-25 animate-pulse" />
                                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] shadow-2xl border border-white/50 dark:border-white/10 flex items-center justify-center group hover:scale-105 transition-transform duration-500">
                                                <Wand2 className="w-14 h-14 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
                                            </div>
                                        </div>

                                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                                            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                                                How can I assist you
                                            </span>
                                            <br />
                                            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                                today?
                                            </span>
                                        </h2>
                                        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                                            I'm your AI-powered talent intelligence assistant. Ask me anything about candidates, assessments, or generate comprehensive reports.
                                        </p>
                                    </div>

                                    {/* Capabilities Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '200ms' }}>
                                        {capabilities.map((cap, i) => (
                                            <div key={i} className="group p-4 sm:p-5 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-white/10 hover:border-transparent hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 text-center">
                                                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <cap.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cap.label}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{cap.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick Prompts */}
                                    <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '400ms' }}>
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 text-center">Try asking</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {quickPrompts.map((prompt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(prompt.text)}
                                                    className="group flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
                                                >
                                                    <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{prompt.icon}</span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-snug">
                                                        {prompt.text}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 pb-8">
                                    {messages.map(m => (
                                        <div
                                            key={m.id}
                                            className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-3 duration-500`}
                                        >
                                            <div className={`flex-shrink-0 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${m.role === 'assistant'
                                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                                    : 'bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800'
                                                    }`}>
                                                    {m.role === 'assistant' ? <Sparkles className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                                                </div>
                                            </div>

                                            <div className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`relative px-5 py-4 rounded-3xl shadow-lg ${m.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-br-lg'
                                                    : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-lg'
                                                    }`}>
                                                    {m.role === 'assistant' ? (
                                                        <RenderContent
                                                            content={m.content}
                                                            streaming={m.isStreaming}
                                                            onDone={() => finishStreaming(m.id)}
                                                            apiUrl={apiUrl}
                                                        />
                                                    ) : (
                                                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                                    )}
                                                </div>

                                                <div className={`flex items-center gap-2 mt-2 px-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {m.role === 'assistant' && !m.isStreaming && (
                                                        <button
                                                            onClick={() => copyText(m.content, m.id)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                            title="Copy"
                                                        >
                                                            {copied === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {loading && (
                                        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                            <div className="px-6 py-4 rounded-3xl rounded-bl-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700 shadow-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1.5">
                                                        {[0, 150, 300].map(delay => (
                                                            <div
                                                                key={delay}
                                                                className="w-2.5 h-2.5 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full animate-bounce"
                                                                style={{ animationDelay: `${delay}ms` }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Analyzing your request...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Enhanced Floating Input */}
                <footer className="relative z-20 flex-shrink-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white/98 to-transparent dark:from-gray-900 dark:via-gray-900/98">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative group">
                            {/* Animated gradient border */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-sm transition-all duration-500" />
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl opacity-0 group-focus-within:opacity-30 transition-all duration-500" />

                            <div className="relative bg-white dark:bg-gray-800/95 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
                                {/* Input Row */}
                                <div className="flex items-end gap-3 p-3">
                                    {/* Message Icon */}
                                    <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-400">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>

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
                                        placeholder="Ask MITHRA anything about your talent data..."
                                        rows={1}
                                        className="flex-1 bg-transparent py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none text-[15px] leading-relaxed max-h-32"
                                        disabled={loading}
                                    />

                                    {/* Enhanced Send Button */}
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="group/btn flex-shrink-0 flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 transition-all duration-200"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
                                                <span className="hidden sm:inline text-sm">Send</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-center mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                            MITHRA AI • OriginBI Talent Intelligence Platform
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
