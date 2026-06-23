"use client";

import React, { useState } from "react";

interface SurveyOption {
    id: number;
    displayOrder: number;
    textEn: string | null;
    textTa: string | null;
    selected: boolean;
}
interface SurveyAnswer {
    sequence: number;
    questionId: number;
    setNumber: number | null;
    theme: string | null;
    contextEn: string | null;
    contextTa: string | null;
    questionEn: string | null;
    questionTa: string | null;
    status: string;
    answered: boolean;
    selectedOptionId: number | null;
    options: SurveyOption[];
}
export interface SurveyAnswersData {
    setNumber: number | null;
    total: number;
    answered: number;
    answers: SurveyAnswer[];
}

/**
 * Presentational view of a candidate's SURVEY answers (non-scoring).
 * Pure render - parent fetches the data and decides tab enable/disable.
 */
const SurveyAnswersView: React.FC<{ data: SurveyAnswersData | null; loading?: boolean }> = ({
    data,
    loading,
}) => {
    const [lang, setLang] = useState<"en" | "ta">("en");
    // Show the chosen language; fall back to the other if a field is missing.
    const pick = (en?: string | null, ta?: string | null) =>
        (lang === "ta" ? ta || en : en || ta) || null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
            </div>
        );
    }

    if (!data || data.total === 0) {
        return (
            <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                No survey questions were part of this assessment.
            </div>
        );
    }

    return (
        <div className="py-6">
            {/* Summary + language toggle */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
                        Survey Set {data.setNumber ?? "-"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {data.answered} of {data.total} answered
                    </span>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-0.5">
                    {([["en", "English"], ["ta", "தமிழ்"]] as const).map(([code, label]) => (
                        <button
                            key={code}
                            onClick={() => setLang(code)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                lang === code
                                    ? "bg-brand-green text-white shadow"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-5">
                {data.answers.map((a) => (
                    <div
                        key={a.questionId}
                        className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-5"
                    >
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                                Q{a.sequence}
                                {a.theme ? <span className="ml-2 text-brand-green">· {a.theme}</span> : null}
                            </span>
                            {!a.answered && (
                                <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                    Not answered
                                </span>
                            )}
                        </div>

                        {/* Optional context */}
                        {pick(a.contextEn, a.contextTa) && (
                            <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {pick(a.contextEn, a.contextTa)}
                            </p>
                        )}

                        {/* Question */}
                        {pick(a.questionEn, a.questionTa) && (
                            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                {pick(a.questionEn, a.questionTa)}
                            </p>
                        )}

                        {/* Options - selected one highlighted */}
                        <div className="space-y-2">
                            {a.options.map((o) => (
                                <div
                                    key={o.id}
                                    className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                                        o.selected
                                            ? "border-brand-green bg-brand-green/10 text-gray-900 dark:text-white"
                                            : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {/* Radio indicator - survey has no correct answer; this just
                                        shows the option the candidate selected. */}
                                    <span
                                        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                            o.selected
                                                ? "border-brand-green"
                                                : "border-gray-300 dark:border-white/25"
                                        }`}
                                    >
                                        {o.selected && (
                                            <span className="h-2 w-2 rounded-full bg-brand-green" />
                                        )}
                                    </span>
                                    <span>{pick(o.textEn, o.textTa)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SurveyAnswersView;
