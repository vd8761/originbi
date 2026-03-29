"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    BulkUploadIcon,
    PlusIcon,
    ChevronDownIcon,
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    FilterFunnelIcon,
    EmailIcon,
} from '../icons';
import CorporateBulkEmailTab from './CorporateBulkEmailTab';
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import BulkUploadRegistration from "./BulkUploadRegistration";
import AddRegistrationForm from "./AddRegistrationForm";
import EmployeePreview from "./EmployeePreview";
import { corporateDashboardService } from '../../lib/services';
import { Registration } from '../../lib/types';
import { AssessmentSession } from '../../lib/services/assessment.service'; // type
import RegistrationTable from '../ui/RegistrationTable';
import AssessmentSessionsTable from '../admin/AssessmentSessionsTable';
import DateRangeFilter, { DateRangeOption } from '../ui/DateRangeFilter';
import ExcelExportButton from '../ui/ExcelExportButton';
import DateRangePickerModal from '../ui/DateRangePickerModal';
import GroupAssessmentPreview from "./GroupAssessmentPreview";
import GroupCandidateAssessmentPreview from "./GroupCandidateAssessmentPreview";

// Debounce utility
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const MyEmployeesContent: React.FC = () => {
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');

    const [view, setView] = useState<"list" | "add" | "bulk" | "preview" | "group-assessment-preview" | "group-candidate-assessment-preview">("list");
    const [selectedEmployee, setSelectedEmployee] = useState<Registration | null>(null);
    const [activeTab, setActiveTab] = useState<"registrations" | "individual" | "group" | "send-emails">("registrations");
    const [selectedGroupSessionId, setSelectedGroupSessionId] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<AssessmentSession | null>(null);

    // Send Emails tab state
    const [showSendEmailsTab, setShowSendEmailsTab] = useState(false);
    const [sendEmailsPage, setSendEmailsPage] = useState(1);
    const [sendEmailsEntriesPerPage, setSendEmailsEntriesPerPage] = useState(20);
    const [sendEmailsTotal, setSendEmailsTotal] = useState(0);
    const [showSendEmailsEntriesDropdown, setShowSendEmailsEntriesDropdown] = useState(false);
    const sendEmailsEntriesRef = React.useRef<HTMLDivElement>(null);

    // Data State
    const [users, setUsers] = useState<Registration[]>([]);
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("All");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    // Sorting
    const [sortColumn, setSortColumn] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const statusDropdownRef = React.useRef<HTMLDivElement>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [corporateEmail, setCorporateEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>("");

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

    useEffect(() => {
        // Get logged in corporate email
        const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        // Get user ID from stored object
        try {
            const u = localStorage.getItem('user');
            if (u) {
                const parsed = JSON.parse(u);
                if (parsed.email) setCorporateEmail(parsed.email);
                if (parsed.id) setUserId(parsed.id);
            }
        } catch (e) { /* empty */ }

        if (email && !corporateEmail) setCorporateEmail(email);
    }, []);

    // Effect for handling deep link (id parameter)
    useEffect(() => {
        const checkDeepLink = async () => {
            if (idParam && corporateEmail && (!selectedEmployee || selectedEmployee.id !== idParam)) {
                try {
                    // We can reuse getMyEmployees with a search term as the ID if supported,
                    // but usually registrations are fetched by searching.
                    // Let's search by ID if the service allows or just fetch the profile.
                    // For now, let's try searching specifically for this ID in MyEmployees.
                    const res = await corporateDashboardService.getMyEmployees(corporateEmail, 1, 1, idParam);
                    if (res.data && res.data.length > 0) {
                        const r = res.data[0];
                        const mapped: Registration = {
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
                            gender: r.gender,
                            groupName: r.group?.name || undefined,
                        };
                        setSelectedEmployee(mapped);
                        setView("preview");
                    }
                } catch (e) {
                    console.error("Failed to fetch deep-linked employee", e);
                }
            }
        };
        checkDeepLink();
    }, [idParam, corporateEmail]);

    // Initial Fetch for Tab Counts
    useEffect(() => {
        const fetchInitialCounts = async () => {
            if (!corporateEmail) return;

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

            try {
                // Fetch counts independently (limit=1)
                const [empRes, indRes, grpRes] = await Promise.all([
                    corporateDashboardService.getMyEmployees(corporateEmail, 1, 1, "", dateFilters),
                    corporateDashboardService.getAssessmentSessions(corporateEmail, 1, 1, "", "", "DESC", { ...dateFilters, type: "individual" }),
                    corporateDashboardService.getAssessmentSessions(corporateEmail, 1, 1, "", "", "DESC", { ...dateFilters, type: "group" })
                ]);
                setTabCounts({
                    registrations: empRes.total,
                    individual: indRes.total,
                    group: grpRes.total,
                });
            } catch (e) {
                console.error("Failed to fetch initial tab counts", e);
            }
        };
        fetchInitialCounts();
    }, [corporateEmail, startDate, endDate]);

    const fetchData = useCallback(async () => {
        if (!corporateEmail) return;

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

            // Only fetch what is needed for active tab to save bandwidth, but actually we need counts?
            // Existing logic fetched both. Let's stick to updating current view mostly.
            // But to keep counts updated we might need to fetch all?
            // The original code passed activeTab to conditional loading? No, it used Promise.all.
            // Let's refactor to switch based on activeTab.

            let total = 0;

            if (activeTab === 'registrations') {
                const empRes = await corporateDashboardService.getMyEmployees(
                    corporateEmail,
                    currentPage,
                    entriesPerPage,
                    debouncedSearchTerm,
                    dateFilters
                );
                const mappedRegistrations: Registration[] = empRes.data.map((r: any) => ({
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
                    gender: r.gender,
                    groupName: r.group?.name || undefined,
                }));
                setUsers(mappedRegistrations);
                total = empRes.total;
                setTabCounts(prev => ({ ...prev, registrations: empRes.total }));
            } else {
                const type = activeTab === 'group' ? 'group' : 'individual';
                const sessRes = await corporateDashboardService.getAssessmentSessions(
                    corporateEmail,
                    currentPage,
                    entriesPerPage,
                    debouncedSearchTerm,
                    sortColumn,
                    sortOrder,
                    {
                        ...dateFilters,
                        status: statusFilter || undefined,
                        type
                    }
                );
                setSessions(sessRes.data);
                total = sessRes.total;
                setTabCounts(prev => ({ ...prev, [activeTab]: sessRes.total }));
            }
            setTotalCount(total);

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
        corporateEmail,
        currentPage,
        entriesPerPage,
        debouncedSearchTerm,
        activeTab,
        startDate,
        endDate,
        sortColumn,
        sortOrder,
        statusFilter
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

            // Calculate dates
            const today = new Date();
            let start: Date | null = new Date(today);
            let end: Date | null = new Date(today);

            switch (option) {
                case 'Today':
                    // start/end already today
                    break;
                case 'Yesterday':
                    start.setDate(today.getDate() - 1);
                    end.setDate(today.getDate() - 1);
                    break;
                case 'Last 7 Days':
                    start.setDate(today.getDate() - 6);
                    break;
                case 'Last 30 Days':
                    start.setDate(today.getDate() - 29);
                    break;
                case 'This Month':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    break;
                case 'Last Month':
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    end = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case 'All':
                    start = null;
                    end = null;
                    break;
                default: // Should be covered by custom range or defaults
                    break;
            }

            setStartDate(start);
            setEndDate(end);
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

    const handleTabChange = (tab: "registrations" | "individual" | "group") => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchTerm("");
        setShowSendEmailsTab(false);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
        } else {
            setSortColumn(column);
            setSortOrder("ASC");
        }
        setCurrentPage(1);
    };

    const handleViewDetails = (id: string) => {
        const employee = users.find((u) => u.id === id || u.user_id === id);
        if (employee) {
            setSelectedEmployee(employee);
            setView("preview");
        }
    };

    const handleViewGroupSession = (id: string | number) => {
        console.log("MyEmployees: handleViewGroupSession triggered with ID:", id);
        if (id === undefined || id === null || id === "") return;
        setSelectedGroupSessionId(String(id));
        setView('group-assessment-preview');
    };

    const handleViewGroupCandidateSession = (session: any) => {
        if (session && session.id) {
            setSelectedSession(session);
            setView('group-candidate-assessment-preview');
        }
    };

    const handleExport = async () => {
        try {
            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            const startStr = startDate ? formatDate(startDate) : undefined;
            const endStr = endDate ? formatDate(endDate) : undefined;

            if (activeTab === 'registrations') {
                const response = await corporateDashboardService.getMyEmployees(
                    corporateEmail!,
                    1,
                    10000,
                    debouncedSearchTerm
                );
                // Note: MyEmployees doesn't support date/sort logic fully in export yet if base api doesn't.
                // Assuming it returns all matched by search.

                const headers = ["Name", "Gender", "Email", "Mobile", "Status", "Registered At"];
                const rows = response.data.map((u: any) => [
                    u.fullName,
                    u.gender,
                    u.user?.email,
                    `${u.countryCode} ${u.mobileNumber}`,
                    u.status,
                    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
                ]);
                downloadCSV(headers, rows, `employees_export_${new Date().toISOString().split('T')[0]}.csv`);

            } else {
                const type = activeTab === 'group' ? 'group' : 'individual';
                const response = await corporateDashboardService.getAssessmentSessions(
                    corporateEmail!,
                    1,
                    10000,
                    debouncedSearchTerm,
                    sortColumn,
                    sortOrder,
                    {
                        start_date: startStr,
                        end_date: endStr,
                        status: statusFilter || undefined,
                        type
                    }
                );

                const headers = ["User Email", "Program", "Assessment Title", "Valid From", "Valid To", "Status", "Created At"];
                const rows = response.data.map((s: any) => [
                    s.user?.email || 'N/A',
                    s.program?.name || 'N/A',
                    s.program?.assessment_title || 'N/A',
                    s.validFrom ? new Date(s.validFrom).toLocaleDateString() : '',
                    s.validTo ? new Date(s.validTo).toLocaleDateString() : '',
                    s.status,
                    s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''
                ]);

                downloadCSV(headers, rows, `assigned_assessments_export_${new Date().toISOString().split('T')[0]}.csv`);
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

    if (view === "preview" && selectedEmployee && corporateEmail) {
        return (
            <EmployeePreview
                registration={selectedEmployee}
                onBack={() => {
                    setView("list");
                    setSelectedEmployee(null);
                }}
                corporateEmail={corporateEmail}
            />
        );
    }

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
        return (
            <BulkUploadRegistration
                onCancel={() => {
                    setView("list");
                    fetchData();
                }}
                corporateUserId={userId}
            />
        );
    }

    if (view === 'group-assessment-preview' && selectedGroupSessionId) {
        return (
            <GroupAssessmentPreview
                sessionId={selectedGroupSessionId}
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
                    // Back logic: if we have a group ID, go back to group preview, else list
                    if (selectedGroupSessionId) {
                        setView('group-assessment-preview');
                    } else {
                        setView('list');
                    }
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full gap-6 font-sans p-4 sm:p-6 lg:p-8">
            {/* ... DateRangePickerModal and Header unchanged ... */}
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
                        onClick={() => handleTabChange("registrations")}
                        className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "registrations"
                            ? "border-brand-green font-medium"
                            : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
                            }`}
                    >
                        <span className="text-[#19211C] dark:text-white">Employees</span>
                        <span className="text-brand-green ml-1">
                            ({tabCounts.registrations !== null ? tabCounts.registrations : "..."})
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange("individual")}
                        className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "individual"
                            ? "border-brand-green font-medium"
                            : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
                            }`}
                    >
                        <span className="text-[#19211C] dark:text-white">Individual Assessment</span>
                        <span className="text-brand-green ml-1">
                            ({tabCounts.individual !== null ? tabCounts.individual : "..."})
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange("group")}
                        className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "group"
                            ? "border-brand-green font-medium"
                            : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
                            }`}
                    >
                        <span className="text-[#19211C] dark:text-white">Group Assessments</span>
                        <span className="text-brand-green ml-1">
                            ({tabCounts.group !== null ? tabCounts.group : "..."})
                        </span>
                    </button>
                    {/* Hidden Send Emails tab — revealed after clicking the button */}
                    {showSendEmailsTab && (
                        <button
                            onClick={() => setActiveTab('send-emails')}
                            className={`flex items-center gap-1.5 px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                                activeTab === 'send-emails'
                                    ? 'border-brand-green font-medium'
                                    : 'border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100'
                            }`}
                        >
                            <span className="text-[#19211C] dark:text-white">Send Emails</span>
                            <span
                                onClick={(e) => { e.stopPropagation(); setShowSendEmailsTab(false); setActiveTab('individual'); }}
                                className="ml-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                title="Close"
                            >✕</span>
                        </button>
                    )}
                </div>

                {/* Compact "Showing / per page / arrows" — swaps to send-emails pagination when active */}
                {activeTab !== 'send-emails' ? (
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                    currentPage === 1
                                        ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                                        : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
                                }`}
                            >
                                <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                    currentPage === totalPages
                                        ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                                        : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
                                }`}
                            >
                                <ArrowRightWithoutLineIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Send Emails pagination
                    <div className="flex items-center gap-3 py-2 w-full xl:w-auto justify-end" ref={sendEmailsEntriesRef}>
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">Showing</span>
                        <div className="relative">
                            <button
                                onClick={() => setShowSendEmailsEntriesDropdown(v => !v)}
                                className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all"
                            >
                                {sendEmailsEntriesPerPage}
                                <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                            </button>
                            {showSendEmailsEntriesDropdown && (
                                <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                    {[10, 20, 50, 100].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => { setSendEmailsEntriesPerPage(num); setShowSendEmailsEntriesDropdown(false); setSendEmailsPage(1); }}
                                            className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
                            of {sendEmailsTotal.toLocaleString()} entries
                        </span>
                        <div className="flex items-center gap-2 ml-2">
                            <button
                                onClick={() => setSendEmailsPage(p => Math.max(1, p - 1))}
                                disabled={sendEmailsPage === 1}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                    sendEmailsPage === 1
                                        ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                                        : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
                                }`}
                            >
                                <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setSendEmailsPage(p => p + 1)}
                                disabled={sendEmailsPage * sendEmailsEntriesPerPage >= sendEmailsTotal}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                    sendEmailsPage * sendEmailsEntriesPerPage >= sendEmailsTotal
                                        ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                                        : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
                                }`}
                            >
                                <ArrowRightWithoutLineIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Search + filters + buttons row — hidden on send-emails tab */}
            {activeTab !== 'send-emails' && (
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
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

                    {/* Status Filter */}
                    {(activeTab === 'individual' || activeTab === 'group') && (
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
                            onClick={() => setView("bulk")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer"
                        >
                            <span>Bulk Registration</span>
                            <BulkUploadIcon className="w-[18px] h-[18px] text-[#150089] dark:text-white" />
                        </button>
                    )}

                    {/* Send Emails button — only on Individual Assessment tab */}
                    {activeTab === 'individual' && (
                        <button
                            onClick={() => { setShowSendEmailsTab(true); setActiveTab('send-emails'); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-brand-green/40 dark:border-brand-green/30 rounded-lg text-sm font-medium text-brand-green hover:bg-brand-green/5 transition-all shadow-sm cursor-pointer"
                        >
                            <EmailIcon className="w-4 h-4" />
                            <span>Send Emails</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (activeTab === 'registrations') setView("add");
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-green border border-transparent rounded-lg text-sm font-medium text-white hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
                    >
                        <span>{activeTab === 'registrations' ? 'Add New' : 'Assign New exam'}</span>
                        <PlusIcon className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
            )}

            {/* Table Area */}
            <div className="flex-1 min-h-[300px] relative flex flex-col">
                {activeTab === 'send-emails' ? (
                    <CorporateBulkEmailTab
                        page={sendEmailsPage}
                        entriesPerPage={sendEmailsEntriesPerPage}
                        onTotalChange={(total) => setSendEmailsTotal(total)}
                        onViewSession={(session) => {
                            setSelectedSession(session);
                            setSelectedGroupSessionId(null);
                            setView('group-candidate-assessment-preview');
                        }}
                    />
                ) : activeTab === 'registrations' ? (
                    <RegistrationTable
                        users={users}
                        loading={loading}
                        error={error}
                        onViewDetails={handleViewDetails}
                        showAiCounsellor={false}
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
                        isGroupView={activeTab === 'group'}
                        onView={(id) => {
                            if (activeTab === 'group') {
                                handleViewGroupSession(id);
                            } else {
                                // Individual view logic
                                const sess = sessions.find(s => String(s.id) === String(id));
                                if (sess) {
                                    setSelectedSession(sess);
                                    setSelectedGroupSessionId(null);
                                    setView('group-candidate-assessment-preview');
                                }
                            }
                        }}
                    />
                )}
            </div>

            {/* Bottom pagination + footer — hidden on send-emails tab */}
            {activeTab !== 'send-emails' && (
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
                            className="w-8 h-8 rounded-full bg-white dark:bg-[#FFFFFF1F] flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 hover:border-gray-200 border border-transparent dark:border-[#FFFFFF1F] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
        </div>
    );
};

const MyEmployees: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-[#1ED36A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <MyEmployeesContent />
        </Suspense>
    );
};

export default MyEmployees;

