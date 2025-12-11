"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BulkUploadIcon,
  PlusIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
} from "@/components/icons";
import AddRegistrationForm from "@/components/admin/AddRegistrationForm";
import DateRangeFilter, {
  DateRangeOption,
} from "@/components/ui/DateRangeFilter";
import DateRangePickerModal from "@/components/ui/DateRangePickerModal";
import ExcelExportButton from "@/components/ui/ExcelExportButton";
import RegistrationTable from "@/components/ui/RegistrationTable";
import { RegistrationUser } from "@/lib/types";
import { registrationService } from "@/lib/registrationService";

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const RegistrationManagement: React.FC = () => {
  const [view, setView] = useState<"list" | "add">("list");
  const [activeTab, setActiveTab] = useState<"registrations" | "assigned">(
    "registrations"
  );

  // Data State
  const [users, setUsers] = useState<RegistrationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Independent Tab Counts
  const [tabCounts, setTabCounts] = useState<{
    registrations: number | null;
    assigned: number | null;
  }>({
    registrations: null,
    assigned: null,
  });

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

  // Initial Fetch for Tab Counts (Background)
  useEffect(() => {
    const fetchInitialCounts = async () => {
      try {
        const [regRes, assignRes] = await Promise.all([
          registrationService.getUsers({
            page: 1,
            limit: 1,
            tab: "registrations",
            search: "",
          }),
          registrationService.getUsers({
            page: 1,
            limit: 1,
            tab: "assigned",
            search: "",
          }),
        ]);
        setTabCounts({
          registrations: regRes.total,
          assigned: assignRes.total,
        });
      } catch (e) {
        console.error("Failed to fetch initial tab counts", e);
      }
    };
    fetchInitialCounts();
  }, []);

  // Fetch Data Function for Active View
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await registrationService.getUsers({
        page: currentPage,
        limit: entriesPerPage,
        tab: activeTab,
        search: debouncedSearchTerm,
        // if your API supports it, you can later add: startDate, endDate
      });

      setUsers(response.data);
      setTotalCount(response.total);

      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: response.total,
      }));
    } catch (err) {
      console.error(err);
      setError("Unable to fetch data. Please try again.");
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    activeTab,
    debouncedSearchTerm,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: !u.status } : u))
    );
    try {
      await registrationService.toggleStatus(id, !currentStatus);
    } catch (err) {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: currentStatus } : u))
      );
      console.error("Failed to toggle status");
    }
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTabChange = (tab: "registrations" | "assigned") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handleExport = () => {
    //console.log("Exporting data for range:", dateRangeLabel);
  };

  const handleBulkUpload = () => {
    //console.log("Bulk upload triggered");
  };

  const handleDateRangeSelect = (option: DateRangeOption) => {
    if (option === "Custom Range") {
      setIsDateModalOpen(true);
    } else {
      setDateRangeLabel(option);
      const now = new Date();
      let newStart: Date | null = now;
      let newEnd: Date | null = now;

      if (option === "Yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        newStart = yesterday;
        newEnd = yesterday;
      } else if (option === "Last 7 Days") {
        const prev = new Date(now);
        prev.setDate(now.getDate() - 6);
        newStart = prev;
      } else if (option === "Last 30 Days") {
        const prev = new Date(now);
        prev.setDate(now.getDate() - 29);
        newStart = prev;
      } else if (option === "This Month") {
        newStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (option === "Last Month") {
        newStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        newEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      setStartDate(newStart);
      setEndDate(newEnd);
      setCurrentPage(1);
    }
  };

  const handleDateModalApply = (start: Date, end: Date, label: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);

    if (label === "Custom Range") {
      const format = (d: Date) =>
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      const formatted = `${format(start)} - ${format(end)}`;
      setDateRangeLabel(formatted);
    } else {
      setDateRangeLabel(label);
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

      {/* Header – aligned with Corporate / Programs style */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
          </span>
          <span className="text-brand-green font-semibold">My Employees</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white">
          Registrations &amp; Assessment Management
        </h1>
      </div>

      {/* Tabs + top pagination bar */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
        {/* Tabs */}
        <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange("registrations")}
            className={`px-1 py-3 mr-8 text-sm sm:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "registrations"
                ? "text-brand-green border-brand-green"
                : "text-brand-text-light-secondary dark:text-brand-text-secondary border-transparent hover:text-brand-text-light-primary dark:hover:text-white"
            }`}
          >
            Registrations (
            {tabCounts.registrations !== null
              ? tabCounts.registrations
              : "..."}
            )
          </button>
          <button
            onClick={() => handleTabChange("assigned")}
            className={`px-1 py-3 text-sm sm:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "assigned"
                ? "text-brand-green border-brand-green"
                : "text-brand-text-light-secondary dark:text-brand-text-secondary border-transparent hover:text-brand-text-light-primary dark:hover:text-white"
            }`}
          >
            Assign Assessment (
            {tabCounts.assigned !== null ? tabCounts.assigned : "..."}
            )
          </button>
        </div>

        {/* Compact "Showing / per page / arrows" – styled like Corporate */}
        <div className="flex items-center gap-3 py-2 w-full xl:w-auto justify-end">
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

          <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary whitespace-nowrap">
            of {totalCount.toLocaleString()} entries
          </span>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-[#303438] flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Search + filters + buttons row – aligned with other screens */}
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
            placeholder="Search by name, mobile, or Origin ID..."
            className="w-full bg-transparent border border-brand-light-tertiary dark:border-brand-dark-tertiary rounded-lg py-2.5 pl-4 pr-10 text-sm text-brand-text-light-primary dark:text-white placeholder-brand-text-light-secondary dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
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

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <DateRangeFilter
            selectedRange={dateRangeLabel}
            onRangeSelect={handleDateRangeSelect}
          />

          <ExcelExportButton onClick={handleExport} />

          <button
            onClick={handleBulkUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-[#1A3A2C] border border-transparent dark:border-[#1A3A2C] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity"
          >
            <span>Bulk Registration</span>
            <BulkUploadIcon className="w-4 h-4 dark:text-white text-brand-green" />
          </button>

          <button
            onClick={() => setView("add")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20"
          >
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <RegistrationTable
        users={users}
        loading={loading}
        error={error}
        onToggleStatus={handleToggleStatus}
      />

      {/* Bottom pagination + footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-2">
        <div className="flex gap-4">
          <a
            href="#"
            className="hover:text-brand-green transition-colors underline"
          >
            Privacy Policy
          </a>
          <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
          <a
            href="#"
            className="hover:text-brand-green transition-colors underline"
          >
            Terms &amp; Conditions
          </a>
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
              className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-colors border ${
                currentPage === page
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

        <div className="text-right hidden sm:block">
          &copy; 2025 Origin BI, Made with by{" "}
          <span className="underline hover:text-brand-green transition-colors cursor-pointer">
            Touchmark Descience Pvt. Ltd.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationManagement;
