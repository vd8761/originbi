"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, Check, X, Download } from "lucide-react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CandidateDetailProps {
    candidateId: string;
    jobTitle?: string;
    onBack?: () => void;
    initialTab?: "origin_report" | "resume" | "certificate1" | "certificate2" | "applied_jobs";
    candidateData?: Partial<CandidateData>;
}

interface CandidateData {
    id: string;
    name: string;
    originId: string;
    avatar: string;
    trait: string;
    traitColor: string;
    skills: string[];
    alignment: string;
    alignmentPercent: number;
    role: string;
    linkedIn: string;
    github: string;
}

interface OriginReportData {
    traitName: string;
    traitImage?: string;
    strengthChartImage?: string;
    characterName: string;
    collegeName: string;
    degreeInfo: string;
    keyStrengths: string[];
    roleAlignment: { title: string; items: string[] };
    careerGrowthTips: { title: string; sections: { heading: string; body: string }[] };
}

interface AppliedJob {
    id: string;
    title: string;
    company: string;
    employmentType: string;
    roleAlignment: string;
    alignmentPercent: number;
    postedDate: string;
    appliedDate: string;
    closeDate: string;
    status: "Hired" | "Shortlisted" | "Rejected" | "-";
}

type TabKey = "origin_report" | "resume" | "certificate1" | "certificate2" | "applied_jobs";
type SortColumn = "title" | "role_alignment" | "posted_date" | "applied_date" | "close_date";
type SortDirection = "asc" | "desc";

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockCandidate: CandidateData = {
    id: "202001256",
    name: "Monishwar Rajasekaran",
    originId: "202001256",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    trait: "Supportive Energizer",
    traitColor: "border-[#FFB020] text-[#FFB020]",
    skills: ["Figma", "UX Design", "Wire Framing", "Photoshop", "Adobe XD", "Prototype", "Sketch"],
    alignment: "92%",
    alignmentPercent: 92,
    role: "UI/UX Designer",
    linkedIn: "https://linkedin.com",
    github: "https://github.com",
};

const mockOriginReport: OriginReportData = {
    traitName: "Supportive Energizer",
    traitImage: "/traits/Corporate_Supportive_Energizer.png",
    strengthChartImage: "/charts/Supportive_Energizer_Strength_Chart.png",
    characterName: "Pushparaaj",
    collegeName: "Peri Institute of Engineering and Technology",
    degreeInfo: "B.Tech Information Technology (3rd Year)",
    keyStrengths: [
        "Frequently reviews and aligns goals to stay focused and motivated.",
        "Continuously seeks ways to improve and refine processes.",
        "Stays informed about the latest trends and developments in the industry.",
        "Actively seeks constructive feedback from peers and mentors to grow and develop.",
        "Adapts strategies to remain effective in changing circumstances.",
    ],
    roleAlignment: {
        title: "Role Alignment",
        items: [
            "User Experience (UX) Designer",
            "IT Business Analyst",
            "Knowledge Management Specialist",
        ],
    },
    careerGrowthTips: {
        title: "Career Growth Tips",
        sections: [
            {
                heading: "Delivering on Promises",
                body: "The candidate's enthusiasm can sometimes lead him/her to take on more than can realistically be managed. By learning to prioritize and set boundaries, he/she can ensure commitments are met without feeling overwhelmed.",
            },
            {
                heading: "Active Listening",
                body: "While the candidate's conversational skills are excellent, focusing more on listening can help build deeper connections. Taking the time to fully understand others' perspectives will enhance relationships and decision-making.",
            },
            {
                heading: "Staying Focused",
                body: "The candidate's excitement about new ideas can occasionally distract him/her from existing priorities. Adopting tools like task managers and timers can improve focus.",
            },
        ],
    },
};

