'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Send, User, Loader2, Copy, Check, Trash2,
    Download, Sparkles, ArrowLeft, Brain, Zap, Target, TrendingUp,
    Clock, ChevronRight, Star, Briefcase, GraduationCap,
    MessageSquare, Plus, MoreHorizontal, PenLine,
    Search, PanelLeftClose, PanelLeft, X
} from 'lucide-react';
import { getAuthHeaders, getStoredUser, snapshotUserToSession } from '../../lib/auth-helpers';

/* ───────────────────────────── Types ───────────────────────────── */
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

interface Conversation {
    id: number;
    title: string;
    updatedAt: string;
    lastMessage?: string;
    messageCount?: number;
}

interface ChatAssistantProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

/* ───────────────────────── API Helpers ─────────────────────────── */
async function apiGet(url: string) {
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
}
async function apiPost(url: string, body: any = {}) {
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) });
    return res.json();
}
async function apiPatch(url: string, body: any) {
    const res = await fetch(url, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(body) });
    return res.json();
}
async function apiDelete(url: string) {
    const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
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
                indexRef.current = Math.min(indexRef.current + 3, text.length);
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

/* ───────────────────────── Content Renderer ──────────────────── */
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
            const response = await fetch(`${baseUrl}${reportPath}`);
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

    const lines = content.split('\n');
    return (
        <div className="space-y-2 leading-relaxed text-[15px]">
            {lines.map((line, i) => {
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report'))) {
                    return (
                        <button
                            key={i}
                            onClick={() => handleDownload(downloadMatch[2])}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] mt-1"
                        >
                            <Download className="w-4 h-4" />
                            {downloadMatch[1]}
                        </button>
                    );
                }

                let processed: React.ReactNode = line;
                if (line.includes('**')) {
                    processed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') ? (
                            <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
                        ) : part
                    );
                }

                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return (
                        <div key={i} className="flex items-start gap-2.5 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[9px] flex-shrink-0" />
                            <span className="text-gray-700">{typeof processed === 'string' ? processed.replace(/^[-•]\s*/, '') : processed}</span>
                        </div>
                    );
                }

                const numMatch = line.match(/^(\d+)\.\s/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                {numMatch[1]}
                            </span>
                            <span className="text-gray-700">{line.replace(/^\d+\.\s/, '')}</span>
                        </div>
                    );
                }

                if (!line.trim()) return <div key={i} className="h-2" />;
                return <p key={i} className="text-gray-700">{processed}</p>;
            }).filter(Boolean)}
        </div>
    );
});
RenderContent.displayName = 'RenderContent';

/* ───────────────────────── Thinking Indicator ───────────────── */
const ThinkingIndicator = () => (
    <div className="flex items-center gap-3.5 animate-chatSlideIn">
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200">
            <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-md px-5 py-3.5">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }} />
                    ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">Thinking...</span>
            </div>
        </div>
    </div>
);

