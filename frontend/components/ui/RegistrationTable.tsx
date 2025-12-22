import React from 'react';
import { Registration } from '../../lib/types';
import { COUNTRY_CODES } from '../../lib/countryCodes';
import ReactCountryFlag from "react-country-flag";
import { EyeSolidIcon, SortIcon } from '@/components/icons';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface RegistrationTableProps {
    users: Registration[];
    loading: boolean;
    error: string | null;
    onToggleStatus?: (id: string, currentStatus: boolean) => void;
    onViewDetails?: (id: string) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortOrder?: "ASC" | "DESC";
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
    users,
    loading,
    error,
    onViewDetails,
    onToggleStatus,
    onSort,
    sortColumn,
    sortOrder
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
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('gender')}
                            >
                                <div className="flex items-center gap-1">
                                    Gender
                                    <SortIcon sort={sortColumn === 'gender' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('email')}
                            >
                                <div className="flex items-center gap-1">
                                    Email
                                    <SortIcon sort={sortColumn === 'email' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('mobile_number')}
                            >
                                <div className="flex items-center gap-1">
                                    Mobile
                                    <SortIcon sort={sortColumn === 'mobile_number' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort?.('status')}
                            >
                                <div className="flex items-center gap-1 justify-center">
                                    Status
                                    <SortIcon sort={sortColumn === 'status' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">
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
                                            <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">{user.full_name}</span>
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
                                    <td className="p-4 text-center align-middle">
                                        <button
                                            onClick={() => onViewDetails && onViewDetails(user.id)}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-brand-green"
                                        >
                                            <EyeSolidIcon className="w-6 h-6" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
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
