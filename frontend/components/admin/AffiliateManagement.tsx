"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    PlusIcon,
    ChevronDownIcon,
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
} from '../icons';
import AffiliateTable from "./AffiliateTable";
import AddAffiliateForm from "./AddAffiliateForm";
import AffiliateDetailsView from "./AffiliateDetailsView";

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

const AffiliateManagement: React.FC = () => {
    const [view, setView] = useState<"list" | "form" | "details">("list");
    const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);

    // Data state
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    // Pagination & filter
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch affiliates from real API
    const fetchAffiliates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: String(entriesPerPage),
            });
            if (searchTerm.trim()) {
                params.set("search", searchTerm.trim());
            }
            const res = await fetch(`${API_BASE}/admin/affiliates?${params.toString()}`);
            if (!res.ok) throw new Error(`Failed to load affiliates (${res.status})`);
            const json = await res.json();
            setAffiliates(json.data || []);
            setTotalCount(json.total || 0);
        } catch (err: any) {
            setError(err.message || "Failed to fetch affiliates");
            setAffiliates([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, searchTerm]);

    useEffect(() => {
        fetchAffiliates();
    }, [fetchAffiliates]);

    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Form view
    if (view === "form") {
        return (
            <AddAffiliateForm
                onCancel={() => {
                    setView("list");
                    setSelectedAffiliate(null);
                }}
                onSubmit={() => {
                    setView("list");
                    setSelectedAffiliate(null);
                    fetchAffiliates();
                }}
                initialData={selectedAffiliate}
            />
        );
    }

    // Details view
    if (view === "details" && selectedAffiliate) {
        return (
            <AffiliateDetailsView
                data={selectedAffiliate}
                onBack={() => {
                    setView("list");
                    setSelectedAffiliate(null);
                }}
            />
        );
    }

    // List view
    return (
        <div className="flex flex-col h-full w-full gap-6 font-sans">
            {/* Header / breadcrumb */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <Link href="/admin/dashboard" className="hover:underline hover:text-brand-green transition-colors">
                        Dashboard
                    </Link>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">
                        Affiliates
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                    Affiliate Management
                </h1>
            </div>

            {/* Controls (Search + Add New) */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search name, referral code, mobile..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>
                </div>

                {/* Right side – Add New */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Top Pagination Row (Compact) */}
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end mr-4">
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
                            Showing
                        </span>
                        <div className="relative">
                            <button
                                onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                                className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all cursor-pointer"
                            >
                                {entriesPerPage}
                                <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                            </button>
                            {showEntriesDropdown && (
                                <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                    {[10, 25, 50].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                setEntriesPerPage(num);
                                                setShowEntriesDropdown(false);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white cursor-pointer"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
                            of {totalCount.toLocaleString()} entries
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedAffiliate(null);
                            setView("form");
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20 cursor-pointer"
                    >
                        <span>Add Affiliate</span>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px] relative flex flex-col">
                <AffiliateTable
                    affiliates={affiliates}
                    loading={loading}
                    error={error}
                    onEdit={(affiliate) => {
                        setSelectedAffiliate(affiliate);
                        setView("form");
                    }}
                    onView={(affiliate) => {
                        setSelectedAffiliate(affiliate);
                        setView("details");
                    }}
                    onSettled={() => {
                        fetchAffiliates();
                    }}
                />
            </div>

            {/* Bottom pagination + footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
                {/* Left: Links */}
                <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                    <a
                        href="#"
                        className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer"
                    >
                        Privacy Policy
                    </a>
                    <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                    <a
                        href="#"
                        className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer"
                    >
                        Terms & Conditions
                    </a>
                </div>

                {/* Center: Pagination */}
                <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-brand-green dark:hover:text-brand-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ArrowLeftWithoutLineIcon className="w-4 h-4" />
                        </button>

                        {/* Pagination Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                let start = Math.max(1, currentPage - 2);
                                if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                                page = start + i;
                            }

                            if (page > totalPages) return null;

                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-all border cursor-pointer ${currentPage === page
                                        ? "bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20"
                                        : "bg-transparent border-brand-light-tertiary dark:border-white/10 text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-brand-green dark:hover:text-brand-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ArrowRightWithoutLineIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right: Copyright */}
                <div className="text-center sm:text-right w-full sm:w-1/3 order-3 hidden sm:block font-medium text-[#19211C] dark:text-[#FFFFFF]">
                    &copy; {new Date().getFullYear()} Origin BI, Made with by{" "}
                    <span className="underline text-[#1ED36A] hover:text-[#1ED36A]/80 transition-colors cursor-pointer">
                        Touchmark Descience Pvt. Ltd.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AffiliateManagement;
