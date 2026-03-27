"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import CandidateDetail from "./CandidateDetail";

// ─── Types ──────────────────────────────────────────────────────

type TabKey = "origin_report" | "resume" | "certificate1" | "certificate2" | "applied_jobs";

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

// ─── Filter Dropdown ─────────────────────────────────────────────

function FilterDropdown({
    label,
    icon,
    options,
    value,
    onChange,
}: {
    label: string;
    icon?: React.ReactNode;
    options: string[];
    value: string | null;
    onChange: (v: string | null) => void;
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
    const displayLabel = isActive
        ? (label.includes(":") ? `${label.split(":")[0]}: ${value}` : value!)
        : label;

    const iconNode = React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `${(icon as React.ReactElement<{ className?: string }>).props.className ?? ""} ${
                isActive ? "text-[#1ED36A]" : "text-[#7B8A84] dark:text-white/65"
            }`,
        })
        : icon;

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 h-[44px] px-4 rounded-xl text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                    isActive
                        ? "border-brand-green/50 bg-[#E7F8EE] text-[#1F3B2A] hover:bg-[#DDF4E7] dark:bg-brand-green/20 dark:text-white dark:hover:bg-brand-green/25"
                        : "border-gray-300 bg-transparent text-[#33413B] hover:bg-black/[0.04] dark:border-white/[0.24] dark:text-white/90 dark:hover:bg-white/5"
                }`}
            >
                {iconNode}
                <span>{displayLabel}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[170px] bg-white dark:bg-[#1F2823] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                    <button
                        onClick={() => { onChange(null); setOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors cursor-pointer ${
                            !value ? "text-brand-green font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
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
                                    ? "text-brand-green font-semibold bg-brand-green/5"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
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
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<TabKey>("origin_report");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showingMenuOpen, setShowingMenuOpen] = useState(false);
    const showingRef = useRef<HTMLDivElement>(null);
    const [traitFilter, setTraitFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [jobFilter, setJobFilter] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const totalEntries = 1676;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const hasMoreThanSelectedEntries = totalEntries > entriesPerPage;

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

    return (
        <div className="flex flex-col w-full min-h-0 gap-5 font-sans p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#18241F]">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-500 dark:text-white/70 mb-1.5 font-normal">
                <span className="hover:underline cursor-pointer">Dashboard</span>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="text-brand-green font-semibold">Candidates</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-[32px] font-semibold text-[#19211C] dark:text-white">
                    Candidates
                </h1>
                <div className="flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/60">
                    <span className="font-light">Showing</span>
                    <div className="relative" ref={showingRef}>
                        <button
                            onClick={() => setShowingMenuOpen((prev) => !prev)}
                            className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-[7px] text-[13px] text-brand-green font-medium min-w-[42px] justify-between transition-all cursor-pointer hover:border-brand-green/55"
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
                        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-500 dark:text-white/50 hover:text-brand-green hover:dark:text-brand-green hover:bg-gray-200 dark:hover:bg-white/15">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                hasMoreThanSelectedEntries
                                    ? "bg-[#1ED36A] text-white hover:bg-[#18C963]"
                                    : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 hover:text-brand-green hover:dark:text-brand-green hover:bg-gray-200 dark:hover:bg-white/15"
                            }`}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Box — search + filters + table + progress bar all inside */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#232E28] overflow-hidden shadow-sm">

                {/* Filters Bar */}
                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-white/[0.05]">
                    {/* Search */}
                    <div className="relative w-full lg:w-[260px]">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Name, OriginID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[44px] rounded-xl border border-gray-300 dark:border-white/[0.24] bg-transparent pl-10 pr-4 text-[13px] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 transition-colors focus:outline-none focus:border-brand-green/50"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                        <FilterDropdown
                            label="Trait"
                            value={traitFilter}
                            onChange={setTraitFilter}
                            options={traitOptions}
                        />
                        <FilterDropdown
                            label="Status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={["Hired", "Shortlisted", "Rejected"]}
                        />
                        <FilterDropdown
                            label="Applied Job"
                            icon={
                                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                    <path
                                        d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            }
                            value={jobFilter}
                            onChange={setJobFilter}
                            options={["UI/UX Designer", "Front-End Developer", "Product Manager", "Data Analyst"]}
                        />
                        <FilterDropdown
                            label="Applied Date"
                            icon={
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="shrink-0">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                            }
                            value={dateFilter}
                            onChange={setDateFilter}
                            options={["Today", "Past Week", "Past Month", "Custom Range"]}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[980px] text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.06]">
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">
                                    Name
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 text-brand-green"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Trait</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Applied Jobs</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">
                                    Latest Applied
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 text-brand-green"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Candidate Status</th>
                                <th className="text-left px-4 sm:px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCandidateRows.map((candidate) => (
                                <tr key={candidate.id} className="border-b border-gray-100 dark:border-white/[0.04] transition-colors last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                    {/* Name + Avatar */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                                                <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#19211C] dark:text-white">{candidate.name}</p>
                                                <p className="text-[11px] font-light text-gray-500 dark:text-gray-400 mt-0.5">Origin ID : {candidate.originId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Trait */}
                                    <td className={`px-4 sm:px-5 py-4 whitespace-nowrap font-medium ${candidate.traitColor}`}>
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
                                    <td className="px-4 sm:px-5 py-4 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {candidate.latestApplied}
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 sm:px-5 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-medium whitespace-nowrap">
                                            <span className="text-gray-600 dark:text-gray-300">Hired <span className="text-brand-green font-medium">({candidate.candidateStatus.hired})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-gray-600 dark:text-gray-300">Shortlist <span className="text-[#FFB020] font-medium">({candidate.candidateStatus.shortlist})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-gray-600 dark:text-gray-300">Rejected <span className="text-[#FF4A4A] font-medium">({candidate.candidateStatus.rejected})</span></span>
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

                {/* Progress Bar — attached to bottom of box */}
                <div className="w-full h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#FFB020] via-[#13C065] to-[#13C065] rounded-full" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
                </div>

            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-2 mb-4 text-[13px] font-medium">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="w-8 h-8 rounded flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-brand-green hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">&lt;</button>
                {[1, 2, 3, 4, 5, 6].map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === page ? "bg-brand-green text-white font-bold" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                        {page}
                    </button>
                ))}
                <span className="px-1 text-gray-400">...</span>
                <button onClick={() => setCurrentPage(144)} className={`min-w-8 px-2 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === 144 ? "bg-brand-green text-white font-bold" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"}`}>144</button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="w-8 h-8 rounded flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-brand-green hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">&gt;</button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 pb-4">
                <div className="flex items-center gap-4">
                    <span className="text-brand-green hover:underline cursor-pointer">Privacy Policy</span>
                    <span className="text-brand-green hover:underline cursor-pointer">Terms & Conditions</span>
                </div>
                <span>
                    © 2025 Origin BI, Made with{" "}
                    <span className="text-brand-green hover:underline cursor-pointer">Touchmark Descience Pvt. Ltd</span>
                </span>
            </div>
        </div>
    );
}
