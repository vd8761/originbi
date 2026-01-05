"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BulkUploadIcon,
  PlusIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
  FilterFunnelIcon,
} from "@/components/icons";
import AddRegistrationForm from "@/components/admin/AddRegistrationForm";
import BulkUploadRegistration from "@/components/admin/BulkUploadRegistration"; // Import
import DateRangeFilter, {
  DateRangeOption,
} from "@/components/ui/DateRangeFilter";
import DateRangePickerModal from "@/components/ui/DateRangePickerModal";
import ExcelExportButton from "@/components/ui/ExcelExportButton";
import RegistrationTable from "@/components/ui/RegistrationTable";
import AssessmentSessionsTable from "@/components/admin/AssessmentSessionsTable"; // Import
import { Registration } from "@/lib/types";
import { registrationService } from "@/lib/services/registration.service";
import { assessmentService, AssessmentSession } from "@/lib/services/assessment.service";

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
  const [view, setView] = useState<"list" | "add" | "bulk">("list");
  const [activeTab, setActiveTab] = useState<"registrations" | "assigned">(
    "registrations"
  );

  // Data State
  const [users, setUsers] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]); // New State
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

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Initial Fetch for Tab Counts (Background)
  useEffect(() => {
    const fetchInitialCounts = async () => {
      try {
        const [regRes, sessRes] = await Promise.all([
          registrationService.getRegistrations(1, 1, ""),
          assessmentService.getSessions(1, 1, ""),
        ]);
        setTabCounts({
          registrations: regRes.total,
          assigned: sessRes.total,
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
      // Format dates (Local YYYY-MM-DD)
      const formatDate = (d: Date | null) => {
        if (!d) return undefined;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (activeTab === 'registrations') {
        const response = await registrationService.getRegistrations(
          currentPage,
          entriesPerPage,
          debouncedSearchTerm,
          {
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
          },
          sortColumn,
          sortOrder
        );
        setUsers(response.data);
        setTotalCount(response.total);
        if (tabCounts.registrations !== response.total) { // Update if changed (optional)
          setTabCounts(prev => ({ ...prev, registrations: response.total }));
        }
      } else {
        // ASSESSMENTS TAB
        const response = await assessmentService.getSessions(
          currentPage,
          entriesPerPage,
          debouncedSearchTerm,
          sortColumn,
          sortOrder,
          {
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            status: statusFilter || undefined,
          }
        );
        setSessions(response.data);
        setTotalCount(response.total);
        if (tabCounts.assigned !== response.total) {
          setTabCounts(prev => ({ ...prev, assigned: response.total }));
        }
      }

    } catch (err) {
      console.error(err);
      setError("Unable to fetch data. Please try again.");
      setUsers([]);
      setSessions([]);
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
    sortColumn,
    sortOrder,
    tabCounts
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortOrder("ASC");
    }
    setCurrentPage(1); // Reset page on sort
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const newStatus = isActive ? "CANCELLED" : "COMPLETED";
      await registrationService.toggleStatus(id, newStatus);
      fetchData();
    } catch (error) {
      console.error("Failed to update status", error);
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

  const handleExport = async () => {
    try {
      if (activeTab === 'registrations') {
        // Fetch all registrations with current filters
        const response = await registrationService.getRegistrations(
          1,
          10000, // Large limit for export
          debouncedSearchTerm,
          {
            start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
            end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
          },
          sortColumn,
          sortOrder
        );

        const headers = ["Name", "Gender", "Email", "Mobile", "Status", "Registered At"];
        const rows = response.data.map(u => [
          u.full_name,
          u.gender,
          u.email,
          `${u.country_code} ${u.mobile_number}`,
          u.status,
          u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
        ]);

        downloadCSV(headers, rows, `registrations_export_${new Date().toISOString().split('T')[0]}.csv`);

      } else {
        // Fetch all sessions with current filters
        const response = await assessmentService.getSessions(
          1,
          10000,
          debouncedSearchTerm,
          sortColumn,
          sortOrder,
          {
            start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
            end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
            status: statusFilter || undefined,
          }
        );

        const headers = ["User Email", "Program", "Assessment Title", "Valid From", "Valid To", "Status", "Created At"];
        const rows = response.data.map(s => [
          s.user?.email || 'N/A',
          s.program?.name || 'N/A',
          s.program?.assessment_title || 'N/A',
          s.validFrom ? new Date(s.validFrom).toLocaleDateString() : '',
          s.validTo ? new Date(s.validTo).toLocaleDateString() : '',
          s.status,
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''
        ]);

        downloadCSV(headers, rows, `assigned_assessments_export_${new Date().toISOString().split('T')[0]}.csv`);
        // I should probably fix `fetchData` to pass `statusFilter` first!
        // The user previously said "Integrate Status Filter" as a next step.
        // So I should fix `fetchData` AND `handleExport` to include `statusFilter`.

        // Let's check `fetchData` implementation now.
      }
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const downloadCSV = (headers: string[], rows: (string | number | null | undefined)[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.map(c => `"${c || ''}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = () => {
    setView("bulk");
  };

  const handleDateRangeSelect = (option: DateRangeOption) => {
    if (option === "Custom Range") {
      setIsDateModalOpen(true);
    } else {
      setDateRangeLabel(option);
      const now = new Date();
      let newStart: Date | null = now;
      let newEnd: Date | null = now;

      if (option === 'All') {
        newStart = null;
        newEnd = null;
      } else if (option === "Yesterday") {
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

  if (view === "bulk") {
    return <BulkUploadRegistration onCancel={() => setView("list")} />;
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
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
          Registrations &amp; Assessment Management
        </h1>
      </div>

      {/* Tabs + top pagination bar */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
        {/* Tabs */}
        <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange("registrations")}
            className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "registrations"
              ? "border-brand-green font-medium"
              : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
              }`}
          >
            <span className="text-[#19211C] dark:text-white">Registrations</span>
            <span className="text-brand-green ml-1">
              ({tabCounts.registrations !== null ? tabCounts.registrations : "..."})
            </span>
          </button>
          <button
            onClick={() => handleTabChange("assigned")}
            className={`px-1 py-3 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "assigned"
              ? "border-brand-green font-medium"
              : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
              }`}
          >
            <span className="text-[#19211C] dark:text-white">Assign Assessment</span>
            <span className="text-brand-green ml-1">
              ({tabCounts.assigned !== null ? tabCounts.assigned : "..."})
            </span>
          </button>
        </div>

        {/* Compact "Showing / per page / arrows" – styled like Corporate */}
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

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <DateRangeFilter
            selectedRange={dateRangeLabel}
            onRangeSelect={handleDateRangeSelect}
          />

          {/* Status Filter */}
          {activeTab === 'assigned' && (
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer text-[#19211C] dark:text-white`}
              >
                <FilterFunnelIcon className="w-4 h-4" />
                <span>
                  {statusFilter
                    ? statusFilter
                      .toLowerCase()
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                    : "All"}
                </span>
                <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-white" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  {[
                    { label: 'All', value: null },
                    { label: 'Not Started', value: 'NOT_STARTED' },
                    { label: 'In Progress', value: 'IN_PROGRESS' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Partially Completed', value: 'PARTIALLY_COMPLETED' },
                    { label: 'Expired', value: 'EXPIRED' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => { setStatusFilter(option.value); setShowStatusDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                        ${statusFilter === option.value
                          ? 'text-brand-green bg-gray-50 dark:bg-white/5'
                          : 'text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                      <span>{option.label}</span>
                      {statusFilter === option.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(32,210,125,0.6)]"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <ExcelExportButton onClick={handleExport} />

          {activeTab === 'registrations' && (
            <button
              onClick={handleBulkUpload}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer"
            >
              <span>Bulk Registration</span>
              <BulkUploadIcon className="w-[18px] h-[18px] text-[#150089] dark:text-white" />
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'registrations') setView("add");
              // else setView("assign"); // TODO: Implement Assign View
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green border border-transparent rounded-lg text-sm font-medium text-white hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
          >
            <span>{activeTab === 'registrations' ? 'Add New' : 'Assign New exam'}</span>
            <PlusIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Table Area - flex-1 ensures it fills available vertical space */}
      <div className="flex-1 min-h-[300px] relative flex flex-col">
        {activeTab === 'registrations' ? (
          <RegistrationTable
            users={users}
            loading={loading}
            error={error}
            onToggleStatus={handleToggleStatus}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ) : (
          <AssessmentSessionsTable
            sessions={sessions}
            loading={loading}
            error={error}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}


      </div>

      {/* Bottom pagination + footer */}
      {/* Bottom pagination + footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
        {/* Left: Links */}
        <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
          <a
            href="#"
            className="text-brand-green hover:text-brand-green/80 transition-colors underline"
          >
            Privacy Policy
          </a>
          <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
          <a
            href="#"
            className="text-brand-green hover:text-brand-green/80 transition-colors underline"
          >
            Terms &amp; Conditions
          </a>
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

export default RegistrationManagement;
