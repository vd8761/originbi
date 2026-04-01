"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
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
        : "border border-gray-300/80 bg-transparent text-[#33413B] hover:bg-black/[0.04] dark:border-transparent dark:bg-white/[0.12] dark:text-white/90 dark:hover:bg-white/[0.16]";

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 h-[44px] px-4 rounded-xl text-[13px] leading-[18px] font-medium transition-colors cursor-pointer whitespace-nowrap border ${buttonToneClass}`}
            >
                {iconNode}
                <span>{displayLabel}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[170px] bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden py-1 box-border">
                    <button
                        onClick={() => { onChange(null); setOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors cursor-pointer ${
                            !value ? "text-brand-green font-semibold bg-white/10 dark:bg-white/10" : "text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10"
                        }`}
                    >
                        All
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors cursor-pointer ${
                                value === opt
                                    ? "text-brand-green font-semibold bg-white/10 dark:bg-white/10"
                                    : "text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10"
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

function EyeIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
    return (
        <span className="group inline-block cursor-pointer">
            <svg viewBox="0 0 24 24" width={width} height={height} className="block">
                <path
                    d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
                    className="fill-transparent stroke-[#22c55e] [stroke-width:2] transition-all duration-300 ease-in-out group-hover:fill-[#22c55e]"
                />
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    className="fill-transparent stroke-[#22c55e] [stroke-width:2] transition-all duration-300 ease-in-out origin-center group-hover:fill-[#065f46] group-hover:scale-125"
                />
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
    const [calendarPreset, setCalendarPreset] = useState("Any Time");
    const [rangeStart, setRangeStart] = useState<Date | null>(new Date(2025, 9, 9));
    const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date(2025, 10, 17));
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date(2025, 9, 1));
    const [sortColumn, setSortColumn] = useState<SortColumn>("latestApplied");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
            <div className="w-[344px] h-[300px] rounded-[12px] bg-white/[0.08] border border-white/[0.12] px-5 py-3.5">
                <div className="flex items-center justify-between mb-3 text-white/90 pb-3.5 border-b border-white/[0.12]">
                    <button type="button" onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, -1))} className="p-1 text-white/60 hover:text-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <p className="text-[14px] leading-[18px] font-semibold text-[#E7EFEB]">{title}</p>
                    <button type="button" onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, 1))} className="p-1 text-white/60 hover:text-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-y-2 mb-2">
                    {weekDays.map((day) => (
                        <span key={`${title}-${day}`} className="text-center text-[13px] leading-[17px] font-normal text-white/80">{day}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1.5">
                    {cells.map((cell) => {
                        const day = cell.date.getDate();
                        const inRange = isInRange(cell.date);
                        const start = isRangeStart(cell.date);
                        const end = isRangeEnd(cell.date);
                        const isMuted = !cell.inCurrentMonth;
                        const rangePillClass = inRange
                            ? `${start ? "rounded-l-[24px]" : ""} ${end ? "rounded-r-[100px]" : ""} ${!start && !end ? "rounded-none" : ""}`
                            : "";

                        return (
                            <div key={`${title}-${cell.date.toISOString()}`} className={`h-[28px] flex items-center justify-center text-[13px] leading-[17px] ${inRange ? "bg-[#1ED36A]/[0.16]" : ""} ${rangePillClass}`}>
                                <button
                                    type="button"
                                    onClick={() => handleDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                                    className={`h-9 w-9 flex items-center justify-center font-normal ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : ""} ${!start && !end && inRange ? "text-white" : ""} ${!inRange && !isMuted ? "text-white" : ""} ${isMuted ? "text-white/40" : ""}`}
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
        const upColor = isActive && sortDirection === "asc" ? "#1ED36A" : "rgba(255,255,255,0.35)";
        const downColor = isActive && sortDirection === "desc" ? "#1ED36A" : "rgba(255,255,255,0.35)";

        return (
            <button
                type="button"
                onClick={() => toggleSort(column)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#5C6963] dark:text-white/80 hover:text-[#19211C] dark:hover:text-white transition-colors cursor-pointer"
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

    // Show CandidateDetail when a candidate is selected
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

    const traitOptions = Array.from(new Set(mockCandidateRows.map((row) => row.trait)));
    const appliedDateLabel = dateFilter && dateFilter !== "Applied Date" ? dateFilter : "Applied Date";
    const isDateFilterActive = Boolean(dateFilter && dateFilter !== "Applied Date");

    return (
        <div className="thin-ui-page flex flex-col w-full min-h-screen gap-5 font-sans p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#19211C]">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-500 dark:text-white/70 mb-1.5 font-normal">
                <span className="hover:underline cursor-pointer">Dashboard</span>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="text-brand-green font-medium">Candidates</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-[44px] leading-[56px] font-medium text-[#19211C] dark:text-white">
                    Candidates
                </h1>
                <div className="flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/60">
                    <span className="font-light">Showing</span>
                    <div className="relative" ref={showingRef}>
                        <button
                            onClick={() => setShowingMenuOpen((prev) => !prev)}
                            className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-transparent px-2.5 py-1 rounded-[7px] text-[13px] text-brand-green font-medium min-w-[42px] justify-between transition-all cursor-pointer"
                        >
                            {entriesPerPage}
                            <ChevronDownIcon className={`w-3 h-3 text-gray-400 dark:text-white/50 transition-transform ${showingMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        {showingMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white dark:bg-[#1F2823] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 py-1">
                                {[10, 25, 50].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            setEntriesPerPage(size);
                                            setCurrentPage(1);
                                            setShowingMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer ${
                                            entriesPerPage === size
                                                ? "text-brand-green font-semibold"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                hasMoreThanSelectedEntries
                                    ? "bg-brand-green text-white hover:bg-brand-green/90"
                                    : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white"
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Box — search + filters + table + progress bar all inside */}
            <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-visible">

                {/* Filters Bar */}
                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-white/[0.08]">
                    {/* Search */}
                    <div className="relative w-full lg:w-[360px]">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Name, OriginID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[44px] rounded-xl border border-gray-300 dark:border-white/[0.24] bg-transparent pl-10 pr-4 text-[13px] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 transition-colors focus:outline-none focus:border-white/40"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
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
                        <button
                            type="button"
                            onClick={() => setShowDateModal(true)}
                            className={`h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-all whitespace-nowrap border ${isDateFilterActive
                                ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                                : "border-gray-300/80 bg-transparent text-[#33413B] hover:bg-black/[0.04] dark:border-transparent dark:bg-white/[0.12] dark:text-white/90 dark:hover:bg-white/[0.16]"
                                }`}
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#1ED36A]">
                                <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor" />
                                <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor" />
                            </svg>
                            <span>{appliedDateLabel}</span>
                            <ChevronDownIcon className="w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70" />
                        </button>
                    </div>
                </div>

                {showDateModal && (
                    <div className="fixed inset-0 z-[80] bg-[#08120E]/80 backdrop-blur-[1.5px] flex items-center justify-center px-3" onClick={() => setShowDateModal(false)}>
                        <div className="w-[900px] h-[480px] max-w-[95vw] rounded-[24px] border border-white/[0.2] bg-[#19211C]/40 shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5" onClick={(e) => e.stopPropagation()}>
                            <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-white/[0.12]">
                                <p className="text-[18px] leading-[23px] font-semibold text-white">Select Date Range</p>
                                <button type="button" onClick={() => setShowDateModal(false)} className="w-8 h-8 rounded-full bg-white/[0.12] text-[#1ED36A] hover:bg-[#1ED36A]/30 hover:text-white transition-colors flex items-center justify-center" aria-label="Close date range picker">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                                <div className="w-[126px] shrink-0 border-r border-white/[0.12] pr-2.5">
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
                                                className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#1ED36A] text-white font-semibold" : "text-white/60 font-normal hover:bg-white/[0.08] hover:text-white"}`}
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
                            <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-white/[0.12] flex items-center justify-between gap-3">
                                <p className="text-[12px] leading-[16px] font-normal text-white">Selected Range : {selectedRangeText}</p>
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
                                        className="h-7 px-4 rounded-full border border-white text-white text-[12px] leading-[16px] font-medium hover:bg-white/10 transition-colors"
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
                                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-medium hover:bg-[#16BD5C] transition-colors"
                                    >
                                        Apply changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[980px] text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-black/[0.06] dark:bg-white/[0.1]">
                                <th className="text-left px-4 sm:px-5 py-3.5 whitespace-nowrap">
                                    {renderSortHeader("Name", "name")}
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-[#3A4741] dark:text-white/70 whitespace-nowrap">Trait</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-[#3A4741] dark:text-white/70 whitespace-nowrap">Applied Jobs</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 whitespace-nowrap">
                                    {renderSortHeader("Latest Applied", "latestApplied")}
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-[#3A4741] dark:text-white/70 whitespace-nowrap">Candidate Status</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-[#3A4741] dark:text-white/70 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCandidateRows.map((candidate) => (
                                <tr key={candidate.id} className="border-b border-gray-200 dark:border-white/[0.08] transition-colors last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                    {/* Name + Avatar */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-white/20 shrink-0">
                                                <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[16px] leading-[21px] font-medium text-[#19211C] dark:text-white">{candidate.name}</p>
                                                <p className="text-[14px] leading-[18px] font-normal text-gray-600 dark:text-white/80 mt-1">Origin ID : {candidate.originId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Trait */}
                                    <td className="px-4 sm:px-5 py-4 whitespace-nowrap text-[#19211C] dark:text-white/90 font-medium text-[16px] leading-[21px]">
                                        {candidate.trait}
                                    </td>
                                    {/* Applied Jobs — click opens Applied Jobs tab */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <button
                                            onClick={() => openCandidate(candidate.id, "applied_jobs")}
                                            className="text-brand-green font-medium underline decoration-solid underline-offset-2 cursor-pointer text-left"
                                        >
                                            {candidate.appliedJobs[0].title}{" "}
                                            <span>+{candidate.appliedJobs[0].count}</span>
                                        </button>
                                    </td>
                                    {/* Latest Applied */}
                                    <td className="px-4 sm:px-5 py-4 font-medium text-[#19211C] dark:text-white whitespace-nowrap">
                                        {candidate.latestApplied}
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-medium whitespace-nowrap">
                                            <span className="text-[#19211C] dark:text-white">Hired <span className="text-brand-green font-medium">({candidate.candidateStatus.hired})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-[#19211C] dark:text-white">Shortlist <span className="text-[#FFB020] font-medium">({candidate.candidateStatus.shortlist})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-[#19211C] dark:text-white">Rejected <span className="text-[#FF4A4A] font-medium">({candidate.candidateStatus.rejected})</span></span>
                                        </div>
                                    </td>
                                    {/* Action — eye muted by default, green on hover */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <button
                                            onClick={() => openCandidate(candidate.id)}
                                            className="group/eye flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                                        >
                                            <EyeIcon width={24} height={24} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-2 mb-4 text-[13px] font-medium">
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
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === page ? "bg-brand-green text-white font-bold" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"}`}
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
                <div className="text-center sm:text-right w-full sm:w-1/2 font-medium text-[#19211C] dark:text-[#FFFFFF]">
                    &copy; {new Date().getFullYear()} Origin BI, Made with by{" "}
                    <span className="underline text-[#1ED36A] hover:text-[#1ED36A]/80 transition-colors cursor-pointer">
                        Touchmark Descience Pvt. Ltd.
                    </span>
                </div>
            </div>
        </div>
    );
}
