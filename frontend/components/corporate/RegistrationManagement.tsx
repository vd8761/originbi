"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BulkUploadIcon,
  PlusIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
} from "../icons";
import AddRegistrationForm from "./AddRegistrationForm";
import DateRangeFilter, {
  DateRangeOption
} from "../ui/DateRangeFilter";
import DateRangePickerModal from "../ui/DateRangePickerModal";
import ExcelExportButton from "../ui/ExcelExportButton";
import RegistrationTable from "../ui/RegistrationTable";
import AssessmentSessionsTable from "./AssessmentSessionsTable";
import GroupAssessmentPreview from "./GroupAssessmentPreview";
import GroupCandidateAssessmentPreview from "./GroupCandidateAssessmentPreview";

import { Registration } from "../../lib/types";
import { corporateRegistrationService } from "../../lib/services/corporate-registration.service";
import { assessmentService, AssessmentSession } from "../../lib/services/assessment.service";

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
  type ViewState = 'list' | 'add' | 'preview' | 'assessment-preview' | 'group-assessment-preview' | 'group-candidate-assessment-preview';
  const [view, setView] = useState<ViewState>("list");

  const [activeTab, setActiveTab] = useState<"registrations" | "individual" | "group">("registrations");

  // Data State
  const [users, setUsers] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Items for Previews
  const [selectedSession, setSelectedSession] = useState<AssessmentSession | null>(null);
  const [selectedGroupSessionId, setSelectedGroupSessionId] = useState<string | null>(null);

  // Independent Tab Counts
  const [tabCounts, setTabCounts] = useState<{
    registrations: number | null;
    individual: number | null;
    group: number | null;
  }>({
    registrations: null,
    individual: null,
    group: null,
  });

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Date Filter State
  const [dateRangeLabel, setDateRangeLabel] = useState<string>("This Month");
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  // const [statusFilter, setStatusFilter] = useState<string | null>(null); // Unused for now

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Initial Fetch for Tab Counts
  useEffect(() => {
    // Only fetching initial counts roughly, dynamic counts handled in fetchData
  }, []);

  // Fetch Data Function
  const fetchData = useCallback(async () => {
    // If not in list view (except for initial load implicitly), skip? 
    // No, we might want to refresh background. But mainly for list view.
    if (view !== 'list') return;

    setLoading(true);
    setError(null);
    try {
      const formatDate = (d: Date | null) => {
        if (!d) return undefined;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dateFilters = {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      };

      // Similar to Admin, fetch all tab counts to keep UI consistent
      // But here we might optimize to fetch only active tab data + counts
      // For simplicity and matching admin, fetching counts separate or concurrently

      const [regRes, indRes, grpRes] = await Promise.all([
        corporateRegistrationService.getMyEmployees(
          activeTab === 'registrations' ? currentPage : 1,
          activeTab === 'registrations' ? entriesPerPage : 1,
          debouncedSearchTerm
          // date filters for employees if supported? 
          // corporateRegistrationService.getMyEmployees signature might need check.
          // Assuming it supports basic params. Keeping it simple.
        ),
        assessmentService.getSessions(
          activeTab === 'individual' ? currentPage : 1,
          activeTab === 'individual' ? entriesPerPage : 1,
          debouncedSearchTerm,
          activeTab === 'individual' ? sortColumn : undefined,
          activeTab === 'individual' ? sortOrder : undefined,
          { ...dateFilters, type: 'individual' }
        ),
        assessmentService.getSessions(
          activeTab === 'group' ? currentPage : 1,
          activeTab === 'group' ? entriesPerPage : 1,
          debouncedSearchTerm,
          activeTab === 'group' ? sortColumn : undefined,
          activeTab === 'group' ? sortOrder : undefined,
          { ...dateFilters, type: 'group' }
        )
      ]);

      // Update Counts
      setTabCounts({
        registrations: regRes.total,
        individual: indRes.total,
        group: grpRes.total
      });

      // Update Active Data
      if (activeTab === 'registrations') {
        setUsers(regRes.data);
        setTotalCount(regRes.total);
      } else if (activeTab === 'individual') {
        setSessions(indRes.data);
        setTotalCount(indRes.total);
      } else {
        setSessions(grpRes.data);
        setTotalCount(grpRes.total);
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
    view
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: "registrations" | "individual" | "group") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
    setSortColumn("created_at");
    setSortOrder("DESC");
  };

  const handleDateRangeSelect = (option: DateRangeOption) => {
    if (option === "Custom Range") {
      setIsDateModalOpen(true);
    } else {
      setDateRangeLabel(option);
      const now = new Date();
      let newStart: Date | null = now;
      let newEnd: Date | null = now;

      // ... logic same as previous ...
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
        newEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (option === "Last Month") {
        newStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        newEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (option === "Today") {
        newStart = new Date(); // Start of today? Logic usually implies.
        newEnd = new Date();
      }
      // Note: Reusing exact logic from previous Steps/Admin
      setStartDate(newStart);
      setEndDate(newEnd);
      setCurrentPage(1);
    }
  };

  const handleDateModalApply = (start: Date, end: Date, label: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
    setDateRangeLabel(label === "Custom Range" ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : label);
  };

  const handleExport = () => {
    // Implement Excel export logic here corresponding to the active tab
    // For now, placeholder or use backend export if available.
    console.log("Export triggered");
  };

  const handleBulkUpload = () => {
    // Logic for bulk upload
  };


  // Preview Handlers
  const handleViewGroupSession = (id: string | number) => {
    console.log("handleViewGroupSession triggered with ID:", id, "Type:", typeof id);
    if (id === undefined || id === null || id === "") {
      console.error("Invalid ID passed to handleViewGroupSession:", id);
      return;
    }
    const safeId = String(id);
    console.log("Setting view to group-assessment-preview with ID:", safeId);
    setSelectedGroupSessionId(safeId);
    setView('group-assessment-preview');
  };

  const handleViewGroupCandidateSession = (session: any) => { // Type 'any' or AssessmentSession
    // If passing from Group Preview component which passes 'candidate' object
    // We might need to map or ensure it has an ID
    console.log("handleViewGroupCandidateSession triggered with session:", session);
    if (session && session.id) {
      // Need to ensure type compatibility
      const sessId = String(session.id);
      // For searching in list, we need to be careful if we are in group view, 'sessions' only has Group data?
      // If we are in group view, 'sessions' holds GroupAssessment objects.
      // But 'session' passed here comes from GroupAssessmentPreview list of candidates, which are AssessmentSessions.
      // So we might NOT find it in the 'sessions' state list.
      // We should use the passed session object directly if possible, or fetch details.

      // If we are in Group View, use the passed session directly as selectedSession
      setSelectedSession(session as AssessmentSession);
      setView('group-candidate-assessment-preview');
    }
  };

  // Render Views
  if (view === "add") {
    return <AddRegistrationForm onCancel={() => setView("list")} onRegister={() => { setView("list"); fetchData(); }} />;
  }

  if (view === 'group-assessment-preview') {
    console.log("Render logic: Entering group-assessment-preview block with ID:", selectedGroupSessionId);
    return (
      <GroupAssessmentPreview
        sessionId={selectedGroupSessionId || ""}
        onBack={() => setView('list')}
        onViewSession={handleViewGroupCandidateSession}
      />
    );
  }

  if (view === 'group-candidate-assessment-preview' && selectedSession) {
    return (
      <GroupCandidateAssessmentPreview
        session={selectedSession}
        onBack={() => {
          // If we came from Group Assessment Preview, we should go back there?
          // Currently 'onBack' in Admin goes to 'list' if it was individual.
          // But if it was nested? 
          // The breadcrumb says Group Assessment Preview.
          // So we should go back to group-assessment-preview.
          // But we need to know where we came from.
          // Simple logic: if selectedGroupSessionId is set, go back to group view.
          if (selectedGroupSessionId) {
            setView('group-assessment-preview');
          } else {
            setView('list');
          }
        }}
      />
    );
  }

  // List View
  const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;

  // Pagination UI Logic - Helper function
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
      <DateRangePickerModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onApply={handleDateModalApply} initialRange={{ start: startDate, end: endDate, label: dateRangeLabel }} />

      {/* Header */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600"><ArrowRightWithoutLineIcon className="w-3 h-3" /></span>
          <span className="text-brand-green font-semibold">My Employees</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white">
          Registrations &amp; Assessment Management
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
        <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
          {['registrations', 'individual', 'group'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as any)}
              className={`px-1 py-3 mr-8 text-sm sm:text-base font-semibold border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? "text-brand-green border-brand-green" : "text-brand-text-light-secondary dark:text-brand-text-secondary border-transparent"
                }`}
            >
              {tab === 'registrations' ? 'Registrations' : tab === 'individual' ? 'Individual Assessment' : 'Group Assessments'}
              ({tabCounts[tab as keyof typeof tabCounts] ?? '...'})
            </button>
          ))}
        </div>
        {/* Pagination / Sort Controls (Simplified for brevity, same as existing) */}
        <div className="flex items-center gap-3 py-2 w-full xl:w-auto justify-end">
          <span className="text-sm text-gray-500 hidden sm:inline">Showing</span>
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

      {/* Filters */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
        <div className="relative w-full xl:w-96">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-transparent border border-brand-light-tertiary dark:border-brand-dark-tertiary rounded-lg py-2.5 pl-4 pr-10 text-sm" />
          {/* Search icon ... */}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter selectedRange={dateRangeLabel} onRangeSelect={handleDateRangeSelect} />

          <ExcelExportButton onClick={handleExport} />

          <button
            onClick={handleBulkUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-[#1A3A2C] border border-transparent dark:border-[#1A3A2C] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity"
          >
            <span>Bulk Registration</span>
            <BulkUploadIcon className="w-4 h-4 dark:text-white text-brand-green" />
          </button>

          <button onClick={() => setView('add')} className="flex items-center gap-2 px-4 py-2 bg-brand-green rounded-lg text-sm font-semibold text-white">
            Add New
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'registrations' ? (
        <RegistrationTable users={users} loading={loading} error={error} />
      ) : activeTab === 'individual' ? (
        <AssessmentSessionsTable
          sessions={sessions}
          loading={loading}
          error={error}
          // no sorting logic passed for simplicity in this step, can add later
          onView={(id) => {
            // For individual, finding session from list might fail if 'id' is string vs number confusion
            // But assuming handleViewSession logic from Admin
            const sess = sessions.find(s => String(s.id) === String(id));
            if (sess) {
              setSelectedSession(sess);
              // Clear group ID to ensure back button works
              setSelectedGroupSessionId(null);
              setView('group-candidate-assessment-preview'); // Using same component for now!
            }
          }}
        />
      ) : (
        <AssessmentSessionsTable
          sessions={sessions}
          loading={loading}
          error={error}
          isGroupView
          onView={(id) => handleViewGroupSession(id)}
        />
      )}

      {/* Footer Pagination */}
      <div className="flex justify-end gap-2 mt-4">
        <div className="flex items-center gap-2">
          {/* Pagination Controls Reuse */}
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
                  ? "bg-transparent dark:bg-[#19211C] border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500"
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

export default RegistrationManagement;
