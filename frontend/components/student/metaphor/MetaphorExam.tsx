"use client";

/* ============================================================
   Level 3 "Metaphor" - candidate exam page (ported from the
   Claude Design prototype). Wired to the metaphor connectors +
   pluggable speech hook. Desktop layout; images via URL.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import "./metaphor-exam.css";
import ThemeToggle from "../../ui/ThemeToggle";
import { useTheme } from "../../../contexts/ThemeContext";
import {
    metaphorService,
    MetaphorConfig,
    MetaphorQuestionItem,
} from "../../../lib/services/metaphor.service";
import { useMetaphorSpeech } from "../../../lib/hooks/useMetaphorSpeech";
import {
    MicIcon, MicOffIcon, StopIcon, ChevronDownIcon, CheckIcon, CheckCircleIcon,
    ExpandIcon, CloseIcon, StartOverIcon,
    ClockIcon, ArrowRightIcon, ArrowLeftIcon, FlagFinishIcon, ImageOffIcon,
    InfoIcon, WarnIcon,
} from "./metaphor-icons";

const fmtTime = (s: number) => {
    s = Math.max(0, Math.floor(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

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
    const [speakLang, setSpeakLang] = useState("ta-IN");

    const [langOpen, setLangOpen] = useState(false);

    const [timeLeft, setTimeLeft] = useState(20 * 60);
    const [, setExpired] = useState(false);
    const [zoom, setZoom] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [finished, setFinished] = useState(false);
    const [saving, setSaving] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [imageFailed, setImageFailed] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const workingRef = useRef<Record<number, string>>({});
    const langRef = useRef<HTMLDivElement>(null);
    const qnavRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const transcriptBodyRef = useRef<HTMLDivElement>(null);

    const langs = config?.supportedLanguages ?? [];

    const sttProvider = config?.sttProvider?.provider || "web_speech";
    const { theme, toggleTheme } = useTheme();
    const speech = useMetaphorSpeech({ provider: sttProvider, lang: speakLang });
    const { finalText: liveText, interim, listening, micState, audioLevel, spectrum } = speech;

    const total = questions.length;
    const q = questions[Math.min(idx, Math.max(0, total - 1))];
    const isLast = idx === total - 1;

    useEffect(() => {
        setImageFailed(false);
    }, [q?.questionId, q?.imageUrl]);

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
                // Default to Tamil unless the candidate already picked another supported language.
                const hasTamil = data.config.supportedLanguages?.some((l) => l.code === "ta-IN");
                setSpeakLang(hasTamil ? "ta-IN" : data.config.supportedLanguages?.[0]?.code || "ta-IN");
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
            if (liveText.trim() || interim.trim()) { e.preventDefault(); e.returnValue = ""; }
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [liveText, interim]);

    useEffect(() => {
        qnavRefs.current[idx]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    }, [idx]);

    useEffect(() => {
        if (!listening) return;
        const iv = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
        return () => clearInterval(iv);
    }, [listening]);

    useEffect(() => {
        const body = transcriptBodyRef.current;
        if (!body) return;
        body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
    }, [liveText, interim]);

    const T = (en?: string | null, ta?: string | null) => (readLang === "TA" && ta ? ta : en || ta || "");

    const toggleSpeak = () => {
        if (listening) speech.stop();
        else void speech.start();
    };
    const handleStartOver = () => { speech.stop(); speech.reset(); speech.resetRecording(); setRecordingSeconds(0); };

    const assemble = () => {
        return (liveText + (interim ? " " + interim : "")).trim();
    };

    const switchTo = (newIdx: number) => {
        if (newIdx < 0 || newIdx >= total) return;
        if (q) workingRef.current[q.questionId] = assemble();
        speech.stop(); speech.reset(); speech.resetRecording(); setRecordingSeconds(0);
        const target = questions[newIdx];
        const w = workingRef.current[target.questionId];
        if (w) speech.setFinalText(w);
        else if (savedAnswers[target.questionId]) speech.setFinalText(savedAnswers[target.questionId]);
        else speech.setFinalText("");
        setIdx(newIdx);
    };

    const persistAnswer = async (answer: string, audioBlob?: Blob | null) => {
        setSavedAnswers((prev) => ({ ...prev, [q.questionId]: answer }));
        try {
            await metaphorService.saveAnswer({
                attemptId,
                metaphorQuestionId: q.questionId,
                spokenLanguage: speakLang,
                answerText: answer,
                audioBlob: config?.audioTranscriptionEnabled ? audioBlob : null,
            });
        } catch { /* surfaced by UI state; keep local */ }
    };

    const goNext = async () => {
        setSaving(true);
        const answer = assemble();
        const audioBlob = await speech.finalizeRecording();
        await persistAnswer(answer, audioBlob);
        setSaving(false);
        if (isLast) {
            const unansweredIdx = questions.findIndex((qq) => {
                const isCurrent = qq.questionId === q.questionId;
                if (isCurrent) return false;
                const hasSaved = !!savedAnswers[qq.questionId]?.trim();
                const hasWorking = !!workingRef.current[qq.questionId]?.trim();
                return !hasSaved && !hasWorking;
            });

            if (unansweredIdx !== -1) {
                setAlertMessage("Please answer all questions before submitting. Taking you to an unanswered question.");
                switchTo(unansweredIdx);
                return;
            }

            try { await metaphorService.finish(attemptId); } catch { /* sweep retries */ }
            setFinished(true);
            return;
        }
        switchTo(idx + 1);
    };

    const handleSaveNext = () => {
        if (!assemble() && !savedAnswers[q.questionId]) {
            setAlertMessage("Please provide an answer before continuing.");
            return;
        }
        void goNext();
    };

    const blocked = micState === "denied" || micState === "unsupported";
    const textSizeClass = (prefix: "context" | "question", text: string) => {
        const len = text.trim().length;
        if (len > 260) return `${prefix}--xlong`;
        if (len > 180) return `${prefix}--long`;
        if (len > 110) return `${prefix}--medium`;
        return `${prefix}--short`;
    };

    // ---- render ----
    if (loading) {
        return <div className="exam" data-theme={theme}><div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}>Loading...</div></div>;
    }
    if (loadError || !q) {
        return <div className="exam" data-theme={theme}><div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "var(--red-300)" }}>{loadError || "No metaphor questions for this attempt."}</div></div>;
    }

    const pct = Math.round((idx / total) * 100);
    const tcls = timeLeft <= 0 ? "is-out" : timeLeft <= 120 ? "is-low" : "";
    // Pick list excludes "auto" - students choose a real spoken language; default = Tamil.
    const speechLanguages = langs.length > 0
        ? langs
        : [{ code: "ta-IN", label: "Tamil", native: "தமிழ்" }, { code: "en-IN", label: "English", native: "English" }];
    const curLang = speechLanguages.find((l) => l.code === speakLang) || speechLanguages[0];
    const ctx = T(q.contextEn, q.contextTa);
    const imageDesc = T(q.imageDescEn, q.imageDescTa);
    const questionText = T(q.questionEn, q.questionTa);
    const hasImage = Boolean(q.imageUrl && !imageFailed);
    const spectrumBars = spectrum.length ? spectrum : Array(32).fill(0.04);
    const spectrumSplit = Math.ceil(spectrumBars.length / 2);
    const hasTranscript = liveText.trim().length > 0 || interim.trim().length > 0;
    const statuses = questions.map((qq, i) =>
        i === idx ? "current" : (savedAnswers[qq.questionId]?.trim() || workingRef.current[qq.questionId]?.trim()) ? "done" : "todo");

    return (
        <div className="exam layout-two-col" data-theme={theme}>
            {/* TOP BAR */}
            <header className="topbar">
                <div className="topbar__brand">
                    <img className="topbar__logo is-white" src="/metaphor-assets/Origin-BI-white-logo.png" alt="Origin BI" />
                    <img className="topbar__logo is-color" src="/metaphor-assets/Origin-BI-Logo-01.png" alt="Origin BI" />
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
                    <div className="theme-toggle-wrap">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    </div>
                    <button className="pill-btn" onClick={() => setShowInstructions(true)} title="How this works"><InfoIcon /><span>Instructions</span></button>
                    {onExit && (
                        <button className="leave-btn" onClick={() => setShowExitModal(true)} title="Leave assessment">
                            <CloseIcon /><span>Leave</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="exam__body">
                {/* STIMULUS */}
                <section className="stimulus">
                    <div className="stimulus__scroll">
                        <div className={`imgframe ${hasImage ? "" : "is-unavailable"}`} onClick={hasImage ? () => setZoom(true) : undefined} style={{ cursor: hasImage ? "zoom-in" : "default" }}>
                            {hasImage ? (
                                <>
                                    <img
                                        src={q.imageUrl || ""}
                                        alt=""
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            setImageFailed(true);
                                        }}
                                    />
                                    <span className="imgframe__zoom"><ExpandIcon />Click to zoom</span>
                                </>
                            ) : (
                                <div className="imgframe__state">
                                    <ImageOffIcon />
                                    <strong>Image not available</strong>
                                    {imageDesc ? <p>{imageDesc}</p> : <p>No image description is available.</p>}
                                </div>
                            )}
                        </div>
                        {hasImage && imageDesc && <div className="field-block"><p className="field-desc">{imageDesc}</p></div>}
                        {ctx && (<div className="question-block"><p className={`field-context ${textSizeClass("context", ctx)}`}>{ctx}</p></div>)}
                        <div className="question-block">
                            <span className="field-label"><span className="bar" />Question</span>
                            <h1 className={`field-question ${textSizeClass("question", questionText)}`}>{questionText}</h1>
                        </div>
                    </div>
                </section>

                {/* ANSWER PANEL */}
                <section className="answer voice-answer">
                    <div className="answer__head voice-floating-head">
                        <div className="answer__title">
                            <h3><MicIcon />Voice Response</h3>
                            <span>Your response will be transcribed automatically as you speak.</span>
                        </div>
                        <div className="lang-select dropdown align-end" ref={langRef}>
                            <span className="lang-select__cap">Answering in</span>
                            <button className={`lang-select__btn ${langOpen ? "is-open" : ""}`} onClick={() => setLangOpen((v) => !v)}>
                                <MicIcon /><span>{curLang?.native || "Auto"}</span><ChevronDownIcon className="chev" />
                            </button>
                            {langOpen && (
                                <div className="dropdown__menu">
                                    <div className="dropdown__head">Language you will speak in</div>
                                    {speechLanguages.map((l) => (
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

                    <div className={`mic-float ${listening ? "is-live" : ""}`} style={{ "--mic-level": audioLevel, "--mic-ring": `${8 + audioLevel * 18}px` } as React.CSSProperties}>
                        <div className="mic-float__spectrogram mic-float__spectrogram--left" aria-hidden="true">
                            {spectrumBars.slice(0, spectrumSplit).map((amp, i) => (
                                <span key={i} style={{ height: `${Math.max(10, amp * 100)}%`, opacity: 0.34 + amp * 0.58 }} />
                            ))}
                        </div>
                        <button
                            className="mic-fab"
                            onClick={() => { if (!listening) void speech.start(); }}
                            disabled={blocked}
                            title={listening ? "Listening…" : "Start speaking"}
                            aria-label={listening ? "Listening" : "Start speaking"}
                        >
                            <MicIcon />
                        </button>
                        <div className="mic-float__spectrogram mic-float__spectrogram--right" aria-hidden="true">
                            {spectrumBars.slice(spectrumSplit).map((amp, i) => (
                                <span key={i} style={{ height: `${Math.max(10, amp * 100)}%`, opacity: 0.34 + amp * 0.58 }} />
                            ))}
                        </div>
                    </div>
                    <div className="voice-status">
                        <span className={listening ? "is-live" : ""}>{listening ? "Listening..." : "Tap mic to speak"}</span>
                        <b>{fmtTime(recordingSeconds)}</b>
                    </div>

                    {listening && (
                        <button
                            className="stop-transcription-btn"
                            onClick={() => speech.stop()}
                            title="Stop transcription"
                            aria-label="Stop transcription"
                        >
                            <StopIcon /><span>Stop Transcription</span>
                        </button>
                    )}

                    <div className={`transcript transcript--floating ${listening ? "is-live" : ""} ${hasTranscript ? "has-text" : ""}`}>
                        <div className="transcript__head">
                            <span>Live Transcript</span>
                            {curLang?.native && <em>{curLang.native}</em>}
                        </div>
                        <div className="transcript__body" ref={transcriptBodyRef}>
                            {(liveText || interim || listening) ? (
                                <div className="transcript__text">
                                    {liveText}
                                    {interim && <span className="transcript__interim">{liveText ? " " : ""}{interim}</span>}
                                    {listening && <span className="transcript__caret" />}
                                </div>
                            ) : (
                                <p className="transcript__empty">Your spoken response will appear here.</p>
                            )}
                        </div>
                    </div>

                    {micState === "denied" && (
                        <div className="notice err"><MicOffIcon /><span><b>Microphone access is blocked.</b> Allow it from your browser address bar, then press Speak.</span></div>
                    )}
                    {micState === "unsupported" && (
                        <div className="notice warn"><WarnIcon /><span><b>Live voice is not supported here.</b> Use the latest Chrome or Edge.</span></div>
                    )}

                    <div className="mobile-voice-nav" aria-label="Voice answer controls">
                        <button
                            className="mobile-voice-nav__btn"
                            onClick={() => switchTo(idx - 1)}
                            disabled={idx === 0}
                            title="Previous question"
                            aria-label="Previous question"
                        >
                            <ArrowLeftIcon />
                        </button>
                        <button
                            className={`mobile-voice-nav__record ${listening ? "is-live" : ""}`}
                            onClick={toggleSpeak}
                            disabled={blocked}
                            title={listening ? "Stop recording" : "Start recording"}
                            aria-label={listening ? "Stop recording" : "Start recording"}
                        >
                            {listening ? <StopIcon /> : <MicIcon />}
                        </button>
                        <button
                            className="mobile-voice-nav__btn is-primary"
                            onClick={handleSaveNext}
                            disabled={saving}
                            title={isLast ? "Save and finish" : "Save and next"}
                            aria-label={isLast ? "Save and finish" : "Save and next"}
                        >
                            {isLast ? <FlagFinishIcon /> : <ArrowRightIcon />}
                        </button>
                    </div>

                    <div className="voice-actions">
                        <button className="reset-btn" onClick={handleStartOver} disabled={!assemble()}>
                            <StartOverIcon />Reset
                        </button>
                        <button className={`next-btn ${isLast ? "finish" : ""}`} onClick={handleSaveNext} disabled={saving}>
                            {isLast ? <><FlagFinishIcon />Save &amp; Finish</> : <>Save &amp; Next<ArrowRightIcon /></>}
                        </button>
                    </div>
                </section>

                {/* QUESTION RAIL */}
                <nav className="qrail" aria-label="Question navigation">
                    <button
                        className="qrail__arrow qrail__arrow--prev"
                        onClick={() => switchTo(idx - 1)}
                        disabled={idx === 0}
                        title="Previous question"
                        aria-label="Previous question"
                    >
                        <ChevronDownIcon />
                    </button>
                    <div className="qrail__list">
                        {statuses.map((st, i) => (
                            <button
                                key={i}
                                ref={(node) => { qnavRefs.current[i] = node; }}
                                className={`qnav qnav--${st}`}
                                onClick={() => switchTo(i)}
                                aria-current={st === "current"}
                                aria-label={`Question ${i + 1}${st === "done" ? " answered" : st === "current" ? " current" : ""}`}
                                title={`Question ${i + 1}${st === "done" ? " - answered" : st === "current" ? " - current" : ""}`}>
                                <span className="qnav__num">{i + 1}</span>
                                <span className="qnav__label">Q{i + 1}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        className="qrail__arrow qrail__arrow--next"
                        onClick={() => switchTo(idx + 1)}
                        disabled={idx === total - 1}
                        title="Next question"
                        aria-label="Next question"
                    >
                        <ChevronDownIcon />
                    </button>
                </nav>
            </div>

            {/* BOTTOM BAR */}
            <footer className="bottombar">
                <div className="bottombar__spacer" />
                <button className="ghost-btn" onClick={() => switchTo(idx - 1)} disabled={idx === 0}><ArrowLeftIcon />Previous</button>
                <button className={`next-btn ${isLast ? "finish" : ""}`} onClick={handleSaveNext} disabled={saving}>
                    {isLast ? <><FlagFinishIcon />Save &amp; Finish</> : <>Save &amp; Next<ArrowRightIcon /></>}
                </button>
            </footer>

            {/* LIGHTBOX */}
            {zoom && hasImage && q.imageUrl && (
                <div className="lightbox" onClick={() => setZoom(false)}>
                    <button className="lightbox__close" onClick={() => setZoom(false)}><CloseIcon /></button>
                    <div className="lightbox__inner" onClick={(e) => e.stopPropagation()} style={{ width: "min(92vw, 1100px)", aspectRatio: "16/10" }}>
                        <img src={q.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div className="lightbox__cap">{imageDesc}</div>
                    </div>
                </div>
            )}

            {/* INSTRUCTIONS */}
            {showInstructions && (
                <div className="modal-scrim">
                    <div className="modal sheet">
                        <h2>How Level 3 works</h2>
                        <p className="sheet__sub">A voice assessment - you answer out loud, one image at a time.</p>
                        <div className="sheet__steps">
                            {[
                                ["Pick your spoken language", "Use the language selector - that’s the language you’ll answer in by voice."],
                                ["Look, then speak", "Study the image, description and context. Press Speak and respond naturally - there’s no right answer."],
                                ["Speak continuously", "Your live transcript appears automatically while you answer."],
                                ["Save & Next", "Your transcript is saved for that question before you continue."],
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

            {/* ALERT MESSAGE */}
            {alertMessage && (
                <div className="modal-scrim"><div className="modal">
                    <div className="modal__icon warn"><WarnIcon /></div>
                    <h2>Attention</h2>
                    <p>{alertMessage}</p>
                    <div className="modal__actions row">
                        <button className="btn-solid" onClick={() => setAlertMessage(null)}>OK</button>
                    </div>
                </div></div>
            )}

            {/* CONFIRM EXIT */}
            {showExitModal && (
                <div className="modal-scrim"><div className="modal">
                    <div className="modal__icon warn"><WarnIcon /></div>
                    <h2>Leave assessment?</h2>
                    <p>Your saved answers will remain available. Any unsaved speech on the current question may be lost.</p>
                    <div className="modal__actions row">
                        <button className="btn-outline" onClick={() => setShowExitModal(false)}>Stay</button>
                        <button className="btn-solid danger" onClick={() => { setShowExitModal(false); onExit?.(); }}>Leave</button>
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
