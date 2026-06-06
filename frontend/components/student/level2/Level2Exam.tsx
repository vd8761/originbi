"use client";

/* ============================================================
   Level 2 "ACI" — IAT Reaction Test
   Two category cards (LEFT / RIGHT) + centered stimulus word.
   User presses E for Left, I for Right.
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { studentService } from "../../../lib/services/student.service";
import { useTheme } from "../../../contexts/ThemeContext";
import Logo from "../../ui/Logo";
import "./level2-exam.css";
import {
    CheckIcon, CheckCircleIcon, ClockIcon,
    InfoIcon, WarnIcon, ModuleIcon, StepIcon, TrialIcon,
} from "./level2-icons";

/* ---- icons used only in this file ---- */
const MoonIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const SunIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const SettingsIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);
const ZapIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

// --- Interfaces ---
interface APIOption {
    id: string | number;
    option_text: string;
    option_text_en?: string;
    option_text_ta?: string;
}

interface APIQuestion {
    id: string | number;
    question: string;
    question_text_en?: string;
    question_text_ta?: string;
    context_text_en?: string;
    context_text_ta?: string;
    options?: APIOption[];
}

interface APIAssessmentAnswer {
    id: string;
    main_question?: APIQuestion;
    open_question?: APIQuestion;
    main_option_id?: number | string;
    open_option_id?: number | string;
    status?: string;
    question_source?: string;
    open_question_id?: number | string;
}

interface Option {
    id: string;
    textEn: string;
    textTa?: string;
}

interface Question {
    id: string;
    contextTextEn?: string;
    contextTextTa?: string;
    textEn: string;        // stimulus word
    textTa?: string;
    options: Option[];     // [0]=LEFT, [1]=RIGHT
    assessmentAnswerId: string;
    source?: string;
}

interface Level2ExamProps {
    attemptId: string | number;
    onExit?: () => void;
}

const REPORT_READY_STORAGE_KEY = "studentReportReady";

// --- helpers ---
const fmtTime = (sec: number) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
};

/** Split "Young + Strategic" into ["Young", "Strategic"] */
const splitCategory = (text: string): string[] => {
    const parts = text.split(/\s*\+\s*/);
    return parts.length > 1 ? parts : [text];
};

// --- Completion Modal ---
const CompletionModal: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="l2-modal-scrim">
        <div className="l2-modal">
            <div className="l2-modal__icon"><CheckCircleIcon /></div>
            <h2>Level 2 Complete</h2>
            <p>You&apos;ve completed all trials for the Agile Culture Index (ACI) assessment.</p>
            <div className="l2-modal__actions">
                <button className="l2-btn-solid" onClick={onBack}>Back to Assessments</button>
            </div>
        </div>
    </div>
);

// --- Circular Progress SVG ---
interface CircularProgressProps {
    current: number;
    total: number;
    size?: number;
    stroke?: number;
    fontSize?: number;
    showLabel?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    current,
    total,
    size = 130,
    stroke = 7,
    fontSize = 28,
    showLabel = true,
}) => {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    const center = size / 2;
    const r = (size - stroke) / 2;
    const circ = r * 2 * Math.PI;
    const offset = circ - (pct / 100) * circ;

    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle style={{ stroke: "var(--line)", fill: "transparent" }} strokeWidth={stroke} r={r} cx={center} cy={center} />
                <circle
                    stroke="var(--green-500)" strokeWidth={stroke}
                    strokeDasharray={`${circ} ${circ}`}
                    style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.6s ease-out", fill: "transparent", filter: `drop-shadow(0 0 ${size / 16}px rgba(30,211,106,0.45))` }}
                    strokeLinecap="round" r={r} cx={center} cy={center}
                />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize, fontWeight: 800, color: "var(--fg-1)", lineHeight: 1 }}>{pct}%</span>
                {showLabel && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)", marginTop: 4 }}>Overall</span>}
            </div>
        </div>
    );
};

