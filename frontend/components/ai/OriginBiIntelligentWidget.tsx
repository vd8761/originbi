'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Plus, Loader2, Bot, User, MessageSquareText, Search } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
}

export default function OriginBiIntelligentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  
  // Widget is now exclusively for CORPORATE users
  const isCorporate = pathname?.includes('/corporate');
  
  const corporatePrompts = [
    // UC1: Individual Employee Intelligence
    "What is {candidate1}'s behavioral character and natural working style?",
    "Describe how {candidate2} typically approaches decisions and collaboration.",
    // UC2: Role Fitment & Internal Mobility
    "Is {candidate1} behaviorally suited to their current role?",
    "Which of my employees might be underutilized in their current position?",
    // UC4 & UC5: Team Formation & Project Teams
    "Build a balanced 5-person team for a new product launch from my workforce.",
    "Who are the best employees to combine for a high-pressure client delivery project?",
    // UC6: Manager Guidance
    "How should I give constructive feedback to {candidate2} without demotivating them?",
    "What is the best way to delegate responsibilities to {candidate1}?",
    // UC7: Team Dynamics & Conflict
    "Why might two of my employees frequently disagree in team meetings?",
    "How can I improve collaboration between two contrasting personalities on my team?",
    // UC8: Succession Planning
    "Who in my workforce has the strongest natural leadership potential?",
    "Which employees could step into a senior manager role in the next 12 months?",
    // UC9: Capability Mapping
    "What are the dominant behavioral strengths across my entire workforce?",
    "Where are the critical behavioral gaps in my organization?",
    // UC11: Learning & Development
    "What training program should I assign to {candidate1} to prepare them for a senior role?",
    "What are the top 3 capability development priorities for my team?",
    // UC12: Workforce Planning
    "Do I have enough internal behavioral capability to launch a new business unit?",
    // UC13: Recruitment Intelligence
    "What behavioral traits should I look for when hiring for a sales leadership role?",
    // UC14: People Strategy
    "What communication framework best suits my team's behavioral makeup?",
    // JD Matching
    "Find employees suitable for a Senior Developer with strong leadership and analytical skills",
  ];

  const currentSubtitle = "Ask me questions about your candidates, job posts, and assessment metrics.";

  const fetchCandidatesAndSetPrompts = async () => {
    try {
      const email = typeof window !== 'undefined'
        ? (localStorage.getItem('originbi_user_email') || sessionStorage.getItem('userEmail') || '')
        : '';
        
      const res = await fetch('/api/chat/candidates', {
        headers: { 'x-user-email': email }
      });
      let candidateNames = [];
      if (res.ok) {
        const data = await res.json();
        candidateNames = data.candidates || [];
      }
      
      let filledPrompts = [...corporatePrompts];
      
      if (candidateNames.length >= 1) {
        filledPrompts = filledPrompts.map(p => p.replace('{candidate1}', candidateNames[0]));
      } else {
        filledPrompts = filledPrompts.filter(p => !p.includes('{candidate1}'));
      }

      if (candidateNames.length >= 2) {
        filledPrompts = filledPrompts.map(p => p.replace('{candidate2}', candidateNames[1]));
      } else {
        filledPrompts = filledPrompts.filter(p => !p.includes('{candidate2}'));
      }
      
      const shuffled = [...filledPrompts].sort(() => 0.5 - Math.random());
      setDynamicPrompts(shuffled.slice(0, 4));
    } catch (error) {
      const fallbackPrompts = corporatePrompts.filter(p => !p.includes('{candidate1}') && !p.includes('{candidate2}'));
      const shuffled = [...fallbackPrompts].sort(() => 0.5 - Math.random());
      setDynamicPrompts(shuffled.slice(0, 4));
    }
  };

  useEffect(() => {
    if (isCorporate) {
      fetchCandidatesAndSetPrompts();
    }
  }, [isCorporate]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opened and lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
      if (sessions.length === 0 && isCorporate) fetchSessions();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isCorporate]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    setActiveSessionId(id);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
      // On mobile, automatically hide sidebar after selecting a chat
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const createNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Read auth token and email from browser storage
      const authToken = typeof window !== 'undefined'
        ? (localStorage.getItem('originbi_id_token') || sessionStorage.getItem('idToken') || '')
        : '';
      const userEmail = typeof window !== 'undefined'
        ? (sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '')
        : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-auth-token': authToken } : {}),
          ...(userEmail ? { 'x-user-id': userEmail } : {})
        },
        body: JSON.stringify({
          prompt: text.trim(),
          sessionId: activeSessionId,
          messages: messages,
          userRole: 'CORPORATE'
        })
      });
      
      if (!res.ok) {
        let errorMsg = 'API Error';
        try {
          const errorData = await res.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch(e) {
          console.error("Failed to parse error response", e);
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      
      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId);
        fetchSessions();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group sessions by date
  const groupSessions = () => {
    const groups: { [key: string]: Session[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    sessions.forEach(session => {
      const date = new Date(session.createdAt);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (date.toDateString() === todayStr) {
        groups['Today'].push(session);
      } else if (date.toDateString() === yesterdayStr) {
        groups['Yesterday'].push(session);
      } else if (diffDays <= 7) {
        groups['Previous 7 Days'].push(session);
      } else if (diffDays <= 30) {
        groups['Previous 30 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessions();

  if (!isCorporate) return null;

  return (
    <>
      {/* Animated Branded Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="fixed bottom-6 right-6 px-4 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-full shadow-lg hover:shadow-[0_0_15px_rgba(0,200,83,0.4)] z-50 flex items-center justify-center gap-2 transition-transform overflow-hidden group border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
          >
            {/* Pulsing glow effect behind icon */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
            <Sparkles size={16} className="animate-pulse" />
            <span className="font-medium text-sm tracking-wide">Ask AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] bg-white dark:bg-[#1E293B] flex overflow-hidden font-sans"
          >
            {/* Sidebar (History) */}
            <div className={`
              ${isSidebarOpen ? 'w-full md:w-[320px] flex' : 'hidden'} 
              md:flex flex-col h-full bg-slate-50/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 z-10 relative
            `}>
              <div className="p-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
                <button 
                  onClick={createNewSession}
                  className="flex-1 flex items-center gap-3 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-all font-medium shadow-sm hover:shadow-md group"
                >
                  <div className="bg-brand-green/10 p-1.5 rounded-lg group-hover:bg-brand-green/20 transition-colors">
                    <Plus size={16} className="text-brand-green" />
                  </div>
                  New Chat
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="ml-3 p-2 md:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
                  groupSessions.length > 0 && (
                    <div key={groupName} className="mb-8">
                      <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-2">
                        {groupName}
                      </h4>
                      <div className="space-y-1">
                        {groupSessions.map(session => (
                          <button
                            key={session.id}
                            onClick={() => loadSession(session.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${
                              activeSessionId === session.id 
                                ? 'bg-white dark:bg-[#1E293B] text-brand-green font-semibold shadow-sm border border-slate-200 dark:border-slate-700' 
                                : 'hover:bg-white/60 dark:hover:bg-[#1E293B]/60 text-slate-600 dark:text-slate-400 border border-transparent'
                            }`}
                          >
                            <MessageSquareText size={16} className={activeSessionId === session.id ? 'text-brand-green' : 'text-slate-400 group-hover:text-slate-500'} />
                            <span className="truncate text-sm">{session.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0F172A] relative ${isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Subtle Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-transparent to-blue-500/5 pointer-events-none"></div>

              {/* Header */}
              <div className="h-[72px] border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 sticky top-0 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                  {!isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center shadow-md shadow-brand-green/20">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      OriginBI <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">Ask AI</span>
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
                  title="Close Fullscreen"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto scroll-smooth z-0 pt-4 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 w-full min-h-full flex flex-col">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-4 md:py-8">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand-green/10 to-emerald-500/5 rounded-3xl rotate-3 flex items-center justify-center mb-4 md:mb-6 border border-brand-green/20 shadow-xl shadow-brand-green/5"
                      >
                        <Sparkles size={32} className="text-brand-green -rotate-3" />
                      </motion.div>
                      <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight"
                      >
                        How can I help you today?
                      </motion.h1>
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400 mb-6 md:mb-10 max-w-lg"
                      >
                        {currentSubtitle}
                      </motion.p>
                      
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl"
                      >
                        {dynamicPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(prompt)}
                            className="group text-left p-4 md:p-5 bg-white/60 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(30,211,106,0.12)] hover:border-brand-green/30 hover:-translate-y-1 backdrop-blur-sm relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-[14px] md:text-[15px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10 w-full">{prompt}</p>
                          </button>
                        ))}
                      </motion.div>
                    </div>
                  ) : (
                    <div className="space-y-10 pb-12">
                      {messages.map((msg) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id} 
                          className={`flex gap-4 sm:gap-6 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          
                          {/* Assistant Avatar */}
                          {msg.role === 'assistant' && (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-green/20">
                              <Sparkles size={20} className="text-white" />
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`max-w-[90%] sm:max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl rounded-tr-sm px-6 py-4 shadow-md' 
                              : 'text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-[#1E293B] rounded-3xl rounded-tl-sm px-7 py-5 shadow-sm border border-slate-100 dark:border-slate-800'
                          }`}>
                            {msg.role === 'user' ? (
                              <p className="text-[15px] font-medium whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <MarkdownRenderer content={msg.content} />
                            )}
                          </div>

                          {/* User Avatar */}
                          {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User size={20} className="text-slate-600 dark:text-slate-300" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      
                      {isLoading && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex gap-4 sm:gap-6 justify-start w-full"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-green/20">
                            <Sparkles size={20} className="text-white animate-pulse" />
                          </div>
                          <div className="flex flex-col gap-2 justify-center">
                             <div className="flex gap-2.5 items-center bg-white dark:bg-[#1E293B] px-5 py-4 rounded-3xl rounded-tl-sm w-fit border border-slate-100 dark:border-slate-800 shadow-sm">
                               <div className="w-2.5 h-2.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                               <div className="w-2.5 h-2.5 bg-brand-green/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                               <div className="w-2.5 h-2.5 bg-brand-green/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                             </div>
                             <span className="text-xs font-medium text-slate-400 ml-2">Generating response...</span>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area anchored to bottom */}
              <div className="w-full pb-8 pt-4 px-4 sm:px-6 z-10 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent dark:from-[#0F172A] dark:via-[#0F172A]">
                <div className="max-w-3xl mx-auto relative">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                    className="relative flex items-end shadow-lg dark:shadow-[0_0_30px_rgba(0,0,0,0.3)] rounded-[24px] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(30,211,106,0.15)] focus-within:border-brand-green/40 focus-within:ring-4 focus-within:ring-brand-green/10"
                  >
                    <textarea
                      ref={inputRef as any}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text');
                        // Collapse multiple blank lines into one, trim leading/trailing whitespace
                        const cleaned = pasted.replace(/\n{3,}/g, '\n\n').trim();
                        setInput(prev => prev + cleaned);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(input);
                        }
                      }}
                      placeholder="Ask anything about your reports, data, or career..."
                      className="w-full max-h-48 min-h-[64px] py-5 pl-6 pr-16 bg-transparent border-none outline-none resize-none text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 scrollbar-hide font-medium"
                      rows={1}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center">
                      <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 bg-brand-green hover:bg-[#1bc05f] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-[14px] transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed shadow-md shadow-brand-green/20 disabled:shadow-none"
                      >
                        <Send size={18} className={input.trim() && !isLoading ? 'translate-x-0.5' : ''} />
                      </button>
                    </div>
                  </form>
                  <p className="text-center text-[11px] font-medium text-slate-400 mt-4 tracking-wide">
                    OriginBI Ask AI can make mistakes. Consider verifying important information.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
