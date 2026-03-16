"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import CandidateDetail from "./CandidateDetail";
import { EyeSolidIcon } from "../../icons";

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

const mockCandidateRows: CandidateRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: `202001256_${i}`,
    name: "Monishwar Rajasekaran",
    originId: "202001256",
    avatar: `https://i.pravatar.cc/150?u=${200 + i}`,
    trait: "Supportive Energizer",
    traitColor: "text-[#FFB020]",
    appliedJobs: [
        { title: "UX/UI Designer", count: 3 },
    ],
    latestApplied: "13 May 2025",
    candidateStatus: { hired: 2, shortlist: 4, rejected: 6 },
}));

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

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                    isActive
                        ? "border-brand-green bg-brand-green/15 text-white dark:bg-brand-green/20"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-white/90 dark:hover:bg-white/5"
                }`}
            >
                {icon}
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
        return (
            <CandidateDetail
                candidateId={selectedCandidateId}
                initialTab={selectedTab}
                onBack={() => { setSelectedCandidateId(null); setSelectedTab("origin_report"); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full gap-5 font-sans p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#18241F]">

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
                    <span className="font-normal">Showing</span>
                    <div className="relative" ref={showingRef}>
                        <button
                            onClick={() => setShowingMenuOpen((prev) => !prev)}
                            className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-[7px] text-[13px] text-brand-green font-semibold min-w-[42px] justify-between transition-all cursor-pointer hover:border-brand-green/55"
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
                    <span className="whitespace-nowrap font-normal">of {totalEntries.toLocaleString()} entries</span>
                    <div className="flex items-center gap-1.5 ml-1">
                        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-500 dark:text-white/50 hover:text-brand-green hover:dark:text-brand-green hover:bg-gray-200 dark:hover:bg-white/15">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-gray-500 dark:text-white/50 hover:text-brand-green hover:dark:text-brand-green hover:bg-gray-200 dark:hover:bg-white/15">
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
                            className="w-full rounded-lg border border-gray-200 dark:border-white/12 bg-gray-50 dark:bg-white/5 pl-10 pr-4 py-2 text-[13px] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 transition-colors focus:outline-none focus:border-brand-green/50"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                        <FilterDropdown
                            label="Trait"
                            value={traitFilter}
                            onChange={setTraitFilter}
                            options={["Supportive Energizer", "Creative Thinker", "Strategic Leader", "Analytical Mind"]}
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green shrink-0">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            }
                            value={jobFilter}
                            onChange={setJobFilter}
                            options={["UI/UX Designer", "Front-End Developer", "Product Manager", "Data Analyst"]}
                        />
                        <FilterDropdown
                            label="Applied Date"
                            icon={
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-brand-green shrink-0">
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
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.06]">
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">
                                    Name
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 text-brand-green"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Trait</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Applied Jobs</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">
                                    Latest Applied
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 text-brand-green"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Candidate Status</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCandidateRows.map((candidate) => (
                                <tr key={candidate.id} className="border-b border-gray-100 dark:border-white/[0.04] transition-colors last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                    {/* Name + Avatar */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                                                <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#19211C] dark:text-white">{candidate.name}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Origin ID : {candidate.originId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Trait */}
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {candidate.trait}
                                    </td>
                                    {/* Applied Jobs — click opens Applied Jobs tab */}
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => openCandidate(candidate.id, "applied_jobs")}
                                            className="text-brand-green font-medium hover:underline cursor-pointer text-left"
                                        >
                                            {candidate.appliedJobs[0].title}{" "}
                                            <span>+{candidate.appliedJobs[0].count}</span>
                                        </button>
                                    </td>
                                    {/* Latest Applied */}
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {candidate.latestApplied}
                                    </td>
                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
                                            <span className="text-gray-600 dark:text-gray-300">Hired <span className="text-brand-green font-semibold">({candidate.candidateStatus.hired})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-gray-600 dark:text-gray-300">Shortlist <span className="text-[#FFB020] font-semibold">({candidate.candidateStatus.shortlist})</span></span>
                                            <span className="text-gray-400">·</span>
                                            <span className="text-gray-600 dark:text-gray-300">Rejected <span className="text-[#FF4A4A] font-semibold">({candidate.candidateStatus.rejected})</span></span>
                                        </div>
                                    </td>
                                    {/* Action — eye muted by default, green on hover */}
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => openCandidate(candidate.id)}
                                            className="group/eye flex items-center justify-center cursor-pointer transition-all duration-150"
                                        >
                                            <EyeSolidIcon className="w-5 h-5 text-[#13C065]/70 dark:text-[#13C065]/60 transition-all duration-150 group-hover/eye:text-[#1ED36A] group-hover/eye:scale-110" />
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