// =============================================================
export default function Level2Exam({ attemptId, onExit }: Level2ExamProps) {
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const [idx, setIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [overallSeconds, setOverallSeconds] = useState(0);

    const [flashSide, setFlashSide] = useState<"left" | "right" | null>(null);
    const [flashKey, setFlashKey] = useState<"E" | "I" | null>(null);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

    const { language, setLanguage } = useLanguage();
    const startTimeRef = useRef(Date.now());
    const initialLoadRef = useRef(false);
    const activeStepRef = useRef<HTMLButtonElement | null>(null);

    const total = questions.length;
    const q = questions[Math.min(idx, Math.max(0, total - 1))];

    // ---------- Timer ----------
    useEffect(() => {
        const iv = setInterval(() => setOverallSeconds((p) => p + 1), 1000);
        return () => clearInterval(iv);
    }, []);

    // ---------- Scroll Active Step into View ----------
    useEffect(() => {
        if (activeStepRef.current) {
            activeStepRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        }
    }, [idx]);

    // ---------- Load Questions ----------
    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const email = sessionStorage.getItem("userEmail") || localStorage.getItem("userEmail");
            if (!email) throw new Error("User session expired. Please log in again.");

            const profile = await studentService.getProfile(email);
            if (!profile?.id) throw new Error("Failed to fetch user profile.");

            const payload = { student_id: Number(profile.id), exam_id: Number(attemptId) };
            const examApiUrl = process.env.NEXT_PUBLIC_EXAM_ENGINE_API_URL;
            const res = await fetch(`${examApiUrl}/api/v1/exam/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to start exam (${res.status})`);
            }

            const data = await res.json();
            const apiAnswers: APIAssessmentAnswer[] = data.data || [];
            if (apiAnswers.length === 0) throw new Error("No questions available for this level.");

            const mappedAnswers: Record<string, string> = {};
            const mapped: Question[] = apiAnswers.map((ans) => {
                const qData = ans.main_question || ans.open_question;
                if (!qData) return { id: ans.id, textEn: "—", options: [], assessmentAnswerId: ans.id, source: "MAIN" };

                const ansId = String(ans.id);
                const isAnswered = ans.status && String(ans.status).toUpperCase() === "ANSWERED";
                if (isAnswered) {
                    if (ans.main_option_id) mappedAnswers[ansId] = String(ans.main_option_id);
                    else if (ans.open_option_id) mappedAnswers[ansId] = String(ans.open_option_id);
                }

                return {
                    id: String(qData.id),
                    textEn: qData.question_text_en || qData.question,
                    textTa: qData.question_text_ta,
                    contextTextEn: qData.context_text_en,
                    contextTextTa: qData.context_text_ta,
                    options: qData.options?.map((o) => ({
                        id: String(o.id),
                        textEn: o.option_text_en || o.option_text,
                        textTa: o.option_text_ta,
                    })) || [],
                    assessmentAnswerId: ansId,
                    source: ans.question_source || (ans.open_question_id ? "OPEN" : "MAIN"),
                };
            });

            setQuestions(mapped);
            setAnswers(mappedAnswers);
            const first = mapped.findIndex((qq) => !mappedAnswers[qq.assessmentAnswerId]);
            setIdx(first === -1 ? 0 : first);
        } catch (e: any) {
            setLoadError(e.message || "Failed to load assessment.");
        } finally {
            setLoading(false);
            startTimeRef.current = Date.now();
        }
    }, [attemptId]);

    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;
        void fetchQuestions();
    }, [fetchQuestions]);

    const T = (en: string, ta?: string) => {
        const t = language === "TAM" && ta ? ta : en;
        return t ? t.replace(/\\/g, "") : "";
    };

    // ---------- Submit answer ----------
    const submitAnswer = async (question: Question, optionId: string, timeSpent: number) => {
        try {
            const payload = {
                attempt_id: Number(attemptId),
                question_id: Number(question.id),
                selected_option: Number(optionId),
                time_taken: timeSpent,
                answer_change_count: 0,
                question_source: question.source || "MAIN",
                assessment_answer_id: Number(question.assessmentAnswerId),
            };
            const examApiUrl = process.env.NEXT_PUBLIC_EXAM_ENGINE_API_URL;
            await fetch(`${examApiUrl}/api/v1/exam/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("[Level2] save error:", err);
        }
    };

    // ---------- Select side (E=left, I=right) ----------
    const selectSide = useCallback(async (side: "left" | "right") => {
        if (!q || submitting || isCompleted) return;
        const optIdx = side === "left" ? 0 : 1;
        if (optIdx >= q.options.length) return;

        const optionId = q.options[optIdx].id;
        setSubmitting(true);

        // visual flash
        setFlashSide(side);
        setFlashKey(side === "left" ? "E" : "I");
        setFeedback("correct"); // assume correct for now
        setTimeout(() => { setFlashSide(null); setFlashKey(null); setFeedback(null); }, 200);

        // save
        setAnswers((prev) => ({ ...prev, [q.assessmentAnswerId]: optionId }));
        const timeSpent = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        await submitAnswer(q, optionId, timeSpent);

        // check completion
        const updatedAnswers = { ...answers, [q.assessmentAnswerId]: optionId };
        const unanswered = questions.filter((qq) => !updatedAnswers[qq.assessmentAnswerId]);

        if (unanswered.length === 0) {
            if (typeof window !== "undefined") {
                sessionStorage.setItem(REPORT_READY_STORAGE_KEY, "true");
                localStorage.setItem(REPORT_READY_STORAGE_KEY, "true");
                sessionStorage.removeItem("isAssessmentMode");
            }
            setIsCompleted(true);
        } else {
            // advance to next unanswered
            const nextIdx = questions.findIndex((qq, i) => i > idx && !updatedAnswers[qq.assessmentAnswerId]);
            const target = nextIdx !== -1 ? nextIdx : questions.findIndex((qq) => !updatedAnswers[qq.assessmentAnswerId]);
            if (target !== -1) {
                setIdx(target);
                startTimeRef.current = Date.now();
            }
        }

        setSubmitting(false);
    }, [q, submitting, isCompleted, idx, answers, questions, attemptId]);

    // ---------- Keyboard: E / I only ----------
    useEffect(() => {
        if (loading || loadError || isCompleted || !q || submitting) return;
        const handler = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
            const key = e.key.toLowerCase();
            if (key === "e") { e.preventDefault(); void selectSide("left"); }
            else if (key === "i") { e.preventDefault(); void selectSide("right"); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [loading, loadError, isCompleted, q, submitting, selectSide]);

    const answeredCount = Object.keys(answers).length;

    // Dynamic Step: map trials progress to 7 steps (matching Reference Image 1)
    const stepVal = Math.min(7, Math.floor((answeredCount / (total || 1)) * 7) + 1);

    // ---------- Extract category labels from first question's options ----------
    const leftLabel = q?.options?.[0] ? T(q.options[0].textEn, q.options[0].textTa) : "Left";
    const rightLabel = q?.options?.[1] ? T(q.options[1].textEn, q.options[1].textTa) : "Right";
    const leftParts = splitCategory(leftLabel);
    const rightParts = splitCategory(rightLabel);
    const stimulus = q ? T(q.textEn, q.textTa) : "";
    const isLongStimulus = stimulus.length > 20;
    const stimulusClass = `l2-stimulus__word ${isLongStimulus ? "is-long" : ""} ${feedback === "correct" ? "is-correct" : ""} ${feedback === "wrong" ? "is-wrong" : ""}`;

    // --- Loading ---
    if (loading) {
        return (
            <div className="l2exam">
                <div className="l2-splash"><div className="l2-splash__spin" /><p>Loading Level 2 Assessment…</p></div>
            </div>
        );
    }
    // --- Error ---
    if (loadError || !q) {
        return (
            <div className="l2exam">
                <div className="l2-error">
                    <WarnIcon />
                    <h2>Error Loading Assessment</h2>
                    <p>{loadError || "No questions available."}</p>
                    <div className="l2-error__actions">
                        <button className="l2-error__btn" onClick={() => fetchQuestions()}>Retry</button>
                        <button className="l2-error__btn" onClick={onExit}>Exit</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="l2exam">
            {isCompleted && <CompletionModal onBack={onExit || (() => {})} />}

            {/* ===== TOPBAR ===== */}
            <header className="l2-topbar">
                <div className="l2-topbar__brand">
                    <Logo className="l2-topbar__logo" />
                </div>
                <div className="l2-topbar__spacer" />
                <div className="l2-topbar__tools">
                    <button className="l2-icon-btn" onClick={toggleTheme} title="Toggle theme">
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <div className="l2-seg">
                        <button className={language !== "TAM" ? "is-active" : ""} onClick={() => setLanguage("ENG")}>ENG</button>
                        <button className={language === "TAM" ? "is-active" : ""} onClick={() => setLanguage("TAM")}>த</button>
                    </div>
                    <button className="l2-icon-btn" title="Settings"><SettingsIcon /></button>
                    <div className="l2-avatar" title="Student">S</div>
                </div>
            </header>

            {/* ===== BODY ===== */}
            <div className="l2-body">



                {/* --- CENTER CONTENT --- */}
                <main className="l2-center">
                    {/* stat strip */}
                    <section className="l2-stats">
                        <div className="l2-stat">
                            <ModuleIcon />
                            <div className="l2-stat__info">
                                <span className="l2-stat__label">Module</span>
                                <span className="l2-stat__val">1 of 6</span>
                            </div>
                        </div>
                        <div className="l2-stat">
                            <StepIcon />
                            <div className="l2-stat__info">
                                <span className="l2-stat__label">Step</span>
                                <span className="l2-stat__val">{stepVal} of 7</span>
                            </div>
                        </div>
                        <div className="l2-stat">
                            <TrialIcon />
                            <div className="l2-stat__info">
                                <span className="l2-stat__label">Trial</span>
                                <span className="l2-stat__val">{answeredCount} / {total}</span>
                            </div>
                        </div>
                        <div className="l2-stat">
                            <ClockIcon />
                            <div className="l2-stat__info">
                                <span className="l2-stat__label">Time</span>
                                <span className="l2-stat__val">{fmtTime(overallSeconds)}</span>
                            </div>
                        </div>
                    </section>

                    {/* category cards */}
                    <section className="l2-categories">
                        <div
                            className={`l2-category ${flashSide === "left" ? "is-flash" : ""}`}
                            onClick={() => void selectSide("left")}
                        >
                            <span className="l2-category__side">LEFT</span>
                            <span className="l2-category__text">
                                {leftParts.map((part, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="plus">+</span>}
                                        <span className={i === 1 ? "l2-category__text--green" : "l2-category__text--white"}>
                                            {part}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                        <div
                            className={`l2-category ${flashSide === "right" ? "is-flash" : ""}`}
                            onClick={() => void selectSide("right")}
                        >
                            <span className="l2-category__side">RIGHT</span>
                            <span className="l2-category__text">
                                {rightParts.map((part, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="plus">+</span>}
                                        <span className={i === 1 ? "l2-category__text--green" : "l2-category__text--white"}>
                                            {part}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                    </section>

                    {/* stimulus word */}
                    <div className="l2-stimulus">
                        <span
                            key={idx}
                            className={stimulusClass}
                        >
                            {stimulus}
                        </span>
                    </div>

                    {/* key indicators / touch indicators */}
                    <div className="w-full flex flex-col items-center justify-center mt-2">
                        {/* Desktop key indicators */}
                        <div className="l2-keys">
                            <div
                                className={`l2-key ${flashKey === "E" ? "is-flash" : ""}`}
                                onClick={() => void selectSide("left")}
                            >
                                <div className="l2-key__badge">E</div>
                                <div className="l2-key__label">
                                    <span className="l2-key__action">Press <b>E</b></span>
                                    <span className="l2-key__dir">for Left</span>
                                </div>
                            </div>
                            <div className="l2-key__divider" />
                            <div
                                className={`l2-key ${flashKey === "I" ? "is-flash" : ""}`}
                                onClick={() => void selectSide("right")}
                            >
                                <div className="l2-key__badge">I</div>
                                <div className="l2-key__label">
                                    <span className="l2-key__action">Press <b>I</b></span>
                                    <span className="l2-key__dir">for Right</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile touch helper */}
                        <div className="l2-mobile-touch-helper items-center justify-center gap-2 p-2 bg-brand-light-primary dark:bg-white/5 border border-brand-light-tertiary dark:border-white/10 rounded-full px-4 mb-4 select-none">
                            <span className="text-sm">👆</span>
                            <span className="text-[11px] font-semibold text-brand-text-light-secondary dark:text-gray-400">
                                {language === "TAM" ? "பதிலளிக்க இடது அல்லது வலது வகை அட்டையைத் தட்டவும்" : "Tap Left or Right Category Card to answer"}
                            </span>
                        </div>
                    </div>

                    {/* bottom hints */}
                    <div className="l2-hints">
                        <div className="l2-hint l2-hint--info">
                            <InfoIcon style={{ width: 15, height: 15 }} />
                            <span>Pause unavailable during timed block.</span>
                        </div>
                        <div className="l2-hint l2-hint--warn">
                            <ZapIcon style={{ width: 15, height: 15 }} />
                            <span>If you press the wrong key, correct it and continue.</span>
                        </div>
                    </div>
                </main>


                {/* --- RIGHT SIDEBAR (PROGRESS & STEPPER QUESTIONS) --- */}
                <aside className="l2-sidebar">
                    {/* Desktop Test Progress Block */}
                    <div className="l2-progress hidden md:flex">
                        <span className="l2-progress__title">Test Progress</span>
                        <CircularProgress current={answeredCount} total={total} size={130} stroke={7} fontSize={28} showLabel={true} />
                        <span className="l2-progress__desc">
                            You&apos;re in the timed <b>Reaction Test</b> block.
                        </span>
                    </div>

                    <div className="l2-stepper">
                        <div className="l2-stepper__line" />
                        {questions.map((qq, i) => {
                            const isCurrent = i === idx;
                            const isDone = !!answers[qq.assessmentAnswerId];
                            const cls = isCurrent ? "is-current" : isDone ? "is-done" : "";
                            return (
                                <button
                                    key={i}
                                    ref={isCurrent ? activeStepRef : null}
                                    onClick={() => { setIdx(i); startTimeRef.current = Date.now(); }}
                                    className={`l2-step-btn ${cls}`}
                                    title={`Trial ${i + 1}`}
                                >
                                    <div className="l2-step__circle">
                                        <span>{i + 1}</span>
                                    </div>
                                    <span className="l2-step__label">Trial {i + 1}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mobile Test Progress (Small, placed in the top right corner beside horizontal stepper) */}
                    <div className="l2-progress-mobile flex md:hidden items-center gap-2">
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-light-secondary dark:text-gray-400">Progress</span>
                            <span className="text-[11px] font-black text-brand-green">{answeredCount}/{total}</span>
                        </div>
                        <CircularProgress current={answeredCount} total={total} size={36} stroke={3} fontSize={10} showLabel={false} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
