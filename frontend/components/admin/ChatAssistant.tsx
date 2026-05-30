'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Send, User, Loader2, Copy, Check, Trash2,
    Download, Sparkles, ArrowLeft, Brain, Zap, Target, TrendingUp,
    Clock, ChevronRight, Star, Briefcase, GraduationCap,
    MessageSquare, Plus, MoreHorizontal, PenLine,
    Search, PanelLeftClose, PanelLeft, X,
    Code, ExternalLink, CornerDownRight,
    Home, FileText, Video, Share2, Settings, Calendar, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, getStoredUser, snapshotUserToSession } from '../../lib/auth-helpers';
import { PromptInputBox } from '../ui/ai-prompt-box';

// Sleek Abstract Isometric Data Layer Logo (Professional Monogram / Enterprise Analytics)
const ProfessionalLogo = ({ className = "w-5 h-5 text-white" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            d="M12 2L20.66 7v10L12 22L3.34 17V7L12 2z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            d="M12 2v10M12 22v-10M3.34 7L12 12M20.66 17L12 12M3.34 17L12 12M20.66 7L12 12" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.85"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
);

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
                <span className="inline-block w-0.5 h-5 ml-1 bg-[#1ED36A] animate-pulse rounded-full" />
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
        <div className="relative group/code rounded-xl overflow-hidden my-2 border border-gray-200 dark:border-white/10 bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                >
                    {copied ? <><Check className="w-3 h-3 text-[#1ED36A]" /><span className="text-[#1ED36A]">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
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
            parts.push(<code key={key++} className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-[#1ED36A] rounded-md text-[13px] font-mono border border-[#E0E0E0] dark:border-white/10">{m.slice(1, -1)}</code>);
        } else if (m.startsWith('**')) {
            parts.push(<strong key={key++} className="font-semibold text-[#19211C] dark:text-white">{m.slice(2, -2)}</strong>);
        } else if (m.startsWith('[')) {
            const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                parts.push(<a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#1ED36A] hover:text-[#16b058] underline decoration-[#1ED36A]/30 underline-offset-2 inline-flex items-center gap-1 font-semibold">{linkMatch[1]}<ExternalLink className="w-3 h-3" /></a>);
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
            const headers = getAuthHeaders();

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

    const preprocessContent = (raw: string): string => {
        const lines = raw.split('\n');
        const result: string[] = [];
        let inBoxTable = false;
        const boxRows: string[] = [];

        const isBoxBorder = (l: string) => /^[┌┬┐└┴┘├┼┤─│╔╦╗╚╩╝╠╬╣═║\s]+$/.test(l.trim());
        const isBoxDataRow = (l: string) => /^[│║]/.test(l.trim()) && /[│║]$/.test(l.trim());

        const flushBoxTable = () => {
            if (boxRows.length === 0) return;
            const dataRows = boxRows.filter(r => isBoxDataRow(r));
            if (dataRows.length === 0) { boxRows.length = 0; return; }
            const mdRows = dataRows.map(r =>
                '| ' + r.replace(/^[│║]\s*/, '').replace(/\s*[│║]$/, '').split(/\s*[│║]\s*/).join(' | ') + ' |'
            );
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
            while (i < rawLines.length && !rawLines[i].startsWith('```')) {
                codeLines.push(rawLines[i]);
                i++;
            }
            blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
            i++;
            continue;
        }

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

        blocks.push({ type: 'lines', content: line });
        i++;
    }

    return (
        <div className="space-y-2 leading-relaxed text-[15px]">
            {blocks.map((block, bi) => {
                if (block.type === 'code') {
                    return <CodeBlock key={bi} code={block.content} language={block.lang} />;
                }

                if (block.type === 'table') {
                    const rows = block.content.split('\n').filter(r => !r.match(/^\|[\s\-:|]+\|$/) || r.replace(/[|\s\-:]/g, '').length > 0 && !r.match(/^[|\s\-:]+$/));
                    const parseRow = (r: string) => r.split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).map(c => c.trim());
                    const header = rows[0] ? parseRow(rows[0]) : [];
                    const body = rows.slice(1).map(parseRow).filter(row => row.some(cell => cell && cell.replace(/[-\s*]/g, '').length > 0));
                    const shouldRenderAsText = header.length >= 8 || header.join(' ').length > 90;
                    const normalizedHeaders = header.map(h => h.toLowerCase().replace(/\s+/g, ' ').trim());
                    const companyNameIndex = normalizedHeaders.findIndex(h => h.includes('company name') || h === 'company' || h.includes('organization name'));
                    const hiddenColumns = new Set(
                        normalizedHeaders
                            .map((h, idx) => ({ h, idx }))
                            .filter(x => x.h === 'id' || x.h === 's.no' || x.h === 's no' || x.h === 'serial no' || x.h === 'serial number')
                            .map(x => x.idx)
                    );
                    const isCompanyFocusedTable = companyNameIndex !== -1;

                    if (shouldRenderAsText) {
                        return (
                            <div key={bi} className="my-3 rounded-xl border border-gray-150 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                {body.map((row, ri) => (
                                    <div key={ri} className="rounded-lg border border-gray-150/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-3">
                                        {isCompanyFocusedTable && row[companyNameIndex] ? (
                                            <div className="mb-2.5 pb-2 border-b border-[#1ED36A]/20 dark:border-[#1ED36A]/30">
                                                <h4 className="text-lg font-extrabold tracking-tight text-[#1ED36A] dark:text-[#1ED36A] break-words">{formatInline(row[companyNameIndex])}</h4>
                                            </div>
                                        ) : null}
                                        <div className="space-y-1.5">
                                            {header.map((h, hi) => {
                                                if (hiddenColumns.has(hi)) return null;
                                                if (isCompanyFocusedTable && hi === companyNameIndex) return null;
                                                return (
                                                <p key={hi} className="text-sm text-[#19211C] dark:text-white/80 break-words">
                                                    <span className="font-semibold text-[#19211C]/80 dark:text-white/60">{formatInline(h)}:</span>{' '}
                                                    <span>{formatInline(row[hi] || '-')}</span>
                                                </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div key={bi} className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm bg-white/30 dark:bg-black/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 dark:bg-white/5">
                                        {header.map((h, hi) => (
                                            <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-[#19211C] dark:text-white/60 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">{formatInline(h)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 dark:divide-white/5">
                                    {body.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="px-4 py-2.5 text-[#19211C] dark:text-white/80 break-words">{formatInline(cell)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                const line = block.content;

                const downloadMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (downloadMatch && (line.includes('Download') || line.includes('report') || line.includes('download') || line.includes('Click here'))) {
                    return (
                        <button
                            key={bi}
                            onClick={() => handleDownload(downloadMatch[2])}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-[#1ED36A] hover:bg-[#16b058] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(30,211,106,0.3)] hover:shadow-[0_6px_20px_rgba(30,211,106,0.4)] active:scale-[0.98] mt-1"
                        >
                            <Download className="w-4 h-4" />
                            {downloadMatch[1]}
                        </button>
                    );
                }

                if (/^[━─═─-]{5,}$/.test(line.trim())) {
                    return <hr key={bi} className="border-gray-200 dark:border-white/10 my-2" />;
                }

                const h3Match = line.match(/^###\s+(.+)/);
                if (h3Match) {
                    return (
                        <h5 key={bi} className="text-sm font-semibold text-[#19211C] dark:text-white mt-3 mb-1 flex items-center gap-2">
                            <span className="w-0.5 h-3.5 bg-[#1ED36A]/30 rounded-full" />
                            {formatInline(h3Match[1].replace(/\*\*/g, ''))}
                        </h5>
                    );
                }
                const h2Match = line.match(/^##\s+(.+)/);
                if (h2Match) {
                    return (
                        <h4 key={bi} className="text-[15px] font-bold text-[#19211C] dark:text-white mt-3.5 mb-1 flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#1ED36A]/40 rounded-full" />
                            {formatInline(h2Match[1].replace(/\*\*/g, ''))}
                        </h4>
                    );
                }
                const h1Match = line.match(/^#\s+(.+)/);
                if (h1Match) {
                    return (
                        <h3 key={bi} className="text-base font-bold text-[#19211C] dark:text-white mt-4 mb-1.5 flex items-center gap-2">
                            <span className="w-1 h-5 bg-[#1ED36A] rounded-full" />
                            {formatInline(h1Match[1].replace(/\*\*/g, ''))}
                        </h3>
                    );
                }

                if (line.trim().startsWith('>')) {
                    return (
                        <div key={bi} className="flex items-start gap-0 my-1">
                            <div className="w-1 self-stretch bg-[#1ED36A]/40 rounded-full flex-shrink-0" />
                            <div className="pl-3 py-1 text-[#19211C]/60 dark:text-white/60 italic text-[14px]">{formatInline(line.replace(/^>\s*/, ''))}</div>
                        </div>
                    );
                }

                if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
                    const bulletText = line.replace(/^\s*[-•]\s*/, '');
                    return (
                        <div key={bi} className="flex items-start gap-2.5 pl-1 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1ED36A] mt-[9px] flex-shrink-0 animate-pulse" />
                            <span className="text-[#19211C] dark:text-white/80">{formatInline(bulletText)}</span>
                        </div>
                    );
                }

                const numMatch = line.match(/^(\d+)\.\s(.+)/);
                if (numMatch) {
                    return (
                        <div key={bi} className="flex items-start gap-3 py-0.5">
                            <span className="w-6 h-6 rounded-full bg-[#1ED36A]/10 text-[#1ED36A] text-xs font-bold flex items-center justify-center flex-shrink-0 border border-[#1ED36A]/20 mt-0.5">
                                {numMatch[1]}
                            </span>
                            <span className="text-[#19211C] dark:text-white/80 flex-1">{formatInline(numMatch[2])}</span>
                        </div>
                    );
                }

                if (!line.trim()) return <div key={bi} className="h-1.5" />;

                return <p key={bi} className="text-[#19211C] dark:text-white/80">{formatInline(line)}</p>;
            }).filter(Boolean)}
        </div>
    );
});
RenderContent.displayName = 'RenderContent';

/* ───────────────────────── Thinking Indicator ───────────────── */
const ThinkingIndicator = () => {
    const [stage, setStage] = useState(0);
    const stages = ['Analyzing request...', 'Querying intelligence model...', 'Synthesizing response...'];
    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 1500);
        const t2 = setTimeout(() => setStage(2), 4000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    return (
        <div className="flex items-start gap-4 animate-chatSlideIn">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1ED36A] via-[#10B981] to-[#0DF09E] flex items-center justify-center shadow-lg shadow-[#1ED36A]/25 relative">
                <div className="absolute inset-0 rounded-2xl bg-[#1ED36A]/25 blur-sm animate-pulse" />
                <ProfessionalLogo className="w-5 h-5 text-white animate-pulse relative z-10" />
            </div>
            <div className="bg-white/95 dark:bg-[#1A211D]/90 border border-emerald-500/10 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl rounded-2xl rounded-tl-sm px-6 py-4 max-w-sm">
                <div className="flex items-center gap-3.5">
                    <div className="flex gap-1.5 items-center justify-center">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2.5 h-2.5 bg-gradient-to-tr from-[#1ED36A] to-[#0DF09E] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }} />
                        ))}
                    </div>
                    <span className="text-xs text-[#19211C]/75 dark:text-emerald-400 font-extrabold uppercase tracking-wider">{stages[stage]}</span>
                </div>
                <div className="mt-3.5 w-full bg-gray-200/80 dark:bg-white/[0.06] rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1ED36A] via-[#10B981] to-[#0DF09E] rounded-full animate-progressBar" />
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
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setMessages(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.role === 'assistant' && last.isStreaming) {
                return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, isStreaming: false } : m);
            }
            return prev;
        });
    }, []);

    const base = apiUrl || '';

    const getBackPath = () => {
        if (pathname?.includes('/corporate/')) return '/corporate/dashboard';
        if (pathname?.includes('/student/')) return '/student/dashboard';
        return '/admin';
    };

    const loadConversations = useCallback(async () => {
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

    useEffect(() => {
        snapshotUserToSession();
        const user = getStoredUser();
        setUserName(user.name || user.email?.split('@')[0] || '');
        setUserId(user.id);
        setMounted(true);
        loadConversations();
    }, [userRole, loadConversations]);

    useEffect(() => {
        if (userId > 0) {
            loadConversations();
        }
    }, [userId, loadConversations]);

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

    useEffect(() => {
        if (!menuOpenId) return;
        const handler = () => setMenuOpenId(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [menuOpenId]);

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

    const handleSendDirect = useCallback(async (customMessage?: string) => {
        const messageToSend = (customMessage || input).trim();
        if (!messageToSend) return;

        if (loading) {
            handleStop();
        }

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: messageToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const botId = `a-${Date.now()}`;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await fetch(`${base}/rag/query`, {
                method: 'POST',
                headers: getAuthHeaders(),
                signal: controller.signal,
                body: JSON.stringify({
                    question: userMsg.content,
                    conversationId: activeConvId || undefined,
                }),
            });

            if (!res.ok) {
                let errorMsg = `Server error (${res.status})`;
                try {
                    const errData = await res.json();
                    errorMsg = errData.message || errData.error || errorMsg;
                } catch { /* non-JSON response */ }
                throw new Error(errorMsg);
            }

            const data = await res.json();

            if (!activeConvId && data.conversationId) {
                setActiveConvId(data.conversationId);
                loadConversations();
            } else if (activeConvId) {
                loadConversations();
            }

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
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Stopped by user
                return;
            }
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setMessages(prev => [...prev, {
                id: botId,
                role: 'assistant',
                content: `Unable to process the request. ${errorMessage}`,
                timestamp: new Date(),
                isStreaming: false,
            }]);
        } finally {
            if (abortControllerRef.current?.signal === controller.signal) {
                abortControllerRef.current = null;
            }
            setLoading(false);
        }
    }, [input, loading, base, activeConvId, loadConversations, handleStop]);

    const finishStreaming = useCallback((id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
    }, []);

    const filteredConvs = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.title.toLowerCase().includes(q) ||
            (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
        );
    }, [conversations, searchQuery]);

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

    const roleConfig = useMemo(() => {
        switch (userRole) {
            case 'CORPORATE': return {
                label: 'Corporate', color: 'bg-white/40 dark:bg-white/5 text-[#1ED36A] border-[#1ED36A]/20 dark:border-white/10 shadow-sm', icon: Briefcase,
                suggestions: [
                    { icon: Target, text: 'Show my employees', desc: 'View your team members' },
                    { icon: TrendingUp, text: 'List candidates completed the assessment', desc: 'Assessment completion list' },
                    { icon: ProfessionalLogo, text: 'Candidates suitable for UI/UX', desc: 'Role-based talent match' },
                ],
            };
            case 'STUDENT': return {
                label: 'Student', color: 'bg-white/40 dark:bg-white/5 text-[#1ED36A] border-[#1ED36A]/20 dark:border-white/10 shadow-sm', icon: GraduationCap,
                suggestions: [
                    { icon: User, text: 'Tell me about myself', desc: 'Your personal profile' },
                    { icon: ProfessionalLogo, text: 'What careers suit me?', desc: 'Personalized matching' },
                    { icon: TrendingUp, text: 'Show my assessment results', desc: 'Performance insights' },
                ],
            };
            default: return {
                label: 'Admin', color: 'bg-white/40 dark:bg-white/5 text-[#1ED36A] border-[#1ED36A]/20 dark:border-white/10 shadow-sm', icon: Star,
                suggestions: [
                    { icon: Target, text: 'List all candidates', desc: 'Browse the talent pool' },
                    { icon: TrendingUp, text: 'Top performer for Team Lead', desc: 'Role-wise talent insights' },
                    { icon: Zap, text: 'List corporate accounts', desc: 'Organization intelligence' },
                ],
            };
        }
    }, [userRole]);

    const RoleIcon = roleConfig.icon;

    return (
        <div className="fixed left-0 right-0 bottom-0 top-[61px] sm:top-[69px] z-[40] bg-transparent flex overflow-hidden font-sans">

            {/* ═══════════════ SIDEBAR ═══════════════ */}
            <aside className={`
                ${sidebarOpen ? 'w-80' : 'w-0'} 
                flex-shrink-0 bg-slate-50/95 dark:bg-[#0E1210]/95 text-[#19211C] dark:text-slate-100 flex flex-col transition-all duration-300 overflow-hidden
                md:relative fixed inset-y-0 left-0 z-50 border-r border-gray-250/60 dark:border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none backdrop-blur-2xl
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200/50 dark:border-white/[0.04] bg-white/30 dark:bg-black/5">
                    <div className="flex-1">
                        <button
                            onClick={newChat}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-tr from-[#1ED36A] via-[#10B981] to-[#0DF09E] text-white text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1ED36A]/20 hover:shadow-xl hover:shadow-[#1ED36A]/30 border border-white/10 outline-none"
                        >
                            <Plus className="w-4 h-4 text-white stroke-[3px]" />
                            New Chat
                        </button>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-3 p-2.5 rounded-xl hover:bg-gray-200/60 dark:hover:bg-white/[0.04] transition-colors border border-gray-200/40 dark:border-white/[0.04]"
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-4">
                    <div className="flex items-center gap-2.5 bg-white dark:bg-[#FFFFFF]/[0.025] rounded-2xl px-4 py-3 border border-gray-200/80 dark:border-white/[0.05] focus-within:border-[#1ED36A]/60 focus-within:ring-4 focus-within:ring-[#1ED36A]/5 transition-all shadow-inner">
                        <Search className="w-4 h-4 text-[#19211C]/35 dark:text-slate-400/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search chats..."
                            className="flex-1 bg-transparent text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/40 dark:placeholder-slate-500/50 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-[#19211C]/40 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200/80 dark:scrollbar-thumb-white/5">
                    <AnimatePresence>
                        {grouped.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-[#19211C]/40 dark:text-white/40 text-xs mt-12 px-4"
                            >
                                <MessageSquare className="w-9 h-9 mx-auto mb-3 opacity-30 text-[#1ED36A]" />
                                {searchQuery ? 'No chats found' : 'No conversations yet. Click New Chat!'}
                            </motion.div>
                        )}
                        {grouped.map(group => (
                            <div key={group.label} className="space-y-1.5">
                                <p className="text-[10px] font-extrabold text-[#19211C]/35 dark:text-slate-500/50 uppercase tracking-widest px-2 mb-2">{group.label}</p>
                                {group.items.map(conv => (
                                    <motion.div
                                        key={conv.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`group relative flex items-center rounded-2xl cursor-pointer transition-all mb-1.5 border
                                            ${activeConvId === conv.id
                                                ? 'bg-gradient-to-r from-[#1ED36A]/10 to-[#0DF09E]/5 dark:from-[#1ED36A]/15 dark:to-[#0DF09E]/8 text-[#1ED36A] dark:text-[#0DF09E] border-emerald-500/20 dark:border-emerald-400/20 shadow-sm font-extrabold'
                                                : 'bg-white/40 dark:bg-white/[0.015] hover:bg-gray-150/70 dark:hover:bg-white/[0.035] text-[#19211C]/80 dark:text-slate-300 border-gray-200/40 dark:border-white/[0.03]'
                                            }`}
                                    >
                                        {editingConvId === conv.id ? (
                                            <input
                                                autoFocus
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                onBlur={commitRename}
                                                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingConvId(null); }}
                                                className="flex-1 bg-white dark:bg-[#303438] text-sm text-[#19211C] dark:text-white px-3 py-2 rounded-lg border border-[#1ED36A] focus:outline-none"
                                            />
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => selectConversation(conv.id)}
                                                    className="flex-1 text-left px-4 py-3.5 text-sm truncate flex items-center gap-2.5"
                                                >
                                                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeConvId === conv.id ? 'text-[#1ED36A]' : 'text-gray-400 dark:text-slate-500'}`} />
                                                    <span className="truncate block">{conv.title}</span>
                                                </button>
                                                <div className={`flex items-center gap-0.5 pr-2 ${menuOpenId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv.id ? null : conv.id); }}
                                                        className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                </div>
                                                {menuOpenId === conv.id && (
                                                    <div className="absolute right-2 top-[80%] w-40 bg-white dark:bg-[#1E2220] border border-gray-150 dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 py-1.5 animate-chatFadeIn"
                                                        onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => startRename(conv)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#19211C]/70 dark:text-white/70 hover:bg-[#1ED36A]/10 hover:text-[#1ED36A] dark:hover:bg-[#1ED36A]/15 dark:hover:text-[#0DF09E] transition-colors"
                                                        >
                                                            <PenLine className="w-3.5 h-3.5" /> Rename
                                                        </button>
                                                        <button
                                                            onClick={() => deleteConversation(conv.id)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            </aside>

            {/* Sidebar overlay on mobile */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ═══════════════ MAIN AREA ═══════════════ */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FCFDFD] dark:bg-[#0A0D0B] relative">

                {/* Background glow effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] right-[5%] w-[450px] h-[450px] bg-gradient-to-tr from-[#1ED36A]/12 to-[#0DF09E]/8 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '12s' }} />
                    <div className="absolute bottom-[15%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#10B981]/8 to-[#0DF09E]/4 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '18s' }} />
                    <div className="absolute top-[40%] left-[20%] w-[350px] h-[350px] bg-[#1ED36A]/[0.03] rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '15s' }} />
                </div>

                {/* ═══════════════ HEADER ═══════════════ */}
                <header className="relative z-10 flex items-center justify-between px-8 py-5 bg-white/70 dark:bg-[#0A0D0B]/70 border-b border-gray-200/50 dark:border-white/[0.04] shadow-[0_2px_20px_rgba(0,0,0,0.01)] backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2.5 rounded-xl hover:bg-gray-150/70 dark:hover:bg-white/[0.04] border border-gray-200 dark:border-white/5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                title="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5 text-[#19211C] dark:text-slate-300" />
                            </button>
                        )}
                        <button
                            onClick={() => router.push(getBackPath())}
                            className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-150/70 dark:hover:bg-white/[0.04] border border-gray-200 dark:border-white/5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-[#19211C] dark:text-slate-300" />
                        </button>
                        <div className="flex items-center gap-3.5">
                            <div className="relative group/avatar cursor-pointer">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1ED36A] via-[#10B981] to-[#0DF09E] flex items-center justify-center shadow-lg shadow-[#1ED36A]/20 ring-2 ring-white/20 dark:ring-white/10 ring-offset-2 ring-offset-transparent">
                                    <ProfessionalLogo className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1ED36A] rounded-full border-2 border-white dark:border-[#0A0D0B] shadow-sm">
                                    <span className="absolute inset-0 bg-[#1ED36A] rounded-full opacity-0 group-hover/avatar:animate-ping group-hover/avatar:opacity-40" />
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-[#19211C] dark:text-white tracking-tight">Ask BI</h1>
                                <p className="text-[10px] text-[#19211C]/55 dark:text-emerald-400/80 flex items-center gap-1 font-extrabold uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-[#1ED36A] rounded-full animate-pulse" />
                                    AI Career Intelligence
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className={`flex items-center gap-2 px-4.5 py-2 rounded-full border ${roleConfig.color} text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm border-emerald-500/10`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleConfig.label}
                        </div>
                    </div>
                </header>

                {/* ═══════════════ MAIN CONTENT ═══════════════ */}
                <main className="relative z-10 flex-1 overflow-y-auto min-h-0">
                    <AnimatePresence mode="wait">
                        {messages.length === 0 && !activeConvId ? (
                            /* ─────── MINIMALIST WELCOME SCREEN ─────── */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.995 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center px-8 py-10 animate-chatFadeIn max-w-2xl w-full mx-auto text-center"
                            >
                                {/* Welcome pill headers */}
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E0F2FE] dark:bg-[#112435] border border-[#BAE6FD]/40 dark:border-blue-500/10 shadow-sm mb-6">
                                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-300">Welcome, {userName || 'ariyappan'}! 👋</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-black text-[#19211C] dark:text-white tracking-tight mb-10 leading-tight">
                                    How can I help you today?
                                </h1>

                                {/* Welcome Input Area */}
                                <div className="w-full">
                                    <PromptInputBox
                                        value={input}
                                        onChange={setInput}
                                        isLoading={loading}
                                        onSend={(msg) => handleSendDirect(msg)}
                                        onStop={handleStop}
                                        placeholder="Ask Ask BI anything..."
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            /* ─────── MESSAGES VIEW ─────── */
                            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 pb-8">
                                {messages.map((m, idx) => (
                                    <div key={m.id} className="animate-chatSlideIn" style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                                        <div className={`flex gap-5 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            {m.role === 'assistant' ? (
                                                <div className="flex-shrink-0 w-10.5 h-10.5 rounded-2xl bg-gradient-to-tr from-[#1ED36A] via-[#10B981] to-[#0DF09E] flex items-center justify-center shadow-lg shadow-[#1ED36A]/20 self-start">
                                                    <ProfessionalLogo className="w-5.5 h-5.5 text-white" />
                                                </div>
                                            ) : (
                                                <div className="flex-shrink-0 w-10.5 h-10.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center border border-gray-200 dark:border-white/[0.06] shadow-sm self-start">
                                                    <User className="w-5.5 h-5.5 text-[#19211C] dark:text-slate-300" />
                                                </div>
                                            )}

                                            <div className={`group flex flex-col max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`rounded-2xl px-6 py-4 shadow-sm relative ${m.role === 'user'
                                                    ? 'bg-[#1ED36A]/[0.08] dark:bg-[#1ED36A]/[0.06] border border-[#1ED36A]/20 dark:border-[#1ED36A]/15 text-[#19211C] dark:text-[#0DF09E] rounded-2xl font-semibold leading-relaxed'
                                                    : 'bg-white/95 dark:bg-[#121614]/85 backdrop-blur-xl border border-gray-250/60 dark:border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl rounded-tl-none pl-7'
                                                    }`}>
                                                    {m.role === 'assistant' && (
                                                        <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-gradient-to-b from-[#1ED36A] via-[#10B981] to-[#0DF09E] rounded-r-md opacity-85" />
                                                    )}
                                                    {m.role === 'assistant' ? (
                                                        <RenderContent content={m.content} streaming={m.isStreaming} onDone={() => finishStreaming(m.id)} apiUrl={apiUrl} />
                                                    ) : (
                                                        <p className="text-[15px] leading-relaxed break-words">{m.content}</p>
                                                    )}
                                                </div>

                                                {/* Assistant message actions */}
                                                {m.role === 'assistant' && !m.isStreaming && (
                                                    <div className="flex items-center gap-1.5 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={() => copyText(m.content, m.id)}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs text-[#19211C]/40 dark:text-white/40 hover:text-[#1ED36A] hover:bg-[#1ED36A]/10 dark:hover:bg-[#1ED36A]/15 transition-all font-bold"
                                                            title="Copy response"
                                                        >
                                                            {copied === m.id ? <><Check className="w-3 h-3 text-[#1ED36A]" /><span className="text-[#1ED36A] font-black">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                                                        </button>
                                                        <div className="w-px h-3 bg-gray-200 dark:bg-white/10 mx-0.5" />
                                                        <span className="text-[10px] text-[#19211C]/25 dark:text-white/25 flex items-center gap-1 ml-1 font-bold">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Follow-up Suggestions */}
                                        {m.role === 'assistant' && !m.isStreaming && m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                                            <div className="ml-[56px] mt-4.5 flex flex-wrap gap-2.5 animate-chatFadeIn">
                                                {m.suggestions.map((s, si) => (
                                                    <button
                                                        key={si}
                                                        onClick={() => { setInput(s); }}
                                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141A16]/40 hover:bg-[#1ED36A]/10 border border-gray-200 dark:border-white/10 hover:border-[#1ED36A]/30 text-xs text-[#19211C]/75 dark:text-slate-300 hover:text-[#1ED36A] dark:hover:text-[#0DF09E] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] font-bold"
                                                    >
                                                        <CornerDownRight className="w-3.5 h-3.5 text-[#1ED36A]" />
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
                    </AnimatePresence>
                </main>

                {/* ═══════════════ BOTTOM INPUT ═══════════════ */}
                {(messages.length > 0 || activeConvId) && (
                    <footer className="relative z-10 px-6 pb-6 pt-2 max-w-3xl mx-auto w-full">
                        <PromptInputBox
                            value={input}
                            onChange={setInput}
                            isLoading={loading}
                            onSend={(msg) => handleSendDirect(msg)}
                            onStop={handleStop}
                            placeholder="Ask a follow-up..."
                        />
                        <p className="text-center text-[10px] text-[#19211C]/35 dark:text-white/20 mt-3 font-bold tracking-wider uppercase">
                            Powered by <span className="font-extrabold text-[#1ED36A]">Ask BI</span> · OriginBI Intelligence Engine
                        </p>
                    </footer>
                )}

                {/* ═══════════════ ANIMATIONS ═══════════════ */}
                <style jsx global>{`
                    @keyframes chatFadeIn {
                        from { opacity: 0; transform: scale(0.99); }
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
                    .scrollbar-thin::-webkit-scrollbar { width: 5px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
                    .dark .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
                    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
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
