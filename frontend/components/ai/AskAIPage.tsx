'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Session { id: number; title: string; createdAt: string; updatedAt: string; }
interface EmployeeCache { data: Employee[]; timestamp: number; }
interface Employee {
  registrationId: number; fullName: string; groupName: string | null;
  designation: string | null; gender: string | null; traitCode: string | null;
  discPattern: { D: string; I: string; S: string; C: string; };
}
interface Transcript { id: string; name: string; transcript: string; }

const THINKING_LABELS = [
  'Originating…',
  'Cooking…',
  'Analyzing your team…',
  'Connecting the dots…',
  'Drafting response…',
];

function getISTDateInfo(dateStr?: string | Date) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const istString = d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  istDate.setHours(0, 0, 0, 0);
  return istDate;
}

function groupSessions(sessions: Session[]) {
  const nowIST = getISTDateInfo();
  const g: Record<string, Session[]> = { Today: [], Yesterday: [], 'Previous 7 days': [], 'Previous 30 days': [], Older: [] };
  sessions.forEach(s => {
    const sIST = getISTDateInfo(s.updatedAt || s.createdAt);
    const diffDays = Math.round((nowIST.getTime() - sIST.getTime()) / 86400000);
    if (diffDays === 0) g.Today.push(s);
    else if (diffDays === 1) g.Yesterday.push(s);
    else if (diffDays <= 7) g['Previous 7 days'].push(s);
    else if (diffDays <= 30) g['Previous 30 days'].push(s);
    else g.Older.push(s);
  });
  return g;
}

const ALL_SUGGESTIONS = [
  { icon: '🎯', label: 'Match employees for a Senior Sales Manager role' },
  { icon: '⚡', label: 'Who drives results independently without supervision?' },
  { icon: '🔥', label: 'Form the best 5-person cross-functional project team' },
  { icon: '🧠', label: 'Who is your best team leader candidate?' },
  { icon: '🤝', label: 'Who collaborates best under pressure?' },
  { icon: '💬', label: 'How do I communicate with a detail-oriented employee?' },
  { icon: '🔎', label: 'Identify our top performers with high drive' },
  { icon: '📈', label: 'Who has leadership succession potential?' },
  { icon: '🌱', label: 'Who needs development to become ready for management?' },
  { icon: '⚖️', label: 'Who can balance compliance and speed effectively?' },
];

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older'];
const CACHE_TTL = 60 * 60 * 1000;

// Animated thinking indicator — cycles through status labels
function ThinkingIndicator() {
  const [labelIdx, setLabelIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIdx(p => (p + 1) % THINKING_LABELS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="text-[14px] text-[#8e8ea0] font-medium"
        key={labelIdx}
        style={{ animation: 'originFadeIn 0.4s ease-in-out' }}
      >
        {THINKING_LABELS[labelIdx]}
      </span>
    </div>
  );
}

// Copy button with feedback
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy response"
      className="flex items-center gap-1 text-[12px] text-[#8e8ea0] hover:text-[#374151] dark:hover:text-[#d1d5db] transition-colors px-2 py-1 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#2d2d2d]"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy
        </>
      )}
    </button>
  );
}

