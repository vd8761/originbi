"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
} from "@/components/icons";
import CorporateRegistrationTable from "@/components/admin/CorporateRegistrationTable";
import AddCorporateRegistrationForm from "@/components/admin/AddCorporateRegistrationForm";
import { CorporateRegistrationUser } from "@/lib/types";
import { corporateRegistrationService } from "@/lib/services";

// Debounce utility (same as Programs)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CorporateManagement: React.FC = () => {
  const [view, setView] = useState<"list" | "form">("list");

  // Data state
  const [users, setUsers] = useState<CorporateRegistrationUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & filter
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await corporateRegistrationService.getRegistrationsList(
        currentPage,
        entriesPerPage,
        debouncedSearchTerm
      );
      setUsers(response.data);
      setTotalCount(response.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load corporate registrations.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle active / inactive
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await corporateRegistrationService.toggleStatus(id, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: !currentStatus } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Optional view details (future modal)
  const handleViewDetails = (id: string) => {
    //console.log("View corporate registration details for:", id);
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;

  // 👉 Form view (like AddProgramForm)
  if (view === "form") {
    return (
      <AddCorporateRegistrationForm
        onCancel={() => setView("list")}
        onRegister={() => {
          setView("list");
          fetchData();
        }}
      />
    );
  }

  // 👉 List view
  return (
    <div className="flex flex-col h-full w-full gap-6 font-sans">
      {/* Header / breadcrumb */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
          </span>
          <span className="text-brand-green font-semibold">
            Corporate Access
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white">
          Corporate Registrations
        </h1>
      </div>

      {/* Controls (Search + Add New) */}
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
            placeholder="Search name, email, mobile..."
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
            onClick={() => setView("form")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-semibold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20"
          >
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Bar 2 (Pagination info) */}
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
      <CorporateRegistrationTable
        users={users}
        loading={loading}
        error={error}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

export default CorporateManagement;
