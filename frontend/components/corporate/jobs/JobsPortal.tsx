"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    PlusIcon,
    ChevronDownIcon,
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    SearchIcon,
} from '../../icons';

// ─── Types ────────────────────────────────────────────────────────

type JobStatus = "Active" | "Draft" | "Closed" | "Hold";
type TabKey = "all" | "active" | "closed" | "draft";
type SortOption = "none" | "title_asc" | "posted_newest" | "posted_oldest" | "closing_soon" | "applicants_high" | "applicants_low";
type DateFilter = "all" | "today" | "yesterday" | "last_7_days" | "this_month" | "last_month" | "last_30_days" | "custom_range";

interface Job {
    id: string;
    jobId: string;
    title: string;
    company: string;
    location: string;
    workMode: string;
    employmentType: string;
    postedDate: string;
    closingDate: string;
    status: JobStatus;
    expiresIn?: number;
    totalApplicants: number;
    newApplicants: number;
    shortListed: number;
    hired: number;
    rejected: number;
}

interface FilterState {
    locations: string[];
    employmentTypes: string[];
    workModes: string[];
}

// ─── Sort Options ────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "title_asc", label: "Job Title (A-Z)" },
    { value: "posted_newest", label: "Posted Date – Newest First" },
    { value: "posted_oldest", label: "Posted Date – Oldest First" },
    { value: "closing_soon", label: "Closing Soon" },
    { value: "applicants_high", label: "Applicants – High to Low" },
    { value: "applicants_low", label: "Applicants – Low to High" },
];

// ─── Mock Data ───────────────────────────────────────────────────

const MOCK_LOCATIONS = [
    { name: "Chennai", count: 232 },
    { name: "Bangalore", count: 213 },
    { name: "Pune", count: 112 },
];

const MOCK_EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Internship"];
const MOCK_WORK_MODES = ["Remote", "Onsite"];

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "custom_range", label: "Custom Range" },
];

function parseDisplayDate(dateValue: string): Date {
    // Supports existing human-readable dates while keeping parsing deterministic.
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date("1970-01-01") : parsed;
}

function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function generateMockJobs(): Job[] {
    const jobs: Job[] = [];
    const statuses: JobStatus[] = [];
    for (let i = 0; i < 72; i++) statuses.push("Active");
    for (let i = 0; i < 15; i++) statuses.push("Closed");
    for (let i = 0; i < 8; i++) statuses.push("Draft");
    for (let i = 0; i < 5; i++) statuses.push("Hold");

    const titles = [
        "UI/UX Designer",
        "Frontend Developer",
        "Product Designer",
        "Data Analyst",
        "QA Engineer",
        "Backend Developer",
    ];

    const companies = ["Google Inc", "Microsoft", "Zoho", "Freshworks", "Amazon", "Infosys"];
    const locations = ["Chennai", "Bangalore", "Pune"];
    const employmentTypes = ["Full Time", "Part Time", "Internship"];
    const workModes = ["Onsite", "Remote"];

    const today = new Date();
    const makeDate = (daysAgo: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);
        return d;
    };

    for (let i = 0; i < 100; i++) {
        const postedDateObj = makeDate(i % 45);
        const closingDateObj = new Date(postedDateObj);
        closingDateObj.setDate(postedDateObj.getDate() + 63);

        jobs.push({
            id: `job-${i + 1}`,
            jobId: `${18722765562 + i}`,
            title: titles[i % titles.length],
            company: companies[i % companies.length],
            location: locations[i % locations.length],
            workMode: workModes[i % workModes.length],
            employmentType: employmentTypes[i % employmentTypes.length],
            postedDate: formatDisplayDate(postedDateObj),
            closingDate: formatDisplayDate(closingDateObj),
            status: statuses[i],
            expiresIn: i % 9 === 1 ? 3 : undefined,
            totalApplicants: 160 + (i % 7) * 28,
            newApplicants: 24 + (i % 8) * 11,
            shortListed: 12 + (i % 6) * 9,
            hired: 8 + (i % 5) * 7,
            rejected: 2 + (i % 4) * 3,
        });
    }
    return jobs;
}

// ─── Debounce Hook ───────────────────────────────────────────────

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// ─── Click-outside Hook ─────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            handler();
        };
        document.addEventListener("mousedown", listener);
        return () => document.removeEventListener("mousedown", listener);
    }, [ref, handler]);
}