/* ───────────────────────── Date grouping ─────────────────────── */
function groupLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 1) return 'Today';
    if (diff < 2) return 'Yesterday';
    if (diff < 7) return 'Previous 7 Days';
    if (diff < 30) return 'Previous 30 Days';
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function ChatAssistant({
    userRole = 'ADMIN',
    apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
}: ChatAssistantProps) {
    const router = useRouter();
    const pathname = usePathname();

    /* ── State ── */
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingConvId, setEditingConvId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const base = apiUrl || '';

    const getBackPath = () => {
        if (pathname?.includes('/corporate/')) return '/corporate/dashboard';
        if (pathname?.includes('/student/')) return '/student/dashboard';
        return '/admin';
    };

    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch(`${base}/rag/chat/conversations`, { headers: getAuthHeaders() });
            if (!res.ok) {
                console.error('[ChatAssistant] loadConversations failed:', res.status, res.statusText);
                return;
            }
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (err) {
            console.error('[ChatAssistant] loadConversations error:', err);
        }
    }, [base]);

    /* ── Init: snapshot user + load conversation list ── */
    useEffect(() => {
        snapshotUserToSession();
        const user = getStoredUser();
        setUserName(user.name || user.email?.split('@')[0] || '');
        setUserId(user.id);
        setMounted(true);
        // Always attempt to load conversations on mount
        loadConversations();
    }, [userRole, loadConversations]);

    /* ── Re-load conversations when userId becomes available (deferred auth) ── */
    useEffect(() => {
        if (userId > 0) {
            loadConversations();
        }
    }, [userId, loadConversations]);

    /* ── Load messages when active conversation changes ── */
    useEffect(() => {
        if (!activeConvId || !mounted) return;
        (async () => {
            try {
                const data = await apiGet(`${base}/rag/chat/conversations/${activeConvId}/messages`);
                const msgs: Message[] = (data.messages || []).map((m: any) => ({
                    id: `db-${m.id}`,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                    isStreaming: false,
                }));
                setMessages(msgs);
            } catch {
                setMessages([]);
            }
        })();
    }, [activeConvId, base, mounted]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* Close dropdown when clicking outside */
    useEffect(() => {
        if (!menuOpenId) return;
        const handler = () => setMenuOpenId(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [menuOpenId]);

    /* ── Actions ── */
    const newChat = useCallback(() => {
        setActiveConvId(null);
        setMessages([]);
        setInput('');
        inputRef.current?.focus();
    }, []);

    const selectConversation = useCallback((id: number) => {
        setActiveConvId(id);
        setMenuOpenId(null);
        if (window.innerWidth < 768) setSidebarOpen(false);
    }, []);

    const deleteConversation = useCallback(async (id: number) => {
        try {
            await apiDelete(`${base}/rag/chat/conversations/${id}`);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
        } catch { /* ignore */ }
        setMenuOpenId(null);
    }, [base, activeConvId]);

    const startRename = useCallback((conv: Conversation) => {
        setEditingConvId(conv.id);
        setEditTitle(conv.title);
        setMenuOpenId(null);
    }, []);

    const commitRename = useCallback(async () => {
        if (!editingConvId || !editTitle.trim()) { setEditingConvId(null); return; }
        try {
            await apiPatch(`${base}/rag/chat/conversations/${editingConvId}`, { title: editTitle.trim() });
            setConversations(prev => prev.map(c => c.id === editingConvId ? { ...c, title: editTitle.trim() } : c));
        } catch { /* ignore */ }
        setEditingConvId(null);
    }, [editingConvId, editTitle, base]);

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
            const res = await fetch(`${base}/rag/query`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    question: userMsg.content,
                    conversationId: activeConvId || undefined,
                }),
            });

            const data = await res.json();

            // If this was a new chat, capture the conversationId returned
            if (!activeConvId && data.conversationId) {
                setActiveConvId(data.conversationId);
                loadConversations();
            } else if (activeConvId) {
                // Refresh sidebar to update title / last message
                loadConversations();
            }

            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: data.answer || 'Sorry, I could not process that request.',
                timestamp: new Date(),
                isStreaming: true,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: 'Unable to connect. Please check your connection.',
                timestamp: new Date(),
                isStreaming: false,
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, base, activeConvId, loadConversations]);

    const finishStreaming = useCallback((id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    /* ── Filtered conversations ── */
    const filteredConvs = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.title.toLowerCase().includes(q) ||
            (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
        );
    }, [conversations, searchQuery]);

    /* ── Grouped conversations ── */
    const grouped = useMemo(() => {
        const groups: { label: string; items: Conversation[] }[] = [];
        const map = new Map<string, Conversation[]>();
        for (const c of filteredConvs) {
            const label = groupLabel(c.updatedAt);
            if (!map.has(label)) { map.set(label, []); groups.push({ label, items: map.get(label)! }); }
            map.get(label)!.push(c);
        }
        return groups;
    }, [filteredConvs]);

    /* ── Role config ── */
    const roleConfig = useMemo(() => {
        switch (userRole) {
            case 'CORPORATE': return {
                label: 'Corporate', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Briefcase,
                suggestions: [
                    { icon: Target, text: 'Show my employees', desc: 'View your team members', gradient: 'from-blue-500 to-indigo-500' },
                    { icon: TrendingUp, text: 'Best performers in my company', desc: 'Top talent insights', gradient: 'from-violet-500 to-purple-500' },
                    { icon: Brain, text: 'Career recommendations for my team', desc: 'AI-powered guidance', gradient: 'from-orange-500 to-rose-500' },
                ],
            };
            case 'STUDENT': return {
                label: 'Student', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: GraduationCap,
                suggestions: [
                    { icon: User, text: 'Tell me about myself', desc: 'Your personal profile', gradient: 'from-cyan-500 to-blue-500' },
                    { icon: Brain, text: 'What careers suit me?', desc: 'Personalized matching', gradient: 'from-violet-500 to-purple-500' },
                    { icon: TrendingUp, text: 'Show my assessment results', desc: 'Performance insights', gradient: 'from-orange-500 to-rose-500' },
                ],
            };
            default: return {
                label: 'Admin', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Star,
                suggestions: [
                    { icon: Target, text: 'List all candidates', desc: 'Browse the talent pool', gradient: 'from-blue-500 to-indigo-500' },
                    { icon: TrendingUp, text: 'Show top performers', desc: 'Best scoring talent', gradient: 'from-violet-500 to-purple-500' },
                    { icon: Zap, text: 'Generate career report', desc: 'AI career analysis', gradient: 'from-orange-500 to-rose-500' },
                ],
            };
        }
    }, [userRole]);

    const RoleIcon = roleConfig.icon;

    /* ───────────────────────── RENDER ───────────────────────── */
    return (
        <div className="fixed inset-0 z-[9999] bg-gray-50 flex overflow-hidden">

            {/* ═══════════════ SIDEBAR ═══════════════ */}
            <aside className={`
                ${sidebarOpen ? 'w-72' : 'w-0'} 
                flex-shrink-0 bg-gray-900 text-white flex flex-col transition-all duration-300 overflow-hidden
                md:relative fixed inset-y-0 left-0 z-50
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
                    <button
                        onClick={newChat}
                        className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium transition-all hover:border-gray-600"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700 focus-within:border-gray-500 transition-colors">
                        <Search className="w-3.5 h-3.5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
                    {grouped.length === 0 && (
                        <div className="text-center text-gray-500 text-xs mt-10 px-4">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            {searchQuery ? 'No conversations match your search' : 'No conversations yet. Start a new chat!'}
                        </div>
                    )}
                    {grouped.map(group => (
                        <div key={group.label}>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">{group.label}</p>
                            {group.items.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`group relative flex items-center rounded-lg cursor-pointer transition-all
                                        ${activeConvId === conv.id
                                            ? 'bg-gray-700/80 text-white'
                                            : 'hover:bg-gray-800/60 text-gray-300'
                                        }`}
                                >
                                    {editingConvId === conv.id ? (
                                        <input
                                            autoFocus
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            onBlur={commitRename}
                                            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingConvId(null); }}
                                            className="flex-1 bg-gray-800 text-sm text-white px-3 py-2.5 rounded-lg border border-emerald-500 focus:outline-none"
                                        />
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => selectConversation(conv.id)}
                                                className="flex-1 text-left px-3 py-2.5 text-sm truncate"
                                            >
                                                <span className="truncate block">{conv.title}</span>
                                            </button>
                                            <div className={`flex items-center gap-0.5 pr-1 ${menuOpenId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv.id ? null : conv.id); }}
                                                    className="p-1.5 rounded-md hover:bg-gray-600 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                            </div>
                                            {menuOpenId === conv.id && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1 animate-chatFadeIn"
                                                    onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => startRename(conv)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                    >
                                                        <PenLine className="w-3.5 h-3.5" /> Rename
                                                    </button>
                                                    <button
                                                        onClick={() => deleteConversation(conv.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                            {(userName || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{userName || 'User'}</p>
                            <p className="text-[10px] text-gray-500">{roleConfig.label}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sidebar overlay on mobile */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ═══════════════ MAIN AREA ═══════════════ */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">

                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-50/60 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[100px]" />
                </div>

                {/* ═══════════════ HEADER ═══════════════ */}
                <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200 transition-all"
                                title="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                        <button
                            onClick={() => router.push(getBackPath())}
                            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-200/60">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm">
                                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-40" />
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 tracking-tight">MITHRA</h1>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    AI Career Intelligence
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={newChat}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-600 text-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">New Chat</span>
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${roleConfig.color} text-xs font-semibold`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleConfig.label}
                        </div>
                    </div>
                </header>

                {/* ═══════════════ MAIN CONTENT ═══════════════ */}
                <main className="relative z-10 flex-1 overflow-y-auto">
                    {messages.length === 0 && !activeConvId ? (
                        /* ─────── WELCOME SCREEN ─────── */
                        <div className="h-full flex flex-col items-center justify-center px-6 py-12 animate-chatFadeIn">
                            <div className="max-w-2xl w-full text-center">
                                <div className="relative mb-8 inline-block">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-200/50 animate-chatLogoFloat">
                                        <Brain className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                                    Hello{userName ? `, ${userName}` : ''}!
                                </h1>
                                <p className="text-gray-500 text-lg mb-2">
                                    I&apos;m <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 font-bold">MITHRA</span>, your intelligent career companion.
                                </p>
                                <p className="text-gray-400 text-sm mb-10">
                                    Ask me anything about talent analytics, career insights, and more.
                                </p>

                                {/* Quick Suggestions */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                                    {roleConfig.suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(s.text)}
                                            className="group relative p-5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all text-left overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                                                <s.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-sm text-gray-800 font-semibold mb-1">{s.text}</p>
                                            <p className="text-xs text-gray-400">{s.desc}</p>
                                            <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>

                                {/* Welcome Input */}
                                <div className="relative">
                                    <div className="flex items-end gap-3 p-2 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl focus-within:border-emerald-400 focus-within:shadow-lg focus-within:shadow-emerald-100/50 transition-all shadow-sm">
                                        <Sparkles className="w-5 h-5 text-emerald-400 ml-3 mb-3 flex-shrink-0" />
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask me anything..."
                                            rows={1}
                                            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none resize-none py-3 text-[15px] max-h-32"
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={loading || !input.trim()}
                                            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-200 text-white disabled:text-gray-400 rounded-xl transition-all shadow-md shadow-emerald-200/50 disabled:shadow-none hover:scale-105 active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-300 mt-6">
                                    Powered by <span className="font-semibold text-emerald-400">MITHRA</span> · OriginBI Intelligence Engine
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ─────── MESSAGES VIEW ─────── */
                        <div className="max-w-3xl mx-auto p-6 space-y-5">
                            {messages.map((m, idx) => (
                                <div
                                    key={m.id}
                                    className={`flex gap-3.5 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-chatSlideIn`}
                                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                                >
                                    {m.role === 'assistant' ? (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200/40">
                                            <Brain className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                    )}

                                    <div className={`group flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-2xl px-4 py-3 ${m.role === 'user'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/40 rounded-tr-md'
                                            : 'bg-white border border-gray-100 shadow-sm rounded-tl-md'
                                            }`}>
                                            {m.role === 'assistant' ? (
                                                <RenderContent content={m.content} streaming={m.isStreaming} onDone={() => finishStreaming(m.id)} apiUrl={apiUrl} />
                                            ) : (
                                                <p className="text-[15px] leading-relaxed">{m.content}</p>
                                            )}
                                        </div>

                                        {m.role === 'assistant' && !m.isStreaming && (
                                            <div className="flex items-center gap-3 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => copyText(m.content, m.id)}
                                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-500 transition-colors"
                                                >
                                                    {copied === m.id ? (
                                                        <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                                                    ) : (
                                                        <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                                                    )}
                                                </button>
                                                <span className="text-[11px] text-gray-300 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && <ThinkingIndicator />}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </main>

                {/* ═══════════════ BOTTOM INPUT ═══════════════ */}
                {(messages.length > 0 || activeConvId) && (
                    <footer className="relative z-10 p-4 bg-gradient-to-t from-white via-white/95 to-white/0 border-t border-gray-100">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-end gap-3 p-2 bg-white border border-gray-200 rounded-2xl focus-within:border-emerald-400 focus-within:shadow-lg focus-within:shadow-emerald-100/50 transition-all shadow-sm">
                                <Sparkles className="w-5 h-5 text-emerald-400 ml-3 mb-3 flex-shrink-0" />
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a follow-up..."
                                    rows={1}
                                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none resize-none py-3 text-[15px] max-h-32"
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-200 text-white disabled:text-gray-400 rounded-xl transition-all shadow-md shadow-emerald-200/50 disabled:shadow-none hover:scale-105 active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-gray-300 mt-2.5">
                                Powered by <span className="font-semibold text-emerald-400">MITHRA</span> · OriginBI Intelligence Engine
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
                    .animate-chatFadeIn  { animation: chatFadeIn  0.5s ease-out both; }
                    .animate-chatSlideIn { animation: chatSlideIn 0.35s ease-out both; }
                    .animate-chatLogoFloat { animation: chatLogoFloat 3s ease-in-out infinite; }
                    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
                    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                `}</style>
            </div>
        </div>
    );
}
