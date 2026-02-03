'use client';
import React, { useState, useEffect } from 'react';
import CounsellingTypesTable from './CounsellingTypesTable';
import AddCounsellingTypeModal from './AddCounsellingTypeModal';
import { PlusIcon, ChevronDownIcon, ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon, ArrowRightIcon } from '../../components/icons';
// import { adminCounsellingService } from '../../lib/services.ts'; // Mock service removed for direct fetch

interface CounsellingType {
    id: number;
    name: string;
    prompt: string;
    isActive: boolean;
    courseDetails?: any;
    isDeleted?: boolean;
}

const CounsellingManagement: React.FC = () => {
    // UI State
    const [view, setView] = useState<"list" | "form">("list");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<CounsellingType | null>(null);

    // Data State
    const [types, setTypes] = useState<CounsellingType[]>([]);

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);

    // Mock Fetch - Replace with actual service call
    const fetchTypes = async () => {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
        try {
            const token = localStorage.getItem('token');
            console.log(`Fetching counselling types from: ${baseUrl}/admin/counselling/types`);

            const response = await fetch(`${baseUrl}/admin/counselling/types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Counselling Types Data:', data);
                // Handle both array and wrapped data
                const items = Array.isArray(data) ? data : (data.data || []);
                setTypes(items.filter((t: any) => !t.isDeleted));
            } else {
                console.error('Fetch Response Status:', response.status);
            }
        } catch (error) {
            console.error("Failed to fetch counselling types", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalCount = filteredTypes.length;
    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
    const paginatedTypes = filteredTypes.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

    const handleEdit = (type: CounsellingType) => {
        setEditingType(type);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this type?')) return;
        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
            await fetch(`${baseUrl}/admin/counselling/types/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTypes();
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingType(null);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="flex flex-col h-full w-full gap-6 font-sans">
            {/* Header / Breadcrumb */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span>Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        {/* Use ArrowRightWithoutLineIcon or similar standard icon */}
                        <svg className="w-3 h-3 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </span>
                    <span className="text-brand-green font-semibold">Counselling</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                    Counselling Management
                </h1>
            </div>

            {/* Controls (Search + Add New) Buttons */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">

                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search types..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                {/* Right side – Add New & Entries */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

                    {/* Entries Dropdown */}
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end mr-4">
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
                            Showing
                        </span>
                        <div className="relative">
                            <button
                                onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                                className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all cursor-pointer"
                            >
                                {entriesPerPage}
                                <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                            </button>
                            {showEntriesDropdown && (
                                <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                    {[10, 25, 50].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                setEntriesPerPage(num);
                                                setShowEntriesDropdown(false);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white cursor-pointer"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
                            of {totalCount} entries
                        </span>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20 cursor-pointer"
                    >
                        <span>Add New Type</span>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-[300px] relative flex flex-col">
                <CounsellingTypesTable
                    data={paginatedTypes}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Bottom Pagination & Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
                {/* Left: Links */}
                <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Privacy Policy</a>
                    <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                    <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Terms & Conditions</a>
                </div>

                {/* Center: Pagination */}
                <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-brand-green dark:hover:text-brand-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ArrowLeftWithoutLineIcon className="w-4 h-4" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-all border cursor-pointer ${currentPage === i + 1
                                    ? "bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20"
                                    : "bg-transparent border-brand-light-tertiary dark:border-white/10 text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-brand-green dark:hover:text-brand-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ArrowRightWithoutLineIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right: Copyright */}
                <div className="text-center sm:text-right w-full sm:w-1/3 order-3 hidden sm:block font-medium text-[#19211C] dark:text-[#FFFFFF]">
                    &copy; {new Date().getFullYear()} Origin BI
                </div>
            </div>

            {/* Modals */}
            <AddCounsellingTypeModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onRefresh={fetchTypes}
                editType={editingType}
            />
        </div>
    );
};

export default CounsellingManagement;
