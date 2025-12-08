
import React from 'react';
import { ProgramData } from '@/lib/types';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { EditIcon, DeleteIcon, EyeVisibleIcon } from '@/components/icons';

interface ProgramsTableProps {
    programs: ProgramData[];
    loading: boolean;
    error: string | null;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onEdit: (program: ProgramData) => void;
    onDelete: (id: string) => void;
}

const ProgramsTable: React.FC<ProgramsTableProps> = ({
    programs,
    loading,
    error,
    onToggleStatus,
    onEdit,
    onDelete
}) => {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary bg-brand-light-primary dark:bg-brand-dark-primary min-h-[400px] relative">
            {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            )}

            <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                    <tr className="bg-brand-light-secondary dark:bg-[#1A1D21] text-left">
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                            Code
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                            Name
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                            Description
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider text-center">
                            Demo?
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                            Assessment Title
                        </th>
                         <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                            Report Title
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider text-center">
                            Status
                        </th>
                        <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider text-right">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                    {programs.length > 0 ? (
                        programs.map((program, index) => (
                            <tr key={program.id} className={`hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary/50 transition-colors ${index % 2 === 0 ? 'bg-brand-light-primary dark:bg-[#1A1D21]' : 'bg-brand-light-secondary/30 dark:bg-[#1e2126]'}`}>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white font-mono">
                                    {program.programCode}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white font-medium">
                                    {program.programName}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-secondary dark:text-brand-text-secondary max-w-xs truncate" title={program.description}>
                                    {program.description || '-'}
                                </td>
                                <td className="p-4 text-center">
                                    {program.isDemo ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            Yes
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                            No
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {program.assessmentTitle}
                                </td>
                                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                                    {program.reportTitle}
                                </td>
                                <td className="p-4 flex justify-center">
                                    <ToggleSwitch isOn={program.status} onToggle={() => onToggleStatus(program.id, program.status)} />
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => onEdit(program)}
                                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(program.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                                {loading ? 'Loading...' : 'No programs found.'}
                                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProgramsTable;
