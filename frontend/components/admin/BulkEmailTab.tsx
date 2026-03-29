"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { assessmentService, AssessmentSession } from "../../lib/services/assessment.service";
import DateRangeFilter, { DateRangeOption } from "../ui/DateRangeFilter";
import DateRangePickerModal from "../ui/DateRangePickerModal";
import {
    EmailIcon,
    CheckIcon,
    LoadingIcon,
    ChevronDownIcon,
    FilterFunnelIcon,
} from "../icons";

// ─── Utilities ───────────────────────────────────────────────────────────────

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

const getEmailStatusInfo = (session: AssessmentSession): { label: string; color: string; sentTo: string } => {
    if (!session.emailSent) {
        return { label: "Not Sent", color: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400", sentTo: "-" };
    }
    const userEmail = session.user?.email || "";
    if (session.emailSentTo && session.emailSentTo === userEmail) {
        return { label: "Sent", color: "bg-brand-green/15 text-brand-green", sentTo: session.emailSentTo };
    }
    return {
        label: "Sent (3rd party)",
        color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
        sentTo: session.emailSentTo || "-",
    };
};

const STATUS_COLORS: Record<string, string> = {
    COMPLETED: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    IN_PROGRESS: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
    ON_GOING: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
    ASSIGNED: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    NOT_STARTED: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
    EXPIRED: "bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400",
};

// ─── Main Component ────────────────────────────────────────────────────────────

interface BulkEmailTabProps {
    onViewSession: (session: AssessmentSession) => void;
    page: number;
    entriesPerPage: number;
    onTotalChange: (total: number) => void;
}

const BulkEmailTab: React.FC<BulkEmailTabProps> = ({ onViewSession, page, entriesPerPage, onTotalChange }) => {
    // ── Data State ──
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Filter State ──
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 400);
    const [emailStatusFilter, setEmailStatusFilter] = useState<"all" | "sent" | "not_sent" | "third_party">("all");
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("All");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    // ── Selection State ──
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // ── Send State ──
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // ── Email Status Filter dropdown ──
    const [showEmailDropdown, setShowEmailDropdown] = useState(false);
    const emailDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (emailDropdownRef.current && !emailDropdownRef.current.contains(e.target as Node)) setShowEmailDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const fmt = (d: Date | null) => {
                if (!d) return undefined;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
            };

            const res = await assessmentService.getSessions(
                page,
                entriesPerPage,
                debouncedSearch,
                "exam_starts_on",
                "DESC",
                {
                    type: "individual",
                    start_date: fmt(startDate),
                    end_date: fmt(endDate),
                    emailStatus: emailStatusFilter !== "all" ? (emailStatusFilter as any) : undefined,
                },
            );
            setSessions(res.data);
            onTotalChange(res.total);
        } catch (err) {
            console.error("BulkEmailTab fetch failed", err);
        } finally {
            setLoading(false);
        }
    }, [page, entriesPerPage, debouncedSearch, startDate, endDate, emailStatusFilter, onTotalChange]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    // ── Selection helpers ──
    const completedSessions = sessions.filter(s => s.status === "COMPLETED");
    const completedIds = new Set(completedSessions.map(s => s.id));
    const allCompletedSelected = completedIds.size > 0 && [...completedIds].every(id => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (allCompletedSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                completedIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                completedIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    const toggleRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // ── Send handler ──
    const handleSendEmails = async () => {
        if (sending || selectedIds.size === 0) return;
        setSending(true);
        setToast(null);
        try {
            const userIds: number[] = sessions
                .filter(s => selectedIds.has(s.id) && s.status === "COMPLETED")
                .map(s => Number(s.userId))
                .filter(id => !isNaN(id) && id > 0);

            if (userIds.length === 0) {
                setToast({ type: "error", msg: "No valid users found for selected sessions." });
                setSending(false);
                return;
            }

            const result = await assessmentService.sendBulkReportEmails(userIds);

            // Optimistic update
            setSessions(prev => prev.map(s => {
                if (!selectedIds.has(s.id)) return s;
                return { ...s, emailSent: true, emailSentTo: s.user?.email || "" };
            }));
            setSelectedIds(new Set());

            const msg = result.failed?.length > 0
                ? `${result.enqueued} job(s) queued. ${result.failed.length} failed.`
                : `${result.enqueued} email job(s) queued successfully!`;
            setToast({ type: result.failed?.length > 0 ? "error" : "success", msg });
            setTimeout(() => setToast(null), 6000);
        } catch (err) {
            console.error("Bulk send failed", err);
            setToast({ type: "error", msg: "Failed to queue emails. Please try again." });
        } finally {
            setSending(false);
        }
    };

    // ── Pagination ──
    // (page & entriesPerPage come from parent — no local state needed)

    // ── Date Range ──
    const handleDateRangeSelect = (option: DateRangeOption) => {
        if (option === "Custom Range") { setIsDateModalOpen(true); return; }
        setDateRangeLabel(option);
        const now = new Date();
        let s: Date | null = null;
        let e: Date | null = null;
        if (option !== "All") {
            e = now;
            if (option === "Yesterday") { const y = new Date(now); y.setDate(now.getDate() - 1); s = y; e = y; }
            else if (option === "Last 7 Days") { s = new Date(now); s.setDate(now.getDate() - 6); }
            else if (option === "Last 30 Days") { s = new Date(now); s.setDate(now.getDate() - 29); }
            else if (option === "This Month") { s = new Date(now.getFullYear(), now.getMonth(), 1); }
            else if (option === "Last Month") { s = new Date(now.getFullYear(), now.getMonth() - 1, 1); e = new Date(now.getFullYear(), now.getMonth(), 0); }
        }
        setStartDate(s);
        setEndDate(e);
    };

    const handleDateModalApply = (start: Date, end: Date, label: string) => {
        setStartDate(start);
        setEndDate(end);
        if (label === "Custom Range") {
            const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
            setDateRangeLabel(`${fmt(start)} - ${fmt(end)}`);
        } else {
            setDateRangeLabel(label);
        }
    };

    const emailFilterLabels: Record<string, string> = {
        all: "All Mail Status",
        not_sent: "Not Sent",
        sent: "Sent",
        third_party: "Sent to 3rd Party",
    };

    // ── Render ──
    return (
        <div className="flex flex-col gap-4">
            <DateRangePickerModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onApply={handleDateModalApply}
                initialRange={{ start: startDate, end: endDate, label: dateRangeLabel }}
            />

            {/* ── Action Bar (top) ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#FFFFFF0A] border border-gray-200 dark:border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-brand-green/10 border border-brand-green/20">
                        <EmailIcon className="w-4 h-4 text-brand-green" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#150089] dark:text-white">Bulk Email Sender</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                            Select completed candidates below and queue their report emails.
                            {selectedIds.size > 0 && (
                                <span className="ml-2 text-brand-green font-semibold">{selectedIds.size} selected</span>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSendEmails}
                    disabled={sending || selectedIds.size === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                        selectedIds.size > 0 && !sending
                            ? "bg-brand-green hover:bg-brand-green/90 text-black shadow-lg shadow-brand-green/20"
                            : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {sending ? (
                        <><LoadingIcon className="w-4 h-4 animate-spin" /> Queueing...</>
                    ) : (
                        <><EmailIcon className="w-4 h-4" /> {selectedIds.size > 0 ? `Send Emails (${selectedIds.size})` : "Send Emails"}</>
                    )}
                </button>
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
                    toast.type === "success"
                        ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                }`}>
                    {toast.type === "success" ? <CheckIcon className="w-4 h-4 flex-shrink-0" /> : <span className="flex-shrink-0">⚠</span>}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* ── Filters Row ── */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                {/* Left: Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search name, email, mobile..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Right: Filters only (pagination is in the shared top bar) */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    {/* Date Range */}
                    <DateRangeFilter
                        selectedRange={dateRangeLabel}
                        onRangeSelect={handleDateRangeSelect}
                    />

                    {/* Email Status Filter */}
                    <div className="relative" ref={emailDropdownRef}>
                        <button
                            onClick={() => setShowEmailDropdown(v => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer text-[#19211C] dark:text-white"
                        >
                            <FilterFunnelIcon className="w-4 h-4" />
                            <span>{emailFilterLabels[emailStatusFilter]}</span>
                            <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-white" />
                        </button>
                        {showEmailDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                {(["all", "not_sent", "sent", "third_party"] as const).map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { setEmailStatusFilter(opt); setShowEmailDropdown(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                            emailStatusFilter === opt
                                                ? "text-brand-green bg-gray-50 dark:bg-white/5"
                                                : "text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        <span>{emailFilterLabels[opt]}</span>
                                        {emailStatusFilter === opt && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(32,210,125,0.6)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={allCompletedSelected}
                                        onChange={toggleSelectAll}
                                        disabled={completedIds.size === 0}
                                        title="Select all completed"
                                        className="w-4 h-4 rounded accent-brand-green cursor-pointer disabled:opacity-40"
                                    />
                                </th>
                                {["Candidate Name", "Email", "Mobile", "Program", "Exam Status", "Starts On", "Ends On", "Email Status", "Sent To", "Action"].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={11} className="px-4 py-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-400">
                                        <LoadingIcon className="w-4 h-4 animate-spin text-brand-green" />
                                        <span className="text-sm">Loading sessions...</span>
                                    </div>
                                </td></tr>
                            ) : sessions.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                                    No sessions found matching your filters.
                                </td></tr>
                            ) : (
                                sessions.map(session => {
                                    const isCompleted = session.status === "COMPLETED";
                                    const isSelected = selectedIds.has(session.id);
                                    const { label: emailLabel, color: emailColor, sentTo } = getEmailStatusInfo(session);
                                    const statusColor = STATUS_COLORS[session.status] || STATUS_COLORS.NOT_STARTED;
                                    const name = session.registration?.fullName || "-";
                                    const email = session.user?.email || "-";
                                    const mobile = session.registration?.mobileNumber
                                        ? `${session.registration.countryCode || ""} ${session.registration.mobileNumber}`.trim()
                                        : "-";
                                    const program = session.program?.name || "-";

                                    return (
                                        <tr
                                            key={session.id}
                                            className={`border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors ${
                                                isCompleted
                                                    ? isSelected
                                                        ? "bg-brand-green/5 dark:bg-brand-green/5"
                                                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                                                    : "opacity-45"
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => isCompleted && toggleRow(session.id)}
                                                    disabled={!isCompleted}
                                                    className="w-4 h-4 rounded accent-brand-green cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-[#19211C] dark:text-white whitespace-nowrap">{name}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate" title={email}>{email}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">{mobile}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[140px] truncate text-xs" title={program}>{program}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${statusColor}`}>
                                                    {session.status?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">{formatDate(session.validFrom)}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">{formatDate(session.validTo)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${emailColor}`}>
                                                    {emailLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[150px] truncate text-xs" title={sentTo}>
                                                {sentTo}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => onViewSession(session)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-brand-green hover:bg-brand-green/10 transition-colors whitespace-nowrap"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BulkEmailTab;
