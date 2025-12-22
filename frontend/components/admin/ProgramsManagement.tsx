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

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await programService.getProgramsList(
        currentPage,
        entriesPerPage,
        debouncedSearchTerm,
        sortColumn,
        sortOrder
      );
      setPrograms(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearchTerm, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortOrder("ASC");
    }
  };

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
      {/* Header / Breadcrumb – Aligned with RegistrationManagement */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
          </span>
          <span className="text-brand-green font-semibold">Programs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
          Programs Management
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
            placeholder="Search program code, name..."
            className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
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
          {/* Top Pagination Row (Compact) */}
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
              of {totalCount.toLocaleString()} entries
            </span>
          </div>

          <button
            onClick={() => {
              setEditingProgram(null);
              setView("form");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20 cursor-pointer"
          >
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Area - flex-1 ensures it fills available vertical space */}
      <div className="flex-1 min-h-[300px] relative flex flex-col">
        <ProgramsTable
          programs={programs}
          loading={loading}
          error={error}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>

      {/* Bottom pagination + footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-6 pb-2">
        {/* Left: Links */}
        <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
          <a
            href="#"
            className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer"
          >
            Privacy Policy
          </a>
          <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
          <a
            href="#"
            className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer"
          >
            Terms & Conditions
          </a>
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

            {/* Simple Pagination Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                // Shift window if strictly necessary, but for now simple logic
                // Adjust start index to center current page if possible
                let start = Math.max(1, currentPage - 2);
                if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                page = start + i;
              }

              if (page > totalPages) return null;

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-all border cursor-pointer ${currentPage === page
                    ? "bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20"
                    : "bg-transparent border-brand-light-tertiary dark:border-white/10 text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  {page}
                </button>
              );
            })}

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
          &copy; {new Date().getFullYear()} Origin BI, Made with by{" "}
          <span className="underline text-[#1ED36A] hover:text-[#1ED36A]/80 transition-colors cursor-pointer">
            Touchmark Descience Pvt. Ltd.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgramsManagement;
