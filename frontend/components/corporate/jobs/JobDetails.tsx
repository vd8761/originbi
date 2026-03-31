import React, { useMemo, useState } from "react";
import { ChevronDownIcon, SearchIcon, ClockIcon, MapPinIcon, StarIcon, CheckCircle2, XCircle } from "lucide-react";
import CandidateDetail from "../candidates/CandidateDetail";

export interface JobDetailsProps {
    jobId: string;
    onBack?: () => void;
}

// ─── Mock Data for Job Details ──────────────────────────────────
// TODO: Replace with real API data later
const mockJobDetail = {
    id: "1",
    title: "UI/UX Designer",
    company: "Google Inc",
    location: "Chennai",
    employmentType: "Full Time",
    jobId: "18722765562",
    workMode: "Onsite",
    shift: "Day Shift",
    experienceLevel: "Fresher",
    annualCTC: "3,50,000 - 4,00,000",
    postedDate: "27 December 2025",
    closingDate: "28 February 2026",
    jobDescription: "We are looking for creative and passionate students or recent graduates to join our team as UX/UI Designers.\nThis role is ideal for freshers who want to learn, gain practical experience, and build a strong portfolio while working on real projects.",
    responsibilities: [
        "Design wireframes, UI screens, and simple prototypes",
        "Collaborate with developers to ensure accurate design implementation",
        "Participate in design discussions and review sessions",
        "Assist in improving user experience across products",
        "Maintain visual consistency and design standards",
    ],
    eligibility: [
        "Final-year students & recent graduates",
        "2024 / 2025 pass-outs",
        "Basic UI/UX knowledge",
        "Portfolio or academic projects accepted",
    ],
    requiredSkills: ["Figma", "Prototyping", "Wire Framing", "Adobe XD"],
    niceToHaveSkills: "Basic knowledge of HTML/CSS, Awareness of responsive design principles, Any prior academic, personal, or internship project experience",
    whatYouWillLearn: [
        "Industry-standard UI/UX design workflows",
        "Working with real product requirements and timelines",
        "Collaboration with cross-functional teams",
        "Iterating designs based on feedback and usability insights",
        "Exposure to professional design systems and best practices",
    ],
    companyDetails: "Google is a global tech leader known for innovation, offering students and freshers opportunities to learn, work on real projects, and grow in a creative culture.",
    counts: {
        all: 100,
        new: 20,
        shortlisted: 20,
        hired: 17,
        rejected: 12,
    }
};

// ─── Mock Candidates Data ───────────────────────────────────────
export interface Candidate {
    id: string;
    name: string;
    originId: string;
    location: string;
    postedTime: string;
    trait: string;
    traitColor: string;
    skills: string[];
    alignment: string;
    avatar: string;
}

