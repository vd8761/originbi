'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Send, User, Loader2, Copy, Check, Trash2,
    Download, Sparkles, ArrowLeft, Brain, Zap, Target, TrendingUp,
    Clock, ChevronRight, Star, Briefcase, GraduationCap,
    MessageSquare, Plus, MoreHorizontal, PenLine,
    Search, PanelLeftClose, PanelLeft, X,
    RefreshCw, Code, ExternalLink,
    Lightbulb, CornerDownRight, Table, AlertCircle
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
    searchType?: string;
    confidence?: number;
    feedback?: 'up' | 'down' | null;
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
                <span className="inline-block w-0.5 h-5 ml-1 bg-brand-green animate-pulse rounded-full" />
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
        <div className="relative group/code rounded-xl overflow-hidden my-2 border border-gray-200 bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                >
                    {copied ? <><Check className="w-3 h-3 text-brand-green" /><span className="text-brand-green">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code className="text-gray-100 font-mono">{code}</code>
            </pre>
        </div>
    );
});
CodeBlock.displayName = 'CodeBlock';

/* ───────────────────── Inline Formatting Helper ─────────────── */
function formatInline(text: string): React.ReactNode[] {
    // Process: inline code `...`, bold **...**, italic _..._, links [text](url)
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(_[^_]+_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const m = match[0];
        if (m.startsWith('`')) {
            parts.push(<code key={key++} className="px-1.5 py-0.5 bg-white/60 dark:bg-white/10 text-brand-green rounded-md text-[13px] font-mono border border-[#E0E0E0] dark:border-white/10">{m.slice(1, -1)}</code>);
        } else if (m.startsWith('**')) {
            parts.push(<strong key={key++} className="font-semibold text-[#19211C] dark:text-white">{m.slice(2, -2)}</strong>);
        } else if (m.startsWith('[')) {
            const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                parts.push(<a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-[#16b058] underline decoration-brand-green/30 underline-offset-2 inline-flex items-center gap-1">{linkMatch[1]}<ExternalLink className="w-3 h-3" /></a>);
            }
        } else if (m.startsWith('_') && m.endsWith('_')) {
            parts.push(<em key={key++} className="text-[#19211C]/60 dark:text-white/60 italic">{m.slice(1, -1)}</em>);
        }
        lastIndex = match.index + m.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

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
            const headers: Record<string, string> = {};
            const token = sessionStorage.getItem('idToken') || sessionStorage.getItem('accessToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    if (u.id && u.id > 0) headers['X-User-Context'] = storedUser;
                } catch { /* skip */ }
            }

            const response = await fetch(`${baseUrl}${reportPath}`, { headers });
            if (!response.ok) {
                console.error(`PDF download failed: ${response.status} ${response.statusText}`);
                return;
            }
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

    // ── Pre-process: Convert ASCII box-drawing tables to Markdown tables ──
    // Handles tables using ┌─┬─┐ │ │ │ └─┴─┘ ├─┼─┤ characters
    const preprocessContent = (raw: string): string => {
        const lines = raw.split('\n');
        const result: string[] = [];
        let inBoxTable = false;
        const boxRows: string[] = [];

        const isBoxBorder = (l: string) => /^[┌┬┐└┴┘├┼┤─│╔╦╗╚╩╝╠╬╣═║\s]+$/.test(l.trim());
        const isBoxDataRow = (l: string) => /^[│║]/.test(l.trim()) && /[│║]$/.test(l.trim());

        const flushBoxTable = () => {
            if (boxRows.length === 0) return;
            // Parse data rows (│ col1 │ col2 │) into markdown
            const dataRows = boxRows.filter(r => isBoxDataRow(r));
            if (dataRows.length === 0) { boxRows.length = 0; return; }
            const mdRows = dataRows.map(r =>
                '| ' + r.replace(/^[│║]\s*/, '').replace(/\s*[│║]$/, '').split(/\s*[│║]\s*/).join(' | ') + ' |'
            );
            // Insert separator after first row (header)
            if (mdRows.length > 1) {
                const colCount = mdRows[0].split('|').filter(c => c.trim() !== '').length;
                const sep = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
                mdRows.splice(1, 0, sep);
            }
            result.push(...mdRows);
            boxRows.length = 0;
        };

        for (const line of lines) {
            if (isBoxBorder(line) || isBoxDataRow(line)) {
                inBoxTable = true;
                boxRows.push(line);
            } else {
                if (inBoxTable) {
                    flushBoxTable();
                    inBoxTable = false;
                }
                result.push(line);
            }
        }
        if (inBoxTable) flushBoxTable();
        return result.join('\n');
    };

    content = preprocessContent(content);

    // ── Parse into blocks: code blocks, tables, regular lines ──
    const blocks: { type: 'code' | 'table' | 'lines'; content: string; lang?: string }[] = [];
    const rawLines = content.split('\n');
    let i = 0;

    while (i < rawLines.length) {
        const line = rawLines[i];

        // Fenced code block ```lang ... ```
        const codeStart = line.match(/^```(\w*)/);
        if (codeStart) {
            const lang = codeStart[1] || '';
            const codeLines: string[] = [];
            i++;
            while (i < rawLines.length && !rawLines[i].startsWith('```')) {
                codeLines.push(rawLines[i]);
                i++;
            }
            blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
            i++; // skip closing ```
            continue;
        }

        // Markdown table (|...|)
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const tableLines: string[] = [line];
            i++;
            while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
                tableLines.push(rawLines[i]);
                i++;
            }
            blocks.push({ type: 'table', content: tableLines.join('\n') });
            continue;
        }

        // Regular line
        blocks.push({ type: 'lines', content: line });
        i++;
    }

    return (
        <div className="space-y-1.5 leading-relaxed text-[15px]">
            {blocks.map((block, bi) => {
                // ── Code blocks ──
                if (block.type === 'code') {
                    return <CodeBlock key={bi} code={block.content} language={block.lang} />;
                }

                // ── Tables ──
                if (block.type === 'table') {
                    const rows = block.content.split('\n').filter(r => !r.match(/^\|[\s\-:|]+\|$/) || r.replace(/[|\s\-:]/g, '').length > 0 && !r.match(/^[|\s\-:]+$/));
                    const parseRow = (r: string) => r.split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).map(c => c.trim());
                    const header = rows[0] ? parseRow(rows[0]) : [];
                    const body = rows.slice(1).map(parseRow).filter(row => row.some(cell => cell && cell.replace(/[-\s*]/g, '').length > 0));
                    return (
                        <div key={bi} className="overflow-x-auto my-3 rounded-xl border border-[#E0E0E0] dark:border-white/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-white/40 dark:bg-white/5">
                                        {header.map((h, hi) => (
                                            <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-[#19211C] dark:text-white/60 uppercase tracking-wider border-b border-[#E0E0E0] dark:border-white/10">{formatInline(h)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E0E0E0]/50 dark:divide-white/5">
                                    {body.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="px-4 py-2.5 text-[#19211C] dark:text-white/80">{formatInline(cell)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                // ── Regular content lines ──
                const line = block.content;

                // Download links
                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report') || line.includes('download') || line.includes('Click here'))) {
                    return (
                        <button
                            key={bi}
                            onClick={() => handleDownload(downloadMatch[2])}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-[#16b058] text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-brand-green/20 active:scale-[0.98] mt-1"
                        >
                            <Download className="w-4 h-4" />
                            {downloadMatch[1]}
                        </button>
                    );
                }

                // Horizontal separator
                if (/^[━─═─-]{5,}$/.test(line.trim())) {
                    return <hr key={bi} className="border-[#E0E0E0] dark:border-white/10 my-2" />;
                }

                // Headings
                const h3Match = line.match(/^###\s+(.+)/);
                if (h3Match) {
                    return (
                        <h5 key={bi} className="text-sm font-semibold text-[#19211C] dark:text-white mt-3 mb-1 flex items-center gap-2">
                            <span className="w-0.5 h-3.5 bg-brand-green/30 rounded-full" />
                            {formatInline(h3Match[1].replace(/\*\*/g, ''))}
                        </h5>
                    );
                }
                const h2Match = line.match(/^##\s+(.+)/);
                if (h2Match) {
                    return (
                        <h4 key={bi} className="text-[15px] font-bold text-[#19211C] dark:text-white mt-3.5 mb-1 flex items-center gap-2">
                            <span className="w-1 h-4 bg-brand-green/40 rounded-full" />
                            {formatInline(h2Match[1].replace(/\*\*/g, ''))}
                        </h4>
                    );
                }
                const h1Match = line.match(/^#\s+(.+)/);
                if (h1Match) {
                    return (
                        <h3 key={bi} className="text-base font-bold text-[#19211C] dark:text-white mt-4 mb-1.5 flex items-center gap-2">
                            <span className="w-1 h-5 bg-brand-green rounded-full" />
                            {formatInline(h1Match[1].replace(/\*\*/g, ''))}
                        </h3>
                    );
                }

                // Blockquote > ...
                if (line.trim().startsWith('>')) {
                    return (
                        <div key={bi} className="flex items-start gap-0 my-1">
                            <div className="w-1 self-stretch bg-brand-green/40 rounded-full flex-shrink-0" />
                            <div className="pl-3 py-1 text-[#19211C]/60 dark:text-white/60 italic text-[14px]">{formatInline(line.replace(/^>\s*/, ''))}</div>
                        </div>
                    );
                }

                // Bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
                    const bulletText = line.replace(/^\s*[-•]\s*/, '');
                    return (
                        <div key={bi} className="flex items-start gap-2.5 pl-1 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-[9px] flex-shrink-0" />
                            <span className="text-[#19211C] dark:text-white/80">{formatInline(bulletText)}</span>
                        </div>
                    );
                }

                // Numbered list
                const numMatch = line.match(/^(\d+)\.\s(.+)/);
                if (numMatch) {
                    return (
                        <div key={bi} className="flex items-start gap-3 py-0.5">
                            <span className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold flex items-center justify-center flex-shrink-0 border border-brand-green/20 mt-0.5">
                                {numMatch[1]}
                            </span>
                            <span className="text-[#19211C] dark:text-white/80 flex-1">{formatInline(numMatch[2])}</span>
                        </div>
                    );
                }

                // Empty line
                if (!line.trim()) return <div key={bi} className="h-1.5" />;

                // Default paragraph
                return <p key={bi} className="text-[#19211C] dark:text-white/80">{formatInline(line)}</p>;
            }).filter(Boolean)}
        </div>
    );
});
RenderContent.displayName = 'RenderContent';

/* ───────────────────────── Thinking Indicator ───────────────── */
const ThinkingIndicator = () => {
    const [stage, setStage] = useState(0);
    const stages = ['Analyzing your question...', 'Searching knowledge base...', 'Generating response...'];
    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 1500);
        const t2 = setTimeout(() => setStage(2), 4000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    return (
        <div className="flex items-start gap-3.5 animate-chatSlideIn">
            <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-brand-green flex items-center justify-center shadow-md shadow-brand-green/20">
                <Brain className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white/60 dark:bg-[#FFFFFF]/[0.08] border border-[#E0E0E0] dark:border-white/10 shadow-sm rounded-2xl rounded-tl-md px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }} />
                        ))}
                    </div>
                    <span className="text-xs text-[#19211C]/60 dark:text-white/60 transition-all duration-300">{stages[stage]}</span>
                </div>
                <div className="mt-2 w-full bg-[#E0E0E0] dark:bg-white/10 rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-brand-green rounded-full animate-progressBar" />
                </div>
            </div>
        </div>
    );
};

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
        // Don't attempt to load if user is anonymous (id=0) — backend will return nothing
        const currentUser = getStoredUser();
        if (!currentUser.id || currentUser.id <= 0) return;
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

    /* ── Periodically re-check auth if anonymous (e.g. slow Cognito token arrival) ── */
    useEffect(() => {
        if (userId > 0) return;
        const interval = setInterval(() => {
            const user = getStoredUser();
            if (user.id > 0) {
                setUserId(user.id);
                setUserName(user.name || user.email?.split('@')[0] || '');
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [userId]);

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

            // Disable typewriter animation for long reports — show instantly
            const longReportTypes = ['career_report', 'custom_report', 'overall_report', 'jd_candidate_match', 'career_guidance'];
            const answerText = data.answer || 'Sorry, I could not process that request.';
            const isLongContent = longReportTypes.includes(data.searchType) || answerText.length > 800;

            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: answerText,
                timestamp: new Date(),
                isStreaming: !isLongContent,
                suggestions: data.suggestions || [],
                searchType: data.searchType,
                confidence: data.confidence,
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
                label: 'Corporate', color: 'bg-white/40 dark:bg-white/5 text-brand-green border-brand-green/20 dark:border-white/10', icon: Briefcase,
                suggestions: [
                    { icon: Target, text: 'Show my employees', desc: 'View your team members' },
                    { icon: TrendingUp, text: 'Best performers in my company', desc: 'Top talent insights' },
                    { icon: Brain, text: 'Career recommendations for my team', desc: 'AI-powered guidance' },
                ],
            };
            case 'STUDENT': return {
                label: 'Student', color: 'bg-white/40 dark:bg-white/5 text-brand-green border-brand-green/20 dark:border-white/10', icon: GraduationCap,
                suggestions: [
                    { icon: User, text: 'Tell me about myself', desc: 'Your personal profile' },
                    { icon: Brain, text: 'What careers suit me?', desc: 'Personalized matching' },
                    { icon: TrendingUp, text: 'Show my assessment results', desc: 'Performance insights' },
                ],
            };
            default: return {
                label: 'Admin', color: 'bg-white/40 dark:bg-white/5 text-brand-green border-brand-green/20 dark:border-white/10', icon: Star,
                suggestions: [
                    { icon: Target, text: 'List all candidates', desc: 'Browse the talent pool' },
                    { icon: TrendingUp, text: 'Show top performers', desc: 'Best scoring talent' },
                    { icon: Zap, text: 'Generate career report', desc: 'AI career analysis' },
                ],
            };
        }
    }, [userRole]);

    const RoleIcon = roleConfig.icon;

    /* ───────────────────────── RENDER ───────────────────────── */
    return (
        <div className="fixed left-0 right-0 bottom-0 top-[61px] sm:top-[69px] z-[40] bg-transparent flex overflow-hidden">

            {/* ═══════════════ SIDEBAR ═══════════════ */}
            <aside className={`
                ${sidebarOpen ? 'w-72' : 'w-0'} 
                flex-shrink-0 bg-[#FAFAFA] dark:bg-[#24272B] text-[#19211C] dark:text-white flex flex-col transition-all duration-300 overflow-hidden
                md:relative fixed inset-y-0 left-0 z-50 border-r border-[#E0E0E0] dark:border-white/10
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-3 border-b border-[#E0E0E0] dark:border-white/10">
                    <div className="flex-1 flex items-center gap-2">
                        <button
                            onClick={newChat}
                            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#303438] hover:bg-gray-50 dark:hover:bg-[#3a3e42] border border-[#E0E0E0] dark:border-white/10 text-sm font-medium text-[#19211C] dark:text-white transition-all hover:border-gray-300 dark:hover:border-white/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Chat
                        </button>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#303438] transition-colors"
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#303438] rounded-lg px-3 py-2 border border-[#E0E0E0] dark:border-white/10 focus-within:border-brand-green/30 dark:focus-within:border-white/20 transition-colors">
                        <Search className="w-3.5 h-3.5 text-[#19211C]/40 dark:text-white/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="flex-1 bg-transparent text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/40 dark:text-white/40 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-[#19211C]/40 dark:text-white/40 hover:text-[#19211C]/70 dark:hover:text-white/70">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3 scrollbar-thin scrollbar-thumb-white/15">
                    {grouped.length === 0 && (
                        <div className="text-center text-[#19211C]/40 dark:text-white/40 text-xs mt-10 px-4">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            {searchQuery ? 'No conversations match your search' : 'No conversations yet. Start a new chat!'}
                        </div>
                    )}
                    {grouped.map(group => (
                        <div key={group.label}>
                            <p className="text-[10px] font-semibold text-[#19211C]/40 dark:text-white/40 uppercase tracking-wider px-2 mb-1">{group.label}</p>
                            {group.items.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`group relative flex items-center rounded-lg cursor-pointer transition-all
                                        ${activeConvId === conv.id
                                            ? 'bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-white border-l-2 border-brand-green shadow-sm'
                                            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-[#19211C]/70 dark:text-white/70'
                                        }`}
                                >
                                    {editingConvId === conv.id ? (
                                        <input
                                            autoFocus
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            onBlur={commitRename}
                                            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingConvId(null); }}
                                            className="flex-1 bg-white dark:bg-[#303438] text-sm text-[#19211C] dark:text-white px-3 py-2.5 rounded-lg border border-brand-green focus:outline-none"
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
                                                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                            </div>
                                            {menuOpenId === conv.id && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#303438] border border-[#E0E0E0] dark:border-white/10 rounded-xl shadow-xl z-50 py-1 animate-chatFadeIn"
                                                    onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => startRename(conv)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#19211C]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#19211C] dark:hover:text-white transition-colors"
                                                    >
                                                        <PenLine className="w-3.5 h-3.5" /> Rename
                                                    </button>
                                                    <button
                                                        onClick={() => deleteConversation(conv.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-red hover:bg-brand-red/10 hover:text-red-600 dark:hover:text-red-300 transition-colors"
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

                {/* Sidebar Footer Removed */}
            </aside>

            {/* Sidebar overlay on mobile */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ═══════════════ MAIN AREA ═══════════════ */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] relative">

                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-green/5 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-green/[0.03] rounded-full blur-[100px]" />
                </div>

                {/* ═══════════════ HEADER ═══════════════ */}
                <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#FAFAFA] dark:bg-[#24272B] border-b border-[#E0E0E0] dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-xl hover:bg-white/10 border border-[#E0E0E0] dark:border-white/10 transition-all"
                                title="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5 text-[#19211C] dark:text-white/60" />
                            </button>
                        )}
                        <button
                            onClick={() => router.push(getBackPath())}
                            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-[#E0E0E0] dark:border-white/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5 text-[#19211C] dark:text-white/60" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative group/avatar cursor-pointer">
                                <div className="w-10 h-10 rounded-2xl bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/30">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-green rounded-full border-2 border-white dark:border-[#24272B] shadow-sm">
                                    <span className="absolute inset-0 bg-brand-green rounded-full opacity-0 group-hover/avatar:animate-ping group-hover/avatar:opacity-40" />
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#19211C] dark:text-white tracking-tight">Ask BI</h1>
                                <p className="text-xs text-[#19211C]/60 dark:text-white/40 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                                    AI Career Intelligence
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* <button
                            onClick={newChat}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-brand-green/10 border border-[#E0E0E0] dark:border-white/10 hover:border-brand-green/30 text-[#19211C] dark:text-white/70 hover:text-brand-green text-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            {/* <span className="hidden sm:inline font-medium">New Chat</span> */}
                        {/* </button> */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${roleConfig.color} text-xs font-semibold backdrop-blur-sm shadow-sm`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleConfig.label}
                        </div>
                    </div>
                </header>

                {/* ═══════════════ MAIN CONTENT ═══════════════ */}
                <main className="relative z-10 flex-1 overflow-y-auto min-h-0">
                    {messages.length === 0 && !activeConvId ? (
                        /* ─────── WELCOME SCREEN ─────── */
                        <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 animate-chatFadeIn">
                            <div className="max-w-2xl w-full text-center">
                                <div className="relative mb-4 sm:mb-6 inline-block">
                                    <div className="absolute inset-0 bg-brand-green rounded-2xl sm:rounded-3xl blur-2xl opacity-20 animate-pulse" />
                                    <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl bg-brand-green flex items-center justify-center shadow-xl shadow-brand-green/30 animate-chatLogoFloat">
                                        <Brain className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                                    </div>
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-bold text-[#19211C] dark:text-white mb-2">
                                    Hello{userName ? `, ${userName}` : ''}!
                                </h1>
                                <p className="text-[#19211C]/60 dark:text-white/60 text-lg mb-2">
                                    I&apos;m <span className="text-brand-green font-bold">Ask BI</span>, your intelligent career companion.
                                </p>
                                <p className="text-[#19211C]/40 dark:text-white/40 text-sm mb-6 sm:mb-8">
                                    Ask me anything about talent analytics, career insights, and more.
                                </p>

                                {/* Quick Suggestions */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-8">
                                    {roleConfig.suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(s.text)}
                                            className="group relative p-5 rounded-2xl bg-white/60 dark:bg-[#FFFFFF]/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.12] border border-[#E0E0E0] dark:border-white/10 transition-all text-left overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <div className={`absolute inset-0 bg-brand-green opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
                                            <div className={`w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                                                <s.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-sm text-[#19211C] dark:text-white font-semibold mb-1">{s.text}</p>
                                            <p className="text-xs text-[#19211C]/40 dark:text-white/40">{s.desc}</p>
                                            <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-[#19211C]/20 dark:text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>

                                {/* Welcome Input */}
                                <div className="relative">
                                    <div className="flex items-center gap-3 p-1.5 bg-white/60 dark:bg-[#FFFFFF]/[0.08] backdrop-blur-xl border border-[#E0E0E0] dark:border-white/10 rounded-2xl focus-within:border-brand-green focus-within:shadow-lg focus-within:shadow-brand-green/10 transition-all shadow-sm">
                                        <Sparkles className="w-5 h-5 text-brand-green ml-3 flex-shrink-0" />
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask me anything..."
                                            rows={1}
                                            className="flex-1 bg-transparent text-[#19211C] dark:text-white placeholder-[#19211C]/40 dark:placeholder-white/40 focus:outline-none resize-none py-1.5 text-[15px] max-h-32"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={loading || !input.trim()}
                                            className="p-3 bg-brand-green hover:bg-[#16b058] disabled:bg-gray-200 dark:disabled:bg-white/10 text-white disabled:text-gray-400 dark:disabled:text-white/30 rounded-xl transition-all shadow-md shadow-brand-green/20 disabled:shadow-none hover:scale-105 active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-[#19211C]/20 dark:text-white/20 mt-6">
                                    Powered by <span className="font-semibold text-brand-green">Ask BI</span> · OriginBI Intelligence Engine
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ─────── MESSAGES VIEW ─────── */
                        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-4">
                            {messages.map((m, idx) => (
                                <div key={m.id} className="animate-chatSlideIn" style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                                    <div className={`flex gap-3.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {m.role === 'assistant' ? (
                                            <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-brand-green flex items-center justify-center shadow-md shadow-brand-green/20">
                                                <Brain className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-white/40 dark:bg-white/10 flex items-center justify-center border border-[#E0E0E0] dark:border-white/10">
                                                <User className="w-4 h-4 text-[#19211C] dark:text-white/60" />
                                            </div>
                                        )}

                                        <div className={`group flex flex-col max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`rounded-2xl px-4 py-3 ${m.role === 'user'
                                                ? 'bg-brand-green text-white shadow-md shadow-brand-green/20 rounded-tr-md'
                                                : 'bg-white/60 dark:bg-[#FFFFFF]/[0.08] border border-[#E0E0E0] dark:border-white/10 shadow-sm rounded-tl-md'
                                                }`}>
                                                {m.role === 'assistant' ? (
                                                    <RenderContent content={m.content} streaming={m.isStreaming} onDone={() => finishStreaming(m.id)} apiUrl={apiUrl} />
                                                ) : (
                                                    <p className="text-[15px] leading-relaxed">{m.content}</p>
                                                )}
                                            </div>

                                            {/* ── Assistant message actions ── */}
                                            {m.role === 'assistant' && !m.isStreaming && (
                                                <div className="flex items-center gap-1 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => copyText(m.content, m.id)}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#19211C]/40 dark:text-white/40 hover:text-brand-green hover:bg-brand-green/10 transition-all"
                                                        title="Copy response"
                                                    >
                                                        {copied === m.id ? <><Check className="w-3 h-3 text-brand-green" /><span className="text-brand-green">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                                                    </button>
                                                    <div className="w-px h-3 bg-[#E0E0E0] dark:bg-white/10 mx-0.5" />
                                                    <span className="text-[10px] text-[#19211C]/20 dark:text-white/20 flex items-center gap-1 ml-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Follow-up Suggestions (after last assistant message) ── */}
                                    {m.role === 'assistant' && !m.isStreaming && m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                                        <div className="ml-[52px] mt-3 flex flex-wrap gap-2 animate-chatFadeIn">
                                            {m.suggestions.map((s, si) => (
                                                <button
                                                    key={si}
                                                    onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-brand-green/10 border border-[#E0E0E0] dark:border-white/10 hover:border-brand-green/30 text-xs text-[#19211C] dark:text-white/70 hover:text-brand-green transition-all hover:shadow-sm"
                                                >
                                                    <CornerDownRight className="w-3 h-3" />
                                                    {s}
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
                {(messages.length > 0 || activeConvId) && (
                    <footer className="relative z-10 px-4 pb-2 pt-1">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 p-1.5 bg-white/95 dark:bg-[#FFFFFF]/[0.1] backdrop-blur-xl border border-[#E0E0E0] dark:border-white/10 rounded-2xl focus-within:border-brand-green focus-within:shadow-xl focus-within:shadow-brand-green/20 transition-all shadow-md">
                                <Sparkles className="w-5 h-5 text-brand-green ml-3 flex-shrink-0" />
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a follow-up..."
                                    rows={1}
                                    className="flex-1 bg-transparent text-[#19211C] dark:text-white placeholder-[#19211C]/40 dark:placeholder-white/40 focus:outline-none resize-none py-1.5 text-[15px] max-h-32"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    className="p-3 bg-brand-green hover:bg-[#16b058] disabled:bg-gray-200 dark:disabled:bg-white/10 text-white disabled:text-gray-400 dark:disabled:text-white/30 rounded-xl transition-all shadow-md shadow-brand-green/20 disabled:shadow-none hover:scale-105 active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-[#19211C]/20 dark:text-white/20 mt-2.5">
                                Powered by <span className="font-semibold text-brand-green">Ask BI</span> · OriginBI Intelligence Engine
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
                    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
                    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                    /* Mobile responsive fixes */
                    @media (max-width: 640px) {
                        .sm\\:top-\\[69px\\] { top: 61px; }
                    }
                    @supports (height: 100dvh) {
                        @media (max-width: 640px) {
                            .fixed.bottom-0 { height: calc(100dvh - 61px) !important; }
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