// ─── Status Badge Component ─────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; dot: string; border: string }> = {
    Active: {
        bg: "bg-[#E8F8F0] dark:bg-[#1F6A45]",
        text: "text-[#1F6A45] dark:text-white/90",
        dot: "bg-[#1F6A45] dark:bg-brand-green",
        border: "border border-transparent dark:border-[#2B8A59]",
    },
    Draft: {
        bg: "bg-[#FFF8E6] dark:bg-[#6B5B23]",
        text: "text-[#D99A00] dark:text-white/90",
        dot: "bg-[#D99A00] dark:bg-[#FFB800]",
        border: "border border-transparent dark:border-[#86702A]",
    },
    Closed: {
        bg: "bg-[#FFEBEB] dark:bg-[#6A2B2B]",
        text: "text-[#FF4B4B] dark:text-white/90",
        dot: "bg-[#FF4B4B] dark:bg-[#FF4B4B]",
        border: "border border-transparent dark:border-[#8A3A3A]",
    },
    Hold: {
        bg: "bg-[#F3F4F6] dark:bg-[#4D5A53]",
        text: "text-[#6B7280] dark:text-white/95",
        dot: "bg-[#6B7280] dark:bg-[#A8B3AD]",
        border: "border border-transparent dark:border-[#64726B]",
    },
};

const STATUS_OPTION_STYLES: Record<JobStatus, string> = {
    Active: "bg-[#8FDDB8]/45 text-[#19211C] font-medium dark:bg-[#32925B] dark:text-white",
    Draft: "bg-[#8FDDB8]/45 text-[#19211C] font-medium dark:bg-[#32925B] dark:text-white",
    Closed: "bg-[#8FDDB8]/45 text-[#19211C] font-medium dark:bg-[#32925B] dark:text-white",
    Hold: "bg-[#8FDDB8]/45 text-[#19211C] font-medium dark:bg-[#32925B] dark:text-white",
};