const mockCandidates: Candidate[] = [
    {
        id: "202001256_1",
        name: "Monishwar Rajasekaran",
        originId: "202001256",
        location: "", // No location for this one in image
        postedTime: "2 days ago",
        trait: "Supportive Energizer",
        traitColor: "border-[#FFB020]/80 bg-[#FFB0201A]",
        skills: ["Figma", "UX Design", "Wire Framing", "+3 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    {
        id: "202001256_2",
        name: "Giyu Tomioka",
        originId: "202001256",
        location: "Chennai, Tamil Nadu",
        postedTime: "2 days ago",
        trait: "Analytical Leader",
        traitColor: "border-[#33B6FF]/80 bg-[#33B6FF1A]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    {
        id: "202001256_3",
        name: "Majiro Sano",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Strategic Stabilizer",
        traitColor: "border-[#FF7A00]/80 bg-[#FF7A001A]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    },
    {
        id: "202001256_4",
        name: "Eren Yeager",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Collaborative Optimist",
        traitColor: "border-[#13C065]/80 bg-[#13C0651A]",
        skills: ["Figma", "UX Design", "Wire Framing", "+1 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026702d",
    },
    {
        id: "202001256_5",
        name: "Sakuna",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Dependable Specialist",
        traitColor: "border-[#00E5FF]/80 bg-[#00E5FF1A]",
        skills: ["Figma", "UX Design", "Wire Framing", "+2 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    },
    {
        id: "202001256_6",
        name: "Taki Tachibana",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Structured Supporter",
        traitColor: "border-[#FF4A8D]/80 bg-[#FF4A8D1A]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024e",
    }
];

type TabKey = "job_details" | "all" | "new" | "shortlisted" | "hired" | "rejected";

export default function JobDetails({ jobId, onBack }: JobDetailsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("job_details");
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
    const [showDateModal, setShowDateModal] = useState(false);
    const [showAlignmentDropdown, setShowAlignmentDropdown] = useState(false);
    const [appliedDateFilter, setAppliedDateFilter] = useState("Applied Date");
    const [alignmentFilter, setAlignmentFilter] = useState("All Alignments");
    const [calendarPreset, setCalendarPreset] = useState("Any Time");
    const [rangeStart, setRangeStart] = useState<Date | null>(new Date(2025, 9, 9));
    const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date(2025, 10, 17));
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date(2025, 9, 1));
    const [customDateLabel, setCustomDateLabel] = useState<string | null>(null);

    const calendarPresets = ["Any Time", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];
    const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    const alignmentFilterOptions = [
        "Alignment (90% - 100%)",
        "Alignment (80% - 89%)",
        "Alignment (Below 80%)",
        "All Alignments",
    ];

    const getDaysAgoFromLabel = (value: string) => {
        const match = value.match(/(\d+)/);
        if (!match) return Number.MAX_SAFE_INTEGER;
        return Number(match[1]);
    };

    const getAlignmentScore = (value: string) => {
        const match = value.match(/(\d+)/);
        return match ? Number(match[1]) : 0;
    };

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
            setAppliedDateFilter("Applied Date");
            setCustomDateLabel(null);
            setShowDateModal(false);
            return;
        }
        if (preset === "Today") {
            setAppliedDateFilter("Today");
            setCustomDateLabel(null);
            setShowDateModal(false);
            return;
        }
        if (preset === "Yesterday") {
            setAppliedDateFilter("Yesterday");
            setCustomDateLabel(null);
            setShowDateModal(false);
            return;
        }
        if (preset === "Last 7 Days") {
            setAppliedDateFilter("Last 7 Days");
            setCustomDateLabel(null);
            setShowDateModal(false);
            return;
        }
        if (preset === "Last 30 Days") {
            setAppliedDateFilter("Last 30 Days");
            setCustomDateLabel(null);
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

    const appliedDateLabel = appliedDateFilter === "Custom Range"
        ? (customDateLabel ?? "Applied Date")
        : appliedDateFilter;
    const isAppliedDateActive = appliedDateFilter !== "Applied Date";
    const isAlignmentActive = alignmentFilter !== "All Alignments";
    const alignmentFilterLabel = isAlignmentActive ? alignmentFilter : "Alignment";

    const filteredCandidates = useMemo(() => {
        const search = candidateSearchTerm.trim().toLowerCase();

        return mockCandidates.filter((candidate) => {
            const daysAgo = getDaysAgoFromLabel(candidate.postedTime);
            const score = getAlignmentScore(candidate.alignment);

            const matchesSearch =
                !search ||
                candidate.name.toLowerCase().includes(search) ||
                candidate.originId.toLowerCase().includes(search) ||
                candidate.skills.some((skill) => skill.toLowerCase().includes(search));

            const matchesDate = (() => {
                const postedDate = new Date();
                postedDate.setDate(postedDate.getDate() - daysAgo);
                const postedDateTime = normalizeDate(postedDate);

                switch (appliedDateFilter) {
                    case "Today":
                        return daysAgo === 0;
                    case "Yesterday":
                        return daysAgo === 1;
                    case "Last 7 Days":
                        return daysAgo <= 7;
                    case "Last 30 Days":
                        return daysAgo <= 30;
                    case "This Month": {
                        const today = new Date();
                        const start = new Date(today.getFullYear(), today.getMonth(), 1);
                        return postedDateTime >= normalizeDate(start);
                    }
                    case "Last Month":
                        {
                            const today = new Date();
                            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                            const end = new Date(today.getFullYear(), today.getMonth(), 0);
                            return postedDateTime >= normalizeDate(start) && postedDateTime <= normalizeDate(end);
                        }
                    case "Custom Range":
                        if (!rangeStart || !rangeEnd) return true;
                        return postedDateTime >= normalizeDate(rangeStart) && postedDateTime <= normalizeDate(rangeEnd);
                    case "Applied Date":
                    default:
                        return true;
                }
            })();

            const matchesAlignment = (() => {
                switch (alignmentFilter) {
                    case "Alignment (90% - 100%)":
                        return score >= 90 && score <= 100;
                    case "Alignment (80% - 89%)":
                        return score >= 80 && score <= 89;
                    case "Alignment (Below 80%)":
                        return score < 80;
                    case "All Alignments":
                    default:
                        return true;
                }
            })();

            return matchesSearch && matchesDate && matchesAlignment;
        });
    }, [candidateSearchTerm, appliedDateFilter, alignmentFilter, rangeStart, rangeEnd]);

    // TODO: Fetch data from backend using jobId
    const job = mockJobDetail;

    // Show CandidateDetail when a candidate is selected
    if (selectedCandidateId) {
        const selectedCandidate = mockCandidates.find((candidate) => candidate.id === selectedCandidateId);

        return (
            <CandidateDetail
                candidateId={selectedCandidateId}
                jobTitle={job.title}
                candidateData={selectedCandidate ? {
                    name: selectedCandidate.name,
                    originId: selectedCandidate.originId,
                    avatar: selectedCandidate.avatar,
                    trait: selectedCandidate.trait,
                    traitColor: selectedCandidate.traitColor,
                    alignment: selectedCandidate.alignment,
                } : undefined}
                onBack={() => setSelectedCandidateId(null)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full gap-5 font-sans p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F9FAFB] dark:bg-[#19211C]">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-400 dark:text-white/70 mb-1.5 font-normal">
                <button onClick={onBack} className="hover:underline cursor-pointer">Dashboard</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500 dark:text-gray-400">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <button onClick={onBack} className="hover:underline cursor-pointer">Jobs</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500 dark:text-gray-400">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="text-brand-green font-semibold">Job Overview</span>
            </div>

            {/* Header: Title & Company Info & Edit Btn */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-semibold text-[#19211C] dark:text-white mb-2 leading-tight">
                        {job.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[16px] sm:text-[20px] leading-[100%] font-normal text-gray-600 dark:text-gray-300">
                        <span>{job.company}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>{job.location}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>{job.employmentType}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-4">|</span>
                        <span className="ml-4 font-normal">Job ID : {job.jobId}</span>
                    </div>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-[7px] bg-white dark:bg-[#313B36] hover:bg-[#343D38] border border-gray-200 dark:border-[#FFFFFF14] rounded-full text-[13px] leading-[100%] font-medium text-[#19211C] dark:text-white transition-colors cursor-pointer shadow-sm dark:shadow-none">
                    Edit
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1ED36A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-100">
                        <path d="M2 10l2.1-.5L10 3.6 8.4 2 2.5 7.9 2 10z" />
                        <path d="M7.7 1.3L9.3 2.9" />
                    </svg>
                </button>
            </div>

            {/* Tabs + Dates Row */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-end border-b border-brand-light-tertiary dark:border-white/10 pb-0 gap-4 xl:gap-0 mt-4">
                {/* Tabs */}
                <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
                    {([
                        { key: "job_details" as TabKey, label: "Job Details", count: null },
                        { key: "all" as TabKey, label: "All", count: job.counts.all },
                        { key: "new" as TabKey, label: "New", count: job.counts.new },
                        { key: "shortlisted" as TabKey, label: "Shortlisted", count: job.counts.shortlisted },
                        { key: "hired" as TabKey, label: "Hired", count: job.counts.hired },
                        { key: "rejected" as TabKey, label: "Rejected", count: job.counts.rejected },
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-1 py-3 -mb-px mr-6 text-[14px] border-b-[3px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.key
                                ? "border-brand-green"
                                : "border-transparent hover:border-gray-200 dark:hover:border-white/20"
                                }`}
                        >
                            <span className={activeTab === tab.key ? "font-light text-brand-green" : "font-light text-gray-500 dark:text-gray-400"}>
                                {tab.label}
                            </span>
                            {tab.count !== null && (
                                <span className={activeTab === tab.key ? "text-brand-green font-light ml-1.5" : "text-gray-400 dark:text-gray-500 font-light ml-1.5"}>
                                    ({tab.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-5 py-2 w-full xl:w-auto justify-end flex-wrap text-[13px] font-normal">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-white font-normal">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#1ED36A]">
                            <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor" />
                            <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor" />
                        </svg>
                        Posted on {job.postedDate}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-white font-normal">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
                        Closes at {job.closingDate}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "job_details" && (
                <div className="flex flex-col gap-6 mt-4 bg-white dark:bg-[#2A312D] border border-gray-200 dark:border-[#FFFFFF1F] rounded-[14px] px-6 py-6">
                    {/* Stats Ribbon */}
                    <div className="flex items-center justify-start py-2 gap-7 overflow-x-auto scrollbar-hide whitespace-nowrap">

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full border border-[#D7E2DD] dark:border-[#3E4A44] bg-[#EEF3F0] dark:bg-[#2F3833] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Employment Type</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.employmentType}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full border border-[#D7E2DD] dark:border-[#3E4A44] bg-[#EEF3F0] dark:bg-[#2F3833] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Work Mode</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.workMode}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full border border-[#D7E2DD] dark:border-[#3E4A44] bg-[#EEF3F0] dark:bg-[#2F3833] flex items-center justify-center text-[#13C065] shrink-0">
                                {/* Sun/Moon Shift Icon */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 3v2M12 19v2M3.5 12h2M18.5 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5l1.5-1.5M17 7l1.5-1.5" />
                                    <path d="M15 9a5 5 0 0 1 0 6 7 7 0 0 0 0-6Z" fill="currentColor" stroke="none" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Shift</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.shift}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full border border-[#D7E2DD] dark:border-[#3E4A44] bg-[#EEF3F0] dark:bg-[#2F3833] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Experience Level</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.experienceLevel}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full border border-[#D7E2DD] dark:border-[#3E4A44] bg-[#EEF3F0] dark:bg-[#2F3833] flex items-center justify-center text-[#13C065] shrink-0 font-bold text-[19px]">
                                ₹
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Annual CTC</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.annualCTC}</span>
                            </div>
                        </div>
                    </div>

                    {/* Job Details Body */}
                    <div className="flex flex-col gap-8 max-w-4xl text-[14.5px] text-gray-800 dark:text-gray-200 mt-2 font-normal">

                        {/* Summary / Description */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Job Description</h3>
                            <p className="leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 font-normal">
                                {job.jobDescription}
                            </p>
                        </div>

                        {/* Responsibilities */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Responsibilities</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.responsibilities.map((resp, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300 font-normal">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{resp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Eligibility */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Eligibility</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.eligibility.map((elig, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300 font-normal">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{elig}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Required Skills */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-3">Required Skills (Mandatory for shortlisting)</h3>
                            <div className="flex flex-wrap gap-2.5">
                                {job.requiredSkills.map((skill, i) => (
                                    <span key={i} className="px-3.5 py-[5px] rounded-full border border-[#DDE1DE] dark:border-transparent bg-[#F3F5F3] dark:bg-[#F0F2F0] text-[13px] font-normal text-[#2E3431] dark:text-[#2E3431]">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Nice to Have */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2">Nice-to-Have Skills</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
                                {job.niceToHaveSkills}
                            </p>
                        </div>

                        {/* What You Will Learn */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">What You Will Learn</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.whatYouWillLearn.map((learn, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300 font-normal">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{learn}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Details */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Company Details</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
                                {job.companyDetails}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Candidates Grid View for other tabs */}
            {activeTab !== "job_details" && (
                <div className="flex-1 flex flex-col mt-4">

                    <div className="bg-white dark:bg-[#2C3430] border border-gray-200 dark:border-white/10 rounded-[14px] p-5">

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 mb-5 border-b border-gray-200 dark:border-white/10 relative z-10">
                        {/* Search Input */}
                        <div className="relative w-full md:w-[410px]">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#9EAAA4] w-[18px] h-[18px]" />
                            <input
                                type="text"
                                placeholder="Search by name, Skill..."
                                value={candidateSearchTerm}
                                onChange={(e) => setCandidateSearchTerm(e.target.value)}
                                className="w-full h-11 bg-transparent border border-gray-300 dark:border-white/30 rounded-[12px] pl-12 pr-4 text-[13px] text-[#19211C] dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#B7C1BC] focus:outline-none focus:border-brand-green transition-colors"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide shrink-0 pb-1 md:pb-0">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDateModal(true);
                                        setShowAlignmentDropdown(false);
                                    }}
                                    className={`h-11 flex items-center gap-2.5 px-4 rounded-[12px] text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${isAppliedDateActive
                                        ? "bg-[#1F6A45]/70 border border-[#2B8A59] hover:bg-[#257F54] text-[#19211C] dark:text-white"
                                        : "bg-[#E5E8E6] dark:bg-[#2F3833] border border-[#D3D8D5] dark:border-white/15 hover:bg-[#DCE1DE] dark:hover:bg-[#3A433E] text-[#19211C] dark:text-white"
                                        }`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-[#1ED36A]">
                                        <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor" />
                                        <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor" />
                                    </svg>
                                    {appliedDateLabel}
                                    <ChevronDownIcon className={`w-4 h-4 ml-0.5 ${isAppliedDateActive ? "text-[#19211C]/70 dark:text-white/80" : "text-[#19211C]/65 dark:text-white/75"}`} />
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAlignmentDropdown((prev) => !prev);
                                        setShowDateModal(false);
                                    }}
                                    className={`h-11 flex items-center gap-2.5 px-4 rounded-[12px] text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${isAlignmentActive
                                        ? "bg-[#1F6A45]/70 border border-[#2B8A59] hover:bg-[#257F54] text-[#19211C] dark:text-white"
                                        : "bg-[#E5E8E6] dark:bg-[#2F3833] border border-[#D3D8D5] dark:border-white/15 hover:bg-[#DCE1DE] dark:hover:bg-[#3A433E] text-[#19211C] dark:text-white"
                                        }`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#1ED36A]" stroke="none">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                    </svg>
                                    {alignmentFilterLabel}
                                    <ChevronDownIcon className={`w-4 h-4 ml-0.5 ${isAlignmentActive ? "text-[#19211C]/70 dark:text-white/80" : "text-[#19211C]/65 dark:text-white/75"}`} />
                                </button>
                                {showAlignmentDropdown && (
                                    <div className="absolute top-full mt-2 right-0 w-52 bg-white dark:bg-[#27322C] border border-gray-200 dark:border-white/10 rounded-[10px] shadow-lg z-50 overflow-hidden py-1 text-left">
                                        {alignmentFilterOptions.map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => {
                                                    setAlignmentFilter(option);
                                                    setShowAlignmentDropdown(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-[13px] transition-colors ${alignmentFilter === option
                                                    ? "bg-[#A2E0BA] dark:bg-brand-green/30 text-[#1F6A45] dark:text-white font-medium"
                                                    : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                        {filteredCandidates.map((cad) => (
                            <div key={cad.id} className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-[12px] px-6 py-4 min-h-[286px] hover:border-white/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all flex flex-col gap-3">

                                {/* Top Section */}
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-white/10 shrink-0">
                                            <img src={cad.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        {/* Name & Details */}
                                        <div className="flex flex-col mt-0.5">
                                            <h3 className="text-[24px] leading-[100%] font-[600] text-[#19211C] dark:text-white mb-2">{cad.name}</h3>
                                            <p className="text-[14px] leading-[100%] text-gray-500 dark:text-gray-300 font-normal mb-1.5">Origin ID : {cad.originId}</p>
                                            {cad.location && (
                                                <p className="text-[14px] leading-[100%] text-gray-500 dark:text-gray-300 font-normal flex items-center gap-1.5 mt-0.5">
                                                    <MapPinIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" /> {cad.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time & Links */}
                                    <div className="flex items-center gap-2 text-[14px] leading-[100%] font-normal shrink-0">
                                        <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                        <span className="text-gray-500 dark:text-gray-300">{cad.postedTime}</span>
                                        <span className="text-gray-600 mx-0.5">|</span>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidateId(cad.id); }} className="text-[#13C065] hover:text-[#10A958] transition-colors cursor-pointer">View Details</button>
                                    </div>
                                </div>

                                {/* Skills Row */}
                                <div className="flex items-end justify-between mt-1">
                                    <div className="flex flex-wrap items-center gap-2 max-w-[72%]">
                                        {cad.skills.map((s, idx) => (
                                            <span key={idx} className="bg-[#F2F3F2] text-[#333834] px-4 py-[6px] rounded-full text-[14px] leading-[100%] font-normal whitespace-nowrap">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                    {/* Trait Badge */}
                                    <div className={`inline-flex items-center gap-[10px] h-[43px] px-[10px] rounded-[12px] border text-[14px] leading-[100%] font-normal text-[#19211C] dark:text-white whitespace-nowrap shrink-0 ${cad.traitColor}`}>
                                        <span className="opacity-85 font-normal text-[#19211C] dark:text-white">Trait:</span> <span className="font-normal text-[#19211C] dark:text-white">{cad.trait}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                {/* No divider across the card visually in image, just space */}
                                <div className="h-[1px] w-full bg-white/5 my-1" />

                                {/* Footer Row */}
                                <div className="flex items-center justify-between">
                                    {/* Alignment Score */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[14px] leading-[100%] font-normal text-[#19211C] dark:text-white">
                                            Role Alignment : <span className="text-[#1ED36A] font-semibold">{cad.alignment}</span>
                                        </p>
                                        <div className="flex gap-1.5 text-[#1ED36A]">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={star === 5 ? "opacity-35" : ""}>
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] leading-[100%] font-normal transition-colors cursor-pointer ${activeTab === 'hired' ? 'bg-[#1ED36A] text-white border border-[#1ED36A]' : 'bg-[#E2E6E3] hover:bg-[#D8DEDA] text-[#1F2723] border border-[#D2D8D4] dark:bg-[#454D49] dark:hover:bg-[#4C5751] dark:text-white dark:border-white/10'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'hired' ? '#FFFFFF' : '#1ED36A'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                            Hire
                                        </button>
                                        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] leading-[100%] font-normal transition-colors cursor-pointer ${activeTab === 'shortlisted' ? 'bg-[#FFB020] text-white border border-[#FFB020]' : 'bg-[#E2E6E3] hover:bg-[#D8DEDA] text-[#1F2723] border border-[#D2D8D4] dark:bg-[#454D49] dark:hover:bg-[#4C5751] dark:text-white dark:border-white/10'}`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={`${activeTab === 'shortlisted' ? 'text-white' : 'text-[#FFB020]'}`}>
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                            Shortlist
                                        </button>
                                        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] leading-[100%] font-normal transition-colors cursor-pointer ${activeTab === 'rejected' ? 'bg-[#FF4A4A] text-white border border-[#FF4A4A]' : 'bg-[#E2E6E3] hover:bg-[#D8DEDA] text-[#1F2723] border border-[#D2D8D4] dark:bg-[#454D49] dark:hover:bg-[#4C5751] dark:text-white dark:border-white/10'}`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'rejected' ? '#FFFFFF' : '#FF4A4A'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCandidates.length === 0 && (
                        <div className="flex items-center justify-center py-10 text-[14px] text-gray-500 dark:text-gray-300 border border-dashed border-gray-300 dark:border-white/20 rounded-[12px]">
                            No candidates match the selected filters.
                        </div>
                    )}

                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-2 mb-10 pb-8 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">&lt;</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center bg-[#13C065] text-[#111412] font-bold">1</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">2</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">3</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">4</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">5</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">6</button>
                        <span className="px-1 text-gray-600">...</span>
                        <button className="min-w-8 px-2 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">144</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">&gt;</button>
                    </div>

                </div>
            )}

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
                                        setAppliedDateFilter("Applied Date");
                                        setCustomDateLabel(null);
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
                                            setAppliedDateFilter("Applied Date");
                                            setCustomDateLabel(null);
                                        } else if (rangeStart && !rangeEnd) {
                                            setAppliedDateFilter("Custom Range");
                                            setCustomDateLabel(formatFilterRangeLabel(rangeStart, rangeStart));
                                        } else if (rangeStart && rangeEnd) {
                                            setAppliedDateFilter("Custom Range");
                                            setCustomDateLabel(formatFilterRangeLabel(rangeStart, rangeEnd));
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

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-300 mt-auto pb-4">
                <div className="flex items-center gap-4">
                    <span className="text-brand-green hover:underline cursor-pointer">Privacy Policy</span>
                    <span className="text-brand-green hover:underline cursor-pointer">Terms & Conditions</span>
                </div>
                <span>
                    © 2025 Origin BI, Made with <span className="text-brand-green cursor-pointer hover:underline">Touchmark Descience Pvt. Ltd.</span>
                </span>
            </div>
        </div>
    );
}
