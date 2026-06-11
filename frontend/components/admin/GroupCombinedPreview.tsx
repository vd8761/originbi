"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { assessmentService } from "../../lib/services/assessment.service";
import { buildReportApiUrl } from "../../lib/utils/reportUrl";

interface GroupCombinedPreviewProps {
    groupId: string | number;
    programId: string | number;
    onBack: () => void;
    onViewSession?: (sessionId: string) => void;
}

/**
 * Combined "By Group" detail: shows every exam window for a (group, program)
 * plus the merged candidate list (deduped to one row per student, latest
 * completed). One "Generate Combined Report" button covers all windows via the
 * group-scoped report endpoint.
 */
const GroupCombinedPreview: React.FC<GroupCombinedPreviewProps> = ({
    groupId,
    programId,
    onBack,
    onViewSession,
}) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const isDownloadingRef = useRef(false);

    // Level 1 Behavioural (DISC-only) report is currently College only.
    const isLevel1Available = Number(programId) === 2;

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const res = await assessmentService.getGroupCombined(groupId, programId);
                if (active) setData(res);
            } catch (e: any) {
                if (active) setError(e?.message || "Failed to load combined group details");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [groupId, programId]);

    const fmt = (d?: string) =>
        d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

    const statusPill = (status?: string) => {
        const s = (status || "NOT_STARTED").toUpperCase();
        const cls =
            s === "COMPLETED"
                ? "bg-brand-green/15 text-brand-green"
                : s === "IN_PROGRESS"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300";
        const label = s === "IN_PROGRESS" ? "In Progress" : s === "COMPLETED" ? "Completed" : "Not Started";
        return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
    };

    const handleGenerateCombinedReport = async (
        variant: "full" | "short" | "level1" = "full",
    ) => {
        if (!data?.group?.id || isDownloadingRef.current) return;
        try {
            isDownloadingRef.current = true;
            setShowReportModal(false);
            setGenerating(true);
            setProgress("Initializing...");

            const variantQuery = variant === "full" ? "" : `&reportType=${variant}`;
            const startRes = await fetch(
                buildReportApiUrl(
                    `/generate/group/${data.group.id}?programId=${programId}${variantQuery}&json=true`,
                ),
            );
            const startData = await startRes.json();
            if (!startData.success || !startData.jobId) {
                throw new Error("Failed to start report generation");
            }
            const jobId = startData.jobId;

            let isComplete = false;
            while (!isComplete && isDownloadingRef.current) {
                const statusRes = await fetch(buildReportApiUrl(`/download/status/${jobId}?json=true`));
                const statusData = await statusRes.json();
                if (statusData.status === "PROCESSING") {
                    setProgress(statusData.progress || "Processing...");
                    await new Promise((r) => setTimeout(r, 1000));
                } else if (statusData.status === "COMPLETED") {
                    isComplete = true;
                    setProgress("Download Starting...");
                    if (!statusData.downloadUrl) throw new Error("Download URL missing.");
                    window.location.href = buildReportApiUrl(statusData.downloadUrl);
                    setTimeout(() => {
                        setGenerating(false);
                        setProgress("");
                    }, 2000);
                } else if (statusData.status === "ERROR") {
                    isComplete = true;
                    throw new Error(statusData.error || "Generation failed");
                }
            }
        } catch (e: any) {
            console.error("Combined report failed", e);
            setProgress("Failed");
            setGenerating(false);
        } finally {
            isDownloadingRef.current = false;
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <button onClick={onBack} className="mb-4 text-sm text-brand-green hover:underline">← Back</button>
                <p className="text-red-500">{error || "Not found"}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto pt-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 px-2">
                <div>
                    <button onClick={onBack} className="mb-2 text-sm text-brand-green hover:underline">← Back to Group Assessments</button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.group?.name || "Group"} <span className="text-gray-400 font-normal">·</span>{" "}
                        {data.program?.name || data.program?.assessmentTitle || "Program"}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Combined across <strong>{data.totalAssessments}</strong> assessment window
                        {data.totalAssessments === 1 ? "" : "s"} · <strong>{data.totalCandidates}</strong> candidate
                        {data.totalCandidates === 1 ? "" : "s"} (deduped to latest attempt per student)
                    </p>
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    disabled={generating || data.totalCandidates === 0}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                        generating || data.totalCandidates === 0
                            ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-80"
                            : "bg-brand-green hover:bg-emerald-500"
                    }`}
                >
                    {generating ? (progress || "Generating...") : "Generate Combined Report"}
                </button>
            </div>

            {/* Bulk report-type selection popup */}
            {/* Rendered via a portal to document.body so `position: fixed`
                centres on the viewport — an ancestor's CSS transform
                (animate-fade-in) would otherwise become the containing block
                and push the modal off-screen, forcing the user to scroll. */}
            {showReportModal && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setShowReportModal(false)}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-[#19211C] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
                            <h3 className="text-sm font-bold text-[#150089] dark:text-white">Generate Combined Report</h3>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Which bulk report should be generated for this group?
                            </p>
                        </div>
                        <div className="p-3 space-y-2">
                            <button
                                onClick={() => handleGenerateCombinedReport("full")}
                                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-green hover:bg-brand-green/5 transition-colors flex items-center gap-3"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-xs font-bold text-brand-green">1</span>
                                <span>
                                    <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">Full Report</span>
                                    <span className="block text-[11px] text-gray-500 dark:text-gray-400">Complete detailed report</span>
                                </span>
                            </button>
                            <button
                                onClick={() => handleGenerateCombinedReport("short")}
                                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-green hover:bg-brand-green/5 transition-colors flex items-center gap-3"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-500">2</span>
                                <span>
                                    <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">Short Report</span>
                                    <span className="block text-[11px] text-gray-500 dark:text-gray-400">Program summary report</span>
                                </span>
                            </button>
                            {isLevel1Available && (
                                <button
                                    onClick={() => handleGenerateCombinedReport("level1")}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-green hover:bg-brand-green/5 transition-colors flex items-center gap-3"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-xs font-bold text-brand-green">3</span>
                                    <span>
                                        <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">Level 1 Report</span>
                                        <span className="block text-[11px] text-gray-500 dark:text-gray-400">Level 1 Behavioural (DISC) snapshot</span>
                                    </span>
                                </button>
                            )}
                        </div>
                        <div className="px-3 pb-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-full px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}

            {/* Assessment windows */}
            <div className="px-2 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Assessment Windows</h2>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2 font-medium">#</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium">Candidates</th>
                                <th className="px-4 py-2 font-medium">Starts</th>
                                <th className="px-4 py-2 font-medium">Ends</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                            {(data.assessments || []).map((ga: any, i: number) => (
                                <tr key={ga.id}>
                                    <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                                    <td className="px-4 py-2">{statusPill(ga.status)}</td>
                                    <td className="px-4 py-2">{ga.totalCandidates ?? 0}</td>
                                    <td className="px-4 py-2">{fmt(ga.validFrom)}</td>
                                    <td className="px-4 py-2">{fmt(ga.validTo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Combined candidates */}
            <div className="px-2 pb-12">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Candidates ({data.totalCandidates})
                </h2>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Email</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                            {(data.sessions || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No candidates yet.</td>
                                </tr>
                            )}
                            {(data.sessions || []).map((s: any) => (
                                <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                    <td className="px-4 py-2 text-gray-900 dark:text-white">{s.userFullName}</td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.userEmail}</td>
                                    <td className="px-4 py-2">{statusPill(s.status)}</td>
                                    <td className="px-4 py-2 text-right">
                                        {onViewSession && (
                                            <button
                                                onClick={() => onViewSession(String(s.id))}
                                                className="text-xs font-medium text-brand-green hover:underline"
                                            >
                                                View
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GroupCombinedPreview;
