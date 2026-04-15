"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon } from "lucide-react";
import CandidateDetail from "./CandidateDetail";
import { JobsIcon } from "../../icons";

// ─── Types ──────────────────────────────────────────────────────

type TabKey = "origin_report" | "resume" | "certificate1" | "certificate2" | "applied_jobs";
type SortColumn = "name" | "latestApplied";
type SortDirection = "asc" | "desc";

interface CandidateRow {
    id: string;
    name: string;
    originId: string;
    avatar: string;
    trait: string;
    traitColor: string;
    appliedJobs: { title: string; count: number }[];
    latestApplied: string;
    candidateStatus: { hired: number; shortlist: number; rejected: number };
}

// ─── Mock Data ──────────────────────────────────────────────────

const traitSeed = [
    { name: "Supportive Energizer", colorClass: "text-[#FFB020]" },
    { name: "Analytical Leader", colorClass: "text-[#13C065]" },
    { name: "Creative Thinker", colorClass: "text-[#6B7BFF]" },
    { name: "Decisive Analyst", colorClass: "text-[#00A7A0]" },
    { name: "Structured Supporter", colorClass: "text-[#A26BFF]" },
    { name: "Strategic Stabilizer", colorClass: "text-[#FF6B6B]" },
];

const mockCandidateRows: CandidateRow[] = Array.from({ length: 10 }, (_, i) => {
    const trait = traitSeed[i % traitSeed.length];

    return {
        id: `202001256_${i}`,
        name: "Monishwar Rajasekaran",
        originId: "202001256",
        avatar: `https://i.pravatar.cc/150?u=${200 + i}`,
        trait: trait.name,
        traitColor: trait.colorClass,
        appliedJobs: [
            { title: "UX/UI Designer", count: 3 },
        ],
        latestApplied: "13 May 2025",
        candidateStatus: { hired: 2, shortlist: 4, rejected: 6 },
    };
});

function parseDisplayDate(value: string): number {
    const parts = value.trim().split(" ");
    if (parts.length !== 3) return 0;

    const day = Number(parts[0]);
    const monthName = parts[1].toLowerCase();
    const year = Number(parts[2]);
    const monthMap: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };

    const month = monthMap[monthName.slice(0, 3)] ?? 0;
    if (!day || !month || !year) return 0;

    return year * 10000 + month * 100 + day;
}

function normalizeJobText(value: string): string {
    return value
        .toLowerCase()
        .replace(/ui\/ux|ux\/ui/g, "uiux")
        .replace(/[^a-z0-9]/g, "");
}

// ─── Filter Dropdown ─────────────────────────────────────────────

