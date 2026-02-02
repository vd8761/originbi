0'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { 
    Send, Bot, User, Loader2, Copy, Check, Trash2, 
    MessageSquare, Download, X, Minus, Maximize2, 
    Sparkles, ChevronDown
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

interface FloatingChatBotProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

// Optimized typewriter - uses CSS animation for cursor, RAF for text
const TypeWriter = memo(({ text, onDone }: { text: string; onDone?: () => void }) => {
    const [display, setDisplay] = useState('');
    const frameRef = useRef<number>(0);
    const indexRef = useRef(0);
    const completedRef = useRef(false);

    useEffect(() => {
        if (completedRef.current) return;
        
        indexRef.current = 0;
        const charsPerFrame = 3; // Fast typing speed
        
        const animate = () => {
            if (indexRef.current < text.length) {
                indexRef.current = Math.min(indexRef.current + charsPerFrame, text.length);
                setDisplay(text.slice(0, indexRef.current));
                frameRef.current = requestAnimationFrame(animate);
            } else {
                completedRef.current = true;
                onDone?.();
            }
        };
        
        frameRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [text, onDone]);

    return (
        <span>
            {display}
            {display.length < text.length && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-emerald-500 animate-[blink_0.8s_infinite]" />
            )}
        </span>
    );
});

TypeWriter.displayName = 'TypeWriter';

// Optimized content renderer
const RenderContent = memo(({ content, streaming, onDone, apiUrl }: { 
    content: string; 
    streaming?: boolean; 
    onDone?: () => void; 
    apiUrl?: string 
}) => {
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
            const contentType = response.headers.get('content-type') || '';
            const ext = contentType.includes('pdf') ? '.pdf' : '';
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
        <div className="space-y-1.5 leading-relaxed text-[13px]">
            {lines.map((line, i) => {
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report'))) {
                    const [, linkText, linkUrl] = downloadMatch;
                    return (
                        <button
                            key={i}
                            onClick={() => handleDownload(linkUrl)}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium text-xs transition-all shadow-sm hover:shadow-md mt-2"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {linkText.replace(/\[|\]/g, '')}
                        </button>
                    );
                }

                let processed: React.ReactNode = line;
                if (line.includes('**')) {
                    processed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') ? (
                            <strong key={j} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
                        ) : part
                    );
                }

                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return (
                        <div key={i} className="flex items-start gap-2 pl-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">{typeof processed === 'string' ? processed.replace(/^[-•]\s*/, '') : processed}</span>
                        </div>
                    );
                }

                const numMatch = line.match(/^(\d+)\.\s/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex items-start gap-2 pl-1">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {numMatch[1]}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">{line.replace(/^\d+\.\s/, '')}</span>
                        </div>
                    );
                }

                if (!line.trim()) return <div key={i} className="h-1" />;
                return <p key={i} className="text-gray-600 dark:text-gray-300">{processed}</p>;
            }).filter(Boolean)}
        </div>
    );
});

RenderContent.displayName = 'RenderContent';

export default function FloatingChatBot({
    userRole = 'ADMIN',
    apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
}: FloatingChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
            setHasUnread(false);
        }
    }, [messages, isOpen, isMinimized]);

    const copyText = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    const handleSend = useCallback(async () => {
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
            
            if (!isOpen || isMinimized) setHasUnread(true);
        } catch {
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: 'Unable to connect. Please check your connection.',
                timestamp: new Date(),
                isStreaming: false
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, apiUrl, isOpen, isMinimized]);

    const finishStreaming = useCallback((id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
    }, []);

    const clearChat = useCallback(() => setMessages([]), []);

    const suggestions = [
        { icon: '👋', text: 'Hello MITHRA' },
        { icon: '📊', text: 'Generate career report' },
        { icon: '🏆', text: 'Show top performers' },
    ];

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                className={`fixed right-6 bottom-6 z-50 group transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <div className="relative">
                    {/* Animated rings */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-ping opacity-20" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse opacity-30" />
                    
                    {/* Main button */}
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Unread indicator */}
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-bounce">
                            !
                        </span>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Chat with MITHRA
                        <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                    </div>
                </div>
            </button>

            {/* Chat Window */}
            <div className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ease-out ${
                isOpen 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}>
                <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ${
                    isMinimized ? 'w-72 h-14' : 'w-[380px] h-[560px]'
                }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">MITHRA</h3>
                                <p className="text-[10px] text-white/80">AI Assistant • Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && !isMinimized && (
                                <button
                                    onClick={clearChat}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title={isMinimized ? 'Expand' : 'Minimize'}
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Body - Hidden when minimized */}
                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                                            <Bot className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            Hi, I'm <span className="text-emerald-600">MITHRA</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                                            Your intelligent assistant for talent insights
                                        </p>
                                        
                                        <div className="w-full space-y-2">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(s.text)}
                                                    className="w-full flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition-all text-sm"
                                                >
                                                    <span className="text-lg">{s.icon}</span>
                                                    <span className="text-gray-600 dark:text-gray-300 font-medium">{s.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-4">
                                        {messages.map(m => (
                                            <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    {m.role === 'assistant' ? (
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message */}
                                                <div className={`group flex flex-col max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                    <div className={`rounded-2xl px-3 py-2.5 ${
                                                        m.role === 'user'
                                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'
                                                    }`}>
                                                        {m.role === 'assistant' ? (
                                                            <RenderContent
                                                                content={m.content}
                                                                streaming={m.isStreaming}
                                                                onDone={() => finishStreaming(m.id)}
                                                                apiUrl={apiUrl}
                                                            />
                                                        ) : (
                                                            <p className="text-[13px]">{m.content}</p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    {m.role === 'assistant' && !m.isStreaming && (
                                                        <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => copyText(m.content, m.id)}
                                                                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                                                            >
                                                                {copied === m.id ? (
                                                                    <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                                                                ) : (
                                                                    <><Copy className="w-3 h-3" /><span>Copy</span></>
                                                                )}
                                                            </button>
                                                            <span className="text-[10px] text-gray-300">
                                                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Typing indicator */}
                                        {loading && (
                                            <div className="flex gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={scrollRef} />
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <div className="flex items-end gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
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
                                        placeholder="Type your message..."
                                        rows={1}
                                        className="flex-1 bg-transparent px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none text-sm"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 rounded-lg text-white disabled:text-gray-400 transition-all shadow-sm disabled:shadow-none"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-center text-[9px] text-gray-400 mt-2">
                                    Powered by <span className="font-semibold text-emerald-600">MITHRA</span> • OriginBI
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
