import React from 'react';
import { AssessmentSession } from '../../lib/services/assessment.service';
import { SortIcon } from '../icons';
import ReactCountryFlag from "react-country-flag";
import { COUNTRY_CODES } from '../../lib/countryCodes';
import { capitalizeWords } from "../../lib/utils";

interface AssessmentSessionsTableProps {
    sessions: AssessmentSession[];
    loading: boolean;
    error: string | null;
    onView?: (id: string) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortOrder?: "ASC" | "DESC";
    isGroupView?: boolean;
    hideCandidateName?: boolean;
}

function EyeActionIcon({ width = 31, height = 20 }: { width?: number; height?: number }) {
    return (
        <span className="inline-flex items-center justify-center">
            <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block group-hover/eye:hidden">
                <path d="M15.4697 20C9.67887 20 4.13428 15.7396 0.474369 11.3165C-0.158123 10.5521 -0.158123 9.44246 0.474369 8.67809C1.39456 7.566 3.32293 5.42048 5.89892 3.5454C12.3871 -1.17724 18.5398 -1.18635 25.0405 3.5454C28.0668 5.74819 30.4651 8.63677 30.4651 8.67809C31.0975 9.44246 31.0975 10.5521 30.4651 11.3165C26.8057 15.739 21.2619 20 15.4697 20ZM15.4697 1.89989C9.05465 1.89989 3.49375 8.01767 1.94226 9.8927C1.89213 9.95331 1.89213 10.0413 1.94226 10.1019C3.49381 11.9769 9.05465 18.0947 15.4697 18.0947C21.8848 18.0947 27.4457 11.9769 28.9972 10.1019C29.0876 9.99255 28.9912 9.8927 28.9972 9.8927C27.4456 8.01767 21.8848 1.89989 15.4697 1.89989Z" fill="#1ED36A"/>
                <path d="M15.4702 16.6658C11.7932 16.6658 8.80176 13.6743 8.80176 9.99732C8.80176 6.32032 11.7932 3.32886 15.4702 3.32886C19.1472 3.32886 22.1387 6.32032 22.1387 9.99732C22.1387 13.6743 19.1472 16.6658 15.4702 16.6658ZM15.4702 5.23413C12.8438 5.23413 10.707 7.3709 10.707 9.99732C10.707 12.6237 12.8438 14.7605 15.4702 14.7605C18.0966 14.7605 20.2334 12.6237 20.2334 9.99732C20.2334 7.3709 18.0966 5.23413 15.4702 5.23413Z" fill="#1ED36A"/>
            </svg>
            <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden group-hover/eye:block">
                <path d="M15.4692 14.7659C18.0999 14.7659 20.2324 12.6333 20.2324 10.0027C20.2324 7.37205 18.0999 5.2395 15.4692 5.2395C12.8386 5.2395 10.7061 7.37205 10.7061 10.0027C10.7061 12.6333 12.8386 14.7659 15.4692 14.7659Z" fill="#1ED36A"/>
                <path d="M30.4649 8.68329C26.8035 4.25888 21.2613 0 15.4698 0C9.67716 0 4.13358 4.26186 0.474681 8.68329C-0.158227 9.44778 -0.158227 10.5576 0.474681 11.3221C1.39457 12.4337 3.32307 14.5795 5.89876 16.4544C12.3856 21.1766 18.5397 21.1871 25.0408 16.4544C27.6165 14.5795 29.545 12.4337 30.4649 11.3221C31.096 10.5591 31.0992 9.45028 30.4649 8.68329ZM15.4698 3.33423C19.147 3.33423 22.1382 6.32551 22.1382 10.0027C22.1382 13.6799 19.147 16.6711 15.4698 16.6711C11.7926 16.6711 8.80132 13.6799 8.80132 10.0027C8.80132 6.32551 11.7926 3.33423 15.4698 3.33423Z" fill="#1ED36A"/>
            </svg>
        </span>
    );
}

