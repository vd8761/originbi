"use client";

import React, { useState, useRef, useCallback } from "react";
import { ChevronDownIcon, SearchIcon, Eye } from "lucide-react";
import CandidateDetail from "./CandidateDetail";

// ─── Types ──────────────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────

export default function CandidatesList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;
    const totalEntries = 1676;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    // Show CandidateDetail when a candidate is selected
    if (selectedCandidateId) {
        return (
            <CandidateDetail
                candidateId={selectedCandidateId}
                onBack={() => setSelectedCandidateId(null)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full gap-5 font-sans p-4 sm:p-6 lg:p-8">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-400 dark:text-white/70 mb-1.5 font-normal">
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
                <div className="flex items-center gap-3 text-[13px] text-gray-500 dark:text-gray-400">
                    <span>
                        Showing{" "}
                        <span className="inline-flex items-center gap-1 font-semibold text-[#19211C] dark:text-white">
                            10
                            <ChevronDownIcon className="w-3.5 h-3.5 text-brand-green" />
                        </span>
                    </span>
                    <span>of {totalEntries.toLocaleString()} entries</span>
                    {/* Nav arrows */}
                    <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 9L4.5 6L7.5 3" /></svg>
                    </button>
                    <button className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center hover:bg-[#10A958] transition-colors cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3L7.5 6L4.5 9" /></svg>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="relative w-full md:w-[300px]">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by Name, OriginID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-[#19211C] dark:text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide shrink-0">
                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                        Trait: Supportive Energizer
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                        Hired
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                        Applied Job (UI/UX)
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        Applied Date
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5">
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    Name
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Trait</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Applied Jobs</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    Latest Applied
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                </th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Candidate Status</th>
                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCandidateRows.map((candidate) => (
                                <tr key={candidate.id} className="border-b border-gray-100 dark:border-white/5 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    {/* Name + Avatar */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-white/10 shrink-0">
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
                                    {/* Applied Jobs */}
                                    <td className="px-5 py-4">
                                        {candidate.appliedJobs.map((job, i) => (
                                            <span key={i} className="text-brand-green font-medium hover:underline cursor-pointer">
                                                {job.title} <span className="text-brand-green">+{job.count}</span>
                                            </span>
                                        ))}
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
                                    {/* Action */}
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => setSelectedCandidateId(candidate.id)}
                                            className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center hover:bg-[#10A958] transition-colors cursor-pointer"
                                        >
                                            <Eye className="w-4 h-4 text-white" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FFB020] via-[#13C065] to-[#13C065] rounded-full" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-2 mb-4 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-gray-200 dark:border-white/10">
                    &lt;
                </button>
                {[1, 2, 3, 4, 5, 6].map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === page
                            ? "bg-brand-green text-white font-bold"
                            : "hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10"
                            }`}
                    >
                        {page}
                    </button>
                ))}
                <span className="px-1 text-gray-400">...</span>
                <button onClick={() => setCurrentPage(144)} className={`min-w-8 px-2 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${currentPage === 144 ? "bg-brand-green text-white font-bold" : "hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10"}`}>
                    144
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-gray-200 dark:border-white/10">
                    &gt;
                </button>
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
