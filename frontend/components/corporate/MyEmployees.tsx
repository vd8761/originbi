"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    BulkUploadIcon,
    PlusIcon,
    ChevronDownIcon,
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
} from "@/components/icons";
import AddRegistrationForm from "./AddRegistrationForm";
import { corporateDashboardService } from "@/lib/services";
import { Registration } from "@/lib/types";
import RegistrationTable from "@/components/ui/RegistrationTable";
import DateRangeFilter, { DateRangeOption } from "@/components/ui/DateRangeFilter";
import ExcelExportButton from "@/components/ui/ExcelExportButton";
import DateRangePickerModal from "@/components/ui/DateRangePickerModal";

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
    const [view, setView] = useState<"list" | "add">("list");
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

    // Date Filter State
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("Today");
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [corporateEmail, setCorporateEmail] = useState<string | null>(null);

    useEffect(() => {
        // Get logged in corporate email
        const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
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
            // Note: Currently passing default dates or ignoring them if backend doesn't support yet
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
                corporate_account_id: r.corporateAccountId,
                gender: r.gender, // Ensure gender is mapped
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

    const handleDateRangeSelect = (option: DateRangeOption) => {
        if (option === "Custom Range") {
            setIsDateModalOpen(true);
        } else {
            setDateRangeLabel(option);
            setCurrentPage(1);
        }
    };

    const handleDateModalApply = (start: Date, end: Date, label: string) => {
        setStartDate(start);
        setEndDate(end);
        setDateRangeLabel(label);
        setCurrentPage(1);
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

    if (view === "add") {
        return (
            <AddRegistrationForm
                onCancel={() => setView("list")}
                onRegister={() => {
                    setView("list");
                    fetchData();
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full gap-6 font-sans">
            <DateRangePickerModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onApply={handleDateModalApply}
                initialRange={{
                    start: startDate,
                    end: endDate,
                    label: dateRangeLabel,
                }}
            />

            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span>Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">My Employees</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                    Employee Management
                </h1>
            </div>

            {/* Tabs + top pagination bar */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
                {/* Tabs */}
                <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
                    <button
                        className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer border-brand-green font-medium`}
                    >
                        <span className="text-[#19211C] dark:text-white">All Employees</span>
                        <span className="text-brand-green ml-1">
                            ({totalCount})
                        </span>
                    </button>
                </div>

                {/* Compact "Showing / per page / arrows" */}
                <div className="flex items-center gap-3 py-2 w-full xl:w-auto justify-end">
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
                        Showing
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all"
                        >
                            {entriesPerPage}
                            <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                        </button>
                        {showEntriesDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
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

                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
                        of {totalCount.toLocaleString()} entries
                    </span>

                    <div className="flex items-center gap-2 ml-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-[#FFFFFF1F] flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 hover:border-gray-200 border border-transparent dark:border-[#FFFFFF1F] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowRightWithoutLineIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search + filters + buttons row */}
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
                        placeholder="Search by name, email or mobile..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <DateRangeFilter
                        selectedRange={dateRangeLabel}
                        onRangeSelect={handleDateRangeSelect}
                    />

                    <ExcelExportButton onClick={() => console.log('Exporting...')} />

                    <button
                        onClick={() => console.log('Bulk Upload')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer"
                    >
                        <span>Bulk Registration</span>
                        <BulkUploadIcon className="w-[18px] h-[18px] text-[#150089] dark:text-white" />
                    </button>

                    <button
                        onClick={() => setView("add")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-green border border-transparent rounded-lg text-sm font-medium text-white hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
                    >
                        <span>Add New</span>
                        <PlusIcon className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-[300px] relative flex flex-col">
                <RegistrationTable
                    users={users}
                    loading={loading}
                    error={error}
                />
            </div>

            {/* Bottom pagination + footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
                {/* Left: Links */}
                <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline">Privacy Policy</a>
                    <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline">Terms &amp; Conditions</a>
                </div>

                {/* Center: Pagination */}
                <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
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
                                onClick={() => typeof page === "number" ? handlePageChange(page) : null}
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

export default MyEmployees;

