'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

function groupSessions(sessions: Session[]) {
  const now = new Date();
  const g: Record<string, Session[]> = { Today: [], Yesterday: [], 'This Week': [], 'Last Week': [], Older: [] };
  sessions.forEach(s => {
    const diff = Math.floor((now.getTime() - new Date(s.updatedAt || s.createdAt).getTime()) / 86400000);
    if (diff === 0) g.Today.push(s);
    else if (diff === 1) g.Yesterday.push(s);
    else if (diff <= 7) g['This Week'].push(s);
    else if (diff <= 14) g['Last Week'].push(s);
    else g.Older.push(s);
  });
  return g;
}

const SUGGESTIONS = [
  { icon: '🧠', label: 'Who is your best team leader candidate?' },
  { icon: '🎯', label: 'Match employees for a Senior Sales Manager role' },
  { icon: '🤝', label: 'Who collaborates best under pressure?' },
  { icon: '📈', label: 'Who has leadership succession potential?' },
  { icon: '⚡', label: 'Who drives results independently without supervision?' },
  { icon: '🌱', label: 'Who needs development to become ready for management?' },
  { icon: '🔥', label: 'Form the best 5-person cross-functional project team' },
  { icon: '💬', label: 'How do I communicate with a detail-oriented employee?' },
];

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Last Week', 'Older'];
const CACHE_TTL = 60 * 60 * 1000;

