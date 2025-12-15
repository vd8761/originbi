import React from 'react';
import { Registration } from '../../lib/types';
import { COUNTRY_CODES } from '../../lib/countryCodes';
import ReactCountryFlag from "react-country-flag";
import { EyeVisibleIcon } from '@/components/icons';

interface RegistrationTableProps {
    users: Registration[];
    loading: boolean;
    error: string | null;
    onToggleStatus?: (id: string, currentStatus: boolean) => void; // Optional now? Or remove.
    onViewDetails?: (id: string) => void;
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
    users,
    loading,
    error,
    onViewDetails
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
        <div className="w-full overflow-x-auto rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary bg-brand-light-primary dark:bg-brand-dark-primary min-h-[400px] relative">
            {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            )}

            <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                    <tr className="bg-brand-light-secondary dark:bg-[#1A1D21] text-left">
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer group">
                            <div className="flex items-center gap-1">
                                Name
                                <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                                    <span>▲</span><span>▼</span>
                                </div>
                            </div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                            <div className="flex items-center gap-1">
                                Gender
                                <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                                    <span>▲</span><span>▼</span>
                                </div>
                            </div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                            <div className="flex items-center gap-1">
                                Email
                                <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                                    <span>▲</span><span>▼</span>
                                </div>
                            </div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                            <div className="flex items-center gap-1">
                                Mobile
                                <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                                    <span>▲</span><span>▼</span>
                                </div>
                            </div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer text-center">
                            <div className="flex items-center gap-1 justify-center">
                                Status
                                <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                                    <span>▲</span><span>▼</span>
                                </div>
                            </div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider text-right">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                    {users.length > 0 ? (
                        users.map((user, index) => (
                            <tr key={user.id || index} className="border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=${getAvatarColor(user.full_name || 'User')}&color=fff&font-size=0.4`}
                                            alt=""
                                            className="w-9 h-9 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                                        />
                                        <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">{user.full_name}</span>
                                    </div >
                                </td >
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {user.gender}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {user['email' as keyof typeof user] || 'N/A'}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
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
                                <td className="p-4 flex justify-center">
                                    <span className="px-2 py-1 text-xs rounded-full bg-brand-green/20 text-brand-green">
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => onViewDetails && onViewDetails(user.id)}
                                        className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                    >
                                        <EyeVisibleIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr >
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                                {loading ? 'Loading...' : 'No records found.'}
                                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                            </td>
                        </tr>
                    )}
                </tbody >
            </table >
        </div >
    );
};

export default RegistrationTable;
