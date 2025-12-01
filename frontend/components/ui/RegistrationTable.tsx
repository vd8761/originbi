
import React from 'react';
import { RegistrationUser } from '../../lib/types';
import ToggleSwitch from '../ui/ToggleSwitch';
import { EyeVisibleIcon } from '@/components/icons';

interface RegistrationTableProps {
    users: RegistrationUser[];
    loading: boolean;
    error: string | null;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onViewDetails?: (id: string) => void;
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({ 
    users, 
    loading, 
    error, 
    onToggleStatus,
    onViewDetails 
}) => {
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
                            <tr key={user.id || index} className={`hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary/50 transition-colors ${index % 2 === 0 ? 'bg-brand-light-primary dark:bg-[#1A1D21]' : 'bg-brand-light-secondary/30 dark:bg-[#1e2126]'}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt="" className="w-8 h-8 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary" />
                                        <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">{user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {user.gender}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {user.email}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {user.mobile}
                                </td>
                                <td className="p-4 flex justify-center">
                                    <ToggleSwitch isOn={user.status} onToggle={() => onToggleStatus(user.id, user.status)} />
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => onViewDetails && onViewDetails(user.id)}
                                        className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                    >
                                        <EyeVisibleIcon className="w-5 h-5" />
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
    );
};

export default RegistrationTable;
