import React from 'react';
import { AssessmentSession } from '@/lib/services/assessment.service';
import { EyeVisibleIcon, SortIcon } from '@/components/icons';

interface AssessmentSessionsTableProps {
    sessions: AssessmentSession[];
    loading: boolean;
    error: string | null;
    onView?: (id: string) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortOrder?: "ASC" | "DESC";
    isGroupView?: boolean;
}

const AssessmentSessionsTable: React.FC<AssessmentSessionsTableProps> = ({
    sessions,
    loading,
    error,
    onView,
    onSort,
    sortColumn,
    sortOrder,
    isGroupView
}) => {

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

    const getStatusParams = (session: AssessmentSession) => {
        const { status, currentLevel, totalLevels } = session;
        switch (status) {
            case 'ON_GOING':
            case 'IN_PROGRESS':
                return {
                    label: `On Going (${currentLevel ?? 1}/${totalLevels ?? 4})`,
                    color: 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]'
                };
            case 'COMPLETED': return { label: 'Completed', color: 'bg-[#00B69B] text-white border-[#00B69B]' };
            case 'EXPIRED': return { label: 'Expired', color: 'bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]' };
            case 'PARTIALLY_EXP': return { label: 'Partially Exp', color: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]' };
            default: return { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
        }
    };

    return (
        <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
            {loading && sessions.length > 0 && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            )}

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full border-collapse relative min-w-[1200px]">
                    <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
                        <tr className="text-left">
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-16">
                                Action
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('exam_title')}
                            >
                                <div className="flex items-center gap-1">
                                    Exam Title
                                    <SortIcon sort={sortColumn === 'exam_title' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('exam_status')}
                            >
                                <div className="flex items-center gap-1 justify-center">
                                    Exam Status
                                    <SortIcon sort={sortColumn === 'exam_status' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">
                                Exam Type
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('program_name')}
                            >
                                <div className="flex items-center gap-1">
                                    Program Name
                                    <SortIcon sort={sortColumn === 'program_name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            {isGroupView && (
                                <th
                                    className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => onSort?.('group_name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Group Name
                                        <SortIcon sort={sortColumn === 'group_name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </th>
                            )}
                            {isGroupView && (
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">
                                    No. of Candidates
                                </th>
                            )}
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('exam_starts_on')}
                            >
                                <div className="flex items-center gap-1">
                                    Exam Starts On
                                    <SortIcon sort={sortColumn === 'exam_starts_on' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('exam_ends_on')}
                            >
                                <div className="flex items-center gap-1">
                                    Exam Ends On
                                    <SortIcon sort={sortColumn === 'exam_ends_on' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            {!isGroupView && (
                                <>
                                    <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-1">
                                            Exam Published On
                                            <SortIcon sort={null} />
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-1">
                                            Exam Expired On
                                            <SortIcon sort={null} />
                                        </div>
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                        {loading && sessions.length === 0 ? (
                            // Skeleton Row
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                    <td className="p-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div></td>
                                    <td className="p-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                    <td className="p-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                </tr>
                            ))
                        ) : error ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : sessions.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No assessment sessions found.
                                </td>
                            </tr>
                        ) : (
                            sessions.map((session) => {
                                const status = getStatusParams(session);
                                return (
                                    <tr
                                        key={session.id}
                                        className="hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] transition-colors group"
                                    >
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onView?.(session.id)}
                                                className="p-1 hover:bg-brand-light-tertiary dark:hover:bg-white/10 rounded transition-colors text-brand-green"
                                            >
                                                <EyeVisibleIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">
                                            {session.program?.assessment_title || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded text-[10px] font-semibold border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary text-center">
                                            WebApp
                                        </td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                                            {session.program?.name || '-'}
                                        </td>
                                        {isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                                                {session.groupName || '-'}
                                            </td>
                                        )}
                                        {isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary text-center">
                                                {session.totalCandidates || 0}
                                            </td>
                                        )}
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap">
                                            {formatDate(session.validFrom)}
                                        </td>
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap">
                                            {formatDate(session.validTo)}
                                        </td>
                                        {!isGroupView && (
                                            <>
                                                <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap">
                                                    {formatDate(session.createdAt)}
                                                </td>
                                                <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap">
                                                    {formatDate(session.validTo)} {/* Using ValidTo as proxy for expired on */}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssessmentSessionsTable;
