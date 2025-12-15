"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
} from "@/components/icons";
import ProgramsTable from "@/components/admin/ProgramsTable";
import AddProgramForm from "@/components/admin/AddProgramForm";
import { Program } from "@/lib/types";
import { programService } from "@/lib/services";

// Debounce utility (same pattern as Corporate)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ProgramsManagement: React.FC = () => {
  const [view, setView] = useState<"list" | "form">("list");
  const [editingProgram, setEditingProgram] = useState<Program | null>(
    null
  );

  // Data State
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);

  // Pagination & Filter
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await programService.getProgramsList(
        currentPage,
        entriesPerPage,
        debouncedSearchTerm
      );
      setPrograms(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this program?")) return;
    try {
      await programService.deleteProgram(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete program");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
    );
    try {
      await programService.toggleStatus(id, !currentStatus);
    } catch (err) {
      // Revert
      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: currentStatus } : p))
      );
      console.error("Failed to update status");
    }
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (view === "form") {
    return (
      <AddProgramForm
        onCancel={() => {
          setView("list");
          setEditingProgram(null);
        }}
        onSuccess={() => {
          setView("list");
          setEditingProgram(null);
          fetchData();
        }}
        initialData={editingProgram}
      />
    );
  }

  const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;

  return (
    <div className="flex flex-col h-full w-full gap-6 font-sans">
      {/* Header / Breadcrumb – aligned with CorporateManagement */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
          </span>
          <span className="text-brand-green font-semibold">Programs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white">
          Programs Management
        </h1>
      </div>

      {/* Controls (Search + Add New) – styled like CorporateManagement */}
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
            placeholder="Search program code, name..."
            className="w-full bg-transparent border border-brand-light-tertiary dark:border-brand-dark-tertiary rounded-lg py-2.5 pl-4 pr-10 text-sm text-brand-text-light-primary dark:text-white placeholder-brand-text-light-secondary dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Right side – Add New */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={() => {
              setEditingProgram(null);
              setView("form");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20"
          >
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Bar 2 (Pagination Info) – same as Corporate */}
      <div className="flex justify-end items-center gap-3 py-2 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-4">
        <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary hidden sm:inline">
          Showing
        </span>
        <div className="relative">
          <button
            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
            className="flex items-center gap-2 bg-brand-light-tertiary dark:bg-[#303438] px-3 py-1.5 rounded-lg text-sm text-brand-text-light-primary dark:text-white font-medium min-w-[60px] justify-between"
          >
            {entriesPerPage}
            <ChevronDownIcon className="w-3 h-3 text-gray-500" />
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
                  className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white"
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary whitespace-nowrap">
          of {totalCount} entries
        </span>

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-[#303438] flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50"
          >
            <ArrowLeftWithoutLineIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg disabled:opacity-50"
          >
            <ArrowRightWithoutLineIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table */}
      <ProgramsTable
        programs={programs}
        loading={loading}
        error={error}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ProgramsManagement;
