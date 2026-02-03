'use client';
import React from 'react';
import { EditIcon, DeleteIcon, CheckIcon } from '@/components/icons/index';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface CounsellingType {
    id: number;
    name: string;
    prompt: string;
    isActive: boolean;
}

interface CounsellingTypesTableProps {
    data: CounsellingType[];
    isLoading: boolean;
    onEdit: (type: CounsellingType) => void;
    onDelete: (id: number) => void;
}

const CounsellingTypesTable: React.FC<CounsellingTypesTableProps> = ({ data, isLoading, onEdit, onDelete }) => {
    return (
        <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">

            {/* Loading Spinner Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            )}

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
                        <tr className="text-left">
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">ID</th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">Name</th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider hidden md:table-cell">Prompt Preview</th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center">Status</th>
                            <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                        {data.length === 0 && !isLoading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                                    No counselling types found.
                                </td>
                            </tr>
                        ) : (
                            data.map((type) => (
                                <tr key={type.id} className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white font-medium align-middle">
                                        #{type.id}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white font-medium align-middle">
                                        {type.name}
                                    </td>
                                    <td className="p-4 text-sm text-brand-text-light-primary dark:text-white hidden md:table-cell align-middle max-w-xs truncate">
                                        {type.prompt}
                                    </td>
                                    <td className="p-4 text-center align-middle">
                                        {/* Using generic badge or Toggle if we had onStatusChange */}
                                        {type.isActive ? (
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                                                Active
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                Inactive
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right align-middle">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(type)}
                                                className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                                                title="Edit"
                                            >
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(type.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete"
                                            >
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CounsellingTypesTable;