export default function AskAIPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Corporate app stores user as JSON object in localStorage.getItem('user')
    // not as a flat 'userEmail' key. Try all known patterns.
    let e = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '';
    if (!e) {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) e = JSON.parse(userStr)?.email || '';
      } catch { /* ignore parse error */ }
    }

    const t = sessionStorage.getItem('authToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('token')
      || '';

    setEmail(e); setAuthToken(t);
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
    } catch { /* localStorage unavailable or invalid JSON — fall through to fetch */ }
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
    } catch { /* network error — cache remains stale, silent fail */ }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions', { headers: { 'x-user-id': email, 'x-user-role': 'CORPORATE' } });
      if (res.ok) setSessions(await res.json());
    } catch { /* network error — sessions list unchanged */ }
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
    } catch { /* network error — messages list unchanged */ }
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE', headers: { 'x-user-id': email } });
    if (activeSessionId === id) newChat();
    setSessions(p => p.filter(s => s.id !== id));
  };

  const startEdit = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingId(s.id); setEditingTitle(s.title || '');
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
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
              body: JSON.stringify({ prompt: `Generate a concise 5-7 word chat title (no quotes, no punctuation) for a conversation starting with: "${prompt.substring(0, 100)}"`, sessionId: null, userRole: 'CORPORATE', messages: [] }),
            });
            if (tr.ok) {
              const td = await tr.json();
              const rawTitle = td.reply || '';
              // Strip ALL markdown: bold (**), italic (*/_), headings (#), code (`), and trim whitespace
              const autoTitle = rawTitle
                .replace(/\*\*/g, '')   // remove bold markers
                .replace(/[*_#`]/g, '') // remove other markdown
                .replace(/^[\s\W]+/, '') // trim leading punctuation/spaces
                .trim()
                .substring(0, 60);
              if (autoTitle) {
                await fetch(`/api/chat/sessions/${sid}/title`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': email },
                  body: JSON.stringify({ title: autoTitle }),
                });
                setSessions(p => p.map(s => s.id === sid ? { ...s, title: autoTitle } : s));
              }
            }
          } catch { /* auto-title failed — session keeps default title */ }
        }
      } else if (sid) {
        setSessions(p =>
          [...p.map(s => s.id === sid ? { ...s, updatedAt: new Date().toISOString() } : s)]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        );
      }
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '⚠️ Connection error. Please check the corporate service is running.' }]);
    } finally { setLoading(false); }
  };

  const runInterview = async () => {
    const filled = transcripts.filter(t => t.name.trim() && t.transcript.trim());
    if (!jdText.trim() || !filled.length) return;
    setInterviewLoading(true); setInterviewResult('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': email, 'x-user-role': 'CORPORATE', 'x-auth-token': authToken },
        body: JSON.stringify({ prompt: ' ', userRole: 'CORPORATE', interviewMode: true, jdText, transcripts: filled, messages: [] }),
      });
      const data = await res.json();
      setInterviewResult(data.reply || 'Analysis failed.');
    } catch { setInterviewResult('⚠️ Connection error.'); }
    finally { setInterviewLoading(false); }
  };

  const grouped = groupSessions(sessions);

  return (
    <div className="flex h-screen bg-white dark:bg-[#19211C] overflow-hidden font-sans">

      {/* SIDEBAR */}
      <aside className={`flex flex-col shrink-0 bg-[#F7F8F7] dark:bg-[#111811] border-r border-gray-200 dark:border-white/[0.06] transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-white/[0.06]">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Conversations</span>
          <button onClick={refreshCache} className="text-xs text-brand-green hover:opacity-70 font-medium" title="Refresh employee cache">↻ Sync</button>
        </div>
        <div className="px-3 pt-3 pb-1">
          <button onClick={newChat} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-sm font-semibold transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4"/></svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {employees.length > 0 && (
            <p className="text-[10px] text-gray-400 px-2 pt-2 pb-1">{employees.length} employees cached</p>
          )}
          {GROUP_ORDER.map(group => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <div key={group}>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-2 pt-4 pb-1.5">{group}</p>
                {items.map(s => (
                  <div key={s.id} onClick={() => selectSession(s)}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm mb-0.5 ${activeSessionId === s.id ? 'bg-brand-green/15 text-brand-green font-medium' : 'hover:bg-white dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300'}`}>
                    {editingId === s.id ? (
                      <input ref={titleRef} value={editingTitle} onChange={e => setEditingTitle(e.target.value)}
                        onBlur={() => saveTitle(s.id)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(s.id); if (e.key === 'Escape') setEditingId(null); }}
                        onClick={e => e.stopPropagation()} maxLength={60}
                        className="flex-1 bg-white dark:bg-[#1a2620] border border-brand-green/40 rounded-lg px-2 py-0.5 text-sm outline-none" />
                    ) : (
                      <span className="flex-1 truncate">{s.title || 'Untitled Chat'}</span>
                    )}
                    <span className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button onClick={e => startEdit(s, e)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs" title="Rename">✎</button>
                      <button onClick={e => deleteSession(s.id, e)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 text-xs" title="Delete">✕</button>
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div className="text-center pt-12 px-4">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-xs text-gray-400">No conversations yet.<br/>Start a new chat above.</p>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#19211C] shrink-0">
          <button onClick={() => setSidebarOpen(p => !p)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">People Intelligence Copilot</h1>
            <p className="text-[11px] text-gray-500">OriginBI · Workforce Decision Advisor</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1">
            {[{ id: 'ask', label: '🧠 Ask Your Team' }, { id: 'interviews', label: '📋 Analyse Interviews' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/corporate/dashboard')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back
          </button>
        </div>

        {/* ASK TAB */}
        {activeTab === 'ask' && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/20 to-brand-green/5 flex items-center justify-center mb-5 shadow-inner">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">People Intelligence Copilot</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md leading-relaxed">
                    Ask anything about your workforce. I understand your team's behavioural profiles and help you make smarter people decisions.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s.label)}
                        className="group flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.07] hover:border-brand-green/30 rounded-xl text-left transition-all shadow-sm">
                        <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-brand-green/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-base">🧠</span>
                        </div>
                      )}
                      <div className={`max-w-[78%] ${msg.role === 'user'
                        ? 'bg-brand-green/10 border border-brand-green/20 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tr-sm px-5 py-3.5'
                        : 'bg-white dark:bg-[#1a2620] border border-gray-100 dark:border-white/[0.07] text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm'}`}>
                        {msg.role === 'user'
                          ? <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          : <MarkdownRenderer content={msg.content} />}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-green/15 flex items-center justify-center shrink-0"><span className="text-base">🧠</span></div>
                      <div className="bg-white dark:bg-[#1a2620] border border-gray-100 dark:border-white/[0.07] rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                        <div className="flex gap-1.5 items-center h-5">
                          {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-brand-green/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.06] bg-white/95 dark:bg-[#19211C]/95 shrink-0">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <div className="flex-1 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.09] rounded-2xl focus-within:border-brand-green/40 transition-colors">
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 200) + 'px'; }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about your team… e.g. 'Who would be best suited for a client-facing leadership role?'"
                    rows={1} disabled={loading}
                    className="w-full bg-transparent px-5 py-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 resize-none outline-none min-h-[52px] max-h-[200px]" />
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className="w-12 h-12 shrink-0 bg-brand-green hover:bg-brand-green/80 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-2">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}

        {/* INTERVIEWS TAB */}
        {activeTab === 'interviews' && (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Interview Transcript Analyser</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Paste a JD and interview transcripts for external candidates. The AI evaluates each person against the JD — <strong>no internal database lookup.</strong></p>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Description</label>
                <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full Job Description here…" rows={6}
                  className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-brand-green/40 transition-colors resize-none" />
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Candidate Transcripts</label>
                  <button onClick={() => setTranscripts(p => [...p, { id: Date.now().toString(), name: '', transcript: '' }])}
                    className="text-sm text-brand-green hover:opacity-70 font-semibold transition-opacity">＋ Add Candidate</button>
                </div>
                <div className="space-y-4">
                  {transcripts.map((t, idx) => (
                    <div key={t.id} className="border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 space-y-3 bg-gray-50 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-medium w-24 shrink-0">Candidate {idx + 1}</span>
                        <input value={t.name} onChange={e => setTranscripts(p => p.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))}
                          placeholder="Full name" className="flex-1 bg-white dark:bg-[#1a2620] border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-green/40" />
                        {transcripts.length > 1 && (
                          <button onClick={() => setTranscripts(p => p.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">✕</button>
                        )}
                      </div>
                      <textarea value={t.transcript} onChange={e => setTranscripts(p => p.map(x => x.id === t.id ? { ...x, transcript: e.target.value } : x))}
                        placeholder="Paste the interview transcript here…" rows={5}
                        className="w-full bg-white dark:bg-[#1a2620] border border-gray-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green/40 resize-none" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={runInterview} disabled={interviewLoading || !jdText.trim() || !transcripts.some(t => t.name.trim() && t.transcript.trim())}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green/80 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm transition-all shadow-sm">
                {interviewLoading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing…</span>
                  : '🔍 Analyse All Candidates Against JD'}
              </button>
              {interviewResult && (
                <div className="mt-6 bg-white dark:bg-[#1a2620] border border-gray-100 dark:border-white/[0.07] rounded-2xl px-8 py-7 shadow-sm">
                  <MarkdownRenderer content={interviewResult} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

