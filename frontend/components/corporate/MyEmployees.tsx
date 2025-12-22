"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    ChevronDownIcon,
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    PlusIcon,
} from "@/components/icons";
import { corporateDashboardService } from "@/lib/services";
import { Registration, User } from "@/lib/types";
import RegistrationTable from "@/components/ui/RegistrationTable";

// Debounce utility
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const MyEmployees: React.FC = () => {
    // Data State
    const [users, setUsers] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Filter State
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [corporateEmail, setCorporateEmail] = useState<string | null>(null);

    useEffect(() => {
        // Get logged in corporate email
        const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        // Fallback to localStorage user object if needed
        if (!email) {
            try {
                const u = localStorage.getItem('user');
                if (u) {
                    const parsed = JSON.parse(u);
                    setCorporateEmail(parsed.email);
                    return;
                }
            } catch (e) { /* empty */ }
        }
        setCorporateEmail(email);
    }, []);

    const fetchData = useCallback(async () => {
        if (!corporateEmail) return;

        setLoading(true);
        setError(null);
        try {
            const response = await corporateDashboardService.getMyEmployees(
                corporateEmail,
                currentPage,
                entriesPerPage,
                debouncedSearchTerm
            );

            // Mapper: Backend returns Registration[], we need Registration[] for the table
            const mappedRegistrations: Registration[] = response.data.map((r: any) => ({
                id: r.id,
                user_id: r.userId,
                registration_source: r.registrationSource,
                full_name: r.fullName || "Unknown",
                email: r.user?.email || "",
                mobile_number: r.mobileNumber,
                country_code: r.countryCode,
                payment_required: r.paymentRequired,
                payment_status: r.paymentStatus,
                status: r.status,
                is_deleted: r.isDeleted,
                created_at: r.createdAt,
                updated_at: r.updatedAt,
                // Corporate ID matches current user
                corporate_account_id: r.corporateAccountId
            }));

            setUsers(mappedRegistrations);
            setTotalCount(response.total);

        } catch (err) {
            console.error(err);
            setError("Unable to fetch employees. Please try again.");
            setUsers([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [
        corporateEmail,
        currentPage,
        entriesPerPage,
        debouncedSearchTerm,
    ]);

    useEffect(() => {
        if (corporateEmail) {
            fetchData();
        }
    }, [fetchData, corporateEmail]);

    // Handlers
    const handlePageChange = (page: number) => {
        const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;

    // Pagination UI Logic
    const getPaginationNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxVisibleButtons = 5;

        if (totalPages <= maxVisibleButtons + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > 3) pageNumbers.push("...");

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                start = 2;
                end = 4;
            }
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - 2) pageNumbers.push("...");
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    return (
        <div className="flex flex-col h-full w-full gap-6 font-sans">

            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span>Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">My Employees</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white">
                    Employee Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your registered employees and track their progress.
                </p>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-4 gap-4 xl:gap-0">

                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by name or email..."
                        className="w-full bg-transparent border border-brand-light-tertiary dark:border-brand-dark-tertiary rounded-lg py-2.5 pl-4 pr-10 text-sm text-brand-text-light-primary dark:text-white placeholder-brand-text-light-secondary dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                </div>

                {/* Filters/Actions */}
                <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20"
                    >
                        <span>Add Employee</span>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <RegistrationTable
                users={users}
                loading={loading}
                error={error}
            />

            {/* Bottom pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-2">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary hidden sm:inline">
                        Showing
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center gap-2 bg-brand-light-tertiary dark:bg-[#303438] px-3 py-1.5 rounded-lg text-sm text-brand-text-light-primary dark:text-white font-medium min-w-[60px] justify-between"
                        >
                            {entriesPerPage}
                            <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                        </button>
                        {showEntriesDropdown && (
                            <div className="absolute bottom-full left-0 mb-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                {[10, 25, 50, 100].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            setEntriesPerPage(num);
                                            setShowEntriesDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white"
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span>of {totalCount} entries</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                    </button>

                    {getPaginationNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() =>
                                typeof page === "number" ? handlePageChange(page) : null
                            }
                            disabled={typeof page !== "number"}
                            className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-colors border ${currentPage === page
                                ? "bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/20"
                                : typeof page === "number"
                                    ? "bg-transparent border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500"
                                    : "border-transparent text-gray-500 cursor-default"
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ArrowRightWithoutLineIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyEmployees;
