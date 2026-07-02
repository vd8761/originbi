"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ArrowLeftWithoutLineIcon,
  ArrowRightWithoutLineIcon,
  FilterFunnelIcon,
} from "../icons";
import ExtendAssessmentsTable from "./ExtendAssessmentsTable";
import AssessmentResultPreview from "./AssessmentResultPreview";
import GroupAssessmentPreview from "./GroupAssessmentPreview";
import {
  assessmentService,
  AssessmentSession,
} from "../../lib/services/assessment.service";

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const STATUS_OPTIONS = [
  { label: "All Expired", value: "EXPIRED,PARTIALLY_EXPIRED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Partially Expired", value: "PARTIALLY_EXPIRED" },
];

type Tab = "individual" | "group";
type View = "list" | "individual-preview" | "group-preview";

const ExtendAssessmentsManagement: React.FC = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("individual");
  const [view, setView] = useState<View>("list");
  const [selectedSession, setSelectedSession] = useState<AssessmentSession | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tabCounts, setTabCounts] = useState<{ individual: number | null; group: number | null }>({
    individual: null,
    group: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_OPTIONS[0].value);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<HTMLDivElement>(null);

  // Rows currently animating out after a successful extend.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  // Per-status counts (for the filter dropdown), scoped to the active tab + search.
  const [statusCounts, setStatusCounts] = useState<{ expired: number; partially: number }>({
    expired: 0,
    partially: 0,
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
      if (entriesRef.current && !entriesRef.current.contains(e.target as Node)) setShowEntriesDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [indRes, grpRes] = await Promise.all([
        assessmentService.getSessions(
          activeTab === "individual" ? currentPage : 1,
          activeTab === "individual" ? entriesPerPage : 1,
          debouncedSearch,
          "exam_ends_on",
          "DESC",
          { status: statusFilter, type: "individual" },
        ),
        assessmentService.getSessions(
          activeTab === "group" ? currentPage : 1,
          activeTab === "group" ? entriesPerPage : 1,
          debouncedSearch,
          "exam_ends_on",
          "DESC",
          { status: statusFilter, type: "group" },
        ),
      ]);

      setTabCounts({ individual: indRes.total, group: grpRes.total });
      if (activeTab === "individual") {
        setSessions(indRes.data);
        setTotalCount(indRes.total);
      } else {
        setSessions(grpRes.data);
        setTotalCount(grpRes.total);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to fetch expired assessments. Please try again.");
      setSessions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, entriesPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Per-status counts for the filter dropdown (scoped to active tab + search).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [e, p] = await Promise.all([
          assessmentService.getSessions(1, 1, debouncedSearch, "exam_ends_on", "DESC", {
            status: "EXPIRED",
            type: activeTab,
          }),
          assessmentService.getSessions(1, 1, debouncedSearch, "exam_ends_on", "DESC", {
            status: "PARTIALLY_EXPIRED",
            type: activeTab,
          }),
        ]);
        if (!cancelled) setStatusCounts({ expired: e.total, partially: p.total });
      } catch {
        /* counts are best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedSearch]);

  const optionCount = (value: string) => {
    if (value === "EXPIRED") return statusCounts.expired;
    if (value === "PARTIALLY_EXPIRED") return statusCounts.partially;
    return statusCounts.expired + statusCounts.partially;
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
    setStatusFilter(STATUS_OPTIONS[0].value);
  };

  // API call only — the row-removal animation is driven by handleExtended once
  // the ExtendControl finishes its success tick.
  const handleExtend = async (session: AssessmentSession, newDateISO: string) => {
    if (activeTab === "group") {
      await assessmentService.extendGroupAssessment(session.id, newDateISO);
    } else {
      await assessmentService.extendSession(session.id, newDateISO);
    }
  };

  const handleExtended = (session: AssessmentSession) => {
    setRemovingIds((prev) => new Set(prev).add(session.id));
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => String(s.id) !== String(session.id)));
      setTotalCount((c) => Math.max(0, c - 1));
      setTabCounts((prev) => ({
        ...prev,
        [activeTab]:
          prev[activeTab] != null ? Math.max(0, (prev[activeTab] as number) - 1) : prev[activeTab],
      }));
      setStatusCounts((prev) => {
        const isPartial = session.status === "PARTIALLY_EXPIRED";
        return {
          expired: isPartial ? prev.expired : Math.max(0, prev.expired - 1),
          partially: isPartial ? Math.max(0, prev.partially - 1) : prev.partially,
        };
      });
      setRemovingIds((prev) => {
        const n = new Set(prev);
        n.delete(session.id);
        return n;
      });
    }, 520);
  };

  const handleView = (id: string) => {
    if (activeTab === "group") {
      setSelectedGroupId(id);
      setView("group-preview");
    } else {
      const s = sessions.find((x) => String(x.id) === String(id));
      setSelectedSession(s || ({ id } as unknown as AssessmentSession));
      setView("individual-preview");
    }
  };

  const totalPages = Math.ceil(totalCount / entriesPerPage) || 1;
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPaginationNumbers = () => {
    const nums: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (currentPage > 3) nums.push("...");
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) { start = 2; end = 4; }
      if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
      for (let i = start; i <= end; i++) nums.push(i);
      if (currentPage < totalPages - 2) nums.push("...");
      nums.push(totalPages);
    }
    return nums;
  };

  // ---- Preview views ----
  if (view === "individual-preview" && selectedSession) {
    return (
      <AssessmentResultPreview
        session={selectedSession}
        onBack={() => {
          setView("list");
          setSelectedSession(null);
        }}
      />
    );
  }
  if (view === "group-preview" && selectedGroupId) {
    return (
      <GroupAssessmentPreview
        sessionId={selectedGroupId}
        onBack={() => {
          setView("list");
          setSelectedGroupId(null);
        }}
        onViewSession={() => {}}
      />
    );
  }

  const activeCount = activeTab === "individual" ? tabCounts.individual : tabCounts.group;

  return (
    <div className="flex flex-col h-full w-full gap-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <button onClick={() => router.push("/admin/dashboard")} className="hover:underline">
            Dashboard
          </button>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
          </span>
          <span className="text-brand-green font-semibold">Extend Assessments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
          Extend Expired Assessments
        </h1>
        <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm mt-1">
          Reopen expired or partially-expired exams for individual candidates or whole groups.
        </p>
      </div>

      {/* Tabs + per-page */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
        <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
          {([
            { key: "individual", label: "Individual Candidates" },
            { key: "group", label: "Group Assessments" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-1 py-3 mr-8 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? "border-brand-green font-medium"
                  : "border-transparent hover:border-gray-200 font-[300] opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-[#19211C] dark:text-white">{t.label}</span>
              <span className="text-brand-green ml-1">
                ({(t.key === "individual" ? tabCounts.individual : tabCounts.group) ?? "..."})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 py-2 w-full xl:w-auto justify-end">
          <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
            Showing
          </span>
          <div className="relative" ref={entriesRef}>
            <button
              onClick={() => setShowEntriesDropdown((v) => !v)}
              className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all"
            >
              {entriesPerPage}
              <ChevronDownIcon className="w-3 h-3 text-brand-green" />
            </button>
            {showEntriesDropdown && (
              <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                {[10, 25, 50, 100].map((num) => (
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
          <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
            of {(activeCount ?? totalCount).toLocaleString()} entries
          </span>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPage === 1
                  ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                  : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
              }`}
            >
              <ArrowLeftWithoutLineIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPage === totalPages
                  ? "bg-white dark:bg-[#FFFFFF1F] text-[#19211C] dark:text-white border border-transparent dark:border-[#FFFFFF1F]"
                  : "bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90"
              }`}
            >
              <ArrowRightWithoutLineIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
        <div className="relative w-full xl:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activeTab === "group"
                ? "Search by group or program..."
                : "Search by name, email, or mobile..."
            }
            className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setShowStatusDropdown((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer text-[#19211C] dark:text-white"
            >
              <FilterFunnelIcon className="w-4 h-4" />
              <span>{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || "Filter"}</span>
              <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-white" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowStatusDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      statusFilter === option.value
                        ? "text-brand-green bg-gray-50 dark:bg-white/5"
                        : "text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>
                      {option.label}{" "}
                      <span className="opacity-60">({optionCount(option.value)})</span>
                    </span>
                    {statusFilter === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(32,210,125,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-[300px] relative flex flex-col">
        <ExtendAssessmentsTable
          sessions={sessions}
          loading={loading}
          error={error}
          isGroupView={activeTab === "group"}
          sortColumn="exam_ends_on"
          sortOrder="DESC"
          onView={handleView}
          onExtend={handleExtend}
          onExtended={handleExtended}
          removingIds={removingIds}
        />
      </div>

      {/* Bottom pagination */}
      <div className="flex justify-center pt-6 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeftWithoutLineIcon className="w-3 h-3" />
          </button>
          {getPaginationNumbers().map((page, i) => (
            <button
              key={i}
              onClick={() => (typeof page === "number" ? handlePageChange(page) : null)}
              disabled={typeof page !== "number"}
              className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-colors border ${
                currentPage === page
                  ? "bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/20"
                  : typeof page === "number"
                    ? "bg-transparent border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500"
                    : "border-transparent text-gray-500 cursor-default"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowRightWithoutLineIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendAssessmentsManagement;