function StatusBadge({
    status,
    onChangeStatus,
}: {
    status: JobStatus;
    onChangeStatus?: (s: JobStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => setOpen(false));
    const s = STATUS_STYLES[status];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-['Haskoy'] text-[11px] font-[300] cursor-pointer transition-colors [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] ${s.bg} ${s.text} ${s.border}`}
            >
                <span className={`w-[8px] h-[8px] rounded-full ${s.dot}`} />
                {status}
                <ChevronDownIcon className="w-2.5 h-2.5" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[102px] h-[136px] bg-white dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.1)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] shadow-[0_10px_24px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] dark:backdrop-blur-[20px] z-50 overflow-hidden py-0 box-border">
                    {(["Active", "Draft", "Hold"] as JobStatus[]).map((opt) => (
                        <div key={opt} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChangeStatus?.(opt);
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-4 h-[45px] text-[13px] transition-colors antialiased ${opt === status
                                    ? STATUS_OPTION_STYLES[opt]
                                    : "text-[#19211C] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.08]"
                                    }`}
                            >
                                {opt}
                            </button>
                            {opt !== "Hold" && (
                                <div className="absolute bottom-0 left-4 right-4 h-px bg-[#19211C]/10 dark:bg-white/20" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Three-dot Menu ─────────────────────────────────────────────

function ThreeDotMenu({ onAction }: { onAction: (action: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => setOpen(false));

    const items = [
        { key: "view", label: "View Details" },
        { key: "edit", label: "Edit Job" },
        { key: "copy", label: "Make a Copy" },
        { key: "delete", label: "Delete Job" },
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer group/btn ${open ? "bg-brand-green shadow-sm text-white" : "bg-gray-100 dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] hover:bg-brand-green dark:hover:bg-brand-green hover:shadow-sm hover:border-transparent dark:hover:border-transparent text-gray-500 dark:text-white/60 hover:text-white dark:hover:text-white"}`}
            >
                {/* Horizontal three dots */}
                <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor" className="transition-colors">
                    <circle cx="2" cy="2" r="1.5" />
                    <circle cx="7" cy="2" r="1.5" />
                    <circle cx="12" cy="2" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.1)] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_10px_24px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] dark:backdrop-blur-[20px] z-50 overflow-hidden text-left box-border">
                    {items.map((item, index) => (
                        <div key={item.key} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(item.key);
                                    setOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-[13px] hover:bg-[#EEF5F1] dark:hover:bg-white/10 transition-colors text-[#19211C] dark:text-white/90"
                            >
                                {item.label}
                            </button>
                            {index < items.length - 1 && (
                                <div className="absolute bottom-0 left-4 right-4 h-px bg-[#19211C]/10 dark:bg-white/20" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Job Card Component ─────────────────────────────────────────

const JobCard = React.memo(function JobCard({ job, onStatusChange, onAction }: {
    job: Job;
    onStatusChange: (id: string, status: JobStatus) => void;
    onAction: (id: string, action: string) => void;
}) {
    const [clicked, setClicked] = useState(false);

    const handleClick = () => {
        setClicked(true);
        setTimeout(() => {
            onAction(job.id, "view");
        }, 300);
    };

    return (
        <div
            onClick={handleClick}
            style={{ contentVisibility: "auto", containIntrinsicSize: "179px", contain: "layout paint style" }}
            className={`bg-white dark:bg-[#FFFFFF0A] border rounded-xl px-6 py-5 min-h-[179px] transition-colors duration-150 group cursor-pointer ${clicked
                ? "border-[#13D669] shadow-[0_0_8px_rgba(19,214,105,0.2)]"
                : "border-gray-200 dark:border-white/[0.08] hover:border-brand-green dark:hover:border-white/30"
                }`}>
            {/* Top row: Job ID + Status + Menu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h3 className="font-['Haskoy'] text-[20px] sm:text-[24px] font-normal text-gray-900 dark:text-white/95 leading-[100%] tracking-[0px] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                    {job.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-[6px] font-['Haskoy'] text-[13px] font-normal text-gray-700 dark:text-white/92 border border-transparent whitespace-nowrap [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                        <span className="text-[#19211C] dark:text-white">Job ID :</span>{" "}<span className="text-[#19211C] dark:text-brand-green">{job.jobId}</span>
                    </span>
                    <StatusBadge
                        status={job.status}
                        onChangeStatus={(s) => onStatusChange(job.id, s)}
                    />
                    <ThreeDotMenu onAction={(action) => onAction(job.id, action)} />
                </div>
            </div>

            {/* Company info */}
            <p className="font-['Haskoy'] text-[18px] text-white/82 mb-5 font-[300] leading-[100%] tracking-[0px] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                {job.company} | {job.location}, {job.employmentType}
            </p>

            {/* Bottom row: Dates on left, Stats on right */}
            <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-5 mt-auto w-full overflow-hidden">
                {/* Dates */}
                <div className="flex flex-col gap-2 min-w-0">
                    
                    {job.expiresIn && (
                        <div className="flex items-start justify-start -mt-1 mb-1">
                            <span className="inline-flex items-center px-2 py-[6px] rounded-[4px] font-['Haskoy'] text-[12px] font-[300] leading-[100%] tracking-[0px] bg-[rgba(237,47,52,0.24)] text-[#19211C] dark:text-white border border-[#ED2F34] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                                Expires in {job.expiresIn} Days
                            </span>
                        </div>
                    )}
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap font-['Haskoy'] text-[13px] sm:text-[14px] text-white/82 font-[300] leading-[1.2] tracking-[0px] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[12px] h-[12px] shrink-0 text-[#1ED36A]">
                                <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor" />
                                <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor" />
                            </svg>
                            {job.expiresIn ? "Posted Today" : `Posted on ${job.postedDate}`}
                        </div>
                        <span className="hidden sm:block w-[5px] h-[5px] rounded-full bg-brand-green/80 shrink-0" />
                        <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap font-['Haskoy'] text-[13px] sm:text-[14px] text-white/82 font-[300] leading-[1.2] tracking-[0px] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                            Closes at {job.closingDate}
                        </div>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-5 items-center bg-[#F6F4F7] dark:bg-white/[0.08] rounded-[6px] px-2 sm:px-4 h-[84px] w-full xl:w-[62%] xl:max-w-[760px] border border-gray-100 dark:border-transparent">
                    {[
                        { label: "Total Applicants", value: job.totalApplicants },
                        { label: "New Applicants", value: job.newApplicants },
                        { label: "Short Listed", value: job.shortListed },
                        { label: "Hired", value: job.hired },
                        { label: "Rejected", value: String(job.rejected).padStart(2, "0") },
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            className={`text-center px-2 sm:px-3 ${index > 0 ? "border-l border-gray-200 dark:border-white/[0.08]" : ""}`}
                        >
                            <div className="font-['Haskoy'] mx-auto text-center text-[28px] sm:text-[30px] leading-[1.2] font-medium text-[#150089] dark:text-white [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
                                {stat.value}
                            </div>
                            <div className={`font-['Haskoy'] text-[11px] sm:text-[12px] font-[300] leading-tight whitespace-nowrap [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] ${stat.label === "Rejected" ? "text-[#4A5A53] dark:text-white/65" : "text-[#2E2E2E] dark:text-white/65"}`}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// ─── Filter Item (colored square style) ─────────────────────────

function FilterItem({
    label,
    count,
    checked,
    onChange,
}: {
    label: string;
    count?: number;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <div className="border-b border-gray-100 dark:border-white/5 last:border-0 pb-1 mb-1">
            <button onClick={onChange} className="flex items-center gap-3 cursor-pointer group py-2.5 px-1.5 w-full text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-md">
                <span
                    className={`w-[16px] h-[16px] rounded-[2px] shrink-0 transition-colors border ${checked
                        ? "bg-brand-green border-brand-green"
                        : "bg-white dark:bg-white/10 group-hover:bg-gray-50 dark:group-hover:bg-white/20 border-gray-300 dark:border-white/15"
                        }`}
                />
                <div className="flex items-center gap-1.5 flex-1">
                    <span className={`text-[13px] font-normal ${checked ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-white/80"}`}>{label}</span>
                    {count !== undefined && (
                        <span className={`text-[13px] font-normal ${checked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/60"}`}>
                            ({count})
                        </span>
                    )}
                </div>
            </button>
        </div>
    );
}

// ─── Filter Section ─────────────────────────────────────────────

function FilterSection({
    title,
    children,
    defaultOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="mb-4 overflow-hidden bg-transparent rounded-[10px] border border-gray-200 dark:border-[#FFFFFF1F]">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-3 text-[14px] font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                {title}
                <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 dark:text-white/60 transition-transform ${open ? "" : "-rotate-90"}`} />
            </button>
            <div className="border-t border-gray-100 dark:border-white/10 mx-4" />
            {open && (
                <div className="px-4 pb-3.5 pt-2.5 flex flex-col gap-1">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Filters Sidebar ────────────────────────────────────────────

function FiltersSidebar({
    filters,
    onFilterChange,
    onClearAll,
}: {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onClearAll: () => void;
}) {
    const toggleLocation = (loc: string) => {
        const updated = filters.locations.includes(loc)
            ? filters.locations.filter((l) => l !== loc)
            : [...filters.locations, loc];
        onFilterChange({ ...filters, locations: updated });
    };
    const toggleEmploymentType = (type: string) => {
        const updated = filters.employmentTypes.includes(type)
            ? filters.employmentTypes.filter((t) => t !== type)
            : [...filters.employmentTypes, type];
        onFilterChange({ ...filters, employmentTypes: updated });
    };
    const toggleWorkMode = (mode: string) => {
        const updated = filters.workModes.includes(mode)
            ? filters.workModes.filter((m) => m !== mode)
            : [...filters.workModes, mode];
        onFilterChange({ ...filters, workModes: updated });
    };

    const hasFilters = filters.locations.length > 0 || filters.employmentTypes.length > 0 || filters.workModes.length > 0;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-[17px] font-medium text-gray-900 dark:text-white">Filters</h3>
                <button
                    onClick={onClearAll}
                    className={`text-[13px] transition-colors cursor-pointer text-[#19211C] dark:text-white hover:text-brand-green dark:hover:text-brand-green ${hasFilters ? "font-medium" : "font-normal"}`}
                >
                    Clear all
                </button>
            </div>

            <FilterSection title="Location">
                {MOCK_LOCATIONS.map((loc) => (
                    <FilterItem
                        key={loc.name}
                        label={loc.name}
                        count={loc.count}
                        checked={filters.locations.includes(loc.name)}
                        onChange={() => toggleLocation(loc.name)}
                    />
                ))}
            </FilterSection>

            <FilterSection title="Employment Type">
                {MOCK_EMPLOYMENT_TYPES.map((type) => (
                    <FilterItem
                        key={type}
                        label={type}
                        checked={filters.employmentTypes.includes(type)}
                        onChange={() => toggleEmploymentType(type)}
                    />
                ))}
            </FilterSection>

            <FilterSection title="Remote, Onsite">
                {MOCK_WORK_MODES.map((mode) => (
                    <FilterItem
                        key={mode}
                        label={mode}
                        checked={filters.workModes.includes(mode)}
                        onChange={() => toggleWorkMode(mode)}
                    />
                ))}
            </FilterSection>
        </div>
    );
}

// ─── Toast Notification ─────────────────────────────────────────

function ToastNotification({
    message,
    submessage,
    actionLabel,
    onAction,
    onClose,
}: {
    message: string;
    submessage?: string;
    actionLabel?: string;
    onAction?: () => void;
    onClose: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
            <div className="flex items-center gap-3 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl px-5 py-3.5 min-w-[340px]">
                <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3.5 9L7 12.5L14.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#19211C] dark:text-white">{message}</div>
                    {submessage && (
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{submessage}</div>
                    )}
                </div>
                {actionLabel && (
                    <button
                        onClick={onAction}
                        className="text-[12px] font-medium text-[#19211C] dark:text-white bg-[#F2F2F2] dark:bg-white/10 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
                    >
                        {actionLabel}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shrink-0 cursor-pointer hover:bg-brand-green/80 transition-colors"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── Main JobsPortal Component ──────────────────────────────────
import JobDetails from "./JobDetails";
import CreateJob from "./CreateJob";

export default function JobsPortal() {
    // Data
    const [allJobs, setAllJobs] = useState<Job[]>(generateMockJobs);

    // Routing State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isCreatingJob, setIsCreatingJob] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [sortBy, setSortBy] = useState<SortOption>("none");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        locations: [],
        employmentTypes: [],
        workModes: [],
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateModalAnchorStyle, setDateModalAnchorStyle] = useState<{ top: number; left: number } | null>(null);
    const [calendarPreset, setCalendarPreset] = useState("Any Time");
    const [rangeStart, setRangeStart] = useState<Date | null>(new Date(2025, 9, 9));
    const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date(2025, 10, 17));
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date(2025, 9, 1));
    const [customDateLabel, setCustomDateLabel] = useState<string | null>(null);


    // Toast
    const [toast, setToast] = useState<{ message: string; submessage?: string } | null>(null);

    // Refs
    const sortRef = useRef<HTMLDivElement>(null);
    const entriesRef = useRef<HTMLDivElement>(null);
    const dateFilterButtonRef = useRef<HTMLButtonElement | null>(null);
    useClickOutside(sortRef, () => setShowSortDropdown(false));
    useClickOutside(entriesRef, () => setShowEntriesDropdown(false));

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
            setRangeStart(null);
            setRangeEnd(null);
            return;
        }
        if (preset === "Today") {
            setRangeStart(todayDate);
            setRangeEnd(todayDate);
            setLeftCalendarMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
            return;
        }
        if (preset === "Yesterday") {
            const yesterday = new Date(todayDate);
            yesterday.setDate(yesterday.getDate() - 1);
            setRangeStart(yesterday);
            setRangeEnd(yesterday);
            setLeftCalendarMonth(new Date(yesterday.getFullYear(), yesterday.getMonth(), 1));
            return;
        }
        if (preset === "Last 7 Days") {
            const start = new Date(todayDate);
            start.setDate(start.getDate() - 6);
            setRangeStart(start);
            setRangeEnd(todayDate);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            return;
        }
        if (preset === "Last 30 Days") {
            const start = new Date(todayDate);
            start.setDate(start.getDate() - 29);
            setRangeStart(start);
            setRangeEnd(todayDate);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            return;
        }
        if (preset === "This Month") {
            const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
            const end = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
            setRangeStart(start);
            setRangeEnd(end);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            return;
        }
        if (preset === "Last Month") {
            const start = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
            const end = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
            setRangeStart(start);
            setRangeEnd(end);
            setLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            return;
        }
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

    const dateFilterLabel = dateFilter === "custom_range"
        ? (customDateLabel ?? "Custom Range")
        : (DATE_FILTER_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "All Time");
    const isDateFilterActive = dateFilter !== "all";

    const updateDateModalPosition = useCallback(() => {
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

        setDateModalAnchorStyle((current) => (
            current?.top === top && current?.left === left
                ? current
                : { top, left }
        ));
    }, []);

    const openDateModal = () => {
        const presetByFilter: Record<DateFilter, string> = {
            all: "Any Time",
            today: "Today",
            yesterday: "Yesterday",
            last_7_days: "Last 7 Days",
            this_month: "This Month",
            last_month: "Last Month",
            last_30_days: "Last 30 Days",
            custom_range: "Custom Range",
        };

        const preset = presetByFilter[dateFilter] ?? "Any Time";
        setCalendarPreset(preset);
        if (preset !== "Custom Range") {
            applyPresetRange(preset);
        }
        updateDateModalPosition();
        setShowDateModal(true);
    };

    useEffect(() => {
        if (!showDateModal) return;

        updateDateModalPosition();
        window.addEventListener("resize", updateDateModalPosition);
        window.addEventListener("scroll", updateDateModalPosition, true);
        return () => {
            window.removeEventListener("resize", updateDateModalPosition);
            window.removeEventListener("scroll", updateDateModalPosition, true);
        };
    }, [showDateModal, updateDateModalPosition]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        if (!showDateModal) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [showDateModal]);

    // Tab counts
    const tabCounts = useMemo(() => ({
        all: allJobs.length,
        active: allJobs.filter((j) => j.status === "Active").length,
        closed: allJobs.filter((j) => j.status === "Closed").length,
        draft: allJobs.filter((j) => j.status === "Draft").length,
    }), [allJobs]);

    // Filter + Sort logic (memoized to avoid extra render pass and state writes)
    const filteredJobs = useMemo(() => {
        let result = [...allJobs];

        // Tab filter
        if (activeTab === "active") result = result.filter((j) => j.status === "Active");
        if (activeTab === "closed") result = result.filter((j) => j.status === "Closed");
        if (activeTab === "draft") result = result.filter((j) => j.status === "Draft");

        // Search
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(
                (j) =>
                    j.title.toLowerCase().includes(q) ||
                    j.company.toLowerCase().includes(q) ||
                    j.jobId.includes(q)
            );
        }

        // Sidebar filters
        if (filters.locations.length > 0) {
            result = result.filter((j) => filters.locations.includes(j.location));
        }
        if (filters.employmentTypes.length > 0) {
            result = result.filter((j) => filters.employmentTypes.includes(j.employmentType));
        }
        if (filters.workModes.length > 0) {
            result = result.filter((j) => filters.workModes.includes(j.workMode));
        }

        // Date filter
        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            result = result.filter((j) => {
                const posted = parseDisplayDate(j.postedDate);
                switch (dateFilter) {
                    case "today":
                        return posted >= today;
                    case "yesterday": {
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return posted >= yesterday && posted < today;
                    }
                    case "last_7_days": {
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return posted >= sevenDaysAgo;
                    }
                    case "this_month": {
                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        return posted >= monthStart;
                    }
                    case "last_month": {
                        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        const end = new Date(today.getFullYear(), today.getMonth(), 0);
                        return posted >= start && posted <= end;
                    }
                    case "last_30_days": {
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return posted >= thirtyDaysAgo;
                    }
                    case "custom_range": {
                        if (startTime === null || endTime === null) return true;
                        const postedTime = new Date(posted.getFullYear(), posted.getMonth(), posted.getDate()).getTime();
                        return postedTime >= startTime && postedTime <= endTime;
                    }
                    default:
                        return true;
                }
            });
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "title_asc":
                    return a.title.localeCompare(b.title);
                case "posted_newest":
                    return parseDisplayDate(b.postedDate).getTime() - parseDisplayDate(a.postedDate).getTime();
                case "posted_oldest":
                    return parseDisplayDate(a.postedDate).getTime() - parseDisplayDate(b.postedDate).getTime();
                case "closing_soon":
                    return parseDisplayDate(a.closingDate).getTime() - parseDisplayDate(b.closingDate).getTime();
                case "applicants_high":
                    return b.totalApplicants - a.totalApplicants;
                case "applicants_low":
                    return a.totalApplicants - b.totalApplicants;
                case "none":
                    return 0;
                default:
                    return 0;
            }
        });

        return result;
    }, [allJobs, activeTab, debouncedSearch, filters, sortBy, dateFilter, startTime, endTime]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, debouncedSearch, filters, sortBy, dateFilter, startTime, endTime]);

    useEffect(() => {
        const nextTotalPages = Math.max(1, Math.ceil(filteredJobs.length / entriesPerPage));
        setCurrentPage((prev) => (prev > nextTotalPages ? nextTotalPages : prev));
    }, [filteredJobs.length, entriesPerPage]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / entriesPerPage));
    const suggestedEntriesOptions = useMemo(() => {
        if (filteredJobs.length <= 0) {
            return [entriesPerPage];
        }

        const baseOptions = [5, 10, 25, 50].filter((size) => size < filteredJobs.length);
        return Array.from(new Set([...baseOptions, filteredJobs.length, entriesPerPage])).sort((a, b) => a - b);
    }, [filteredJobs.length, entriesPerPage]);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleStatusChange = useCallback((jobId: string, newStatus: JobStatus) => {
        setAllJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
        setToast({ message: "Status Updated", submessage: `Job status changed to ${newStatus}` });
    }, []);

    const handleJobAction = useCallback((jobId: string, action: string) => {
        // TODO: Handle each action — navigate, delete confirmation, etc.
        switch (action) {
            case "view":
                setSelectedJobId(jobId);
                break;
            case "edit":
                {
                    const jobToEdit = allJobs.find((job) => job.id === jobId);
                    if (jobToEdit) {
                        setEditingJob(jobToEdit);
                        setIsCreatingJob(true);
                    }
                }
                break;
            case "copy":
                setToast({ message: "Job Copied", submessage: "A copy of the job has been created as Draft" });
                break;
            case "delete":
                break;
        }
    }, [allJobs]);

    // Pagination number display
    const getPaginationNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    if (isCreatingJob) {
        return (
            <CreateJob
                mode={editingJob ? "edit" : "create"}
                initialData={editingJob ? {
                    title: editingJob.title,
                    employmentType: editingJob.employmentType,
                    shift: "Day",
                    experienceLevel: "Fresher",
                    jobLocation: editingJob.location,
                    workMode: editingJob.workMode,
                } : undefined}
                onBack={() => {
                    setIsCreatingJob(false);
                    setEditingJob(null);
                }}
            />
        );
    }

    if (selectedJobId) {
        return <JobDetails jobId={selectedJobId} onBack={() => setSelectedJobId(null)} />;
    }

    return (
        <div className="thin-ui-page flex flex-col h-full w-full gap-6 font-sans antialiased p-4 sm:p-6 lg:p-10 bg-[#F9FAFB] dark:bg-[#19211C] min-h-screen">
            {/* Toast */}
            {toast && (
                <ToastNotification
                    message={toast.message}
                    submessage={toast.submessage}
                    actionLabel="View Job"
                    onClose={() => setToast(null)}
                />
            )}

            {/* Breadcrumb + Title */}
            <div>
                <div className="flex items-center text-xs text-gray-500 dark:text-white/70 mb-1.5 font-normal">
                    <span>Dashboard</span>
                    <span className="mx-1.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400 dark:text-gray-500">
                            <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="text-brand-green font-medium">Jobs</span>
                </div>
                <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-medium text-[#150089] dark:text-white leading-tight">
                    Job Posted
                </h1>
            </div>

            {/* Tabs + Sort/Date/Create Row */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-gray-200 dark:border-white/20 pb-0 gap-4">
                {/* Tabs */}
                <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
                    {([
                        { key: "all" as TabKey, label: "All", count: tabCounts.all },
                        { key: "active" as TabKey, label: "Active", count: tabCounts.active },
                        { key: "closed" as TabKey, label: "Closed", count: tabCounts.closed },
                        { key: "draft" as TabKey, label: "Draft", count: tabCounts.draft },
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                            className={`px-1 py-3 sm:py-3.5 -mb-px mr-4 sm:mr-7 text-[16px] sm:text-[19px] border-b-[3px] transition-colors whitespace-nowrap cursor-pointer font-['Haskoy'] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] ${activeTab === tab.key
                                ? "border-brand-green"
                                : "border-transparent hover:border-gray-300 dark:hover:border-white/20"
                                }`}
                        >
                            <span className={activeTab === tab.key ? "font-medium text-gray-900 dark:text-white/95" : "font-normal text-gray-500 dark:text-white/45"}>{tab.label}</span>
                            <span className={activeTab === tab.key ? "text-brand-green font-medium ml-1" : "text-gray-400 dark:text-white/45 font-normal ml-1"}>({tab.count})</span>
                        </button>
                    ))}
                </div>

                {/* Sort + Today + Create Job */}
                <div className="flex w-full xl:w-auto flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-5 py-2 md:flex-nowrap">
                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 px-4 py-[9px] rounded-[12px] text-[14px] font-normal border border-[#D4D8D5]/45 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#19211C] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.16] transition-colors cursor-pointer h-[44px] shadow-sm dark:shadow-none"
                        >
                            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#93A19A] dark:text-white/35">
                                <path d="M6 1L11 8H1L6 1Z" fill="#1ED36A" />
                                <path d="M6 15L1 8H11L6 15Z" fill="currentColor" />
                            </svg>
                            <span className="text-left">Sort by</span>
                            <ChevronDownIcon className={`w-3.5 h-3.5 text-[#7B8A84] dark:text-white/65 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showSortDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[rgba(25,33,28,0.92)] border border-[rgba(25,33,28,0.1)] dark:border-[rgba(255,255,255,0.22)] rounded-[12px] shadow-[0_16px_40px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-0 text-left box-border">
                                {SORT_OPTIONS.map((opt, index) => (
                                    <div key={opt.value} className="relative">
                                        <button
                                            onClick={() => {
                                                setSortBy(opt.value);
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full text-left px-5 py-3.5 text-[15px] transition-colors ${sortBy === opt.value
                                                ? "bg-[#A2E0BA]/35 dark:bg-[#32925B]/70 text-[#19211C] dark:text-white font-medium"
                                                : "text-[#19211C] dark:text-white/90 font-normal hover:bg-[#EEF5F1] dark:hover:bg-white/10"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                        {index < SORT_OPTIONS.length - 1 && (
                                            <div className="w-full h-px bg-[#19211C]/10 dark:bg-white/20 absolute bottom-0 left-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Today/Date Filter Button */}
                    <div className={`relative ${showDateModal ? "z-[90]" : ""}`}>
                        <button
                            onClick={openDateModal}
                            ref={dateFilterButtonRef}
                            className={`flex items-center gap-2 px-4 py-[9px] rounded-[12px] text-[14px] font-normal border transition-colors cursor-pointer h-[44px] shadow-sm dark:shadow-none ${isDateFilterActive
                                ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                                : "border-[#D4D8D5]/45 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#19211C] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.16]"
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="#1ED36A" />
                                <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="#1ED36A" />
                            </svg>
                            {dateFilterLabel}
                            <ChevronDownIcon className={`w-2.5 h-2.5 ${isDateFilterActive ? "text-[#1F3B2A]/70 dark:text-white/80" : "text-gray-500 dark:text-white/60"}`} />
                        </button>
                    </div>

                    {/* Create Job Button */}
                    <button
                        onClick={() => setIsCreatingJob(true)}
                        className="flex items-center gap-1.5 bg-brand-green hover:bg-[#10A958] text-white px-6 py-[9px] rounded-[12px] text-[14px] font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[44px]"
                    >
                        Create Job
                        <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Content: Sidebar + Jobs List */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0 items-start">
                {/* Filters Sidebar */}
                <div className="hidden lg:block w-[280px] shrink-0">
                    <div className="bg-white dark:bg-white/[0.08] rounded-xl border border-gray-200 dark:border-white/[0.08] p-5 min-h-[541px] h-auto overflow-visible shadow-sm dark:shadow-none">
                        <FiltersSidebar
                            filters={filters}
                            onFilterChange={setFilters}
                            onClearAll={() => setFilters({ locations: [], employmentTypes: [], workModes: [] })}
                        />
                    </div>
                </div>

                {/* Jobs Content */}
                <div className="w-full min-w-0 flex flex-col gap-4 bg-white dark:bg-white/[0.08] rounded-xl border border-gray-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-none">
                    {/* Search + Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
                        {/* Search */}
                        <div className="relative w-full sm:max-w-[420px]">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search By Job Title or Description..."
                                className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-white/35 rounded-xl py-2.5 pl-4 pr-4 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 placeholder:font-normal focus:outline-none hover:border-gray-400 dark:hover:border-white/55 focus:border-brand-green transition-colors shadow-sm dark:shadow-none"
                            />
                        </div>

                        {/* Showing entries + nav */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[14px] text-[#19211C] dark:text-white/60 font-normal">
                                Showing
                            </span>
                            <div className="relative" ref={entriesRef}>
                                <button
                                    onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                                    className="flex items-center gap-1.5 bg-[#EDF3EE] dark:bg-[#3B4540] border border-gray-200 dark:border-[#4A5550] px-3 h-[32px] rounded-[8px] text-[14px] text-brand-green font-medium min-w-[52px] justify-between transition-colors cursor-pointer hover:border-brand-green/55 shadow-sm dark:shadow-none"
                                >
                                    {entriesPerPage}
                                    <ChevronDownIcon className={`w-3 h-3 text-gray-400 dark:text-white/50 hover:text-brand-green transition-transform ${showEntriesDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showEntriesDropdown && (
                                    <div className="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-[rgba(25,33,28,0.92)] border border-[rgba(25,33,28,0.1)] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_16px_40px_rgba(25,33,28,0.1)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1 box-border">
                                        {suggestedEntriesOptions.map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => {
                                                    setEntriesPerPage(num);
                                                    setShowEntriesDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                                className={`w-full text-center py-1.5 text-[13px] hover:bg-[#EEF5F1] dark:hover:bg-[#2A3A33] dark:hover:text-white cursor-pointer ${num === entriesPerPage
                                                    ? "bg-[#E6F5EC] dark:bg-brand-green/20 text-[#19211C] dark:text-white font-medium"
                                                    : "text-[#19211C] dark:text-white"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[14px] text-[#19211C] dark:text-white/60 whitespace-nowrap font-normal">
                                of {filteredJobs.length.toLocaleString()} entries
                            </span>
                            <div className="flex items-center gap-1.5 ml-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                        <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white"
                                >
                                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Job Cards */}
                    <div className="flex flex-col gap-3.5">
                        {paginatedJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 text-gray-300 dark:text-gray-600">
                                    <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                                    <path d="M16 20H32M16 28H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <h3 className="text-lg font-semibold text-[#19211C] dark:text-white mb-1">No jobs found</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or search term</p>
                            </div>
                        ) : (
                            paginatedJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onStatusChange={handleStatusChange}
                                    onAction={handleJobAction}
                                />
                            ))
                        )}
                    </div>

                </div>
            </div>

            {/* Pagination */}
            {filteredJobs.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2 mb-4 text-[13px] font-medium">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#FFFFFF1F] flex items-center justify-center border border-transparent dark:border-[#FFFFFF1F] text-[#19211C] dark:text-white transition-colors shadow-sm hover:bg-brand-green hover:text-white hover:border-brand-green cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {getPaginationNumbers().map((page, idx) =>
                        page === "..." ? (
                            <span key={`dots-${idx}`} className="px-1 text-gray-400">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page as number)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${currentPage === page
                                    ? "bg-brand-green text-white border border-brand-green"
                                    : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#FFFFFF1F] flex items-center justify-center border border-transparent dark:border-[#FFFFFF1F] text-[#19211C] dark:text-white transition-colors shadow-sm hover:bg-brand-green hover:text-white hover:border-brand-green cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}

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

            {showDateModal && (
                <div className="fixed inset-0 z-[80] bg-[#FFFFFFE6] dark:bg-[#19211CCC]" onClick={() => setShowDateModal(false)}>
                    <div
                        className="fixed"
                        style={{
                            top: `${dateModalAnchorStyle?.top ?? 188}px`,
                            left: `${dateModalAnchorStyle?.left ?? 12}px`,
                            width: "min(900px, calc(100vw - 24px))",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                    <div className="w-full h-[446px] rounded-[24px] border border-[#D7E3DD] dark:border-white/[0.18] bg-white dark:bg-[#19211CCC] shadow-[0px_16px_40px_rgba(25,33,28,0.18)] dark:shadow-[0px_16px_40px_#19211C] backdrop-blur-0 dark:backdrop-blur-[50px] p-5">
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
                                        setDateFilter("all");
                                        setCustomDateLabel(null);
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
                                            setDateFilter("all");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "Today") {
                                            setDateFilter("today");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "Yesterday") {
                                            setDateFilter("yesterday");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "Last 7 Days") {
                                            setDateFilter("last_7_days");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "Last 30 Days") {
                                            setDateFilter("last_30_days");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "This Month") {
                                            setDateFilter("this_month");
                                            setCustomDateLabel(null);
                                        } else if (calendarPreset === "Last Month") {
                                            setDateFilter("last_month");
                                            setCustomDateLabel(null);
                                        } else if (rangeStart && !rangeEnd) {
                                            setDateFilter("custom_range");
                                            setCustomDateLabel(formatFilterRangeLabel(rangeStart, rangeStart));
                                        } else if (rangeStart && rangeEnd) {
                                            setDateFilter("custom_range");
                                            setCustomDateLabel(formatFilterRangeLabel(rangeStart, rangeEnd));
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
        </div>
    );
}
