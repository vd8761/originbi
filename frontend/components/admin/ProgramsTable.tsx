import React from 'react';
import { Program } from '@/lib/types';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { EditIcon, DeleteIcon, SortIcon, CheckIcon } from '@/components/icons';

interface ProgramsTableProps {
    programs: Program[];
    loading: boolean;
    error: string | null;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onEdit: (program: Program) => void;
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
        <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
            {loading && programs.length > 0 && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            )}

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
                        <tr className="text-left">
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                                <div className="flex items-center gap-1">
                                    Name
                                    <div className="flex flex-col">
                                        <SortIcon sort={null} />
                                    </div>
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group">
                                <div className="flex items-center gap-1 justify-center">
                                    Demo?
                                    <SortIcon sort={null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hidden md:table-cell">
                                <div className="flex items-center gap-1">
                                    Assessment Title
                                    <SortIcon sort={null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group hidden md:table-cell">
                                <div className="flex items-center gap-1">
                                    Report Title
                                    <SortIcon sort={null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group">
                                <div className="flex items-center gap-1 justify-center">
                                    Status
                                    <SortIcon sort={null} />
                                </div>
                            </th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-right">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                        {loading && programs.length === 0 ? (
                            // Skeleton Rows
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5">
                                    <td className="p-4 align-middle">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                                    </td>
                                    <td className="p-4 align-middle hidden md:table-cell">
                                        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </td>
                                    <td className="p-4 align-middle hidden md:table-cell">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : programs.length > 0 ? (
                            programs.map((program) => (
                                <tr key={program.id} className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white font-medium align-middle">
                                        {program.name}
                                    </td>
                                    <td className="p-4 text-center align-middle">
                                        {program.is_demo ? (
                                            <div className="flex justify-center">
                                                <CheckIcon className="w-5 h-5 text-brand-green" />
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600 font-medium">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white hidden md:table-cell align-middle">
                                        {program.assessment_title}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white hidden md:table-cell align-middle">
                                        {program.report_title}
                                    </td>
                                    <td className="pt-1 text-center align-middle">
                                        <ToggleSwitch isOn={program.is_active} onToggle={() => onToggleStatus(program.id, program.is_active)} />
                                    </td>
                                    <td className="p-4 text-right align-middle">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(program)}
                                                className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                                                title="Edit"
                                            >
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(program.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete"
                                            >
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                                    No programs found.
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

export default ProgramsTable;
