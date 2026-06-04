"use client";

/* ============================================================
   Level 3 "Metaphor" — candidate exam page (ported from the
   Claude Design prototype). Wired to the metaphor connectors +
   pluggable speech hook. Desktop layout; images via URL.
   ============================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./metaphor-exam.css";
import {
    metaphorService,
    MetaphorConfig,
    MetaphorQuestionItem,
} from "../../../lib/services/metaphor.service";
import { useMetaphorSpeech } from "../../../lib/hooks/useMetaphorSpeech";
import {
    MicIcon, MicOffIcon, StopIcon, ChevronDownIcon, CheckIcon, CheckCircleIcon,
    ExpandIcon, CloseIcon, TrashIcon, ReRecordIcon, StartOverIcon, CaptureIcon,
    ClockIcon, ArrowRightIcon, ArrowLeftIcon, FlagFinishIcon, ImageOffIcon,
    WifiOffIcon, InfoIcon, WarnIcon, LockIcon,
} from "./metaphor-icons";

const fmtTime = (s: number) => {
    s = Math.max(0, Math.floor(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

interface Checkpoint { id: string; text: string; words: number; at: string }

export default function MetaphorExam({
    attemptId,
    onExit,
}: {
    attemptId: number | string;
    onExit?: () => void;
}) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [config, setConfig] = useState<MetaphorConfig | null>(null);
    const [questions, setQuestions] = useState<MetaphorQuestionItem[]>([]);
    const [savedAnswers, setSavedAnswers] = useState<Record<number, string>>({}); // questionId -> text

    const [idx, setIdx] = useState(0);
    const [readLang, setReadLang] = useState<"EN" | "TA">("EN");
    const [speakLang, setSpeakLang] = useState("en-IN");

    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [editingCpId, setEditingCpId] = useState<string | null>(null);
    const [langOpen, setLangOpen] = useState(false);

    const [timeLeft, setTimeLeft] = useState(20 * 60);
    const [expired, setExpired] = useState(false);
    const [zoom, setZoom] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [finished, setFinished] = useState(false);
    const [saving, setSaving] = useState(false);

    const workingRef = useRef<Record<number, { checkpoints: Checkpoint[]; liveText: string }>>({});
    const langRef = useRef<HTMLDivElement>(null);

    const MAX_CP = config?.segmentLimit ?? 5;
    const capLabel = config?.checkpointLabel ?? "Capture";
    const allowTyping = config?.allowTyping ?? false;
    const limitBehavior = config?.limitBehavior ?? "disable";
    const langs = config?.supportedLanguages ?? [];

    const sttProvider = config?.sttProvider?.provider || "web_speech";
    const speech = useMetaphorSpeech({ provider: sttProvider, lang: speakLang });
    const { finalText: liveText, interim, listening, micState } = speech;

    const total = questions.length;
    const q = questions[Math.min(idx, Math.max(0, total - 1))];
    const isLast = idx === total - 1;

    // ---- load ----
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const data = await metaphorService.getQuestions(attemptId);
                if (!active) return;
                setConfig(data.config);
                setQuestions(data.questions);
                setTimeLeft((data.config.durationMinutes || 20) * 60);
                const saved: Record<number, string> = {};
                data.questions.forEach((qq) => {
                    if (qq.answered && qq.savedAnswer) saved[qq.questionId] = qq.savedAnswer;
                });
                setSavedAnswers(saved);
                const firstUnanswered = data.questions.findIndex((qq) => !qq.answered);
                setIdx(firstUnanswered === -1 ? Math.max(0, data.questions.length - 1) : firstUnanswered);
                if (data.config.supportedLanguages?.[0]?.code) {
                    setSpeakLang(data.config.supportedLanguages[0].code);
                }
            } catch (e: any) {
                if (active) setLoadError(e?.message || "Failed to load the assessment.");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [attemptId]);

    // ---- overall soft timer ----
    useEffect(() => {
        const iv = setInterval(() => {
            setTimeLeft((s) => {
                if (s <= 1) { clearInterval(iv); setExpired(true); return 0; }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [config?.durationMinutes]);

    // ---- close lang dropdown on outside click ----
    useEffect(() => {
        const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    // ---- beforeunload warning if scratch exists ----
    useEffect(() => {
        const h = (e: BeforeUnloadEvent) => {
            if (checkpoints.length > 0 || liveText.trim() || interim.trim()) { e.preventDefault(); e.returnValue = ""; }
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [checkpoints, liveText, interim]);

    const T = (en?: string | null, ta?: string | null) => (readLang === "TA" && ta ? ta : en || ta || "");

    // ---- checkpoint actions ----
    const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
    const nowStamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const hasLive = liveText.trim().length > 0 || interim.trim().length > 0;
    const atLimit = checkpoints.length >= MAX_CP && limitBehavior === "disable" && !editingCpId;

    const toggleSpeak = () => { if (listening) speech.stop(); else void speech.start(); };

    const handleCapture = () => {
        const text = (liveText + (interim ? " " + interim : "")).trim();
        if (!text) return;
        if (editingCpId) {
            setCheckpoints((cps) => cps.map((c) => c.id === editingCpId ? { ...c, text, words: wordCount(text), at: nowStamp() } : c));
            setEditingCpId(null);
        } else {
            const cp: Checkpoint = { id: `cp_${Date.now()}`, text, words: wordCount(text), at: nowStamp() };
            setCheckpoints((cps) => {
                if (cps.length >= MAX_CP) return limitBehavior === "replace" ? [...cps.slice(1), cp] : cps;
                return [...cps, cp];
            });
        }
        speech.reset();
        if (listening) speech.stop();
    };
    const handleStartOver = () => { speech.reset(); if (listening) speech.stop(); };
    const handleReRecord = (id: string) => { setEditingCpId(id); speech.reset(); if (listening) speech.stop(); };
    const handleDeleteCp = (id: string) => { setCheckpoints((cps) => cps.filter((c) => c.id !== id)); if (editingCpId === id) setEditingCpId(null); };

    const assemble = () => {
        const parts = checkpoints.map((c) => c.text);
        const tail = (liveText + (interim ? " " + interim : "")).trim();
        if (tail) parts.push(tail);
        return parts.join(" ").trim();
    };

    const switchTo = (newIdx: number) => {
        if (newIdx < 0 || newIdx >= total) return;
        if (q) workingRef.current[q.questionId] = { checkpoints, liveText };
        speech.stop(); speech.reset(); setEditingCpId(null);
        const target = questions[newIdx];
        const w = workingRef.current[target.questionId];
        if (w) { setCheckpoints(w.checkpoints); speech.setFinalText(w.liveText); }
        else if (savedAnswers[target.questionId]) { setCheckpoints([]); speech.setFinalText(savedAnswers[target.questionId]); }
        else { setCheckpoints([]); speech.setFinalText(""); }
        setIdx(newIdx);
        if (target.spokenLanguage) setSpeakLang(target.spokenLanguage);
    };

    const persistAnswer = async (answer: string) => {
        setSavedAnswers((prev) => ({ ...prev, [q.questionId]: answer }));
        try {
            await metaphorService.saveAnswer({
                attemptId,
                metaphorQuestionId: q.questionId,
                spokenLanguage: speakLang,
                answerText: answer,
            });
        } catch (e) { /* surfaced by UI state; keep local */ }
    };

    const goNext = async () => {
        setSaving(true);
        await persistAnswer(assemble());
        setSaving(false);
        if (isLast) {
            speech.stop();
            try { await metaphorService.finish(attemptId); } catch { /* sweep retries */ }
            setFinished(true);
            return;
        }
        switchTo(idx + 1);
    };
    const handleSaveNext = () => { if (!assemble()) { setConfirmEmpty(true); return; } void goNext(); };

    const blocked = micState === "denied" || micState === "unsupported";

    // ---- render ----
    if (loading) {
        return <div className="exam" data-theme="dark"><div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "#9aa" }}>Loading…</div></div>;
    }
    if (loadError || !q) {
        return <div className="exam" data-theme="dark"><div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "#e88" }}>{loadError || "No metaphor questions for this attempt."}</div></div>;
    }

    const pct = Math.round((idx / total) * 100);
    const tcls = timeLeft <= 0 ? "is-out" : timeLeft <= 120 ? "is-low" : "";
    const curLang = langs.find((l) => l.code === speakLang) || langs[0];
    const ctx = T(q.contextEn, q.contextTa);
    const statuses = questions.map((qq, i) =>
        i === idx ? "current" : (savedAnswers[qq.questionId]?.trim() || workingRef.current[qq.questionId]?.checkpoints?.length) ? "done" : "todo");

    return (
        <div className="exam layout-two-col" data-theme="dark">
            {/* TOP BAR */}
            <header className="topbar">
                <div className="topbar__brand">
                    <img className="topbar__logo is-white" src="/metaphor-assets/Origin-BI-white-logo.png" alt="Origin BI" />
                </div>
                <div className="topbar__progress">
                    <div className="topbar__progress-row">
                        <span className="qcount">Question <b>{idx + 1}</b> of {total}</span>
                        <span className="qpct">{pct}%</span>
                    </div>
                    <div className="qbar"><div className="qbar__fill" style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="topbar__spacer" />
                <div className="topbar__tools">
                    <div className={`qtimer ${tcls}`} title="Overall time remaining">
                        <ClockIcon />
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                            <span className="qtimer__label">Time Left</span>
                            <span className="qtimer__time">{fmtTime(timeLeft)}</span>
                        </div>
                    </div>
                    <div className="seg" title="Reading language">
                        <button className={readLang === "EN" ? "is-active" : ""} onClick={() => setReadLang("EN")}>EN</button>
                        <button className={readLang === "TA" ? "is-active" : ""} onClick={() => setReadLang("TA")}>த</button>
                    </div>
                    {blocked && (
                        <div className="mic-status is-denied" title="Microphone status">
                            <span className="mic-status__dot" />{micState === "denied" ? "Mic not working" : "Mic not supported"}
                        </div>
                    )}
                    <button className="pill-btn" onClick={() => setShowInstructions(true)} title="How this works"><InfoIcon /><span>Instructions</span></button>
                </div>
            </header>

            <div className="exam__body">
                {/* STIMULUS */}
                <section className="stimulus">
                    <div className="stimulus__scroll">
                        <div className="imgframe" onClick={q.imageUrl ? () => setZoom(true) : undefined} style={{ cursor: q.imageUrl ? "zoom-in" : "default" }}>
                            {q.imageUrl ? (
                                <>
                                    <img src={q.imageUrl} alt={T(q.imageDescEn, q.imageDescTa)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <span className="imgframe__zoom"><ExpandIcon />Click to zoom</span>
                                </>
                            ) : (
                                <div className="imgframe__state"><ImageOffIcon /><p>Image will appear here.</p></div>
                            )}
                        </div>
                        <div className="field-block"><p className="field-desc">{T(q.imageDescEn, q.imageDescTa)}</p></div>
                        {ctx && (<div className="question-block"><p className="field-context">{ctx}</p></div>)}
                        <div className="question-block">
                            <span className="field-label"><span className="bar" />Question</span>
                            <h1 className="field-question">{T(q.questionEn, q.questionTa)}</h1>
                        </div>
                    </div>
                </section>

                {/* ANSWER PANEL */}
                <section className="answer">
                    <div className="answer__head">
                        <div className="answer__title">
                            <h3>Your Spoken Answer</h3>
                            <span>Speak naturally — your words appear below in real time.</span>
                        </div>
                        <div className="lang-select dropdown align-end" ref={langRef}>
                            <span className="lang-select__cap">Answering in</span>
                            <button className={`lang-select__btn ${langOpen ? "is-open" : ""}`} onClick={() => setLangOpen((v) => !v)}>
                                <MicIcon /><span>{curLang?.native || "English"}</span><ChevronDownIcon className="chev" />
                            </button>
                            {langOpen && (
                                <div className="dropdown__menu">
                                    <div className="dropdown__head">Language you will speak in</div>
                                    {langs.map((l) => (
                                        <button key={l.code} className={`dropdown__item ${l.code === speakLang ? "is-active" : ""}`}
                                            onClick={() => { setSpeakLang(l.code); setLangOpen(false); }}>
                                            <span>{l.label} <span className="native">{l.native}</span></span>
                                            {l.code === speakLang && <CheckIcon className="dropdown__check" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* checkpoints */}
                    <div className="cps">
                        <div className="cps__head">
                            <span className="cps__head-l"><CaptureIcon />Saved Segments</span>
                            <span className="cps__count"><b>{checkpoints.length}</b> / {MAX_CP}</span>
                        </div>
                        {checkpoints.length === 0 ? (
                            <div className="cp" style={{ background: "transparent", borderStyle: "dashed", justifyContent: "center" }}>
                                <p className="cp__text" style={{ color: "var(--fg-2)", textAlign: "center" }}>No segments yet — press “{capLabel}” to pin part of your answer.</p>
                            </div>
                        ) : (
                            <div className="cps__list">
                                {checkpoints.map((cp, i) => (
                                    <div className={`cp ${editingCpId === cp.id ? "is-editing" : ""}`} key={cp.id}>
                                        <span className="cp__num">{i + 1}</span>
                                        <div className="cp__body">
                                            {editingCpId === cp.id
                                                ? <p className="cp__text" style={{ color: "var(--green-500)", fontWeight: 600 }}>Re-recording this segment… speak now, then press “{capLabel}”.</p>
                                                : <p className="cp__text">{cp.text}</p>}
                                            <div className="cp__meta"><span>{cp.words} words</span><span>·</span><span>pinned {cp.at}</span></div>
                                        </div>
                                        <div className="cp__actions">
                                            <button className="icon-btn" title="Re-record this segment" onClick={() => handleReRecord(cp.id)}><ReRecordIcon /></button>
                                            <button className="icon-btn danger" title="Delete segment" onClick={() => handleDeleteCp(cp.id)}><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* transcript */}
                    <div className={`transcript ${listening ? "is-live" : ""} ${allowTyping ? "is-editable" : ""}`}>
                        {allowTyping && <span className="transcript__editbadge">Typing enabled</span>}
                        {allowTyping ? (
                            <textarea className="transcript__editable" value={liveText} placeholder="Type or speak your answer here…" onChange={(e) => speech.setFinalText(e.target.value)} />
                        ) : (liveText || interim || listening) ? (
                            <div className="transcript__text">
                                {liveText}
                                {interim && <span className="transcript__interim">{liveText ? " " : ""}{interim}</span>}
                                {listening && <span className="transcript__caret" />}
                            </div>
                        ) : (
                            <div className="transcript__placeholder"><MicIcon /><p>Press <b>Speak</b> and start talking. Your live transcript shows up here — read-only.</p></div>
                        )}
                    </div>

                    {listening && (
                        <div className="listening">
                            <div className="wave">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${i * 0.09}s` }} />)}</div>
                            <span className="listening__txt">Listening…</span>
                            <span className="listening__hint">Press Stop to pause</span>
                        </div>
                    )}

                    {micState === "denied" && (
                        <div className="notice err"><MicOffIcon /><span><b>Microphone access is blocked.</b> Allow it from your browser’s address bar, then press Speak.</span></div>
                    )}
                    {micState === "unsupported" && (
                        <div className="notice warn"><WarnIcon /><span><b>Live voice isn’t supported here.</b> Use the latest Chrome or Edge, or ask an admin to enable typing.</span></div>
                    )}

                    <div className="controls">
                        <button className={`speak-btn ${listening ? "is-live" : ""}`} onClick={toggleSpeak} disabled={blocked && !allowTyping}>
                            {listening ? <StopIcon /> : <MicIcon />}{listening ? "Stop" : editingCpId ? "Speak (re-record)" : "Speak"}
                        </button>
                        <button className="cap-btn" onClick={handleCapture} disabled={!hasLive || atLimit} title={atLimit ? "Checkpoint limit reached" : ""}>
                            <CaptureIcon />{editingCpId ? "Replace" : capLabel}
                        </button>
                        <button className="startover-btn" onClick={handleStartOver} disabled={!hasLive} title="Start over (clears current recording only)"><StartOverIcon /></button>
                    </div>
                    {atLimit ? (
                        <p className="controls__hint warn">You’ve reached {MAX_CP} saved segments. Delete or re-record one to capture more.</p>
                    ) : (
                        <p className="controls__hint">“{capLabel}” pins your current words above · “Start Over” clears only the live box · segments stay.</p>
                    )}
                </section>

                {/* QUESTION RAIL */}
                <nav className="qrail" aria-label="Question navigation">
                    <div className="qrail__list">
                        {statuses.map((st, i) => (
                            <button key={i} className={`qnav qnav--${st}`} onClick={() => switchTo(i)} aria-current={st === "current"}
                                title={`Question ${i + 1}${st === "done" ? " — answered" : st === "current" ? " — current" : ""}`}>
                                {st === "done" ? <CheckIcon className="qnav__check" /> : <span className="qnav__num">{i + 1}</span>}
                                <span className="qnav__label">Q{i + 1}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            </div>

            {/* BOTTOM BAR */}
            <footer className="bottombar">
                {expired ? (
                    <span className="bottombar__helper warn"><ClockIcon />Time’s up — you can still finish and submit your answers, no rush.</span>
                ) : (
                    <span className="bottombar__helper"><LockIcon />Your answers save as you go — revisit any question with Previous. Captured segments stay on your device until you save.</span>
                )}
                <div className="bottombar__spacer" />
                <button className="ghost-btn" onClick={() => switchTo(idx - 1)} disabled={idx === 0}><ArrowLeftIcon />Previous</button>
                <button className={`next-btn ${isLast ? "finish" : ""}`} onClick={handleSaveNext} disabled={saving}>
                    {isLast ? <><FlagFinishIcon />Save &amp; Finish</> : <>Save &amp; Next<ArrowRightIcon /></>}
                </button>
            </footer>

            {/* LIGHTBOX */}
            {zoom && q.imageUrl && (
                <div className="lightbox" onClick={() => setZoom(false)}>
                    <button className="lightbox__close" onClick={() => setZoom(false)}><CloseIcon /></button>
                    <div className="lightbox__inner" onClick={(e) => e.stopPropagation()} style={{ width: "min(92vw, 1100px)", aspectRatio: "16/10" }}>
                        <img src={q.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div className="lightbox__cap">{T(q.imageDescEn, q.imageDescTa)}</div>
                    </div>
                </div>
            )}

            {/* INSTRUCTIONS */}
            {showInstructions && (
                <div className="modal-scrim">
                    <div className="modal sheet">
                        <h2>How Level 3 works</h2>
                        <p className="sheet__sub">A voice assessment — you answer out loud, one image at a time.</p>
                        <div className="sheet__steps">
                            {[
                                ["Pick your spoken language", "Use the language selector — that’s the language you’ll answer in by voice."],
                                ["Look, then speak", "Study the image, description and context. Press Speak and respond naturally — there’s no right answer."],
                                [`Build it with “${capLabel}”`, `Pin good parts of your answer. Keep up to ${MAX_CP} segments and re-record any one.`],
                                ["Save & Next", "Your segments and live text are stitched together and saved for that question."],
                            ].map((s, i) => (
                                <div className="sheet__step" key={i}>
                                    <span className="sheet__step-num">{i + 1}</span>
                                    <span className="sheet__step-txt"><b>{s[0]}.</b> {s[1]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="modal__actions"><button className="btn-solid" onClick={() => setShowInstructions(false)}>Got it</button></div>
                    </div>
                </div>
            )}

            {/* CONFIRM EMPTY */}
            {confirmEmpty && (
                <div className="modal-scrim"><div className="modal">
                    <div className="modal__icon warn"><WarnIcon /></div>
                    <h2>Submit without an answer?</h2>
                    <p>You haven’t captured or spoken anything for this question. Go back and answer, or skip it and continue.</p>
                    <div className="modal__actions row">
                        <button className="btn-outline" onClick={() => setConfirmEmpty(false)}>Keep answering</button>
                        <button className="btn-solid" onClick={() => { setConfirmEmpty(false); void goNext(); }}>Skip &amp; continue</button>
                    </div>
                </div></div>
            )}

            {/* FINISHED */}
            {finished && (
                <div className="modal-scrim"><div className="modal">
                    <div className="modal__icon ok"><CheckCircleIcon /></div>
                    <h2>Level 3 complete</h2>
                    <p>You’ve answered every Metaphor question. Your responses have been saved and your Level 3 attempt is now marked complete.</p>
                    <div className="modal__actions"><button className="btn-solid" onClick={() => onExit?.()}>Back to assessments</button></div>
                </div></div>
            )}
        </div>
    );
}