const mockAppliedJobs: AppliedJob[] = [
    { id: "1", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Hired" },
    { id: "2", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Shortlisted" },
    { id: "3", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Rejected" },
    { id: "4", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "-" },
    { id: "5", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Shortlisted" },
    { id: "6", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Hired" },
];

// â”€â”€â”€ Status Badge Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_COLORS: Record<string, string> = {
    Hired: "bg-[#1ED36A]/[0.24] border border-[#1ED36A] text-[#19211C] dark:text-white",
    Shortlisted: "bg-[#FFB703]/[0.24] border border-[#FFB703] text-[#19211C] dark:text-white",
    Rejected: "bg-[#ED2F34]/[0.24] border border-[#ED2F34] text-[#19211C] dark:text-white",
    "-": "text-white/70",
};

function normalizeTraitKey(name: string): string {
    return name.trim().replace(/\s+/g, "_");
}

function parseDisplayDate(value: string): number {
    const parts = value.trim().split(" ");
    if (parts.length !== 3) {
        return 0;
    }

    const day = Number(parts[0]);
    const monthName = parts[1].toLowerCase();
    const year = Number(parts[2]);
    const monthMap: Record<string, number> = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
    };

    const month = monthMap[monthName.slice(0, 3)] ?? 0;
    if (!day || !month || !year) {
        return 0;
    }

    return year * 10000 + month * 100 + day;
}

// â”€â”€â”€ Star Rating Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <div className="flex gap-3">
            {Array.from({ length: max }).map((_, i) => (
                <svg
                    key={i}
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className={i < Math.round(rating) ? "text-[#1ED36A]" : "text-white/15"}
                >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
            ))}
        </div>
    );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CandidateDetail({ candidateId, jobTitle, onBack, initialTab, candidateData }: CandidateDetailProps) {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? "origin_report");
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("All Status");
    const [selectedDateRange, setSelectedDateRange] = useState<string>("Any Time");
    const [selectedAlignmentRange, setSelectedAlignmentRange] = useState<string>("All Alignment");
    const [calendarPreset, setCalendarPreset] = useState<string>("Custom Range");
    const [rangeStart, setRangeStart] = useState<Date | null>(new Date(2025, 9, 9));
    const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date(2025, 10, 17));
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date(2025, 9, 1));
    const [searchQuery, setSearchQuery] = useState("");
    const [sortColumn, setSortColumn] = useState<SortColumn>("posted_date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }

            if (target.closest("[data-action-menu]")) {
                return;
            }

            setActionMenuOpen(null);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const candidate = { ...mockCandidate, ...candidateData };
    const report: OriginReportData = {
        ...mockOriginReport,
        traitName: candidate.trait || mockOriginReport.traitName,
    };
    const appliedJobs = mockAppliedJobs;

    const traitDisplayName = report.traitName || candidate.trait;
    const traitNameWords = traitDisplayName.split(" ");
    const traitHeadingFirst = traitNameWords[0] || "";
    const traitHeadingRest = traitNameWords.slice(1).join(" ");
    const traitImageKey = normalizeTraitKey(traitDisplayName);
    const traitCharacterImage = report.traitImage || `/traits/Corporate_${traitImageKey}.png`;
    const traitStrengthChartImage = report.strengthChartImage || `/charts/${traitImageKey}_Strength_Chart.png`;

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: "origin_report", label: "Origin Report" },
        { key: "resume", label: "Resume" },
        { key: "certificate1", label: "Certificate 1" },
        { key: "certificate2", label: "Certificate 2" },
        { key: "applied_jobs", label: "Applied Jobs", count: appliedJobs.length },
    ];

    const filteredAppliedJobs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return appliedJobs;
        }

        return appliedJobs.filter((job) => {
            const searchable = [
                job.id,
                job.title,
                job.company,
                job.employmentType,
                job.roleAlignment,
                job.postedDate,
                job.appliedDate,
                job.closeDate,
                job.status,
            ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(query);
        });
    }, [appliedJobs, searchQuery]);

    const sortedAppliedJobs = useMemo(() => {
        const sorted = [...filteredAppliedJobs].sort((a, b) => {
            let left = 0;
            let right = 0;

            if (sortColumn === "title") {
                left = a.title.localeCompare(b.title);
                right = 0;
                return left;
            }

            if (sortColumn === "role_alignment") {
                left = a.alignmentPercent;
                right = b.alignmentPercent;
            }

            if (sortColumn === "posted_date") {
                left = parseDisplayDate(a.postedDate);
                right = parseDisplayDate(b.postedDate);
            }

            if (sortColumn === "applied_date") {
                left = parseDisplayDate(a.appliedDate);
                right = parseDisplayDate(b.appliedDate);
            }

            if (sortColumn === "close_date") {
                left = parseDisplayDate(a.closeDate);
                right = parseDisplayDate(b.closeDate);
            }

            return left - right;
        });

        return sortDirection === "asc" ? sorted : sorted.reverse();
    }, [filteredAppliedJobs, sortColumn, sortDirection]);

    const toggleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortColumn(column);
        setSortDirection("asc");
    };

    const renderSortLabel = (label: string, column: SortColumn) => {
        const isActive = sortColumn === column;
        const upColor = isActive && sortDirection === "asc" ? "#1ED36A" : "#93A19A";
        const downColor = isActive && sortDirection === "desc" ? "#1ED36A" : "#93A19A";

        return (
            <button
                type="button"
                onClick={() => toggleSort(column)}
                className="inline-flex items-center gap-2 text-[13px] leading-[18px] font-light text-[#5C6963] dark:text-white/80 hover:text-[#19211C] dark:hover:text-white transition-colors cursor-pointer"
            >
                <span>{label}</span>
                <svg width="9.85" height="14.49" viewBox="0 0 10 15" fill="none" className="shrink-0">
                    <path d="M5 0L10 6H0L5 0Z" fill={upColor} />
                    <path d="M5 15L0 9H10L5 15Z" fill={downColor} />
                </svg>
            </button>
        );
    };

    const getFilterButtonClass = (isSelected: boolean) =>
        isSelected
            ? "flex items-center gap-2 h-[44px] bg-[#E7F8EE] dark:bg-[#1ED36A]/20 border border-[#1ED36A]/50 dark:border-[#1ED36A]/45 hover:bg-[#DDF4E7] dark:hover:bg-[#1ED36A]/25 text-[#1F3B2A] dark:text-white px-4 rounded-xl text-[13px] leading-[18px] font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0"
            : "flex items-center gap-2 h-[44px] bg-transparent border border-gray-300 dark:border-white/[0.24] hover:bg-black/[0.04] dark:hover:bg-white/5 text-[#33413B] dark:text-white/85 px-4 rounded-xl text-[13px] leading-[18px] font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0";

    const calendarPresets = ["All", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];
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
            const day = daysInPrevMonth - startDayIndex + i + 1;
            cells.push({ date: new Date(year, month - 1, day), inCurrentMonth: false });
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

    const applyPresetRange = (preset: string) => {
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (preset === "All") {
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
            const end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
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

        if (preset === "Custom Range" && !rangeStart && !rangeEnd) {
            const defaultStart = new Date(2025, 9, 9);
            const defaultEnd = new Date(2025, 10, 17);
            setRangeStart(defaultStart);
            setRangeEnd(defaultEnd);
            setLeftCalendarMonth(new Date(2025, 9, 1));
        }
    };

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
        if (!startTime) {
            return false;
        }

        const time = normalizeDate(date);
        if (!endTime) {
            return time === startTime;
        }

        return time >= startTime && time <= endTime;
    };

    const isRangeStart = (date: Date) => startTime !== null && normalizeDate(date) === startTime;
    const isRangeEnd = (date: Date) => endTime !== null && normalizeDate(date) === endTime;

    const renderCalendarMonth = (year: number, month: number, title: string, monthOffset: number) => {
        const cells = buildMonthGrid(year, month);

        return (
            <div className="w-[344px] h-[300px] rounded-[12px] bg-white/[0.08] border border-white/[0.12] px-5 py-3.5">
                <div className="flex items-center justify-between mb-3 text-white/90 pb-3.5 border-b border-white/[0.12]">
                    <button
                        type="button"
                        onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, -1))}
                        className="p-1 text-white/60 hover:text-white transition-colors"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <p className="text-[14px] leading-[18px] font-semibold text-[#E7EFEB]">{title}</p>
                    <button
                        type="button"
                        onClick={() => setLeftCalendarMonth((prev) => addMonths(prev, 1))}
                        className="p-1 text-white/60 hover:text-white transition-colors"
                    >
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
                            <div key={`${title}-${cell.date.toISOString()}-${monthOffset}`} className={`h-[28px] flex items-center justify-center text-[13px] leading-[17px] ${inRange ? "bg-[#1ED36A]/[0.16]" : ""} ${rangePillClass}`}>
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

    return (
        <div className="thin-ui-page relative flex flex-col w-full max-w-[1920px] min-h-0 mx-auto gap-4 font-sans p-4 sm:p-6 lg:p-8 bg-[#F7FAF8] dark:bg-[#19211C]">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-[#5F6B65] dark:text-white/70 mb-1.5 font-normal">
                <button onClick={onBack} className="hover:underline cursor-pointer">Dashboard</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <button onClick={onBack} className="hover:underline cursor-pointer">Jobs</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                {jobTitle && (
                    <>
                        <button onClick={onBack} className="hover:underline cursor-pointer">{jobTitle}</button>
                        <span className="mx-1.5">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                                <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </>
                )}
                <span className="text-brand-green font-medium">Candidate Detail</span>
            </div>

            {/* Main Content: Left Sidebar + Right Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-[435px_minmax(0,1fr)] gap-5 xl:gap-7 items-start">

                {/* â”€â”€â”€ Left Sidebar (Profile Card) â”€â”€â”€ */}
                <div className="w-full max-w-[435px] xl:w-[435px] shrink-0 mx-auto xl:mx-0">
                    <div className="bg-white border border-gray-200 dark:bg-white/[0.08] dark:border-white/[0.2] shadow-[0_4px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_40px_rgba(0,0,0,0.4)] rounded-xl px-5 sm:px-6 xl:px-8 py-5 xl:py-6 flex flex-col items-center gap-6">
                        {/* Avatar */}
                        <div className="w-[104px] h-[104px] rounded-full overflow-hidden border border-[#FFFFFF40]">
                            <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Name & ID */}
                        <div className="text-center flex flex-col gap-2">
                            <h2 className="text-[24px] leading-[31px] font-medium text-[#19211C] dark:text-white">{candidate.name}</h2>
                            <p className="text-[16px] leading-[21px] font-normal text-[#3B4741] dark:text-white">Origin ID : {candidate.originId}</p>
                        </div>

                        {/* Trait */}
                        <div className="h-[43px] px-[10px] rounded-xl border border-[#FEF000] bg-[#FEF0001F] flex items-center justify-center whitespace-nowrap">
                            <span className="text-[14px] leading-[18px] font-thin text-[#19211C] dark:text-white">Trait: </span>
                            <span className="text-[14px] leading-[18px] font-normal text-[#19211C] dark:text-white">{candidate.trait}</span>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-[371px]">
                            {candidate.skills.map((skill, i) => (
                                <span key={i} className="px-3.5 py-[5px] rounded-full border border-gray-200 shadow-sm bg-white text-[13px] font-normal text-[#2E3431]">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 w-full justify-center">
                            <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="h-[37px] min-w-[165px] flex items-center justify-center gap-2 px-4 bg-[#007EBB] text-white rounded-xl text-[16px] leading-[21px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                    <path d="M15.9963 16.0001V10.1401C15.9963 7.26006 15.3763 5.06006 12.0163 5.06006C10.3962 5.06006 9.31625 5.94006 8.87625 6.78006H8.83625V5.32006H5.65625V16.0001H8.97625V10.7001C8.97625 9.30006 9.23625 7.96006 10.9563 7.96006C12.6563 7.96006 12.6763 9.54006 12.6763 10.7801V15.9801H15.9963V16.0001Z" fill="white"/>
                                    <path d="M0.257812 5.31995H3.57781V15.9999H0.257812V5.31995Z" fill="white"/>
                                    <path d="M1.92 0C0.86 0 0 0.86 0 1.92C0 2.98 0.86 3.86 1.92 3.86C2.98 3.86 3.84 2.98 3.84 1.92C3.84 0.86 2.98 0 1.92 0Z" fill="white"/>
                                </svg>
                                LinkedIn Profile
                            </a>
                            <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="h-[37px] min-w-[165px] flex items-center justify-center gap-2 px-4 bg-[#1B1F23] text-white border border-white/[0.16] rounded-xl text-[16px] leading-[21px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                                GitHub Profile
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-black/[0.08] dark:bg-white/[0.1] my-1" />

                        {/* Role */}
                        <div className="flex flex-col items-center gap-5 w-full">
                            <h3 className="text-[24px] leading-[31px] font-medium text-[#19211C] dark:text-white">{candidate.role}</h3>

                            {/* Alignment */}
                            <p className="text-[18px] leading-[23px] font-normal text-[#19211C] dark:text-white">
                                Role Alignment : <span className="text-[#1ED36A]">{candidate.alignment}</span>
                            </p>

                            {/* Star Rating */}
                            <StarRating rating={4} />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4 mt-0 w-full">
                            <button className="h-[55px] min-w-[96px] flex items-center justify-center gap-3 px-4 rounded-full text-[18px] leading-[23px] font-normal bg-gray-50 hover:bg-gray-100 dark:bg-[#343B36] dark:hover:bg-[#454D49] text-[#19211C] dark:text-white border border-gray-200 shadow-sm dark:border-white/[0.08] transition-colors cursor-pointer">
                                <Check className="w-[20px] h-[20px] text-[#1ED36A]" strokeWidth={3} />
                                Hire
                            </button>
                            <button className="h-[55px] min-w-[128px] flex items-center justify-center gap-3 px-4 rounded-full text-[18px] leading-[23px] font-normal bg-gray-50 hover:bg-gray-100 dark:bg-[#343B36] dark:hover:bg-[#454D49] text-[#19211C] dark:text-white border border-gray-200 shadow-sm dark:border-white/[0.08] transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-[#FFB020]">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                Shortlist
                            </button>
                            <button className="h-[55px] min-w-[109px] flex items-center justify-center gap-3 px-4 rounded-full text-[18px] leading-[23px] font-normal bg-gray-50 hover:bg-gray-100 dark:bg-[#343B36] dark:hover:bg-[#454D49] text-[#19211C] dark:text-white border border-gray-200 shadow-sm dark:border-white/[0.08] transition-colors cursor-pointer">
                                <X className="w-[20px] h-[20px] text-[#FF4A4A]" strokeWidth={3} />
                                Reject
                            </button>
                        </div>
                    </div>
                </div>

                {/* â”€â”€â”€ Right Content Panel â”€â”€â”€ */}
                <div className="w-full min-w-0">

                    {/* Tab and Content Container - Wrapped with Border */}
                    <div className="bg-white border border-gray-200 dark:bg-white/[0.08] dark:border-white/[0.2] shadow-[0_4px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_40px_rgba(0,0,0,0.4)] rounded-xl w-full max-w-[1372px] flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="flex items-center gap-0 border-b border-gray-200 dark:border-white/[0.1] overflow-x-auto scrollbar-hide shrink-0 px-6 pt-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="relative px-1 pt-3 pb-5 mr-8 text-[18px] leading-[23px] transition-colors whitespace-nowrap cursor-pointer"
                                >
                                    <span className={activeTab === tab.key ? "font-medium dark:font-medium text-[#1ED36A]" : "font-normal dark:font-light text-[#63716B] dark:text-white/60"}>
                                        {tab.label}
                                    </span>
                                    {tab.count !== undefined && (
                                        <span className={activeTab === tab.key ? "text-[#1ED36A] font-medium dark:font-medium ml-1.5" : "text-[#63716B] dark:text-white/60 font-normal dark:font-light ml-1.5"}>
                                            ({tab.count})
                                        </span>
                                    )}
                                    {activeTab === tab.key && (
                                        <span className="absolute left-0 right-0 -bottom-[1px] h-[3px] bg-[#1ED36A] shadow-[0_2px_8px_rgba(30,211,106,0.4)] rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden scrollbar-hide flex-1 relative">
                            {/* â”€â”€â”€ Origin Report Tab â”€â”€â”€ */}
                            {activeTab === "origin_report" && (
                                <div className="pt-2">
                                    <div className="grid grid-cols-1 xl:grid-cols-[280px_340px_minmax(0,1fr)] gap-6 xl:gap-8 items-start mb-8 w-full">
                                        {/* Left: Trait Name */}
                                        <div className="flex items-center justify-start order-2 xl:order-1 px-3 xl:px-0 xl:pt-24">
                                            <h2 className="text-[36px] leading-[46px] font-medium text-[#19211C] dark:text-white tracking-tight">
                                                {traitHeadingFirst} <br />
                                                <span className="ml-20">{traitHeadingRest}</span>
                                            </h2>
                                        </div>

                                        {/* Center: Character Image */}
                                        <div className="flex justify-center order-1 xl:order-2">
                                            <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                                                <img
                                                    src={traitCharacterImage}
                                                    alt={`${traitDisplayName} Character`}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/traits/Corporate_Supportive_Energizer.png";
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Info and Key Strengths */}
                                        <div className="flex flex-col items-start order-3 px-4 xl:px-0 xl:pt-3">
                                            <div className="mb-6 w-full">
                                                <h3 className="text-[22px] leading-[30px] font-medium text-[#19211C] dark:text-white">{report.characterName}</h3>
                                                <p className="text-[14px] leading-[22px] text-[#1ED36A] font-light mt-1">{report.degreeInfo}</p>
                                                <p className="text-[14px] leading-[18px] text-[#3B4741] dark:text-white font-light mt-0.5">{report.collegeName}</p>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-black/20 dark:bg-white/40 mb-5" />

                                            <div className="flex gap-6 items-start w-full">
                                                {/* Diamond Graphic */}
                                                <div className="w-[98px] shrink-0 pt-1">
                                                    <img
                                                        src={traitStrengthChartImage}
                                                        alt={`${traitDisplayName} Strength Chart`}
                                                        className="w-[98px] h-[240.75px] object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "/charts/Supportive_Energizer_Strength_Chart.png";
                                                        }}
                                                    />
                                                </div>

                                                {/* Key Strengths */}
                                                <div className="flex-1">
                                                    <h3 className="text-[16px] leading-[24px] font-normal text-[#19211C] dark:text-white mb-4">Key Strength</h3>
                                                    <ul className="flex flex-col gap-3">
                                                        {report.keyStrengths.map((strength, i) => (
                                                            <li key={i} className="flex items-start gap-3 text-[16px] font-[300] text-[#32403A] dark:text-white/95 leading-[1.4]">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#32403A] dark:bg-white mt-[10px] shrink-0" />
                                                                {strength}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Section: Role Alignment and Career Growth Tips */}
                                    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden mt-6">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Left Column: Role Alignment */}
                                            <div className="lg:w-[38%] flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10">
                                                <div className="px-8 h-[60px] border-b border-gray-200 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.12] flex items-center">
                                                    <h3 className="text-[18px] leading-[28px] font-medium text-[#1ED36A]">{report.roleAlignment.title}</h3>
                                                </div>
                                                <div className="p-8 h-full">
                                                    <ul className="flex flex-col gap-3">
                                                        {report.roleAlignment.items.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-2.5 text-[16px] font-[300] text-[#32403A] dark:text-white/95 leading-[1.5]">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#32403A]/60 dark:bg-white/60 mt-[10px] shrink-0"></span>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Right Column: Career Growth Tips */}
                                            <div className="flex-1 flex flex-col">
                                                <div className="px-8 h-[60px] border-b border-gray-200 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.12] flex items-center">
                                                    <h3 className="text-[18px] leading-[28px] font-medium text-[#1ED36A]">{report.careerGrowthTips.title}</h3>
                                                </div>
                                                <div className="p-8 h-full">
                                                    <p className="text-[16px] font-[300] text-[#32403A] dark:text-white/95 mb-6 leading-[1.5]">
                                                        The candidate&apos;s vibrant personality and optimistic outlook are among his/her greatest assets, but like any strength, these can be overextended. To ensure continued growth, here are some tailored recommendations for the candidate:
                                                    </p>
                                                    <div className="flex flex-col gap-6">
                                                        {report.careerGrowthTips.sections.map((section, i) => (
                                                            <div key={i}>
                                                                <h4 className="text-[14px] font-medium text-[#19211C] dark:text-white mb-2">{section.heading}</h4>
                                                                <p className="text-[16px] font-[300] text-[#32403A] dark:text-white/95 leading-[1.5]">{section.body}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* â”€â”€â”€ Resume Tab â”€â”€â”€ */}
                            {activeTab === "resume" && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14px] text-gray-600 dark:text-gray-300">Monishwar Rajasekaran Resume.pdf</p>
                                        <button className="h-[42px] flex items-center gap-2 px-6 bg-[#2CD76F] hover:bg-[#25C564] text-white rounded-xl text-[16px] leading-[21px] font-medium shadow-[0_2px_8px_rgba(30,211,106,0.35)] transition-colors cursor-pointer">
                                            Download Resume
                                            <Download className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                    {/* Resume Preview */}
                                    <div className="bg-white border border-gray-200 dark:border-white/5 rounded-2xl p-8 sm:p-12 min-h-[600px]">
                                        {/* Name */}
                                        <h2 className="text-[42px] font-bold text-[#2D2D2D] leading-tight tracking-tight">MARSELINA</h2>
                                        <h2 className="text-[42px] font-bold text-[#2D2D2D] leading-tight tracking-tight">ZALIYANTI</h2>
                                        <p className="text-[16px] text-[#666] mt-2 tracking-wide">Accountant</p>

                                        {/* Contact Info */}
                                        <div className="flex flex-col gap-2.5 mt-6 ml-auto w-fit absolute right-16 top-[180px]" style={{ position: "relative", marginLeft: "auto" }}>
                                            <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                                                +123-456-7890
                                            </div>
                                            <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                                hello@reallygreatsite.com
                                            </div>
                                            <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                123 Anywhere St., Any City
                                            </div>
                                            <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                                                www.reallygreatsite.com
                                            </div>
                                        </div>

                                        {/* Work Experience Section */}
                                        <div className="mt-10">
                                            <div className="bg-[#F0F0F0] rounded-lg px-5 py-3 mb-6">
                                                <h3 className="text-[16px] font-bold text-[#2D2D2D] tracking-widest uppercase">Work Experience</h3>
                                            </div>

                                            <div className="flex gap-8 mb-8">
                                                <div className="text-[13px] text-[#888] w-[160px] shrink-0">
                                                    <p>Ingoude Company</p>
                                                    <p>2019 - Present</p>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-[14px] font-bold text-[#2D2D2D] mb-2">Senior Accountant</h4>
                                                    <p className="text-[13px] text-[#666] leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-8">
                                                <div className="text-[13px] text-[#888] w-[160px] shrink-0">
                                                    <p>Ingoude Company</p>
                                                    <p>2019 - Present</p>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-[14px] font-bold text-[#2D2D2D] mb-2">Accountant</h4>
                                                    <p className="text-[13px] text-[#666] leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* â”€â”€â”€ Certificate Tabs â”€â”€â”€ */}
                            {(activeTab === "certificate1" || activeTab === "certificate2") && (
                                <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center text-gray-400 dark:text-gray-500">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-300">
                                            <circle cx="12" cy="8" r="6" />
                                            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                                        </svg>
                                        <p className="text-[14px] font-medium">{activeTab === "certificate1" ? "Certificate 1" : "Certificate 2"}</p>
                                        <p className="text-[12px] mt-1">Certificate preview will appear here</p>
                                    </div>
                                </div>
                            )}

                            {/* â”€â”€â”€ Applied Jobs Tab â”€â”€â”€ */}
                            {activeTab === "applied_jobs" && (
                                <div className="flex flex-col gap-0 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] w-full max-w-[1324px] min-h-0 mx-auto">
                                    {/* Filters */}
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-gray-200 dark:border-white/[0.08]">
                                        {/* Search */}
                                        <div className="relative w-full lg:w-[410px] shrink-0">
                                            <input
                                                type="text"
                                                placeholder="Search by name, mobile, or Origin BI ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-[44px] bg-transparent border border-gray-300 dark:border-white/[0.24] rounded-xl px-5 text-[13px] leading-[18px] font-light text-[#2B3832] dark:text-white/90 placeholder:text-[#7A8781] dark:placeholder:text-white/70 focus:outline-none focus:border-[#1ED36A] transition-colors"
                                            />
                                        </div>

                                        {/* Filter Buttons */}
                                        <div className="flex w-full lg:w-auto items-center gap-3 flex-wrap lg:flex-nowrap lg:ml-auto">
                                            {/* Status Filter */}
                                            <div className="relative">
                                                {(() => {
                                                    const isStatusSelected = selectedStatus !== "All Status";
                                                    return (
                                                <button
                                                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'status' ? null : 'status')}
                                                    className={getFilterButtonClass(isStatusSelected)}
                                                >
                                                    {selectedStatus}
                                                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isStatusSelected ? 'text-[#1ED36A] dark:text-[#1ED36A]' : 'text-[#7B8A84] dark:text-white/65'} ${activeFilterMenu === 'status' ? 'rotate-180' : ''}`} />
                                                </button>
                                                    );
                                                })()}

                                                {activeFilterMenu === 'status' && (
                                                    <div className="absolute left-0 top-full mt-2 w-40 bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden py-1 box-border">
                                                        {['All Status', 'Hired', 'Shortlisted', 'Rejected'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => {
                                                                    setSelectedStatus(status);
                                                                    setActiveFilterMenu(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-[12px] text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Date Filter */}
                                            <div className="relative">
                                                {(() => {
                                                    const isDateSelected = selectedDateRange !== "Any Time";
                                                    return (
                                                <button
                                                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'date' ? null : 'date')}
                                                    className={getFilterButtonClass(isDateSelected)}
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 18 18"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className={isDateSelected ? "text-[#1ED36A]" : "text-[#7B8A84] dark:text-white/65"}
                                                    >
                                                        <path
                                                            d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z"
                                                            fill="currentColor"
                                                        />
                                                        <path
                                                            d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    {selectedDateRange}
                                                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isDateSelected ? 'text-[#1ED36A] dark:text-[#1ED36A]' : 'text-[#7B8A84] dark:text-white/65'} ${activeFilterMenu === 'date' ? 'rotate-180' : ''}`} />
                                                </button>
                                                    );
                                                })()}

                                                {activeFilterMenu === 'date' && (
                                                    <div
                                                        className="fixed inset-0 z-[80] bg-[#08120E]/80 backdrop-blur-[1.5px] flex items-center justify-center px-3"
                                                        onClick={() => setActiveFilterMenu(null)}
                                                    >
                                                        <div
                                                            className="w-[900px] h-[480px] max-w-[95vw] rounded-[24px] border border-white/[0.2] bg-[#19211C]/40 shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-white/[0.12]">
                                                                <p className="text-[18px] leading-[23px] font-semibold text-white">Select Date Range</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveFilterMenu(null)}
                                                                    className="w-8 h-8 rounded-full bg-white/[0.12] text-[#1ED36A] hover:bg-[#1ED36A]/30 hover:text-white transition-colors flex items-center justify-center"
                                                                >
                                                                    <X size={16} />
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
                                                                        {renderCalendarMonth(leftCalendarMonth.getFullYear(), leftCalendarMonth.getMonth(), getMonthLabel(leftCalendarMonth), 0)}
                                                                        {renderCalendarMonth(addMonths(leftCalendarMonth, 1).getFullYear(), addMonths(leftCalendarMonth, 1).getMonth(), getMonthLabel(addMonths(leftCalendarMonth, 1)), 1)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-white/[0.12] flex items-center justify-between gap-3">
                                                                <p className="text-[12px] leading-[16px] font-normal text-white">Selected Range : {selectedRangeText}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCalendarPreset("All");
                                                                            setRangeStart(null);
                                                                            setRangeEnd(null);
                                                                            setSelectedDateRange("Any Time");
                                                                            setActiveFilterMenu(null);
                                                                        }}
                                                                        className="h-7 px-4 rounded-full border border-white text-white text-[12px] leading-[16px] font-medium hover:bg-white/10 transition-colors"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (calendarPreset === "All" || !rangeStart) {
                                                                                setSelectedDateRange("Any Time");
                                                                            } else if (rangeStart && !rangeEnd) {
                                                                                setSelectedDateRange(formatFilterRangeLabel(rangeStart, rangeStart));
                                                                            } else if (rangeStart && rangeEnd) {
                                                                                setSelectedDateRange(formatFilterRangeLabel(rangeStart, rangeEnd));
                                                                            }
                                                                            setActiveFilterMenu(null);
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
                                            </div>

                                            {/* Alignment Filter */}
                                            <div className="relative">
                                                {(() => {
                                                    const isAlignmentSelected = selectedAlignmentRange !== "All Alignment";
                                                    return (
                                                <button
                                                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'alignment' ? null : 'alignment')}
                                                    className={getFilterButtonClass(isAlignmentSelected)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={isAlignmentSelected ? "text-[#1ED36A]" : "text-[#7B8A84] dark:text-white/65"}>
                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                    </svg>
                                                    {selectedAlignmentRange}
                                                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isAlignmentSelected ? 'text-[#1ED36A] dark:text-[#1ED36A]' : 'text-[#7B8A84] dark:text-white/65'} ${activeFilterMenu === 'alignment' ? 'rotate-180' : ''}`} />
                                                </button>
                                                    );
                                                })()}

                                                {activeFilterMenu === 'alignment' && (
                                                    <div className="absolute left-0 top-full mt-2 w-48 bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-lg shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden py-1 box-border">
                                                        {['All Alignment', 'Alignment (90% - 100%)', 'Alignment (70% - 89%)', 'Alignment (50% - 69%)', 'Alignment (Below 50%)'].map((align) => (
                                                            <button
                                                                key={align}
                                                                onClick={() => {
                                                                    setSelectedAlignmentRange(align);
                                                                    setActiveFilterMenu(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-[12px] text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                            >
                                                                {align}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="w-full overflow-x-auto overflow-y-visible scrollbar-hide pb-2">
                                        <table className="w-full min-w-[980px] text-[14px] text-[#19211C] dark:text-white">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-black/[0.06] dark:bg-white/[0.1]">
                                                        <th className="text-left px-4 py-3 whitespace-nowrap">{renderSortLabel("Job Title", "title")}</th>
                                                        <th className="text-left px-4 py-3 whitespace-nowrap">{renderSortLabel("Role Alignment", "role_alignment")}</th>
                                                        <th className="text-left px-4 py-3 whitespace-nowrap">{renderSortLabel("Posted Date", "posted_date")}</th>
                                                        <th className="text-left px-4 py-3 whitespace-nowrap">{renderSortLabel("Applied Date", "applied_date")}</th>
                                                        <th className="text-left px-4 py-3 whitespace-nowrap">{renderSortLabel("Close Date", "close_date")}</th>
                                                        <th className="text-center px-4 py-3 text-[13px] leading-[16px] font-light text-[#3A4741] dark:text-white/70 whitespace-nowrap">Current Status</th>
                                                        <th className="text-center w-[96px] px-4 py-3 text-[13px] leading-[16px] font-light text-[#3A4741] dark:text-white/70 whitespace-nowrap">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedAppliedJobs.map((job) => (
                                                        <tr key={job.id} className="border-b border-gray-200 dark:border-white/[0.08] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 py-4">
                                                                <div>
                                                                    <p className="font-medium text-[16px] leading-[20px] text-[#19211C] dark:text-white">{job.title}</p>
                                                                    <p className="text-[12px] leading-[16px] font-light text-[#4E5B55] dark:text-white/80 mt-1">{job.company} Â· Chennai Â· {job.employmentType}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex gap-0.5">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={star <= 4 ? "text-[#13C065]" : "text-[#13C065]/30"}>
                                                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                                            </svg>
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-[#13C065] font-medium text-[14px] leading-[20px]">{job.roleAlignment}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-[14px] leading-[20px] font-normal text-[#19211C] dark:text-white whitespace-nowrap">{job.postedDate}</td>
                                                            <td className="px-4 py-4 text-[14px] leading-[20px] font-normal text-[#19211C] dark:text-white whitespace-nowrap">{job.appliedDate}</td>
                                                            <td className="px-4 py-4 text-[14px] leading-[20px] font-normal text-[#19211C] dark:text-white whitespace-nowrap">{job.closeDate}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                {job.status === "-" ? (
                                                                    <span className="text-[#6F7D77] dark:text-white/70">-</span>
                                                                ) : (
                                                                    <span className={`inline-flex items-center justify-center min-w-[102px] h-[37px] px-[12px] rounded-[4px] text-[12px] leading-[18px] font-medium ${STATUS_COLORS[job.status]}`}>
                                                                        {job.status}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="w-[96px] px-4 py-4 relative text-center align-middle overflow-visible">
                                                                <button
                                                                    onClick={() => setActionMenuOpen(actionMenuOpen === job.id ? null : job.id)}
                                                                    data-action-menu="toggle"
                                                                    className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${actionMenuOpen === job.id ? 'bg-[#13C065] border-[#13C065] text-white' : 'border-gray-300 dark:border-white/20 hover:bg-[#13C065] hover:border-[#13C065] hover:text-white text-[#6F7D77] dark:text-white/70'}`}
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                                        <circle cx="5" cy="12" r="1.5" />
                                                                        <circle cx="12" cy="12" r="1.5" />
                                                                        <circle cx="19" cy="12" r="1.5" />
                                                                    </svg>
                                                                </button>

                                                                {/* Dropdown Menu */}
                                                                {actionMenuOpen === job.id && (
                                                                    <div data-action-menu="panel" className="absolute right-0 top-11 w-32 bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-xl shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden text-left box-border">
                                                                        <button className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-[#2C3933] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors">
                                                                            View Job
                                                                        </button>
                                                                        <button className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-[#2C3933] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors border-t border-[#19211C]/10 dark:border-white/20">
                                                                            Shortlist
                                                                        </button>
                                                                        <button className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-[#2C3933] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors border-t border-[#19211C]/10 dark:border-white/20">
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* â”€â”€â”€ End Applied Jobs Tab â”€â”€â”€ */}

                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[14px] leading-[18px] text-[#19211C] dark:text-white/90 pb-4 mt-3 w-full">
                <div className="flex items-center gap-4">
                    <span className="text-[#1ED36A] underline decoration-solid underline-offset-2 font-medium cursor-pointer">Privacy Policy</span>
                    <span className="text-black/20 dark:text-white/20">/</span>
                    <span className="text-[#1ED36A] underline decoration-solid underline-offset-2 font-medium cursor-pointer">Terms & Conditions</span>
                </div>
                <span>
                    &copy; 2025 Origin BI, Made with{" "}
                    <span className="text-[#1ED36A] underline decoration-solid underline-offset-2 font-medium cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
                </span>
            </div>
        </div>
    );
}