function FilterDropdown({
    label,
    icon,
    options,
    value,
    onChange,
    selectedTone = "neutral",
    forceGreenIcon = false,
    selectedDisplay,
}: {
    label: string;
    icon?: React.ReactNode;
    options: string[];
    value: string | null;
    onChange: (v: string | null) => void;
    selectedTone?: "green" | "neutral";
    forceGreenIcon?: boolean;
    selectedDisplay?: (value: string | null, label: string) => string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const isActive = value !== null;
    const displayLabel = selectedDisplay
        ? selectedDisplay(value, label)
        : isActive
            ? (label.includes(":") ? `${label.split(":")[0]}: ${value}` : value!)
            : label;

    const iconNode = React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `${(icon as React.ReactElement<{ className?: string }>).props.className ?? ""} ${
                forceGreenIcon
                    ? "text-[#1ED36A]"
                    : isActive && selectedTone === "green"
                    ? "text-[#19211C] dark:text-white"
                    : isActive
                        ? "text-[#1ED36A]"
                        : "text-[#7B8A84] dark:text-white/65"
            }`,
        })
        : icon;

    const buttonToneClass = isActive && selectedTone === "green"
        ? "border border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
        : "border border-gray-300/80 bg-white text-[#33413B] hover:bg-[#EEF5F1] dark:border-transparent dark:bg-white/[0.12] dark:text-white/90 dark:hover:bg-white/[0.2]";

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 h-[44px] px-4 rounded-xl text-[14px] leading-[19px] font-normal transition-colors cursor-pointer whitespace-nowrap border ${buttonToneClass}`}
            >
                {iconNode}
                <span>{displayLabel}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[170px] bg-white dark:bg-[#1F2823] border border-[#D4DCD7] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_16px_40px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1 box-border">
                    <button
                        onClick={() => { onChange(null); setOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors cursor-pointer ${
                            !value ? "text-brand-green font-medium bg-[#E7F8EE] dark:bg-[#1ED36A]/20" : "text-[#33413B] dark:text-white/90 hover:bg-[#EAF4EE] hover:text-[#19211C] dark:hover:bg-white/[0.14] dark:hover:text-white"
                        }`}
                    >
                        All
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors cursor-pointer ${
                                value === opt
                                    ? "text-brand-green font-medium bg-[#E7F8EE] dark:bg-[#1ED36A]/20"
                                    : "text-[#33413B] dark:text-white/90 hover:bg-[#EAF4EE] hover:text-[#19211C] dark:hover:bg-white/[0.14] dark:hover:text-white"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EyeIcon({ width = 31, height = 20 }: { width?: number; height?: number }) {
    return (
        <span className="inline-flex items-center justify-center">
            <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block group-hover/eye:hidden">
                <path d="M15.4697 20C9.67887 20 4.13428 15.7396 0.474369 11.3165C-0.158123 10.5521 -0.158123 9.44246 0.474369 8.67809C1.39456 7.566 3.32293 5.42048 5.89892 3.5454C12.3871 -1.17724 18.5398 -1.18635 25.0405 3.5454C28.0668 5.74819 30.4651 8.63677 30.4651 8.67809C31.0975 9.44246 31.0975 10.5521 30.4651 11.3165C26.8057 15.739 21.2619 20 15.4697 20ZM15.4697 1.89989C9.05465 1.89989 3.49375 8.01767 1.94226 9.8927C1.89213 9.95331 1.89213 10.0413 1.94226 10.1019C3.49381 11.9769 9.05465 18.0947 15.4697 18.0947C21.8848 18.0947 27.4457 11.9769 28.9972 10.1019C29.0876 9.99255 28.9912 9.8927 28.9972 9.8927C27.4456 8.01767 21.8848 1.89989 15.4697 1.89989Z" fill="#1ED36A"/>
                <path d="M15.4702 16.6658C11.7932 16.6658 8.80176 13.6743 8.80176 9.99732C8.80176 6.32032 11.7932 3.32886 15.4702 3.32886C19.1472 3.32886 22.1387 6.32032 22.1387 9.99732C22.1387 13.6743 19.1472 16.6658 15.4702 16.6658ZM15.4702 5.23413C12.8438 5.23413 10.707 7.3709 10.707 9.99732C10.707 12.6237 12.8438 14.7605 15.4702 14.7605C18.0966 14.7605 20.2334 12.6237 20.2334 9.99732C20.2334 7.3709 18.0966 5.23413 15.4702 5.23413Z" fill="#1ED36A"/>
            </svg>
            <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden group-hover/eye:block">
                <path d="M15.4692 14.7659C18.0999 14.7659 20.2324 12.6333 20.2324 10.0027C20.2324 7.37205 18.0999 5.2395 15.4692 5.2395C12.8386 5.2395 10.7061 7.37205 10.7061 10.0027C10.7061 12.6333 12.8386 14.7659 15.4692 14.7659Z" fill="#1ED36A"/>
                <path d="M30.4649 8.68329C26.8035 4.25888 21.2613 0 15.4698 0C9.67716 0 4.13358 4.26186 0.474681 8.68329C-0.158227 9.44778 -0.158227 10.5576 0.474681 11.3221C1.39457 12.4337 3.32307 14.5795 5.89876 16.4544C12.3856 21.1766 18.5397 21.1871 25.0408 16.4544C27.6165 14.5795 29.545 12.4337 30.4649 11.3221C31.096 10.5591 31.0992 9.45028 30.4649 8.68329ZM15.4698 3.33423C19.147 3.33423 22.1382 6.32551 22.1382 10.0027C22.1382 13.6799 19.147 16.6711 15.4698 16.6711C11.7926 16.6711 8.80132 13.6799 8.80132 10.0027C8.80132 6.32551 11.7926 3.33423 15.4698 3.33423Z" fill="#1ED36A"/>
            </svg>
        </span>
    );
}

// ─── Main Component ─────────────────────────────────────────────

export default function CandidatesList() {
    const jobOptionTitles = ["UI/UX", "UI/UX Designer", "Front-End Developer", "Product Manager", "Data Analyst"];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<TabKey>("origin_report");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showingMenuOpen, setShowingMenuOpen] = useState(false);
    const showingRef = useRef<HTMLDivElement>(null);
    const [traitFilter, setTraitFilter] = useState<string | null>("Supportive Energizer");
    const [statusFilter, setStatusFilter] = useState<string | null>("Shortlisted");
    const [jobFilter, setJobFilter] = useState<string | null>("UI/UX");
    const [dateFilter, setDateFilter] = useState<string | null>("Applied Date");
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateModalAnchorStyle, setDateModalAnchorStyle] = useState<{ top: number; left: number } | null>(null);
    const [calendarPreset, setCalendarPreset] = useState("Any Time");
    const [rangeStart, setRangeStart] = useState<Date | null>(new Date(2025, 9, 9));
    const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date(2025, 10, 17));
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date(2025, 9, 1));
    const [sortColumn, setSortColumn] = useState<SortColumn>("latestApplied");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const dateFilterButtonRef = useRef<HTMLButtonElement | null>(null);

    const filteredCandidateRows = useMemo(() => {
        return mockCandidateRows.filter((candidate) => {
            const query = searchTerm.trim().toLowerCase();
            const matchesSearch = !query
                || candidate.name.toLowerCase().includes(query)
                || candidate.originId.toLowerCase().includes(query)
                || candidate.appliedJobs.some((job) => job.title.toLowerCase().includes(query));

            const matchesTrait = !traitFilter || candidate.trait === traitFilter;

            const matchesStatus = !statusFilter
                || statusFilter === "Hired" && candidate.candidateStatus.hired > 0
                || statusFilter === "Shortlisted" && candidate.candidateStatus.shortlist > 0
                || statusFilter === "Rejected" && candidate.candidateStatus.rejected > 0;

            const matchesJob = !jobFilter
                || jobFilter === "UI/UX"
                || candidate.appliedJobs.some((job) => {
                    const normalizedSelected = normalizeJobText(jobFilter);
                    const normalizedJob = normalizeJobText(job.title);
                    return normalizedJob.includes(normalizedSelected) || normalizedSelected.includes(normalizedJob);
                });

            const matchesDate = !dateFilter
                || dateFilter === "Applied Date"
                || dateFilter === "Any Time"
                || dateFilter.includes(" to ")
                || candidate.latestApplied === dateFilter;

            return matchesSearch && matchesTrait && matchesStatus && matchesJob && matchesDate;
        });
    }, [searchTerm, traitFilter, statusFilter, jobFilter, dateFilter]);

    const totalEntries = filteredCandidateRows.length;
    const suggestedEntriesOptions = useMemo(() => {
        if (totalEntries <= 0) {
            return [entriesPerPage];
        }

        const baseOptions = [10, 25, 50].filter((size) => size < totalEntries);
        return Array.from(new Set([...baseOptions, totalEntries, entriesPerPage])).sort((a, b) => a - b);
    }, [totalEntries, entriesPerPage]);
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const hasMoreThanSelectedEntries = totalEntries > entriesPerPage;

    const sortedCandidateRows = useMemo(() => {
        const rows = [...filteredCandidateRows];

        rows.sort((a, b) => {
            if (sortColumn === "name") {
                return a.name.localeCompare(b.name);
            }

            return parseDisplayDate(a.latestApplied) - parseDisplayDate(b.latestApplied);
        });

        return sortDirection === "asc" ? rows : rows.reverse();
    }, [filteredCandidateRows, sortColumn, sortDirection]);

    const paginatedCandidateRows = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        return sortedCandidateRows.slice(start, end);
    }, [sortedCandidateRows, currentPage, entriesPerPage]);

    useEffect(() => {
        const safeTotalPages = Math.max(1, totalPages);
        if (currentPage > safeTotalPages) {
            setCurrentPage(safeTotalPages);
        }
    }, [currentPage, totalPages]);

    const visiblePages = useMemo(() => {
        const safeTotalPages = Math.max(1, totalPages);
        if (safeTotalPages <= 7) {
            return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, -1, safeTotalPages];
        }

        if (currentPage >= safeTotalPages - 3) {
            return [1, -1, safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
        }

        return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, safeTotalPages];
    }, [currentPage, totalPages]);

    const calendarPresets = ["Any Time", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];
    const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);
    const getMonthLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const formatShortNumericDate = (date: Date) => {
        const day = `${date.getDate()}`.padStart(2, "0");
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const year = `${date.getFullYear()}`.slice(-2);
        return `${day}/${month}/${year}`;
    };
    const formatFilterRangeLabel = (start: Date, end: Date) => {
        const startDay = `${start.getDate()}`.padStart(2, "0");
        const endDay = `${end.getDate()}`.padStart(2, "0");
        const startMonth = start.toLocaleDateString("en-US", { month: "short" });
        const endMonth = end.toLocaleDateString("en-US", { month: "short" });
        const endYear = end.getFullYear();
        return `${startDay} ${startMonth} to ${endDay} ${endMonth} ${endYear}`;
    };

    const buildMonthGrid = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const startDayIndex = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const cells: { date: Date; inCurrentMonth: boolean }[] = [];

        for (let i = 0; i < startDayIndex; i += 1) {
            cells.push({ date: new Date(year, month - 1, daysInPrevMonth - startDayIndex + i + 1), inCurrentMonth: false });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
        }

        while (cells.length < 42) {
            const nextDay = cells.length - (startDayIndex + daysInMonth) + 1;
            cells.push({ date: new Date(year, month + 1, nextDay), inCurrentMonth: false });
        }

        return cells;
    };

    const startTime = rangeStart ? normalizeDate(rangeStart) : null;
    const endTime = rangeEnd ? normalizeDate(rangeEnd) : null;
    const selectedRangeText = rangeStart && rangeEnd
        ? `${formatShortNumericDate(rangeStart)} - ${formatShortNumericDate(rangeEnd)}`
        : "No range selected";

    const handleDateCellClick = (date: Date) => {
        setCalendarPreset("Custom Range");

        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(date);
            setRangeEnd(null);
            return;
        }

        if (normalizeDate(date) < normalizeDate(rangeStart)) {
            setRangeEnd(rangeStart);
            setRangeStart(date);
            return;
        }

        setRangeEnd(date);
    };

    const isInRange = (date: Date) => {
        if (!startTime) return false;
        const time = normalizeDate(date);
        if (!endTime) return time === startTime;
        return time >= startTime && time <= endTime;
    };

    const isRangeStart = (date: Date) => startTime !== null && normalizeDate(date) === startTime;
    const isRangeEnd = (date: Date) => endTime !== null && normalizeDate(date) === endTime;

    const applyPresetRange = (preset: string) => {
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (preset === "Any Time") {
            setDateFilter("Any Time");
            setShowDateModal(false);
            return;
        }
        if (preset === "Today") {
            setDateFilter("Today");
            setShowDateModal(false);
            return;
        }
        if (preset === "Yesterday") {
            setDateFilter("Yesterday");
            setShowDateModal(false);
            return;
        }
        if (preset === "Last 7 Days") {
            setDateFilter("Past Week");
            setShowDateModal(false);
            return;
        }
        if (preset === "Last 30 Days") {
            setDateFilter("Past Month");
            setShowDateModal(false);
            return;
        }
        if (preset === "This Month") {
            const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
            const end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
            setRangeStart(start);
            setRangeEnd(end);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            setCalendarPreset("Custom Range");
            return;
        }
        if (preset === "Last Month") {
            const start = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
            const end = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
            setRangeStart(start);
            setRangeEnd(end);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            setCalendarPreset("Custom Range");
            return;
        }

        setCalendarPreset("Custom Range");
    };

    const renderCalendarMonth = (year: number, month: number, title: string) => {
        const cells = buildMonthGrid(year, month);

        return (
            <div className="w-[344px] h-[300px] rounded-[12px] bg-[#F6F9F7] dark:bg-white/[0.08] border border-[#DDE6E1] dark:border-white/[0.12] px-4 py-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2.5 text-[#22302A] dark:text-white/90 pb-2.5 border-b border-[#DDE6E1] dark:border-white/[0.12]">
                    <button type="button" onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, -1))} className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <p className="text-[14px] leading-[18px] font-normal text-[#22302A] dark:text-[#E7EFEB]">{title}</p>
                    <button type="button" onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, 1))} className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 mb-1.5">
                    {weekDays.map((day) => (
                        <span key={`${title}-${day}`} className="text-center text-[12px] leading-[16px] font-light text-[#63716B] dark:text-white/75">{day}</span>
                    ))}
                </div>
                <div className="h-[202px] grid grid-cols-7 grid-rows-6 gap-y-[2px]">
                    {cells.map((cell, index) => {
                        const day = cell.date.getDate();
                        const inRange = isInRange(cell.date);
                        const start = isRangeStart(cell.date);
                        const end = isRangeEnd(cell.date);
                        const isMuted = !cell.inCurrentMonth;
                        const colIndex = index % 7;
                        const prevCell = colIndex > 0 ? cells[index - 1] : null;
                        const nextCell = colIndex < 6 ? cells[index + 1] : null;
                        const prevInRange = Boolean(prevCell && isInRange(prevCell.date));
                        const nextInRange = Boolean(nextCell && isInRange(nextCell.date));
                        const isRangeSegmentStart = inRange && !prevInRange;
                        const isRangeSegmentEnd = inRange && !nextInRange;
                        const rangePillClass = inRange
                            ? `${isRangeSegmentStart ? "rounded-l-[100px]" : ""} ${isRangeSegmentEnd ? "rounded-r-[100px]" : ""}`
                            : "";

                        return (
                            <div key={`${title}-${cell.date.toISOString()}`} className="h-full relative flex items-center justify-center text-[12px] leading-[16px] isolate">
                                {inRange && (
                                    <div className={`absolute inset-y-[5px] z-0 bg-[#DDEFE5] dark:bg-[#204E35] ${rangePillClass}`} style={
                                        {
                                            left: isRangeSegmentStart ? "4px" : "0px",
                                            right: isRangeSegmentEnd ? "4px" : "0px"
                                        }
                                    } />
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                                    className={`relative z-10 h-8 w-8 flex items-center justify-center text-[12px] leading-[16px] font-light text-[#22302A] dark:text-white ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_2px_10px_rgba(30,211,106,0.28)] dark:shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : "rounded-full"} ${!start && !end && inRange ? "text-[#1F6A45] dark:text-white" : ""} ${!inRange && !isMuted ? "text-[#22302A] dark:text-white" : ""} ${isMuted ? "text-[#A3B1AA] dark:text-white/40" : ""}`}
                                >
                                    {day}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const toggleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortColumn(column);
        setSortDirection("asc");
    };

    const renderSortHeader = (label: string, column: SortColumn) => {
        const isActive = sortColumn === column;
        const upColor = isActive && sortDirection === "asc" ? "#1ED36A" : "#9AA8A2";
        const downColor = isActive && sortDirection === "desc" ? "#1ED36A" : "#9AA8A2";

        return (
            <button
                type="button"
                onClick={() => toggleSort(column)}
                className="inline-flex items-center gap-1.5 text-[13px] font-normal text-[#3A4741] dark:text-white hover:text-[#19211C] dark:hover:text-white transition-colors cursor-pointer"
            >
                <span>{label}</span>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="shrink-0">
                    <path d="M4 0L8 4H0L4 0Z" fill={upColor} />
                    <path d="M4 12L0 8H8L4 12Z" fill={downColor} />
                </svg>
            </button>
        );
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (showingRef.current && !showingRef.current.contains(e.target as Node)) {
                setShowingMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const openCandidate = (id: string, tab: TabKey = "origin_report") => {
        setSelectedTab(tab);
        setSelectedCandidateId(id);
    };

    const traitOptions = Array.from(new Set(mockCandidateRows.map((row) => row.trait)));
    const appliedDateLabel = dateFilter && dateFilter !== "Applied Date" ? dateFilter : "Applied Date";
    const isDateFilterActive = Boolean(
        dateFilter
        && dateFilter !== "Applied Date"
        && dateFilter !== "Any Time",
    );

    const openCandidatesDateModal = () => {
        const presetByFilter: Record<string, string> = {
            "Applied Date": "Any Time",
            "Any Time": "Any Time",
            "Today": "Today",
            "Yesterday": "Yesterday",
            "Last 7 Days": "Last 7 Days",
            "Last 30 Days": "Last 30 Days",
            "This Month": "This Month",
            "Last Month": "Last Month",
        };

        const preset = presetByFilter[dateFilter ?? "Applied Date"] ?? "Custom Range";
        setCalendarPreset(preset);

        const trigger = dateFilterButtonRef.current;
        if (trigger && typeof window !== "undefined") {
            const rect = trigger.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = Math.min(900, viewportWidth - 24);
            const modalHeight = 446;
            const gap = 12;

            const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
            const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
            setDateModalAnchorStyle({ top, left });
        }

        setShowDateModal(true);
    };

    useEffect(() => {
        if (!showDateModal) return;

        const updateAnchorPosition = () => {
            const trigger = dateFilterButtonRef.current;
            if (!trigger || typeof window === "undefined") return;

            const rect = trigger.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = Math.min(900, viewportWidth - 24);
            const modalHeight = 446;
            const gap = 12;

            const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
            const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
            setDateModalAnchorStyle({ top, left });
        };

        updateAnchorPosition();
        window.addEventListener("resize", updateAnchorPosition);
        window.addEventListener("scroll", updateAnchorPosition, true);
        return () => {
            window.removeEventListener("resize", updateAnchorPosition);
            window.removeEventListener("scroll", updateAnchorPosition, true);
        };
    }, [showDateModal]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        if (!showDateModal) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [showDateModal]);

    // Keep this conditional return after all hooks to avoid hook-order mismatch.
    if (selectedCandidateId) {
        const selectedCandidate = mockCandidateRows.find((row) => row.id === selectedCandidateId);
        return (
            <CandidateDetail
                candidateId={selectedCandidateId}
                initialTab={selectedTab}
                candidateData={selectedCandidate ? {
                    name: selectedCandidate.name,
                    originId: selectedCandidate.originId,
                    avatar: selectedCandidate.avatar,
                    trait: selectedCandidate.trait,
                    traitColor: `${selectedCandidate.traitColor.replace("text-[", "border-[")} ${selectedCandidate.traitColor}`,
                } : undefined}
                onBack={() => { setSelectedCandidateId(null); setSelectedTab("origin_report"); }}
            />
        );
    }

    return (
        <div className="thin-ui-page flex flex-col w-full min-h-screen gap-5 font-sans p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#19211C]">

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 dark:text-white/70 mb-1.5 font-light">
                <span className="hover:underline cursor-pointer">Dashboard</span>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="text-brand-green font-normal">Candidates</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h1 className="text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.15] font-normal text-[#19211C] dark:text-white">
                    Candidates
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-[14px] text-gray-500 dark:text-white/60">
                    <span className="font-light">Showing</span>
                    <div className="relative" ref={showingRef}>
                        <button
                            onClick={() => setShowingMenuOpen((prev) => !prev)}
                            className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300/70 dark:border-white/20 px-2.5 py-1 rounded-[7px] text-[14px] text-brand-green font-normal min-w-[42px] justify-between transition-colors cursor-pointer"
                        >
                            {entriesPerPage}
                            <ChevronDownIcon className={`w-3 h-3 text-gray-400 dark:text-white/50 transition-transform ${showingMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        {showingMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white dark:bg-[#1F2823] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 py-1">
                                {suggestedEntriesOptions.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            setEntriesPerPage(size);
                                            setCurrentPage(1);
                                            setShowingMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                                            entriesPerPage === size
                                                ? "text-brand-green font-medium"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A3A33] dark:hover:text-white"
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="whitespace-nowrap font-light">of {totalEntries.toLocaleString()} entries</span>
                    <div className="flex items-center gap-1.5 ml-1">
                        <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white">
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button
                            disabled={!hasMoreThanSelectedEntries}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Box — search + filters + table + progress bar all inside */}
            <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#FFFFFF14] overflow-visible">

                {/* Filters Bar */}
                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-white/[0.08]">
                    {/* Search */}
                    <div className="relative w-full lg:w-[360px]">
                        <input
                            type="text"
                            placeholder="Search by Name, OriginID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[44px] rounded-xl border border-[#B7C6BF] dark:border-white/[0.5] bg-transparent px-4 text-[15px] text-[#19211C] dark:text-white placeholder:text-[#19211C]/50 dark:placeholder:text-white/45 shadow-[0_0_0_1px_rgba(183,198,191,0.2)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition-colors focus:outline-none focus:border-[#1ED36A] focus:ring-1 focus:ring-[#1ED36A]/55"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-4 lg:w-auto">
                        <FilterDropdown
                            label="Trait:"
                            value={traitFilter}
                            onChange={setTraitFilter}
                            options={traitOptions}
                            selectedTone="green"
                        />
                        <FilterDropdown
                            label="Status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={["Hired", "Shortlisted", "Rejected"]}
                            selectedTone="green"
                        />
                        <FilterDropdown
                            label="Applied Job"
                            icon={<JobsIcon className="w-5 h-4 shrink-0 text-[#1ED36A]" />}
                            value={jobFilter}
                            onChange={setJobFilter}
                            options={jobOptionTitles}
                            selectedTone="green"
                            forceGreenIcon
                            selectedDisplay={(value) => (value ? `Applied Job (${value})` : "Applied Job")}
                        />
                        <div className={`relative ${showDateModal ? "z-[90]" : ""}`}>
                            <button
                                type="button"
                                ref={dateFilterButtonRef}
                                onClick={openCandidatesDateModal}
                                className={`h-[44px] rounded-[8px] px-4 py-[9px] text-[14px] flex items-center gap-2 font-normal cursor-pointer transition-colors whitespace-nowrap border shadow-sm dark:shadow-none ${isDateFilterActive
                                    ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                                    : "border-[#D4D8D5]/35 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#33413B] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.2]"
                                    }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#1ED36A]">
                                    <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor" />
                                    <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor" />
                                </svg>
                                <span>{appliedDateLabel}</span>
                                <ChevronDownIcon className={`w-2.5 h-2.5 ${isDateFilterActive ? "text-[#1F3B2A]/70 dark:text-white/80" : "text-gray-500 dark:text-white/60"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {showDateModal && (
                    <div className="fixed inset-0 z-[80] bg-[#FFFFFF99] dark:bg-[#19211CCC]" onClick={() => setShowDateModal(false)}>
                        <div
                            className="fixed"
                            style={{
                                top: `${dateModalAnchorStyle?.top ?? 188}px`,
                                left: `${dateModalAnchorStyle?.left ?? 12}px`,
                                width: "min(900px, calc(100vw - 24px))",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="w-full h-[446px] rounded-[24px] border border-[#D7E3DD] dark:border-white/[0.18] bg-white/95 dark:bg-[#19211CCC] shadow-[0px_16px_40px_rgba(25,33,28,0.18)] dark:shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5">
                            <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-[#E1E9E4] dark:border-white/[0.12]">
                                <p className="text-[18px] leading-[23px] font-normal text-[#19211C] dark:text-white">Select Date Range</p>
                                <button type="button" onClick={() => setShowDateModal(false)} className="w-8 h-8 rounded-full bg-[#F2F6F4] dark:bg-[rgba(50,64,57,0.82)] border border-[#DDE6E1] dark:border-white/[0.08] text-[#1ED36A] hover:bg-[#E7F3ED] dark:hover:bg-[#1ED36A]/25 hover:text-[#139555] dark:hover:text-white transition-colors flex items-center justify-center" aria-label="Close date range picker">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                                <div className="w-[126px] shrink-0 border-r border-[#E1E9E4] dark:border-white/[0.12] pr-2.5">
                                    {calendarPresets.map((preset) => {
                                        const isActivePreset = calendarPreset === preset;
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setCalendarPreset(preset);
                                                    applyPresetRange(preset);
                                                }}
                                                className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#E7F8EE] dark:bg-[#1ED36A] text-[#1F6A45] dark:text-white font-normal" : "text-[#5F6E67] dark:text-white/60 font-light hover:bg-[#F3F7F5] dark:hover:bg-white/[0.08] hover:text-[#19211C] dark:hover:text-white"}`}
                                            >
                                                {preset}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-3">
                                        {renderCalendarMonth(leftCalendarMonth.getFullYear(), leftCalendarMonth.getMonth(), getMonthLabel(leftCalendarMonth))}
                                        {renderCalendarMonth(addMonths(leftCalendarMonth, 1).getFullYear(), addMonths(leftCalendarMonth, 1).getMonth(), getMonthLabel(addMonths(leftCalendarMonth, 1)))}
                                    </div>
                                </div>
                            </div>
                            <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-[#E1E9E4] dark:border-white/[0.12] flex items-center justify-between gap-3">
                                <p className="text-[12px] leading-[16px] font-light text-[#4A5B53] dark:text-white">Selected Range : {selectedRangeText}</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCalendarPreset("Any Time");
                                            setRangeStart(null);
                                            setRangeEnd(null);
                                            setDateFilter("Any Time");
                                            setShowDateModal(false);
                                        }}
                                        className="h-7 px-4 rounded-full border border-[#CAD8D0] dark:border-white text-[#19211C] dark:text-white text-[12px] leading-[16px] font-normal hover:bg-[#EEF5F1] dark:hover:bg-white/10 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calendarPreset === "Any Time" || !rangeStart) {
                                                setDateFilter("Any Time");
                                            } else if (rangeStart && !rangeEnd) {
                                                setDateFilter(formatFilterRangeLabel(rangeStart, rangeStart));
                                            } else if (rangeStart && rangeEnd) {
                                                setDateFilter(formatFilterRangeLabel(rangeStart, rangeEnd));
                                            }
                                            setShowDateModal(false);
                                        }}
                                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-normal hover:bg-[#16BD5C] transition-colors"
                                    >
                                        Apply changes
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[980px] text-[14px]">
                        <thead>
                            <tr className="border-b-0 bg-[#F2F5F3] dark:bg-[#FFFFFF1F]">
                                <th className="text-left px-4 sm:px-5 py-3.5 whitespace-nowrap">
                                    {renderSortHeader("Name", "name")}
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[13px] font-normal text-[#3A4741] dark:text-white whitespace-nowrap">Trait</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[13px] font-normal text-[#3A4741] dark:text-white whitespace-nowrap">Applied Jobs</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 whitespace-nowrap">
                                    {renderSortHeader("Latest Applied", "latestApplied")}
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[13px] font-normal text-[#3A4741] dark:text-white whitespace-nowrap">Candidate Status</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[13px] font-normal text-[#3A4741] dark:text-white whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCandidateRows.map((candidate, candidateIndex) => (
                                <React.Fragment key={`${candidate.id}-${candidateIndex}`}>
                                <tr className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                    {/* Name + Avatar */}
                                    <td className="px-4 sm:px-5 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-white/20 shrink-0">
                                                <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[17px] leading-[22px] font-normal text-[#19211C] dark:text-white">{candidate.name}</p>
                                                <p className="text-[15px] leading-[19px] font-light text-gray-600 dark:text-white/80 mt-1">Origin ID : {candidate.originId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Trait */}
                                    <td className="px-4 sm:px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white/90 font-normal text-[17px] leading-[22px]">
                                        {candidate.trait}
                                    </td>
                                    {/* Applied Jobs — click opens Applied Jobs tab */}
                                    <td className="px-4 sm:px-5 py-5">
                                        <button
                                            onClick={() => openCandidate(candidate.id, "applied_jobs")}
                                            className="text-brand-green text-[17px] font-normal underline decoration-solid underline-offset-2 cursor-pointer text-left"
                                        >
                                            {candidate.appliedJobs[0].title}{" "}
                                            <span>+{candidate.appliedJobs[0].count}</span>
                                        </button>
                                    </td>
                                    {/* Latest Applied */}
                                    <td className="px-4 sm:px-5 py-5 text-[17px] font-normal text-[#19211C] dark:text-white whitespace-nowrap">
                                        {candidate.latestApplied}
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 sm:px-5 py-5">
                                        <div className="flex items-center gap-2 text-[14px] font-normal whitespace-nowrap">
                                            <span className="text-[#19211C] dark:text-white">Hired <span className="text-brand-green font-normal">({candidate.candidateStatus.hired})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-[#19211C] dark:text-white">Shortlist <span className="text-[#FFB020] font-normal">({candidate.candidateStatus.shortlist})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-[#19211C] dark:text-white">Rejected <span className="text-[#FF4A4A] font-normal">({candidate.candidateStatus.rejected})</span></span>
                                        </div>
                                    </td>
                                    {/* Action */}
                                    <td className="px-4 sm:px-5 py-5">
                                        <button
                                            onClick={() => openCandidate(candidate.id)}
                                            className="group/eye flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                                        >
                                            <EyeIcon width={31} height={20} />
                                        </button>
                                    </td>
                                </tr>
                                {candidateIndex < paginatedCandidateRows.length - 1 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={6} className="p-0">
                                            <div className="ml-5 mr-5 border-b border-[#E3ECE6] dark:border-[#FFFFFF26]" />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-2 mb-4 text-[14px] font-normal">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === 1}
                >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {visiblePages.map((page, index) => (
                    page === -1 ? (
                        <span key={`ellipsis-${index}`} className="px-1 text-gray-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === page ? "bg-brand-green text-white font-normal" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                        >
                            {page}
                        </button>
                    )
                ))}
                <button
                    onClick={() => setCurrentPage(Math.min(Math.max(1, totalPages), currentPage + 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage >= Math.max(1, totalPages)}
                >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mt-auto pb-4">
                <div className="flex gap-4 w-full sm:w-1/2 justify-center sm:justify-start">
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Privacy Policy</a>
                    <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Terms &amp; Conditions</a>
                </div>
                <div className="text-center sm:text-right w-full sm:w-1/2 font-normal text-sm sm:text-base text-[#19211C] dark:text-[#FFFFFF]">
                    &copy; {new Date().getFullYear()} Origin BI, Made with by{" "}
                    <span className="underline text-[#1ED36A] hover:text-[#1ED36A]/80 transition-colors cursor-pointer">
                        Touchmark Descience Pvt. Ltd.
                    </span>
                </div>
            </div>
        </div>
    );
}
