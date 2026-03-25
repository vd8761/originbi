"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
type SortOption = "title_asc" | "posted_newest" | "posted_oldest" | "closing_soon" | "applicants_high" | "applicants_low";
type DateFilter = "all" | "today" | "yesterday" | "this_week" | "this_month" | "last_30_days";

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
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_30_days", label: "Last 30 Days" },
];

function parseDisplayDate(dateValue: string): Date {
    // Supports existing human-readable dates while keeping parsing deterministic.
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date("1970-01-01") : parsed;
}

function generateMockJobs(): Job[] {
    const jobs: Job[] = [];
    const statuses: JobStatus[] = [];
    for (let i = 0; i < 80; i++) statuses.push("Active");
    for (let i = 0; i < 19; i++) statuses.push("Closed");
    for (let i = 0; i < 1; i++) statuses.push("Draft");

    for (let i = 0; i < 100; i++) {
        jobs.push({
            id: `job-${i + 1}`,
            jobId: "18722765562",
            title: "UI/UX Designer",
            company: "Google Inc",
            location: "Chennai",
            workMode: i % 2 === 0 ? "Onsite" : "Remote",
            employmentType: "Full Time",
            postedDate: "27 December 2025",
            closingDate: "28 February 2026",
            status: statuses[i],
            expiresIn: i === 1 ? 3 : undefined,
            totalApplicants: 300,
            newApplicants: 126,
            shortListed: 88,
            hired: 126,
            rejected: 4,
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
        text: "text-[#1F6A45] dark:text-white",
        dot: "bg-[#1F6A45] dark:bg-brand-green",
        border: "border border-transparent dark:border-[#2B8A59]",
    },
    Draft: {
        bg: "bg-[#FFF8E6] dark:bg-[#6B5B23]",
        text: "text-[#D99A00] dark:text-white",
        dot: "bg-[#D99A00] dark:bg-[#FFB800]",
        border: "border border-transparent dark:border-[#86702A]",
    },
    Closed: {
        bg: "bg-[#FFEBEB] dark:bg-[#6A2B2B]",
        text: "text-[#FF4B4B] dark:text-white",
        dot: "bg-[#FF4B4B] dark:bg-[#FF4B4B]",
        border: "border border-transparent dark:border-[#8A3A3A]",
    },
    Hold: {
        bg: "bg-[#F3F4F6] dark:bg-[#4D5A53]",
        text: "text-[#6B7280] dark:text-white",
        dot: "bg-[#6B7280] dark:bg-purple-500",
        border: "border border-transparent dark:border-[#64726B]",
    },
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${s.bg} ${s.text} ${s.border}`}
            >
                <span className={`w-[8px] h-[8px] rounded-full ${s.dot}`} />
                {status}
                <ChevronDownIcon className="w-2.5 h-2.5" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                    {(["Active", "Draft", "Hold"] as JobStatus[]).map((opt) => (
                        <button
                            key={opt}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChangeStatus?.(opt);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${opt === status
                                ? "bg-brand-green/10 dark:bg-brand-green/25 text-brand-green dark:text-white font-medium"
                                : "text-gray-700 dark:text-white"
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
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer group/btn ${open ? "bg-brand-green shadow-sm text-white" : "bg-gray-100 dark:bg-[#2A312D] border border-gray-200 dark:border-white/15 hover:bg-brand-green hover:shadow-sm hover:border-transparent text-gray-500 dark:text-white/50 hover:text-white"}`}
            >
                {/* Horizontal three dots */}
                <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor" className="transition-colors">
                    <circle cx="2" cy="2" r="1.5" />
                    <circle cx="7" cy="2" r="1.5" />
                    <circle cx="12" cy="2" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                    {items.map((item, index) => (
                        <div key={item.key} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(item.key);
                                    setOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-white"
                            >
                                {item.label}
                            </button>
                            {index < items.length - 1 && (
                                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-100 dark:bg-white/10" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Job Card Component ─────────────────────────────────────────

function JobCard({ job, onStatusChange, onAction }: {
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
            className={`bg-white dark:bg-[#2A312D] border rounded-xl px-6 py-5 transition-all duration-200 group cursor-pointer ${clicked
                ? "border-[#13D669] shadow-[0_0_8px_rgba(19,214,105,0.2)]"
                : "border-gray-200 dark:border-[#3A4A3F] hover:border-brand-green dark:hover:border-white/30"
                }`}>
            {/* Top row: Job ID + Status + Menu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h3 className="text-[20px] sm:text-[24px] font-semibold text-gray-900 dark:text-white leading-tight">
                    {job.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-gray-700 dark:text-white/90 border border-transparent whitespace-nowrap">
                        Job ID : <span className="text-brand-green">{job.jobId}</span>
                    </span>
                    <StatusBadge
                        status={job.status}
                        onChangeStatus={(s) => onStatusChange(job.id, s)}
                    />
                    <ThreeDotMenu onAction={(action) => onAction(job.id, action)} />
                </div>
            </div>

            {/* Company info */}
            <p className="text-[16px] text-gray-500 dark:text-white/60 mb-4">
                {job.company} | {job.location}, {job.employmentType}
            </p>

            {/* Bottom row: Dates on left, Stats on right */}
            <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 mt-auto w-full overflow-hidden">
                {/* Dates */}
                <div className="flex flex-col gap-2 shrink-0">
                    {job.expiresIn && (
                        <div className="flex">
                            <span className="inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold bg-red-50 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-[#FF8888] dark:border-red-400/30">
                                Expires in {job.expiresIn} Days
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-white/60 whitespace-nowrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-green shrink-0">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {job.expiresIn ? "Posted Today" : `Posted on ${job.postedDate}`}
                        </div>
                        <span className="w-[5px] h-[5px] rounded-full bg-brand-green/80 shrink-0" />
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-white/60 whitespace-nowrap">
                            Closes at {job.closingDate}
                        </div>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="flex items-center bg-[#F6F4F7] dark:bg-[#34403A] rounded-[8px] px-3 py-3 w-full xl:w-auto xl:min-w-[480px] 2xl:min-w-[540px] justify-between xl:ml-auto border border-gray-100 dark:border-transparent overflow-x-auto scrollbar-hide">
                    <div className="text-center px-3 flex-1 min-w-[100px]">
                        <div className="text-[20px] sm:text-[24px] font-semibold text-[#141566] dark:text-white leading-tight mb-1">{job.totalApplicants}</div>
                        <div className="text-[12px] sm:text-[13px] font-normal text-[#2E2E2E] dark:text-white/70 leading-tight whitespace-nowrap">Total Applicants</div>
                    </div>
                    <div className="w-px h-[36px] bg-gray-200 dark:bg-white/[0.08] shrink-0" />
                    <div className="text-center px-3 flex-1 min-w-[100px]">
                        <div className="text-[20px] sm:text-[24px] font-semibold text-[#141566] dark:text-white leading-tight mb-1">{job.newApplicants}</div>
                        <div className="text-[12px] sm:text-[13px] font-normal text-[#2E2E2E] dark:text-white/70 leading-tight whitespace-nowrap">New Applicants</div>
                    </div>
                    <div className="w-px h-[36px] bg-gray-200 dark:bg-white/[0.08] shrink-0" />
                    <div className="text-center px-3 flex-1 min-w-[90px]">
                        <div className="text-[20px] sm:text-[24px] font-semibold text-[#141566] dark:text-white leading-tight mb-1">{job.shortListed}</div>
                        <div className="text-[12px] sm:text-[13px] font-normal text-[#2E2E2E] dark:text-white/70 leading-tight whitespace-nowrap">Short Listed</div>
                    </div>
                    <div className="w-px h-[36px] bg-gray-200 dark:bg-white/[0.08] shrink-0" />
                    <div className="text-center px-3 flex-1 min-w-[80px]">
                        <div className="text-[20px] sm:text-[24px] font-semibold text-[#141566] dark:text-white leading-tight mb-1">{job.hired}</div>
                        <div className="text-[12px] sm:text-[13px] font-normal text-[#2E2E2E] dark:text-white/70 leading-tight whitespace-nowrap">Hired</div>
                    </div>
                    <div className="w-px h-[36px] bg-gray-200 dark:bg-white/[0.08] shrink-0" />
                    <div className="text-center px-3 flex-1 min-w-[80px]">
                        <div className="text-[20px] sm:text-[24px] font-semibold text-gray-900 dark:text-white leading-tight mb-1">{String(job.rejected).padStart(2, "0")}</div>
                        <div className="text-[12px] sm:text-[13px] font-normal text-gray-500 dark:text-white/70 leading-tight whitespace-nowrap">Rejected</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            <button onClick={onChange} className="flex items-center gap-3 cursor-pointer group py-2.5 px-2 w-full text-left transition-all hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-md">
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
        <div className="mb-2 overflow-hidden bg-transparent">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-3 text-[14px] font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                {title}
                <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 dark:text-white/60 transition-transform ${open ? "" : "-rotate-90"}`} />
            </button>
            <div className="border-t border-gray-100 dark:border-white/10 mx-4" />
            {open && (
                <div className="px-4 pb-3 pt-3 flex flex-col gap-1">
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
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-medium text-gray-900 dark:text-white">Filters</h3>
                <button
                    onClick={onClearAll}
                    className={`text-[12px] transition-colors cursor-pointer ${hasFilters ? "text-gray-600 dark:text-white/70 hover:text-brand-green dark:hover:text-brand-green" : "text-gray-400 dark:text-white/45 hover:text-brand-green dark:hover:text-brand-green"}`}
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
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    // Routing State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isCreatingJob, setIsCreatingJob] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [sortBy, setSortBy] = useState<SortOption>("posted_newest");
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
    const [showDateDropdown, setShowDateDropdown] = useState(false);


    // Toast
    const [toast, setToast] = useState<{ message: string; submessage?: string } | null>(null);

    // Refs
    const sortRef = useRef<HTMLDivElement>(null);
    const entriesRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    useClickOutside(sortRef, () => setShowSortDropdown(false));
    useClickOutside(entriesRef, () => setShowEntriesDropdown(false));
    useClickOutside(dateRef, () => setShowDateDropdown(false));

    // Tab counts
    const tabCounts = {
        all: allJobs.length,
        active: allJobs.filter((j) => j.status === "Active").length,
        closed: allJobs.filter((j) => j.status === "Closed").length,
        draft: allJobs.filter((j) => j.status === "Draft").length,
    };

    // Filter + Sort logic
    useEffect(() => {
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
                    case "this_week": {
                        const weekStart = new Date(today);
                        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                        return posted >= weekStart;
                    }
                    case "this_month": {
                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        return posted >= monthStart;
                    }
                    case "last_30_days": {
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return posted >= thirtyDaysAgo;
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
                default:
                    return 0;
            }
        });

        setFilteredJobs(result);
        setCurrentPage(1);
    }, [allJobs, activeTab, debouncedSearch, filters, sortBy, dateFilter]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / entriesPerPage));
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
                break;
            case "copy":
                setToast({ message: "Job Copied", submessage: "A copy of the job has been created as Draft" });
                break;
            case "delete":
                break;
        }
    }, []);

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
        return <CreateJob onBack={() => setIsCreatingJob(false)} />;
    }

    if (selectedJobId) {
        return <JobDetails jobId={selectedJobId} onBack={() => setSelectedJobId(null)} />;
    }

    return (
        <div className="flex flex-col h-full w-full gap-5 font-sans p-4 sm:p-6 lg:p-8 bg-[#F9FAFB] dark:bg-[#19211C] min-h-screen">
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
                    <span className="text-brand-green font-semibold">Jobs</span>
                </div>
                <h1 className="text-[44px] font-semibold text-[#150089] dark:text-white leading-tight">
                    Job Posted
                </h1>
            </div>

            {/* Tabs + Sort/Date/Create Row */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-gray-200 dark:border-white/20 pb-0 gap-4 xl:gap-0">
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
                            className={`px-1 py-3 mr-8 text-[18px] border-b-[3px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.key
                                ? "border-brand-green"
                                : "border-transparent hover:border-gray-300 dark:hover:border-white/20"
                                }`}
                        >
                            <span className={activeTab === tab.key ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-500 dark:text-white/45"}>{tab.label}</span>
                            <span className={activeTab === tab.key ? "text-brand-green font-semibold ml-1" : "text-gray-400 dark:text-white/45 font-medium ml-1"}>({tab.count})</span>
                        </button>
                    ))}
                </div>

                {/* Sort + Today + Create Job */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-[27px] py-2 w-full xl:w-auto justify-end">
                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#23302A] px-4 py-[9px] rounded-[8px] text-[14px] font-medium border border-gray-200 dark:border-[#355041] hover:border-brand-green dark:hover:border-brand-green/60 transition-all text-gray-900 dark:text-white cursor-pointer h-[44px] shadow-sm dark:shadow-none"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-brand-green">
                                <path d="M5 1L9 8H1L5 1Z" />
                            </svg>
                            <span className="text-left">Sort by</span>
                            <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-500 dark:text-white/60 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showSortDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-[10px] shadow-lg z-50 overflow-hidden py-0 text-left">
                                {SORT_OPTIONS.map((opt, index) => (
                                    <div key={opt.value} className="relative">
                                        <button
                                            onClick={() => {
                                                setSortBy(opt.value);
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full text-left px-5 py-3.5 text-[15px] transition-colors ${sortBy === opt.value
                                                ? "bg-[#A2E0BA] dark:bg-brand-green/30 text-[#1F6A45] dark:text-white font-medium"
                                                : "text-gray-700 dark:text-white font-normal hover:bg-gray-50 dark:hover:bg-white/5"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                        {index < SORT_OPTIONS.length - 1 && (
                                            <div className="w-full h-px bg-gray-200 dark:bg-white/10 absolute bottom-0 left-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Today/Date Filter Button */}
                    <div className="relative" ref={dateRef}>
                        <button
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#23302A] px-4 py-[9px] rounded-[8px] text-[14px] font-medium border border-gray-200 dark:border-[#355041] hover:border-brand-green dark:hover:border-brand-green/60 transition-all text-gray-900 dark:text-white cursor-pointer h-[44px] shadow-sm dark:shadow-none"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-green">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {dateFilter === "all" ? "All Time" : DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label}
                            <ChevronDownIcon className="w-2.5 h-2.5 text-gray-500 dark:text-white/60" />
                        </button>
                        {showDateDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                {DATE_FILTER_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setDateFilter(opt.value);
                                            setShowDateDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${dateFilter === opt.value
                                            ? "text-brand-green font-medium bg-brand-green/5 dark:bg-brand-green/10"
                                            : "text-gray-700 dark:text-white"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create Job Button */}
                    <button
                        onClick={() => setIsCreatingJob(true)}
                        className="flex items-center gap-1.5 bg-brand-green hover:bg-[#10A958] text-white px-6 py-[9px] rounded-[8px] text-[14px] font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[44px]"
                    >
                        Create Job
                        <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Content: Sidebar + Jobs List */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Filters Sidebar */}
                <div className="hidden lg:block w-[220px] xl:w-[240px] shrink-0">
                    <div className="bg-white dark:bg-[#212A25] border border-gray-200 dark:border-white/10 rounded-xl p-5 sticky top-6 shadow-sm dark:shadow-none">
                        <FiltersSidebar
                            filters={filters}
                            onFilterChange={setFilters}
                            onClearAll={() => setFilters({ locations: [], employmentTypes: [], workModes: [] })}
                        />
                    </div>
                </div>

                {/* Jobs Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 bg-white dark:bg-[#212A25] border border-gray-200 dark:border-white/10 rounded-xl p-5 h-fit shadow-sm dark:shadow-none">
                    {/* Search + Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Search */}
                        <div className="relative w-full sm:max-w-[420px]">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by job title, company, or Job ID..."
                                className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-white/35 rounded-xl py-2.5 pl-4 pr-10 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 placeholder:font-normal focus:outline-none hover:border-gray-400 dark:hover:border-white/55 focus:border-brand-green transition-colors shadow-sm dark:shadow-none"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40">
                                <SearchIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Showing entries + nav */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[14px] text-gray-500 dark:text-white/60 font-normal">
                                Showing
                            </span>
                            <div className="relative" ref={entriesRef}>
                                <button
                                    onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                                    className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-[8px] text-[14px] text-brand-green font-semibold min-w-[52px] justify-between transition-all cursor-pointer hover:border-brand-green/55 shadow-sm dark:shadow-none"
                                >
                                    {entriesPerPage}
                                    <ChevronDownIcon className={`w-3 h-3 text-gray-400 dark:text-white/50 hover:text-brand-green transition-transform ${showEntriesDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showEntriesDropdown && (
                                    <div className="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                        {[5, 10, 25, 50].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => {
                                                    setEntriesPerPage(num);
                                                    setShowEntriesDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                                className={`w-full text-center py-1.5 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer ${num === entriesPerPage
                                                    ? "bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-white font-medium"
                                                    : "text-gray-700 dark:text-white"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[14px] text-gray-500 dark:text-white/60 whitespace-nowrap font-normal">
                                of {filteredJobs.length.toLocaleString()} entries
                            </span>
                            <div className="flex items-center gap-1.5 ml-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white"
                                >
                                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                        <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white"
                                >
                                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Job Cards */}
                    <div className="flex flex-col gap-3">
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

                    {/* Bottom Pagination */}
                    {filteredJobs.length > 0 && (
                        <div className="flex items-center justify-between pt-4 pb-2">
                            {/* Footer left */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                <span className="hover:text-brand-green cursor-pointer transition-colors">Privacy Policy</span>
                                <span className="hover:text-brand-green cursor-pointer transition-colors">Terms & Conditions</span>
                            </div>

                            {/* Page numbers */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-7 h-7 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {getPaginationNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-[#19211C] dark:text-white">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page as number)}
                                            className={`w-8 h-8 rounded-[4px] flex items-center justify-center text-[13px] font-medium transition-all cursor-pointer ${currentPage === page
                                                ? "bg-brand-green text-white border border-brand-green"
                                                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#19211C] dark:text-white hover:border-gray-300 dark:hover:border-white/20"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-7 h-7 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            {/* Footer right */}
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                © 2025 Origin BI, Made with <span className="text-brand-green font-medium cursor-pointer hover:underline">Touchmark Devicorp Pvt. Ltd</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}