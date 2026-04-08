import React from 'react';
import { Registration } from '../../lib/types';
import { COUNTRY_CODES } from '../../lib/countryCodes';
import ReactCountryFlag from "react-country-flag";
import { SortIcon } from '../icons';
import ToggleSwitch from './ToggleSwitch';
import { capitalizeWords } from "../../lib/utils";

interface RegistrationTableProps {
    users: Registration[];
    loading: boolean;
    error: string | null;
    onToggleStatus?: (id: string, currentStatus: boolean) => void;
    onToggleAiCounsellor?: (id: string, currentState: boolean) => void;
    onViewDetails?: (id: string) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortOrder?: "ASC" | "DESC";
    showAiCounsellor?: boolean;
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

const RegistrationTable: React.FC<RegistrationTableProps> = ({
    users,
    loading,
    error,
    onViewDetails,
    onToggleStatus,
    onToggleAiCounsellor,
    onSort,
    sortColumn,
    sortOrder,
    showAiCounsellor = true
}) => {

    // Generate a unique but consistent color based on the name
    // Using HSL allows us to keep the colors vibrant and readable (consistent saturation/lightness)
    const getAvatarColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const h = Math.abs(hash) % 360;    // Full hue spectrum
        const s = 55 + (Math.abs(hash) % 20); // Saturation 55-75% (Vibrant but not neon)
        const l = 45 + (Math.abs(hash) % 10); // Lightness 45-55% (Dark formatting for white text)

        // HSL to Hex conversion
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

    return (
        <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
            {/* Loading overlay removed */}

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
                        <tr className="text-left">
                            <th
                                className="w-[25%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Name
                                    <div className="flex flex-col">
                                        <SortIcon sort={sortColumn === 'name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </div>
                            </th>
                            <th
                                className="w-[10%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('gender')}
                            >
                                <div className="flex items-center gap-1">
                                    Gender
                                    <SortIcon sort={sortColumn === 'gender' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="w-[25%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('email')}
                            >
                                <div className="flex items-center gap-1">
                                    Email
                                    <SortIcon sort={sortColumn === 'email' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="w-[20%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('mobile_number')}
                            >
                                <div className="flex items-center gap-1">
                                    Mobile
                                    <SortIcon sort={sortColumn === 'mobile_number' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="w-[10%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('status')}
                            >
                                <div className="flex items-center gap-1 justify-center">
                                    Status
                                    <SortIcon sort={sortColumn === 'status' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            {showAiCounsellor && (
                                <th
                                    className="w-[10%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => onSort?.('has_ai_counsellor')}
                                >
                                    <div className="flex items-center gap-1 justify-center">
                                        AI Counsellor
                                        <SortIcon sort={sortColumn === 'has_ai_counsellor' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                    </div>
                                </th>
                            )}
                            <th className="w-[10%] p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                        {loading ? (
                            Array.from({ length: 10 }).map((_, index) => (
                                <tr key={index} className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 animate-pulse">
                                    <td className="p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></div></td>
                                    <td className="p-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="p-4 text-center"><div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div></td>
                                    {showAiCounsellor && <td className="p-4 text-center"><div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div></td>}
                                    <td className="p-4 text-center"><div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                </tr>
                            ))
                        ) : users.length > 0 ? (
                            users.map((user, index) => (
                                <tr key={user.id || index} className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=${getAvatarColor(user.full_name || 'User')}&color=fff&font-size=0.4`}
                                                alt=""
                                                className="w-9 h-9 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                                            />
                                            <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">{capitalizeWords(user.full_name)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                                        {user.gender}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                                        {user['email' as keyof typeof user] || 'N/A'}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2" title={user.country_code}>
                                                <ReactCountryFlag
                                                    countryCode={COUNTRY_CODES.find(c => c.dial_code === user.country_code)?.code || 'IN'}
                                                    svg
                                                    style={{
                                                        width: '1.4em',
                                                        height: '1.4em',
                                                        borderRadius: '2px',
                                                    }}
                                                />
                                                <span className="text-brand-text-light-secondary dark:text-gray-500 font-medium">
                                                    {user.country_code}
                                                </span>
                                            </div>
                                            <span>{user.mobile_number}</span>
                                        </div>
                                    </td>
                                    <td className="pt-1 text-center align-middle">
                                        <ToggleSwitch
                                            isOn={['COMPLETED', 'ACTIVE'].includes(user.status)}
                                            onToggle={() => onToggleStatus && onToggleStatus(user.id, ['COMPLETED', 'ACTIVE'].includes(user.status))}
                                        />
                                    </td>
                                    {showAiCounsellor && (
                                        <td className="pt-1 text-center align-middle">
                                            <ToggleSwitch
                                                isOn={!!user.has_ai_counsellor}
                                                onToggle={() => onToggleAiCounsellor && onToggleAiCounsellor(user.id, !!user.has_ai_counsellor)}
                                            />
                                        </td>
                                    )}
                                    <td className="p-4 text-center align-middle">
                                        <button
                                            onClick={() => onViewDetails && onViewDetails(user.id)}
                                            className="group/eye inline-flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                                        >
                                            <EyeActionIcon width={31} height={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={showAiCounsellor ? 7 : 6} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                                    {loading ? 'Loading...' : 'No records found.'}
                                    {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegistrationTable;
