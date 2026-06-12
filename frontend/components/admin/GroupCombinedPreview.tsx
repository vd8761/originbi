"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { assessmentService } from "../../lib/services/assessment.service";
import { buildReportApiUrl } from "../../lib/utils/reportUrl";
import {
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    EyeVisibleIcon,
} from "../icons";
import ExcelExportButton from "../ui/ExcelExportButton";
import AddCandidateModal from "./AddCandidateModal";

interface GroupCombinedPreviewProps {
    groupId: string | number;
    programId: string | number;
    onBack: () => void;
    onViewSession?: (sessionId: string) => void;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return dateStr;
    }
};

/**
 * Combined "By Group" detail: shows every exam window for a (group, program)
 * plus the merged candidate list (deduped to one row per student, latest
 * completed). One "Generate Combined Report" button covers all windows via the
 * group-scoped report endpoint.
 *
 * Visually mirrors GroupAssessmentPreview (the "By Assessment" detail) so the
 * two entry points feel identical: breadcrumb + back header, dark summary card,
 * and the same candidate table styling, plus Excel export and Add Candidate.
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
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const isDownloadingRef = useRef(false);

    // Level 1 Behavioural (DISC-only) report is currently College only.
    const isLevel1Available = Number(programId) === 2;

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await assessmentService.getGroupCombined(groupId, programId);
            setData(res);
        } catch (e: any) {
            setError(e?.message || "Failed to load combined group details");
        } finally {
            setLoading(false);
        }
    };

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

    const statusPill = (status?: string) => {
        const s = (status || "NOT_STARTED").toUpperCase();
        return (
            <span
                className={`px-3 py-1 rounded-md text-[10px] font-bold border tracking-wide uppercase
                    ${s === "COMPLETED"
                        ? "bg-brand-green text-brand-dark-primary border-brand-green"
                        : s === "IN_PROGRESS" || s === "ON_GOING"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                            : s === "EXPIRED"
                                ? "bg-brand-red/20 text-brand-red border-brand-red/30"
                                : "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
                {s.replace(/_/g, " ")}
            </span>
        );
    };

    // First exam window — used as the target for Add Candidate (candidates are
    // added to a concrete assessment window, not the abstract combined view).
    const firstWindowId: string | number | undefined = data?.assessments?.[0]?.id;

    const handleExport = () => {
        if (!data) return;

        const summaryRows: any[][] = [
            ["Group Combined Summary"],
            ["Exam Title", data.program?.assessmentTitle || data.program?.name || "N/A"],
            ["Program Name", data.program?.name || "N/A"],
            ["Group Name", data.group?.name || "N/A"],
            ["Assessment Windows", data.totalAssessments ?? 0],
            ["No. of Candidates", data.totalCandidates ?? 0],
            [],
            ["List of Candidates"],
            ["Name", "Email ID", "Exam Status"],
        ];

        const candidateRows = (data.sessions || []).map((s: any) => [
            s.userFullName,
            s.userEmail,
            s.status,
        ]);

        const csvContent = [
            ...summaryRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
            ...candidateRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Group_Combined_${data.group?.name || "Export"}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-gray-500">{error || "Group not found."}</p>
                <button onClick={onBack} className="text-brand-green hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 font-sans h-full">
            {firstWindowId !== undefined && (
                <AddCandidateModal
                    isOpen={showAddCandidate}
                    groupAssessmentId={firstWindowId}
                    onClose={() => setShowAddCandidate(false)}
                    onSuccess={() => loadData()}
                />
            )}

            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span onClick={onBack} className="cursor-pointer hover:underline">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span onClick={onBack} className="cursor-pointer hover:underline">Registrations</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Group Combined Preview</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-brand-purple dark:text-white" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-brand-purple dark:text-white">
                        Group Combined Preview
                    </h1>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-brand-dark-primary p-6 rounded-2xl text-white relative shadow-lg ring-1 ring-white/5">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 bg-brand-green rounded-full"></div>
                    <h2 className="text-sm text-white/70 font-semibold uppercase tracking-wider">Group Summary</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">Exam Title</p>
                        <p className="text-base font-semibold text-white">{data.program?.assessmentTitle || data.program?.name || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">Program Name</p>
                        <p className="text-base font-semibold text-white">{data.program?.name || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">Group Name</p>
                        <p className="text-base font-semibold text-white">{data.group?.name || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">Exam Type</p>
                        <p className="text-base font-semibold text-white">WebApp</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">Assessment Windows</p>
                        <p className="text-base font-semibold text-white">{data.totalAssessments ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 mb-1.5 font-medium">No. of Candidates</p>
                        <p className="text-base font-semibold text-white">{data.totalCandidates ?? 0}</p>
                    </div>
                </div>
            </div>

            {/* Assessment Windows */}
            <div>
                <h2 className="text-sm font-semibold text-brand-purple dark:text-white mb-2">Assessment Windows</h2>
                <div className="overflow-hidden rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F8FAFC] dark:bg-[#FFFFFF1F] text-left text-xs uppercase tracking-wider text-[#19211C] dark:text-brand-text-secondary">
                            <tr>
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                                <th className="p-4 font-semibold">Candidates</th>
                                <th className="p-4 font-semibold">Starts On</th>
                                <th className="p-4 font-semibold">Ends On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                            {(data.assessments || []).map((ga: any, i: number) => (
                                <tr key={ga.id} className="hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] transition-colors">
                                    <td className="p-4 text-[#19211C] dark:text-brand-text-secondary">{i + 1}</td>
                                    <td className="p-4 text-center">{statusPill(ga.status)}</td>
                                    <td className="p-4 text-[#19211C] dark:text-brand-text-secondary">{ga.totalCandidates ?? 0}</td>
                                    <td className="p-4 text-[#19211C] dark:text-brand-text-secondary">{formatDate(ga.validFrom)}</td>
                                    <td className="p-4 text-[#19211C] dark:text-brand-text-secondary">{formatDate(ga.validTo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Candidates List Header + Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <h2 className="text-xl font-semibold text-brand-purple dark:text-white">
                    List of Candidates
                </h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowReportModal(true)}
                        disabled={generating || data.totalCandidates === 0}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm
                            ${generating || data.totalCandidates === 0
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/30"}`}
                    >
                        <span>{generating ? (progress || "Generating...") : "Generate Combined Report"}</span>
                        {generating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
                        ) : (
                            <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                    <ExcelExportButton onClick={handleExport} />
                    {firstWindowId !== undefined && (
                        <button
                            onClick={() => setShowAddCandidate(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-all whitespace-nowrap"
                        >
                            + Add Candidate
                        </button>
                    )}
                </div>
            </div>

            {/* Candidates Table */}
            <div className="flex-1 min-h-[300px] flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    <table className="w-full border-collapse relative min-w-[700px]">
                        <thead className="sticky top-0 z-20 bg-[#F8FAFC] dark:bg-[#FFFFFF1F] shadow-sm">
                            <tr className="text-left">
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-16 uppercase">Action</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Name</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Email ID</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center uppercase">Exam Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                            {(data.sessions || []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">No candidates found.</td>
                                </tr>
                            ) : (
                                (data.sessions || []).map((s: any) => (
                                    <tr key={s.id} className="hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] transition-colors group">
                                        <td className="p-4 text-center">
                                            {onViewSession && (
                                                <button
                                                    onClick={() => onViewSession(String(s.id))}
                                                    className="p-1 hover:bg-brand-light-tertiary dark:hover:bg-white/10 rounded-full transition-colors text-brand-green transform group-hover:scale-110"
                                                    title="View Results"
                                                >
                                                    <EyeVisibleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">{s.userFullName}</td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{s.userEmail}</td>
                                        <td className="p-4 text-center">{statusPill(s.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk report-type selection popup */}
            {/* Rendered via a portal to document.body so `position: fixed`
                centres on the viewport — an ancestor's CSS transform would
                otherwise become the containing block and push the modal
                off-screen, forcing the user to scroll. */}
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
        </div>
    );
};

export default GroupCombinedPreview;