// Download button
function DownloadButton({ text }: { text: string }) {
  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `origin-copilot-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={handleDownload}
      title="Download response"
      className="flex items-center gap-1 text-[12px] text-[#8e8ea0] hover:text-[#374151] dark:hover:text-[#d1d5db] transition-colors px-2 py-1 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#2d2d2d]"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      Download
    </button>
  );
}

// Origin copilot icon (no brain emoji)
function CopilotIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 bg-[#19c37d]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
        <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" opacity="0.7" />
      </svg>
    </div>
  );
}

export default function AskAIPage() {
  const [email, setEmail] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask' | 'interviews'>('ask');
  const [jdText, setJdText] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([{ id: '1', name: '', transcript: '' }]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewResult, setInterviewResult] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [randomSuggestions, setRandomSuggestions] = useState<typeof ALL_SUGGESTIONS>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 4));

    let e = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '';
    if (!e) {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) e = JSON.parse(userStr)?.email || '';
      } catch { /* ignore */ }
    }
    const t = sessionStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    setEmail(e);
    setAuthToken(t);
    // Build initials from email or name
    if (e) {
      const name = e.split('@')[0];
      setUserInitials(name.slice(0, 2).toUpperCase());
    }

    // Load sidebar state from localStorage
    const savedSidebar = localStorage.getItem('originbi_ask_ai_sidebar');
    if (savedSidebar !== null) {
      setSidebarOpen(savedSidebar === 'true');
    }
  }, []);

  useEffect(() => { if (email) { loadSessions(); loadCache(); } }, [email]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (editingId) titleRef.current?.focus(); }, [editingId]);

  const loadCache = useCallback(async () => {
    const key = `originbi_emp_cache_${email}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p: EmployeeCache = JSON.parse(raw);
        if (Date.now() - p.timestamp < CACHE_TTL) { setEmployees(p.data); return; }
      }
    } catch { /* ignore */ }
    await refreshCache();
  }, [email, authToken]);

  const refreshCache = async () => {
    const key = `originbi_emp_cache_${email}`;
    try {
      const res = await fetch('/api/chat/employees', { headers: { 'x-auth-token': authToken, 'x-user-id': email } });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      }
    } catch { /* ignore */ }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions', { headers: { 'x-user-id': email, 'x-user-role': 'CORPORATE' } });
      if (res.ok) setSessions(await res.json());
    } catch { /* ignore */ }
  };

  const newChat = () => {
    setActiveSessionId(null); setMessages([]); setInput(''); setInterviewResult('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectSession = async (s: Session) => {
    setActiveSessionId(s.id); setMessages([]);
    try {
      const res = await fetch(`/api/chat/sessions/${s.id}`, { headers: { 'x-user-id': email } });
      if (res.ok) { const msgs: any[] = await res.json(); setMessages(msgs.map(m => ({ role: m.role, content: m.content }))); }
    } catch { /* ignore */ }
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE', headers: { 'x-user-id': email } });
    if (activeSessionId === id) newChat();
    setSessions(p => p.filter(s => s.id !== id));
  };

  const startEdit = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingId(s.id); setConfirmDeleteId(null); setEditingTitle(s.title || '');
  };

  const saveTitle = async (id: number) => {
    const title = editingTitle.trim();
    if (title) {
      await fetch(`/api/chat/sessions/${id}/title`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': email },
        body: JSON.stringify({ title }),
      });
      setSessions(p => p.map(s => s.id === id ? { ...s, title } : s));
    }
    setEditingId(null);
  };

  const send = async (text?: string) => {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    const isFirst = messages.length === 0;
    const updated: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(updated); setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': email, 'x-user-role': 'CORPORATE', 'x-auth-token': authToken },
        body: JSON.stringify({ prompt, sessionId: activeSessionId, userRole: 'CORPORATE', messages: updated.slice(-8) }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not process that.';
      const sid: number = data.sessionId;
      setMessages(p => [...p, { role: 'assistant', content: reply }]);

      if (sid && sid !== activeSessionId) {
        setActiveSessionId(sid);
        await loadSessions();
        if (isFirst) {
          try {
            const tr = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-id': email, 'x-user-role': 'CORPORATE', 'x-auth-token': authToken },
              body: JSON.stringify({ prompt: `Generate a concise 5-7 word chat title (no quotes, no punctuation) for a conversation starting with: "${prompt.substring(0, 100)}"`, sessionId: null, userRole: 'CORPORATE', messages: [], noSession: true }),
            });
            if (tr.ok) {
              const td = await tr.json();
              const rawTitle = td.reply || '';
              const autoTitle = rawTitle.replace(/\*\*/g, '').replace(/[*_#`]/g, '').replace(/^[\s\W]+/, '').trim().substring(0, 60);
              if (autoTitle) {
                await fetch(`/api/chat/sessions/${sid}/title`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': email },
                  body: JSON.stringify({ title: autoTitle }),
                });
                setSessions(p => p.map(s => s.id === sid ? { ...s, title: autoTitle } : s));
              }
            }
          } catch { /* ignore */ }
        }
      } else if (sid) {
        setSessions(p =>
          [...p.map(s => s.id === sid ? { ...s, updatedAt: new Date().toISOString() } : s)]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        );
      }
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '⚠️ Connection error. Please check the corporate service is running.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const runInterview = async () => {
    const filled = transcripts.filter(t => t.name.trim() && t.transcript.trim());
    if (!jdText.trim() || !filled.length) return;
    setInterviewLoading(true); setInterviewResult('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': email, 'x-user-role': 'CORPORATE', 'x-auth-token': authToken },
        body: JSON.stringify({ prompt: ' ', userRole: 'CORPORATE', interviewMode: true, jdText, transcripts: filled, messages: [], noSession: true }),
      });
      const data = await res.json();
      setInterviewResult(data.reply || 'Analysis failed.');
    } catch { setInterviewResult('⚠️ Connection error.'); }
    finally { setInterviewLoading(false); }
  };

  const grouped = groupSessions(sessions);

  // Filter sessions by search
  const filteredSessions = sessionSearch.trim()
    ? sessions.filter(s => (s.title || '').toLowerCase().includes(sessionSearch.toLowerCase()))
    : null;

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] overflow-hidden" style={{ fontFamily: "'Söhne', 'ui-sans-serif', 'system-ui', '-apple-system', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside
        className={`flex flex-col shrink-0 bg-[#f9f9f9] dark:bg-[#171717] border-r border-[#e5e7eb] dark:border-[#2d2d2d] transition-all duration-300 ${sidebarOpen ? 'w-[260px]' : 'w-0'} overflow-hidden`}
      >
        {/* Sidebar top spacer to align with header height */}
        <div className="h-[52px] shrink-0 flex items-center px-3">
          <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wider">Chats</span>
        </div>

        {/* New Chat */}
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] text-[#374151] dark:text-[#d1d5db] text-[14px] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2d2d2d] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-lg">
            <svg className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={sessionSearch}
              onChange={e => setSessionSearch(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-[13px] text-[#374151] dark:text-[#d1d5db] placeholder-[#9ca3af] outline-none"
            />
            {sessionSearch && (
              <button onClick={() => setSessionSearch('')} className="text-[#9ca3af] hover:text-[#6b7280]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredSessions ? (
            /* Filtered results */
            filteredSessions.length === 0 ? (
              <p className="text-[12px] text-[#9ca3af] px-3 pt-4">No chats found.</p>
            ) : (
              filteredSessions.map(s => (
                <SessionItem
                  key={s.id}
                  s={s}
                  active={activeSessionId === s.id}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  confirmDeleteId={confirmDeleteId}
                  titleRef={titleRef}
                  onSelect={() => selectSession(s)}
                  onStartEdit={e => startEdit(s, e)}
                  onSaveTitle={() => saveTitle(s.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onConfirmDelete={() => setConfirmDeleteId(s.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onDelete={e => deleteSession(s.id, e)}
                  setEditingTitle={setEditingTitle}
                />
              ))
            )
          ) : (
            /* Grouped sessions */
            <>
              {employees.length > 0 && (
                <p className="text-[10px] text-[#9ca3af] px-3 pt-2 pb-1">{employees.length} employees cached</p>
              )}
              {GROUP_ORDER.map(group => {
                const items = grouped[group];
                if (!items?.length) return null;
                return (
                  <div key={group}>
                    <p className="text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b7280] uppercase tracking-wider px-3 pt-4 pb-1.5">{group}</p>
                    {items.map(s => (
                      <SessionItem
                        key={s.id}
                        s={s}
                        active={activeSessionId === s.id}
                        editingId={editingId}
                        editingTitle={editingTitle}
                        confirmDeleteId={confirmDeleteId}
                        titleRef={titleRef}
                        onSelect={() => selectSession(s)}
                        onStartEdit={e => startEdit(s, e)}
                        onSaveTitle={() => saveTitle(s.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onConfirmDelete={() => setConfirmDeleteId(s.id)}
                        onCancelDelete={() => setConfirmDeleteId(null)}
                        onDelete={e => deleteSession(s.id, e)}
                        setEditingTitle={setEditingTitle}
                      />
                    ))}
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="text-center pt-10 px-4">
                  <p className="text-[13px] text-[#9ca3af]">No conversations yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-[#e5e7eb] dark:border-[#2d2d2d] bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(p => {
                const next = !p;
                localStorage.setItem('originbi_ask_ai_sidebar', String(next));
                return next;
              })}
              className="p-1.5 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#2d2d2d] text-[#6b7280] dark:text-[#9ca3af] transition-colors"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            {/* Logo — always visible in header */}
            <img src="/Origin-BI-Logo-01.png" alt="OriginBI" className="h-5 w-auto dark:hidden" />
            <img src="/Origin-BI-white-logo.png" alt="OriginBI" className="h-5 w-auto hidden dark:block" />
          </div>

          <div className="flex items-center gap-3">
            {/* Tab toggle */}
            <div className="flex items-center gap-0.5 bg-[#f3f4f6] dark:bg-[#2d2d2d] rounded-lg p-0.5">
              {([
                { id: 'ask', label: 'Ask Your Team' },
                { id: 'interviews', label: 'Analyse Interviews' },
              ] as { id: 'ask' | 'interviews'; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#3d3d3d] text-[#111827] dark:text-white shadow-sm' : 'text-[#6b7280] hover:text-[#374151] dark:hover:text-[#d1d5db]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile */}
            <div
              className="w-8 h-8 rounded-full bg-[#19c37d] flex items-center justify-center text-white text-[12px] font-semibold cursor-default select-none"
              title={email}
            >
              {userInitials || 'U'}
            </div>
          </div>
        </div>

        {/* ── ASK TAB ── */}
        {activeTab === 'ask' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Messages scrollable area */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {messages.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
                  <h1 className="text-[28px] font-semibold text-[#111827] dark:text-white mb-2 text-center">
                    Origin Copilot
                  </h1>
                  <p className="text-[15px] text-[#6b7280] dark:text-[#9ca3af] mb-10 text-center max-w-md leading-relaxed">
                    Ask anything about your workforce. I understand your team&apos;s behavioural profiles and help you make smarter people decisions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                    {randomSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s.label)}
                        className="flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-[#2d2d2d] hover:bg-[#f9fafb] dark:hover:bg-[#3d3d3d] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-xl text-left transition-all"
                      >
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <span className="text-[13px] text-[#374151] dark:text-[#d1d5db] leading-snug">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages list */
                <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`min-w-0 max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex-1'}`}>
                        {msg.role === 'user' ? (
                          <div className="bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#111827] dark:text-[#f9fafb] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            <div className="text-[15px] leading-[1.75] text-[#374151] dark:text-[#d1d5db]">
                              <MarkdownRenderer content={msg.content} />
                            </div>
                            {/* Response actions */}
                            <div className="flex items-center gap-0.5 mt-3 -ml-2">
                              <CopyButton text={msg.content} />
                              <DownloadButton text={msg.content} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {loading && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <ThinkingIndicator />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── INPUT AREA ── */}
            <div className="shrink-0 px-4 pb-6 pt-2 bg-white dark:bg-[#212121]">
              <div className="max-w-3xl mx-auto">
                <div className="relative bg-white dark:bg-[#2d2d2d] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-2xl shadow-sm focus-within:border-[#9ca3af] dark:focus-within:border-[#6b7280] transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = 'auto';
                      t.style.height = Math.min(t.scrollHeight, 200) + 'px';
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about your team…"
                    rows={1}
                    disabled={loading}
                    className="w-full bg-transparent px-4 pt-4 pb-12 text-[15px] text-[#111827] dark:text-[#f9fafb] placeholder-[#9ca3af] resize-none outline-none min-h-[52px] max-h-[200px] leading-relaxed"
                  />
                  {/* Send button — bottom-right inside textarea box */}
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || loading}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111827] dark:bg-white disabled:bg-[#e5e7eb] dark:disabled:bg-[#3d3d3d] text-white dark:text-[#111827] disabled:text-[#9ca3af] dark:disabled:text-[#6b7280] disabled:cursor-not-allowed transition-colors"
                      title="Send message"
                    >
                      {/* Up arrow */}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-center text-[11px] text-[#9ca3af] mt-2">
                  Origin Copilot can make mistakes. Consider verifying important information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── INTERVIEWS TAB ── */}
        {activeTab === 'interviews' && (
          <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827] dark:text-white mb-1.5">Interview Transcript Analyser</h2>
                <p className="text-[14px] text-[#6b7280] dark:text-[#9ca3af] leading-relaxed">
                  Paste a JD and interview transcripts for external candidates. The AI evaluates each person against the JD — <strong>no internal database lookup.</strong>
                </p>
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-[#374151] dark:text-[#d1d5db] mb-2">Job Description</label>
                <textarea
                  value={jdText} onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the full Job Description here…" rows={6}
                  className="w-full bg-white dark:bg-[#2d2d2d] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-xl px-4 py-3 text-[14px] text-[#374151] dark:text-[#d1d5db] placeholder-[#9ca3af] outline-none focus:border-[#9ca3af] transition-colors resize-none"
                />
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[#374151] dark:text-[#d1d5db]">Candidate Transcripts</label>
                  <button
                    onClick={() => setTranscripts(p => [...p, { id: Date.now().toString(), name: '', transcript: '' }])}
                    className="text-[13px] text-[#19c37d] hover:opacity-70 font-semibold transition-opacity"
                  >+ Add Candidate</button>
                </div>
                <div className="space-y-4">
                  {transcripts.map((t, idx) => (
                    <div key={t.id} className="border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-xl p-4 space-y-3 bg-[#f9fafb] dark:bg-[#2d2d2d]">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#9ca3af] font-medium w-24 shrink-0">Candidate {idx + 1}</span>
                        <input
                          value={t.name}
                          onChange={e => setTranscripts(p => p.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))}
                          placeholder="Full name"
                          className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#9ca3af] text-[#374151] dark:text-[#d1d5db]"
                        />
                        {transcripts.length > 1 && (
                          <button onClick={() => setTranscripts(p => p.filter(x => x.id !== t.id))} className="text-[#9ca3af] hover:text-red-500 transition-colors text-lg">✕</button>
                        )}
                      </div>
                      <textarea
                        value={t.transcript}
                        onChange={e => setTranscripts(p => p.map(x => x.id === t.id ? { ...x, transcript: e.target.value } : x))}
                        placeholder="Paste the interview transcript here…" rows={5}
                        className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#9ca3af] resize-none text-[#374151] dark:text-[#d1d5db]"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={runInterview}
                disabled={interviewLoading || !jdText.trim() || !transcripts.some(t => t.name.trim() && t.transcript.trim())}
                className="w-full py-3 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#f9fafb] disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-[#111827] rounded-xl font-semibold text-[14px] transition-all"
              >
                {interviewLoading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin dark:border-[#111827]/30 dark:border-t-[#111827]" />Analysing…</span>
                  : '🔍 Analyse All Candidates Against JD'}
              </button>
              {interviewResult && (
                <div className="mt-6 bg-white dark:bg-[#2d2d2d] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-xl px-6 py-6">
                  <MarkdownRenderer content={interviewResult} />
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#3d3d3d]">
                    <CopyButton text={interviewResult} />
                    <DownloadButton text={interviewResult} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Session item sub-component ──
interface SessionItemProps {
  s: Session;
  active: boolean;
  editingId: number | null;
  editingTitle: string;
  confirmDeleteId: number | null;
  titleRef: React.RefObject<HTMLInputElement>;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: (e: React.MouseEvent) => void;
  setEditingTitle: (v: string) => void;
}

function SessionItem({
  s, active, editingId, editingTitle, confirmDeleteId, titleRef,
  onSelect, onStartEdit, onSaveTitle, onCancelEdit, onConfirmDelete, onCancelDelete, onDelete, setEditingTitle,
}: SessionItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-[13px] mb-0.5 ${active ? 'bg-[#ececec] dark:bg-[#2d2d2d] text-[#111827] dark:text-white font-medium' : 'hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] text-[#374151] dark:text-[#d1d5db]'}`}
    >
      {editingId === s.id ? (
        <input
          ref={titleRef}
          value={editingTitle}
          onChange={e => setEditingTitle(e.target.value)}
          onBlur={onSaveTitle}
          onKeyDown={e => { if (e.key === 'Enter') onSaveTitle(); if (e.key === 'Escape') onCancelEdit(); }}
          onClick={e => e.stopPropagation()}
          maxLength={60}
          className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3d3d3d] rounded-md px-2 py-0.5 text-[13px] outline-none"
        />
      ) : (
        <span className="flex-1 truncate" title={s.title || 'Untitled Chat'}>{s.title || 'Untitled Chat'}</span>
      )}
      <span className="hidden group-hover:flex items-center gap-1 shrink-0">
        {confirmDeleteId === s.id ? (
          <>
            <button onClick={onDelete} className="p-1 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Confirm Delete">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <button onClick={e => { e.stopPropagation(); onCancelDelete(); }} className="p-1 flex items-center justify-center text-[#9ca3af] hover:text-[#374151] hover:bg-[#e5e7eb] dark:hover:bg-[#3d3d3d] rounded-md transition-colors" title="Cancel">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <>
            <button onClick={onStartEdit} className="p-1 flex items-center justify-center text-[#9ca3af] hover:text-[#374151] hover:bg-[#e5e7eb] dark:hover:text-[#d1d5db] dark:hover:bg-[#3d3d3d] rounded-md transition-colors" title="Rename">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={e => { e.stopPropagation(); onConfirmDelete(); }} className="p-1 flex items-center justify-center text-[#9ca3af] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </span>
    </div>
  );
}