const AssessmentSessionsTable: React.FC<AssessmentSessionsTableProps> = ({
    sessions,
    loading,
    error,
    onView,
    onSort,
    sortColumn,
    sortOrder,
    isGroupView,
    hideCandidateName
}) => {

    const getAvatarColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        const s = 55 + (Math.abs(hash) % 20);
        const l = 45 + (Math.abs(hash) % 10);
        const hslToHex = (h: number, s: number, l: number) => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = (n: number) => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `${f(0)}${f(8)}${f(4)}`;
        };
        return hslToHex(h, s, l);
    };

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
                if (isGroupView) {
                    return {
                        label: 'On Going',
                        color: 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]'
                    };
                }
                return {
                    label: `On Going (${currentLevel || 1}/${totalLevels || '-'})`,
                    color: 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]'
                };
            case 'NOT_STARTED':
                return {
                    label: 'Not Yet Started',
                    color: 'bg-gray-100 text-gray-600 border-gray-200'
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

                            {!isGroupView && (
                                <th
                                    className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-[15%] min-w-[140px]"
                                    onClick={() => onSort?.('candidate_name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Candidate Name
                                        <SortIcon sort={sortColumn === 'candidate_name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </th>
                            )}
                            {!isGroupView && (
                                <th
                                    className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-[20%] min-w-[200px]"
                                    onClick={() => onSort?.('email')}
                                >
                                    <div className="flex items-center gap-1">
                                        Email
                                        <SortIcon sort={sortColumn === 'email' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </th>
                            )}

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
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-[12%] min-w-[140px]"
                                onClick={() => onSort?.('exam_status')}
                            >
                                <div className="flex items-center gap-1 justify-center">
                                    Exam Status
                                    <SortIcon sort={sortColumn === 'exam_status' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            {!isGroupView && (
                                <th
                                    className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-[15%] min-w-[170px]"
                                    onClick={() => onSort?.('mobile_number')}
                                >
                                    <div className="flex items-center gap-1">
                                        Mobile Number
                                        <SortIcon sort={sortColumn === 'mobile_number' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </th>
                            )}
                            {isGroupView && (
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-[8%] min-w-[80px]">
                                    Exam Type
                                </th>
                            )}
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-[15%] min-w-[140px]"
                                onClick={() => onSort?.('program_name')}
                            >
                                <div className="flex items-center gap-1">
                                    Program Name
                                    <SortIcon sort={sortColumn === 'program_name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>

                            {isGroupView && (
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">
                                    No. of Candidates
                                </th>
                            )}
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap w-[10%] min-w-[120px]"
                                onClick={() => onSort?.('exam_starts_on')}
                            >
                                <div className="flex items-center gap-1">
                                    Exam Starts On
                                    <SortIcon sort={sortColumn === 'exam_starts_on' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap w-[10%] min-w-[120px]"
                                onClick={() => onSort?.('exam_ends_on')}
                            >
                                <div className="flex items-center gap-1">
                                    Exam Ends On
                                    <SortIcon sort={sortColumn === 'exam_ends_on' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-16">
                                Action
                            </th>
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
                                <td colSpan={8} className="p-8 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : sessions.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
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

                                        {!isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(capitalizeWords(session.registration?.fullName || session.user?.email || 'User'))}&background=${getAvatarColor(session.registration?.fullName || session.user?.email || 'User')}&color=fff&font-size=0.4`}
                                                        alt=""
                                                        className="w-9 h-9 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                                                    />
                                                    <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                                                        {capitalizeWords(session.registration?.fullName || session.user?.email || '-')}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {!isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">
                                                {session.registration?.email || session.user?.email || '-'}
                                            </td>
                                        )}

                                        {isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                                                {session.groupName || '-'}
                                            </td>
                                        )}
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded text-[10px] font-semibold border inline-block min-w-[140px] text-center ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        {!isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2" title={session.registration?.countryCode || 'IN'}>
                                                        <ReactCountryFlag
                                                            countryCode={COUNTRY_CODES.find(c => c.dial_code === session.registration?.countryCode)?.code || 'IN'}
                                                            svg
                                                            style={{
                                                                width: '1.4em',
                                                                height: '1.4em',
                                                                borderRadius: '2px',
                                                            }}
                                                        />
                                                        <span className="text-brand-text-light-secondary dark:text-gray-500 font-medium">
                                                            {session.registration?.countryCode || '+91'}
                                                        </span>
                                                    </div>
                                                    <span>{session.registration?.mobileNumber || '-'}</span>
                                                </div>
                                            </td>
                                        )}
                                        {isGroupView && (
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary text-center">
                                                WebApp
                                            </td>
                                        )}
                                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                                            {session.program?.name || '-'}
                                        </td>

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
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onView?.(session.id)}
                                                className="group/eye inline-flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                                            >
                                                <EyeActionIcon width={31} height={20} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default AssessmentSessionsTable;
