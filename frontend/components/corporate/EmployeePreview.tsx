import React, { useState, useEffect, useCallback } from 'react';
import { Registration } from '@/lib/types';
import { AssessmentSession } from '@/lib/services/assessment.service';
import { corporateDashboardService } from '@/lib/services';
import AssessmentSessionsTable from '@/components/admin/AssessmentSessionsTable';
import { ArrowLeftWithoutLineIcon, PlusIcon, ChevronDownIcon, ArrowRightWithoutLineIcon, FilterFunnelIcon } from '@/components/icons';
import ExcelExportButton from '@/components/ui/ExcelExportButton';
import DateRangeFilter, { DateRangeOption } from '@/components/ui/DateRangeFilter';
import DateRangePickerModal from '@/components/ui/DateRangePickerModal';

interface EmployeePreviewProps {
    registration: Registration;
    onBack: () => void;
    corporateEmail: string;
}

const format = (d: Date | null) => {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const EmployeePreview: React.FC<EmployeePreviewProps> = ({ registration, onBack, corporateEmail }) => {
    // Assessment List State
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    // Sort
    const [sortCol, setSortCol] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    // Filters
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("Today");
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const fetchSessions = useCallback(async () => {
        // Handle mismatched property names (backend sends userId, type expects user_id)
        const uid = (registration as any).userId || registration.user_id;

        if (!uid || !corporateEmail) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await corporateDashboardService.getAssessmentSessions(
                corporateEmail,
                page,
                limit,
                search,
                sortCol,
                sortOrder,
                {
                    start_date: format(startDate),
                    end_date: format(endDate),
                    status: statusFilter || undefined,
                    userId: uid
                }
            );
            setSessions(res.data);
            setTotal(res.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, sortCol, sortOrder, startDate, endDate, statusFilter, registration, corporateEmail]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Handlers
    const handleSort = (col: string) => {
        if (sortCol === col) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortCol(col);
            setSortOrder('ASC');
        }
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
            setPage(1);
        }
    };

    const handleDateModalApply = (start: Date, end: Date, label: string) => {
        setStartDate(start);
        setEndDate(end);
        setDateRangeLabel(label);
        setPage(1);
    };

    const handleExport = async () => {
        try {
            const uid = (registration as any).userId || registration.user_id;
            if (!uid || !corporateEmail) return;

            const res = await corporateDashboardService.getAssessmentSessions(
                corporateEmail,
                1, 10000, search, sortCol, sortOrder,
                {
                    start_date: format(startDate),
                    end_date: format(endDate),
                    status: statusFilter || undefined,
                    userId: uid
                }
            );
            // Simplified export
            console.log("Exporting", res.data);
        } catch (e) { console.error(e); }
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="flex flex-col gap-6 font-sans h-full">
            <DateRangePickerModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onApply={handleDateModalApply}
                initialRange={{ start: startDate, end: endDate, label: dateRangeLabel }}
            />
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span onClick={onBack} className="cursor-pointer hover:underline">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span onClick={onBack} className="cursor-pointer hover:underline">My Employees</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Preview Employee</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-[#150089] dark:text-white" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                        Preview Employee
                    </h1>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-[#19211C] p-6 rounded-2xl text-white relative">
                <button className="absolute top-6 right-6 px-4 py-1.5 bg-[#FFFFFF1F] rounded-full text-xs font-medium hover:bg-[#FFFFFF3F] transition-colors flex items-center gap-2">
                    Edit
                    {/* Pencil Icon if needed */}
                </button>

                <h2 className="text-sm text-gray-400 mb-6 font-medium">Profile Summary</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Full Name</p>
                        <p className="text-base font-medium">{registration.full_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Gender</p>
                        <p className="text-base font-medium capitalize">{registration.gender?.toLowerCase() || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Email Address</p>
                        <p className="text-base font-medium break-all">{registration.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Mobile Number</p>
                        <p className="text-base font-medium">{registration.mobile_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Group Name</p>
                        <p className="text-base font-medium">{(registration as any).groupName || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 bg-brand-green/20 text-brand-green rounded text-xs font-semibold border border-brand-green/30`}>
                            {registration.status === 'COMPLETED' || registration.status === 'INCOMPLETE' ? 'Active' : registration.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Assessments List Section */}
            <div>
                <h2 className="text-xl font-semibold text-[#150089] dark:text-white mb-4">List of Exams Assigned</h2>

                {/* Filters */}
                <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center mb-4">
                    {/* Search */}
                    <div className="relative w-full xl:w-96">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name, mobile, or Origin ID..."
                            className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                        />
                        {/* Search Icon */}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        {/* Status Filter */}
                        <div className="relative">
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
                                        : "Filter"}
                                </span>
                                <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-white" />
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1 z-[100]">
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

                        <DateRangeFilter selectedRange={dateRangeLabel} onRangeSelect={handleDateRangeSelect} />

                        <ExcelExportButton onClick={handleExport} />

                        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-green border border-transparent rounded-lg text-sm font-medium text-white hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 cursor-pointer">
                            <span>Assign New exam</span>
                            <PlusIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-[300px] relative flex flex-col">
                    <AssessmentSessionsTable
                        sessions={sessions}
                        loading={loading}
                        error={null}
                        sortColumn={sortCol}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                    />
                </div>

                {/* Bottom pagination + footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
                    {/* Left: Links */}
                    <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                        <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline">
                            Privacy Policy
                        </a>
                        <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                        <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline">
                            Terms & Conditions
                        </a>
                    </div>

                    {/* Center: Pagination */}
                    <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                            </button>

                            {(() => {
                                const pageNumbers: (number | string)[] = [];
                                const maxVisibleButtons = 5;

                                if (totalPages <= maxVisibleButtons + 2) {
                                    for (let i = 1; i <= totalPages; i++) {
                                        pageNumbers.push(i);
                                    }
                                } else {
                                    pageNumbers.push(1);
                                    if (page > 3) pageNumbers.push("...");

                                    let start = Math.max(2, page - 1);
                                    let end = Math.min(totalPages - 1, page + 1);

                                    if (page <= 3) {
                                        start = 2;
                                        end = 4;
                                    }
                                    if (page >= totalPages - 2) {
                                        start = totalPages - 3;
                                        end = totalPages - 1;
                                    }

                                    for (let i = start; i <= end; i++) {
                                        pageNumbers.push(i);
                                    }

                                    if (page < totalPages - 2) pageNumbers.push("...");
                                    pageNumbers.push(totalPages);
                                }

                                return pageNumbers.map((p, index) => (
                                    <button
                                        key={index}
                                        onClick={() => typeof p === "number" ? setPage(p) : null}
                                        disabled={typeof p !== "number"}
                                        className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-colors border ${page === p
                                            ? "bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/20"
                                            : typeof p === "number"
                                                ? "bg-transparent border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500"
                                                : "border-transparent text-gray-500 cursor-default"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ));
                            })()}

                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
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
        </div>
    );
};

export default EmployeePreview;
