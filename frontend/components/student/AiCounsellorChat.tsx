'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Send, User, Loader2, Copy, Check,
    Download, Sparkles, ArrowLeft, Brain,
    Clock, ChevronRight,
    Code, ExternalLink,
    CornerDownRight, GraduationCap, Heart, Target, TrendingUp, Compass, BookOpen
} from 'lucide-react';
import { getAuthHeaders, getStoredUser, snapshotUserToSession } from '../../lib/auth-helpers';

/* ───────────────────────────── Types ───────────────────────────── */
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    suggestions?: string[];
}

/* ───────────────────────── Typewriter Effect ─────────────────── */
const TypeWriter = memo(({ text, onDone }: { text: string; onDone?: () => void }) => {
    const [display, setDisplay] = useState('');
    const frameRef = useRef<number>(0);
    const indexRef = useRef(0);
    const completedRef = useRef(false);

    useEffect(() => {
        if (completedRef.current) return;
        indexRef.current = 0;
        const animate = () => {
            if (indexRef.current < text.length) {
                indexRef.current = Math.min(indexRef.current + 10, text.length);
                setDisplay(text.slice(0, indexRef.current));
                frameRef.current = requestAnimationFrame(animate);
            } else {
                completedRef.current = true;
                onDone?.();
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [text, onDone]);

    return (
        <span>
            {display}
            {display.length < text.length && (
                <span className="inline-block w-0.5 h-5 ml-1 bg-emerald-500 animate-pulse rounded-full" />
            )}
        </span>
    );
});
TypeWriter.displayName = 'TypeWriter';

/* ───────────────────────── Code Block with Copy ─────────────── */
const CodeBlock = memo(({ code, language }: { code: string; language?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative group/code rounded-xl overflow-hidden my-2 border border-gray-200 dark:border-white/10 bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
                    {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed"><code className="text-gray-100 font-mono">{code}</code></pre>
        </div>
    );
});
CodeBlock.displayName = 'CodeBlock';

/* ───────────────────── Inline Formatting Helper ─────────────── */
function formatInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(_[^_]+_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const m = match[0];
        if (m.startsWith('`')) {
            parts.push(<code key={key++} className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 rounded-md text-[13px] font-mono border border-gray-200 dark:border-white/10">{m.slice(1, -1)}</code>);
        } else if (m.startsWith('**')) {
            parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-white">{m.slice(2, -2)}</strong>);
        } else if (m.startsWith('[')) {
            const lm = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (lm) parts.push(<a key={key++} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 underline decoration-emerald-300 underline-offset-2 inline-flex items-center gap-1">{lm[1]}<ExternalLink className="w-3 h-3" /></a>);
        } else if (m.startsWith('_') && m.endsWith('_')) {
            parts.push(<em key={key++} className="text-gray-500 dark:text-gray-400 italic">{m.slice(1, -1)}</em>);
        }
        lastIndex = match.index + m.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

/* ───────────────────────── Content Renderer ──────────────────── */
const RenderContent = memo(({ content, streaming, onDone }: {
    content: string;
    streaming?: boolean;
    onDone?: () => void;
}) => {
    if (streaming) return <TypeWriter text={content} onDone={onDone} />;

    const handleDownload = async (reportPath: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
            const headers: Record<string, string> = {};
            const token = sessionStorage.getItem('idToken') || sessionStorage.getItem('accessToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(`${baseUrl}${reportPath}`, { headers });
            if (!response.ok) return;
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = reportPath.split('/').pop()?.split('?')[0] || 'report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const blocks: { type: 'code' | 'table' | 'lines'; content: string; lang?: string }[] = [];
    const rawLines = content.split('\n');
    let i = 0;
    while (i < rawLines.length) {
        const line = rawLines[i];
        const codeStart = line.match(/^```(\w*)/);
        if (codeStart) {
            const lang = codeStart[1] || '';
            const codeLines: string[] = [];
            i++;
            while (i < rawLines.length && !rawLines[i].startsWith('```')) { codeLines.push(rawLines[i]); i++; }
            blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
            i++;
            continue;
        }
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const tableLines: string[] = [line];
            i++;
            while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) { tableLines.push(rawLines[i]); i++; }
            blocks.push({ type: 'table', content: tableLines.join('\n') });
            continue;
        }
        blocks.push({ type: 'lines', content: line });
        i++;
    }

    return (
        <div className="space-y-1.5 leading-relaxed text-[15px]">
            {blocks.map((block, bi) => {
                if (block.type === 'code') return <CodeBlock key={bi} code={block.content} language={block.lang} />;
                if (block.type === 'table') {
                    const rows = block.content.split('\n').filter(r => !r.match(/^\|[\s\-:]+\|$/));
                    const parseRow = (r: string) => r.split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).map(c => c.trim());
                    const header = rows[0] ? parseRow(rows[0]) : [];
                    const body = rows.slice(1).map(parseRow);
                    return (
                        <div key={bi} className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-white/10">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10">{header.map((h, hi) => (
                                    <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">{formatInline(h)}</th>
                                ))}</tr></thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">{body.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">{row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{formatInline(cell)}</td>
                                    ))}</tr>
                                ))}</tbody>
                            </table>
                        </div>
                    );
                }
                const line = block.content;
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report') || line.includes('download') || line.includes('Click here'))) {
                    return (
                        <button key={bi} onClick={() => handleDownload(downloadMatch[2])}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-1">
                            <Download className="w-4 h-4" />{downloadMatch[1]}
                        </button>
                    );
                }
                if (/^[━─═─-]{5,}$/.test(line.trim())) return <hr key={bi} className="border-gray-200 dark:border-white/10 my-2" />;
                const h3Match = line.match(/^###\s+(.+)/);
                if (h3Match) return (
                    <h5 key={bi} className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-3 mb-1 flex items-center gap-2">
                        <span className="w-0.5 h-3.5 bg-gradient-to-b from-emerald-200 to-teal-300 rounded-full" />{formatInline(h3Match[1].replace(/\*\*/g, ''))}
                    </h5>
                );
                const h2Match = line.match(/^##\s+(.+)/);
                if (h2Match) return (
                    <h4 key={bi} className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mt-3.5 mb-1 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-emerald-300 to-teal-400 rounded-full" />{formatInline(h2Match[1].replace(/\*\*/g, ''))}
                    </h4>
                );
                const h1Match = line.match(/^#\s+(.+)/);
                if (h1Match) return (
                    <h3 key={bi} className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-1.5 flex items-center gap-2">
                        <span className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />{formatInline(h1Match[1].replace(/\*\*/g, ''))}
                    </h3>
                );
                if (line.trim().startsWith('>')) return (
                    <div key={bi} className="flex items-start gap-0 my-1">
                        <div className="w-1 self-stretch bg-gradient-to-b from-emerald-300 to-teal-400 rounded-full flex-shrink-0" />
                        <div className="pl-3 py-1 text-gray-600 dark:text-gray-400 italic text-[14px]">{formatInline(line.replace(/^>\s*/, ''))}</div>
                    </div>
                );
                if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
                    const bulletText = line.replace(/^\s*[-•]\s*/, '');
                    return (
                        <div key={bi} className="flex items-start gap-2.5 pl-1 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[9px] flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{formatInline(bulletText)}</span>
                        </div>
                    );
                }
                const numMatch = line.match(/^(\d+)\.\s(.+)/);
                if (numMatch) return (
                    <div key={bi} className="flex items-start gap-3 py-0.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-700 mt-0.5">{numMatch[1]}</span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">{formatInline(numMatch[2])}</span>
                    </div>
                );
                if (!line.trim()) return <div key={bi} className="h-1.5" />;
                return <p key={bi} className="text-gray-700 dark:text-gray-300">{formatInline(line)}</p>;
            }).filter(Boolean)}
        </div>
    );
});
RenderContent.displayName = 'RenderContent';

/* ───────────────────────── Thinking Indicator ───────────────── */
const ThinkingIndicator = () => {
    const [stage, setStage] = useState(0);
    const stages = ['Understanding your question...', 'Analyzing your profile...', 'Preparing guidance...'];
    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 1500);
        const t2 = setTimeout(() => setStage(2), 4000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    return (
        <div className="flex items-start gap-3.5 animate-chatSlideIn">
            <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900/40">
                <Heart className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-md px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }} />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 transition-all duration-300">{stages[stage]}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 dark:bg-white/10 rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-progressBar" />
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   AI COUNSELLOR CHAT – Student-focused career counselling interface
   ═══════════════════════════════════════════════════════════════════ */
export default function AiCounsellorChat() {
    const router = useRouter();
    const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || '';

    /* ── State ── */
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [userName, setUserName] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    /* ── Init ── */
    useEffect(() => {
        snapshotUserToSession();
        const user = getStoredUser();
        setUserName(user.name || user.email?.split('@')[0] || '');
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ── Actions ── */
    const copyText = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setInput('');
        inputRef.current?.focus();
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

        // Ensure user context is available for auth
        snapshotUserToSession();

        const apiUrl = base || process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || '';

        try {
            if (!apiUrl) {
                throw new Error('Admin API URL is not configured');
            }

            const headers = getAuthHeaders();
            console.log('[AI Counsellor] Sending to:', `${apiUrl}/rag/query`);

            const res = await fetch(`${apiUrl}/rag/query`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    question: userMsg.content,
                    mode: 'counsellor',
                }),
            });

            if (!res.ok) {
                let errorMsg = `Server error (${res.status})`;
                try {
                    const errData = await res.json();
                    errorMsg = errData.message || errData.error || errorMsg;
                } catch { /* non-JSON response */ }
                console.error('[AI Counsellor] API error:', res.status, errorMsg);
                throw new Error(errorMsg);
            }

            const data = await res.json();

            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: data.answer || 'Sorry, I could not process that request.',
                timestamp: new Date(),
                isStreaming: true,
                suggestions: data.suggestions || [],
            }]);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('[AI Counsellor] Chat error:', errorMessage);
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: `Unable to connect to the AI Counsellor. ${errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch') ? 'Please check your connection and ensure the server is running.' : `Error: ${errorMessage}`}`,
                timestamp: new Date(),
                isStreaming: false,
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, base]);

    const finishStreaming = useCallback((id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    /* ── Suggestions ── */
    const suggestions = [
        { icon: Compass, text: 'What careers suit my personality?', desc: 'Based on your assessment results', gradient: 'from-emerald-500 to-teal-500' },
        { icon: Target, text: 'How can I improve my skills?', desc: 'Personalized skill development plan', gradient: 'from-blue-500 to-indigo-500' },
        { icon: TrendingUp, text: 'Show my assessment results', desc: 'View your performance insights', gradient: 'from-orange-500 to-rose-500' },
        { icon: BookOpen, text: 'Recommend courses for me', desc: 'Learning paths aligned to your goals', gradient: 'from-teal-500 to-cyan-500' },
    ];

    /* ───────────────────────── RENDER ───────────────────────── */
    return (
        <div className="fixed left-0 right-0 bottom-0 top-[53px] sm:top-[57px] z-[40] bg-gray-50 dark:bg-brand-dark-primary flex flex-col overflow-hidden">

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-50/60 dark:bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-50/50 dark:bg-teal-900/10 rounded-full blur-[100px]" />
            </div>

            {/* ═══════════════ HEADER ═══════════════ */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#FAFAFA] dark:bg-[#24272B] border-b border-gray-200/60 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/student/dashboard')}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative group/avatar cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200/60 dark:shadow-emerald-900/40">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-brand-dark-secondary shadow-sm">
                                <span className="absolute inset-0 bg-green-400 rounded-full opacity-0 group-hover/avatar:animate-ping group-hover/avatar:opacity-40" />
                            </span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">AI Counsellor</h1>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                Your Personal Career Guide
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">New Topic</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 text-xs font-semibold">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Counsellor
                    </div>
                </div>
            </header>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <main className="relative z-10 flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    /* ─────── WELCOME SCREEN ─────── */
                    <div className="h-full flex flex-col items-center justify-start overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 animate-chatFadeIn">
                        <div className="max-w-2xl w-full text-center flex flex-col items-center">
                            <div className="relative mb-4 sm:mb-6 inline-block">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-green-500 flex items-center justify-center shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/30 animate-chatLogoFloat">
                                    <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                </div>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                                Hello{userName ? `, ${userName}` : ''}!
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-1">
                                I&apos;m your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 font-bold">AI Career Counsellor</span>
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">
                                Ask me anything about career paths, skill development, and your future.
                            </p>

                            {/* Quick Suggestions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full mb-6 sm:mb-8">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(s.text)}
                                        className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all text-left overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                                            <s.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">{s.text}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{s.desc}</p>
                                        <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>

                            {/* Welcome Input */}
                            <div className="relative w-full">
                                <div className="flex items-end gap-3 p-2 bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:shadow-lg focus-within:shadow-emerald-100/50 dark:focus-within:shadow-emerald-900/20 transition-all shadow-sm">
                                    <Sparkles className="w-5 h-5 text-emerald-400 ml-3 mb-3 flex-shrink-0" />
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me about your career, skills, goals..."
                                        rows={1}
                                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none py-3 text-[15px] max-h-32"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white disabled:text-gray-400 rounded-xl transition-all shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 disabled:shadow-none hover:scale-105 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 dark:text-gray-600 mt-6">
                                Powered by <span className="font-semibold text-emerald-400">Ask BI</span> · OriginBI AI Counsellor
                            </p>
                        </div>
                    </div>
                ) : (
                    /* ─────── MESSAGES VIEW ─────── */
                    <div className="max-w-3xl mx-auto p-6 space-y-5">
                        {messages.map((m, idx) => (
                            <div key={m.id} className="animate-chatSlideIn" style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                                <div className={`flex gap-3.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {m.role === 'assistant' ? (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30">
                                            <Brain className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
                                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                    )}

                                    <div className={`group flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-2xl px-4 py-3 ${m.role === 'user'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30 rounded-tr-md'
                                            : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-tl-md'
                                            }`}>
                                            {m.role === 'assistant' ? (
                                                <RenderContent content={m.content} streaming={m.isStreaming} onDone={() => finishStreaming(m.id)} />
                                            ) : (
                                                <p className="text-[15px] leading-relaxed">{m.content}</p>
                                            )}
                                        </div>

                                        {m.role === 'assistant' && !m.isStreaming && (
                                            <div className="flex items-center gap-1 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => copyText(m.content, m.id)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                                    title="Copy response"
                                                >
                                                    {copied === m.id ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                                                </button>
                                                <div className="w-px h-3 bg-gray-200 dark:bg-white/10 mx-0.5" />
                                                <span className="text-[10px] text-gray-300 dark:text-gray-600 flex items-center gap-1 ml-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Follow-up Suggestions */}
                                {m.role === 'assistant' && !m.isStreaming && m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                                    <div className="ml-[52px] mt-3 flex flex-wrap gap-2 animate-chatFadeIn">
                                        {m.suggestions.map((s, si) => (
                                            <button
                                                key={si}
                                                onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:shadow-sm"
                                            >
                                                <CornerDownRight className="w-3 h-3" />{s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && <ThinkingIndicator />}
                        <div ref={scrollRef} />
                    </div>
                )}
            </main>

            {/* ═══════════════ BOTTOM INPUT ═══════════════ */}
            {messages.length > 0 && (
                <footer className="relative z-10 p-4 bg-gradient-to-t from-white dark:from-brand-dark-primary via-white/95 dark:via-brand-dark-primary/95 to-white/0 dark:to-transparent border-t border-gray-100 dark:border-white/5">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-3 p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:shadow-lg focus-within:shadow-emerald-100/50 dark:focus-within:shadow-emerald-900/20 transition-all shadow-sm">
                            <Sparkles className="w-5 h-5 text-emerald-400 ml-3 mb-3 flex-shrink-0" />
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a follow-up..."
                                rows={1}
                                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none py-3 text-[15px] max-h-32"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white disabled:text-gray-400 rounded-xl transition-all shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 disabled:shadow-none hover:scale-105 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-2.5">
                            Powered by <span className="font-semibold text-emerald-400">Ask BI</span> · OriginBI AI Counsellor
                        </p>
                    </div>
                </footer>
            )}

            {/* ═══════════════ ANIMATIONS ═══════════════ */}
            <style jsx global>{`
                @keyframes chatFadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes chatSlideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes chatLogoFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-6px); }
                }
                @keyframes progressBar {
                    0%   { width: 0%; }
                    50%  { width: 70%; }
                    100% { width: 95%; }
                }
                .animate-chatFadeIn  { animation: chatFadeIn  0.5s ease-out both; }
                .animate-chatSlideIn { animation: chatSlideIn 0.35s ease-out both; }
                .animate-chatLogoFloat { animation: chatLogoFloat 3s ease-in-out infinite; }
                .animate-progressBar { animation: progressBar 8s ease-out forwards; }
            `}</style>
        </div>
    );
}
