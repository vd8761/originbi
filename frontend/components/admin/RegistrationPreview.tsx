import React, { useState, useEffect, useCallback } from 'react';
import { Registration } from '@/lib/types';
import { AssessmentSession, assessmentService } from '@/lib/services/assessment.service';
import AssessmentSessionsTable from '@/components/admin/AssessmentSessionsTable';
import AssessmentDetails from '@/components/admin/AssessmentDetails';
import { ArrowLeftWithoutLineIcon, PlusIcon, ChevronDownIcon, ArrowRightWithoutLineIcon, FilterFunnelIcon } from '@/components/icons';
import ExcelExportButton from '@/components/ui/ExcelExportButton';
import DateRangeFilter, { DateRangeOption } from '@/components/ui/DateRangeFilter';
import DateRangePickerModal from '@/components/ui/DateRangePickerModal';

interface RegistrationPreviewProps {
    registration: Registration;
    onBack: () => void;
}

const format = (d: Date | null) => {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const RegistrationPreview: React.FC<RegistrationPreviewProps> = ({ registration, onBack }) => {
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
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("This Month");
    const [startDate, setStartDate] = useState<Date | null>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [endDate, setEndDate] = useState<Date | null>(() => {
        return new Date(); // Or today? Default filter logic suggests This Month usually means '1st to Now' or '1st to EndOfMonth'. Let's default to today for end if it's 'This Month' up to now, or just null if open ended. 
        // Screenshot shows range. Let's start with 1st of month.
        // Actually, let's keep it simple: Start of Month to Today.
        return new Date();
    });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [statusLabel, setStatusLabel] = useState<string>("All"); // UI Label
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        // Handle mismatched property names
        const uid = (registration as any).userId || registration.user_id;

        if (!uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await assessmentService.getSessions(
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
    }, [page, limit, search, sortCol, sortOrder, startDate, endDate, statusFilter, registration.user_id]);

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

    const handleStatusSelect = (label: string) => {
        setStatusLabel(label);
        setShowStatusDropdown(false);
        setPage(1);

        // Map UI label to backend status code
        switch (label) {
            case 'All': setStatusFilter(null); break;
            case 'Not Started': setStatusFilter('NOT_STARTED'); break;
            case 'In Progress': setStatusFilter('IN_PROGRESS'); break; // Or ON_GOING
            case 'Completed': setStatusFilter('COMPLETED'); break;
            case 'Partially Expired': setStatusFilter('PARTIALLY_EXP'); break;
            case 'Expired': setStatusFilter('EXPIRED'); break;
            default: setStatusFilter(null);
        }
    };

    const statusOptions = ['All', 'Not Started', 'In Progress', 'Completed', 'Partially Expired', 'Expired'];

    const handleExport = async () => {
        try {
            const res = await assessmentService.getSessions(
                1, 10000, search, sortCol, sortOrder,
                {
                    start_date: format(startDate),
                    end_date: format(endDate),
                    status: statusFilter || undefined,
                    userId: registration.user_id
                }
            );
            // ... export logic same as user management ...
            // Simplified for now
            console.log("Exporting", res.data);
        } catch (e) { console.error(e); }
    };

    const totalPages = Math.ceil(total / limit) || 1;

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    if (selectedSessionId && selectedSession) {
        return (
            <AssessmentDetails
                session={selectedSession}
                registration={registration}
                onBack={() => setSelectedSessionId(null)}
            />
        );
    }

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
                    <span onClick={onBack} className="cursor-pointer hover:underline">Registrations</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Preview Registrations</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-[#150089] dark:text-white" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                        Preview Registrations
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

                {/* Use grid-cols-6 to fit all items in one row on large screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
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
                <div className='flex justify-between items-center mb-4'>
                    <h2 className="text-xl font-semibold text-[#150089] dark:text-white">List of Exams Assigned</h2>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Showing</span>
                        <div className="flex items-center bg-[#19211C] rounded px-2 py-1 gap-2">
                            <span>{Math.min(page * limit, total).toString().padStart(2, '0')}</span>
                            <ChevronDownIcon className="w-3 h-3" />
                        </div>
                        <span>of {total.toString().padStart(2, '0')} entries</span>

                        <div className="flex gap-1 ml-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-1 rounded bg-[#19211C] hover:bg-white/10 disabled:opacity-50"
                            >
                                <ArrowLeftWithoutLineIcon className="w-2 h-2" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="p-1 rounded bg-[#19211C] hover:bg-white/10 disabled:opacity-50"
                            >
                                <ArrowRightWithoutLineIcon className="w-2 h-2" />
                            </button>
                        </div>
                    </div>
                </div>

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
                        {/* Filter Status */}
                        <div className="relative">
                            <button
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer text-[#19211C] dark:text-white min-w-[140px] justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <FilterFunnelIcon className="w-4 h-4" />
                                    <span>{statusLabel === 'All' ? 'Filter' : statusLabel}</span>
                                </div>
                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showStatusDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-brand-light-secondary dark:bg-[#1A1D21] border border-brand-light-tertiary dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                    <div className="py-1">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => handleStatusSelect(option)}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${statusLabel === option
                                                    ? 'text-brand-green font-semibold bg-brand-green/5'
                                                    : 'text-brand-text-light-primary dark:text-gray-300 hover:bg-brand-light-tertiary dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {option}
                                                {statusLabel === option && <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>}
                                            </button>
                                        ))}
                                    </div>
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
                        onView={(id) => setSelectedSessionId(id)}
                    />
                </div>

                {/* Pagination */}
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

export default RegistrationPreview;
