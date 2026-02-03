import React, { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '@/lib/services/assessment.service';
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon, ChevronDownIcon, EyeVisibleIcon, FilterFunnelIcon } from '@/components/icons/index';
import ExcelExportButton from '@/components/ui/ExcelExportButton';

interface GroupAssessmentPreviewProps {
    sessionId: string;
    onBack: () => void;
    onViewSession: (session: any) => void;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return dateStr;
    }
};

const GroupAssessmentPreview: React.FC<GroupAssessmentPreviewProps> = ({ sessionId, onBack, onViewSession }) => {
    const [groupData, setGroupData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Fetch Data
    const fetchGroupData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await assessmentService.getGroupSession(sessionId);
            setGroupData(data);
        } catch (error) {
            console.error("Failed to fetch group assessment", error);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (!groupData) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-gray-500">Group assessment not found.</p>
                <button onClick={onBack} className="text-brand-green hover:underline">Go Back</button>
            </div>
        );
    }

    // Filter sessions locally for now (since backend returns all for this group)
    const allSessions = groupData.sessions || [];
    const filteredSessions = allSessions.filter((s: any) => {
        const query = search.toLowerCase();
        const matchesSearch = (
            (s.userFullName && s.userFullName.toLowerCase().includes(query)) ||
            (s.userEmail && s.userEmail.toLowerCase().includes(query)) ||
            (s.status && s.status.toLowerCase().includes(query))
        );

        const matchesFilter = statusFilter === 'All'
            ? true
            : s.status?.toUpperCase() === statusFilter.replace(/ /g, '_').toUpperCase();

        return matchesSearch && matchesFilter;
    });

    const total = filteredSessions.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedSessions = filteredSessions.slice((page - 1) * limit, page * limit);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const getPaginationNumbers = () => {
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
        return pageNumbers;
    };

    const handleExport = () => {
        if (!groupData) return;

        // Prepare Summary Data
        const summaryRows = [
            ['Assessment Summary'],
            ['Exam Title', groupData.program?.assessment_title || 'N/A'],
            ['Exam Status', groupData.status || 'N/A'],
            ['Exam Type', 'WebApp'],
            ['Program Name', groupData.program?.name || 'N/A'],
            ['Group Name', groupData.group?.name || 'N/A'],
            ['No. of Candidates', groupData.totalCandidates || allSessions.length],
            ['Exam Starts On', formatDate(groupData.validFrom)],
            ['Exam Ends On', formatDate(groupData.validTo)],
            [], // Empty row
            ['List of Candidates'],
            ['Name', 'Email ID', 'Exam Status', 'Exam Starts On', 'Exam Ends On', 'Expired On'] // Headers
        ];

        // Prepare Candidates Data
        const candidateRows = filteredSessions.map((session: any) => {
            const isNotStarted = session.status === 'NOT_STARTED';
            const isExpired = session.status === 'EXPIRED';
            return [
                session.userFullName,
                session.userEmail,
                session.status,
                isNotStarted ? '--' : formatDate(session.validFrom),
                isNotStarted ? '--' : formatDate(session.validTo),
                isExpired ? formatDate(session.validTo) : '-'
            ];
        });

        // Combine Content
        const csvContent = [
            ...summaryRows.map((row: any[]) => row.map(cell => `"${cell}"`).join(',')),
            ...candidateRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Group_Assessment_${groupData.group?.name || 'Export'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6 font-sans h-full">
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
                    <span className="text-brand-green font-semibold">Group Assessment Preview</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-[#150089] dark:text-white" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                        Group Assessment Preview
                    </h1>
                </div>
            </div>

            {/* Assessment Summary Card */}
            <div className="bg-[#19211C] p-6 rounded-2xl text-white relative shadow-lg">
                <h2 className="text-sm text-gray-400 mb-6 font-medium uppercase tracking-wider">Assessment Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Title</p>
                        <p className="text-base font-semibold text-white">{groupData.program?.assessment_title || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Status</p>
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold border tracking-wide
                            ${groupData.status === 'COMPLETED' ? 'bg-[#00B69B] text-white border-[#00B69B]' :
                                groupData.status === 'IN_PROGRESS' || groupData.status === 'ON_GOING' ? 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]' :
                                    groupData.status === 'EXPIRED' ? 'bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]' :
                                        groupData.status === 'NOT_STARTED' ? 'bg-[#F2F2F2]/10 text-white border-[#F2F2F2]/20' :
                                            'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {groupData.status?.replace(/_/g, " ")}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Type</p>
                        <p className="text-base font-medium text-white">WebApp</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Program Name</p>
                        <p className="text-base font-medium text-white">{groupData.program?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Group Name</p>
                        <p className="text-base font-medium text-white">{groupData.group?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">No. of Candidates</p>
                        <p className="text-base font-medium text-white">{groupData.totalCandidates || allSessions.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Starts On</p>
                        <p className="text-base font-medium text-white">{formatDate(groupData.validFrom)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Ends On</p>
                        <p className="text-base font-medium text-white">{formatDate(groupData.validTo)}</p>
                    </div>
                </div>
            </div>

            {/* Candidates List Header */}
            <div className='flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-4'>
                <h2 className="text-xl font-semibold text-[#150089] dark:text-white">List of Candidates</h2>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
                        Showing
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all"
                        >
                            {limit}
                            <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                        </button>
                        {showEntriesDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                {[10, 25, 50, 100].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            setLimit(num);
                                            setShowEntriesDropdown(false);
                                            setPage(1);
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
                        of {total.toString().padStart(2, '0')} entries
                    </span>

                    {/* Compact arrows for quick nav */}
                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-1 rounded bg-white dark:bg-[#19211C] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowLeftWithoutLineIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="p-1 rounded bg-white dark:bg-[#19211C] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowRightWithoutLineIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search + Actions */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name, email..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer ${statusFilter !== 'All' ? 'text-brand-green border-brand-green/30 bg-brand-green/5' : 'text-[#19211C] dark:text-white'}`}
                        >
                            <FilterFunnelIcon className={`w-4 h-4 ${statusFilter !== 'All' ? 'text-brand-green' : ''}`} />
                            <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
                        </button>
                        {showFilterDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-[#303438] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                {['All', 'Not Started', 'In Progress', 'Completed', 'Partially Expired', 'Expired'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setShowFilterDropdown(false);
                                            setPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between
                                            ${statusFilter === status ? 'text-brand-green' : 'text-gray-300'}`}
                                    >
                                        {status}
                                        {statusFilter === status && <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <ExcelExportButton onClick={handleExport} />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px] flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    <table className="w-full border-collapse relative min-w-[1000px]">
                        <thead className="sticky top-0 z-20 bg-[#F8FAFC] dark:bg-[#FFFFFF1F] shadow-sm">
                            <tr className="text-left">
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-16 uppercase">Action</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Name</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Email ID</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center uppercase">Exam Status</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Exam Starts On</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Exam Ends On</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Expired On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                            {paginatedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">No candidates found.</td>
                                </tr>
                            ) : (
                                paginatedSessions.map((session: any) => {
                                    const isNotStarted = session.status === 'NOT_STARTED';
                                    const isExpired = session.status === 'EXPIRED';
                                    return (
                                        <tr key={session.id} className="hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] transition-colors group">
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => onViewSession(session)}
                                                    className="p-1 hover:bg-brand-light-tertiary dark:hover:bg-white/10 rounded-full transition-colors text-brand-green transform group-hover:scale-110"
                                                    title="View Results"
                                                >
                                                    <EyeVisibleIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">{session.userFullName}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{session.userEmail}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded text-[10px] font-bold border tracking-wide uppercase 
                                                    ${session.status === 'COMPLETED' ? 'bg-[#00B69B] text-white border-[#00B69B]' :
                                                        session.status === 'IN_PROGRESS' || session.status === 'ON_GOING' ? 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]' :
                                                            session.status === 'EXPIRED' ? 'bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {session.status?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isNotStarted ? '--' : formatDate(session.validFrom)}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isNotStarted ? '--' : formatDate(session.validTo)}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isExpired ? formatDate(session.validTo) : '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pb-4">
                <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                    <p className="text-xs text-gray-500">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results</p>
                </div>

                <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                        </button>

                        {getPaginationNumbers().map((p, i) => (
                            <button
                                key={i}
                                onClick={() => typeof p === 'number' && handlePageChange(p)}
                                disabled={typeof p !== 'number'}
                                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors
                                    ${p === page
                                        ? 'bg-brand-green text-white shadow-md shadow-brand-green/20'
                                        : typeof p === 'number' ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300' : 'cursor-default text-gray-400'}`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRightWithoutLineIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="w-full sm:w-1/3 sm:block hidden order-3"></div>
            </div>

        </div>
    );
};

export default GroupAssessmentPreview;
