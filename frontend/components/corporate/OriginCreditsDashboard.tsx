"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import BuyCreditsModal from "./BuyCreditsModal";
import { corporateDashboardService } from "../../lib/services";
import ExcelExportButton from "../ui/ExcelExportButton";
import { SortIcon } from "../icons";

type CreditsTab = "overview" | "usage-history" | "transaction-history";
type RangeKey = "3m" | "6m" | "12m";

interface UsagePoint {
  month: string;
  studentProgram: number;
  employeeProgram: number;
  otherProgram: number;
}

const RANGE_LABELS: Record<RangeKey, string> = {
  "3m": "Last 3 month",
  "6m": "Last 6 month",
  "12m": "Last 12 month",
};

const RANGE_MONTHS: Record<RangeKey, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

const BAR_WIDTH_PX = 80;
const BAR_GAP_PX = 12;
const GROUP_WIDTH_PX = 172;
const GROUP_GAP_PX = 131;
const BAR_MAX_HEIGHT_PX = 300;
const GROUP_TOTAL_HEIGHT_PX = 284;

const DEFAULT_USAGE_DATA: UsagePoint[] = [
  { month: "Jan", studentProgram: 390, employeeProgram: 500, otherProgram: 0 },
  { month: "Feb", studentProgram: 440, employeeProgram: 470, otherProgram: 0 },
  { month: "Mar", studentProgram: 430, employeeProgram: 460, otherProgram: 0 },
  { month: "Apr", studentProgram: 440, employeeProgram: 470, otherProgram: 0 },
  { month: "May", studentProgram: 435, employeeProgram: 468, otherProgram: 0 },
  { month: "Jun", studentProgram: 438, employeeProgram: 472, otherProgram: 0 },
];

const tabs: Array<{ key: CreditsTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "usage-history", label: "Usage History" },
  { key: "transaction-history", label: "Transaction History" },
];

interface UsageHistoryRow {
  date: string;
  employeeAssessment: string;
  type: string;
  examRefNo: string;
  creditsUsed: number;
  users: number;
  examStatus: "Completed" | "Partially Exp" | "Expired";
}

interface TransactionHistoryRow {
  date: string;
  transactionId: string;
  credits: number;
  amount: number;
  method: string;
  paymentStatus: "Completed" | "Pending" | "Failed" | "Refunded";
}

const USAGE_HISTORY_TOTAL_ENTRIES = 1676;
const TRANSACTION_HISTORY_TOTAL_ENTRIES = 1676;

const USAGE_HISTORY_ROWS: UsageHistoryRow[] = [
  {
    date: "01/01/2026",
    employeeAssessment: "Monishwar Rajasekaran",
    type: "Individual",
    examRefNo: "OBI-G308-10/25-WB-CS-0093",
    creditsUsed: 10,
    users: 1,
    examStatus: "Completed",
  },
  {
    date: "01/01/2026",
    employeeAssessment: "Leadership Evaluation",
    type: "Group",
    examRefNo: "OBI-G308-10/25-WB-CS-0093",
    creditsUsed: 300,
    users: 30,
    examStatus: "Partially Exp",
  },
  {
    date: "24/01/2026",
    employeeAssessment: "Karthik Suresh",
    type: "Individual",
    examRefNo: "OBI-G308-10/25-WB-CS-0093",
    creditsUsed: 10,
    users: 1,
    examStatus: "Completed",
  },
  {
    date: "24/01/2026",
    employeeAssessment: "Employee Strengths",
    type: "Group",
    examRefNo: "OBI-G308-10/25-WB-CS-0093",
    creditsUsed: 500,
    users: 50,
    examStatus: "Completed",
  },
  {
    date: "31/01/2026",
    employeeAssessment: "Pranav Arul",
    type: "Individual",
    examRefNo: "OBI-G308-10/25-WB-CS-0093",
    creditsUsed: 10,
    users: 1,
    examStatus: "Expired",
  },
];

const TRANSACTION_HISTORY_ROWS: TransactionHistoryRow[] = [
  {
    date: "01/01/2026",
    transactionId: "ORB-INV-2025-01",
    credits: 250,
    amount: 5000,
    method: "Visa - 8764",
    paymentStatus: "Completed",
  },
  {
    date: "01/01/2026",
    transactionId: "ORB-INV-2025-02",
    credits: 1000,
    amount: 10000,
    method: "Cash",
    paymentStatus: "Pending",
  },
  {
    date: "24/01/2026",
    transactionId: "ORB-INV-2025-03",
    credits: 400,
    amount: 4000,
    method: "Master - 2543",
    paymentStatus: "Failed",
  },
  {
    date: "24/01/2026",
    transactionId: "ORB-INV-2025-04",
    credits: 4330,
    amount: 40320,
    method: "Net Banking",
    paymentStatus: "Refunded",
  },
  {
    date: "31/01/2026",
    transactionId: "ORB-INV-2025-05",
    credits: 920,
    amount: 9200,
    method: "G-Pay",
    paymentStatus: "Completed",
  },
];

type UsageSortKey = keyof Pick<UsageHistoryRow, "date" | "employeeAssessment" | "type" | "examRefNo" | "creditsUsed" | "users" | "examStatus">;
type TransactionSortKey = keyof Pick<TransactionHistoryRow, "date" | "transactionId" | "credits" | "amount" | "method" | "paymentStatus">;

const USAGE_CALENDAR_PRESETS = [
  "Any Time",
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];

const USAGE_WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function toMonthShort(value: string): string {
  if (!value) return "";
  return value.slice(0, 3);
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseUsageDate(value: string): number {
  const parts = value.split("/").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return 0;
  const [day, month, year] = parts;
  return year * 10000 + month * 100 + day;
}

function parseUsageRowDate(value: string): Date | null {
  const parts = value.split("/").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
}

function EyeIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <span className="group inline-block cursor-pointer">
      <svg viewBox="0 0 24 24" width={width} height={height} className="block">
        <path
          d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
          className="fill-transparent stroke-[#22c55e] [stroke-width:2] transition-all duration-300 ease-in-out group-hover:fill-[#22c55e]"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          className="fill-transparent stroke-[#22c55e] [stroke-width:2] transition-all duration-300 ease-in-out origin-center group-hover:fill-[#065f46] group-hover:scale-125"
        />
      </svg>
    </span>
  );
}

const OriginCreditsDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CreditsTab>("overview");
  const [selectedRange, setSelectedRange] = useState<RangeKey>("6m");
  const [openRangeDropdown, setOpenRangeDropdown] = useState<"default" | "chart" | null>(null);
  const [usageSearchTerm, setUsageSearchTerm] = useState("");
  const [usageEntriesPerPage, setUsageEntriesPerPage] = useState(10);
  const [usageEntriesMenuOpen, setUsageEntriesMenuOpen] = useState(false);
  const [usageStatusFilter, setUsageStatusFilter] = useState<"All" | UsageHistoryRow["examStatus"]>("All");
  const [showUsageFilterDropdown, setShowUsageFilterDropdown] = useState(false);
  const [showUsageDateModal, setShowUsageDateModal] = useState(false);
  const [usageDateFilter, setUsageDateFilter] = useState<string>("Applied Date");
  const [usageCalendarPreset, setUsageCalendarPreset] = useState<string>("Any Time");
  const [usageRangeStart, setUsageRangeStart] = useState<Date | null>(null);
  const [usageRangeEnd, setUsageRangeEnd] = useState<Date | null>(null);
  const [usageLeftCalendarMonth, setUsageLeftCalendarMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [isUsageExporting, setIsUsageExporting] = useState(false);
  const [usageSortColumn, setUsageSortColumn] = useState<UsageSortKey>("date");
  const [usageSortDirection, setUsageSortDirection] = useState<"asc" | "desc">("desc");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [transactionEntriesPerPage, setTransactionEntriesPerPage] = useState(10);
  const [transactionEntriesMenuOpen, setTransactionEntriesMenuOpen] = useState(false);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<"All" | TransactionHistoryRow["paymentStatus"]>("All");
  const [showTransactionFilterDropdown, setShowTransactionFilterDropdown] = useState(false);
  const [showTransactionDateModal, setShowTransactionDateModal] = useState(false);
  const [transactionDateFilter, setTransactionDateFilter] = useState<string>("Today (48)");
  const [transactionCalendarPreset, setTransactionCalendarPreset] = useState<string>("Any Time");
  const [transactionRangeStart, setTransactionRangeStart] = useState<Date | null>(null);
  const [transactionRangeEnd, setTransactionRangeEnd] = useState<Date | null>(null);
  const [transactionLeftCalendarMonth, setTransactionLeftCalendarMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [isTransactionExporting, setIsTransactionExporting] = useState(false);
  const [transactionSortColumn, setTransactionSortColumn] = useState<TransactionSortKey>("date");
  const [transactionSortDirection, setTransactionSortDirection] = useState<"asc" | "desc">("desc");
  const [creditsBalance, setCreditsBalance] = useState<number>(250);
  const [assessmentsConducted, setAssessmentsConducted] = useState<number>(75);
  const [totalCreditsUsed, setTotalCreditsUsed] = useState<number>(750);
  const [usageData, setUsageData] = useState<UsagePoint[]>(DEFAULT_USAGE_DATA);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [perCreditCost, setPerCreditCost] = useState<number | undefined>(undefined);
  const usageEntriesRef = useRef<HTMLDivElement | null>(null);
  const usageFilterRef = useRef<HTMLDivElement | null>(null);
  const transactionEntriesRef = useRef<HTMLDivElement | null>(null);
  const transactionFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCreditsData = async () => {
      const email =
        sessionStorage.getItem("userEmail") || localStorage.getItem("userEmail");
      if (!email) return;

      try {
        const [profile, stats] = await Promise.all([
          corporateDashboardService.getProfile(email).catch(() => null),
          corporateDashboardService.getStats(email).catch(() => null),
        ]);

        if (!mounted) return;

        const available =
          toNumber(profile?.available_credits) ?? toNumber(stats?.availableCredits);
        const total =
          toNumber(profile?.total_credits) ?? toNumber(stats?.totalCredits);
        const conducted =
          toNumber(stats?.miniStats?.assessmentsCompleted) ??
          toNumber(stats?.miniStats?.assessmentsAssigned);
        const creditCost = toNumber(stats?.perCreditCost);

        if (available !== null) setCreditsBalance(available);
        if (conducted !== null) setAssessmentsConducted(conducted);
        if (creditCost !== null) setPerCreditCost(creditCost);

        if (total !== null) {
          const resolvedAvailable = available ?? creditsBalance;
          const used = Math.max(0, total - resolvedAvailable);
          setTotalCreditsUsed(used);
        }

        const insights = Array.isArray(stats?.assessmentInsights)
          ? stats.assessmentInsights
          : [];

        if (insights.length > 0) {
          const mapped: UsagePoint[] = insights.slice(-12).map((item: any) => {
            const student = toNumber(item.completed) ?? 0;
            const employee = toNumber(item.assigned) ?? 0;
            const other = Math.max(0, (toNumber(item.inProgress) ?? 0));

            return {
              month: toMonthShort(String(item.month ?? "")) || "-",
              studentProgram: student,
              employeeProgram: employee,
              otherProgram: other,
            };
          });

          setUsageData(mapped);
        }
      } catch (error) {
        console.error("Failed to load Origin Credits data", error);
      }
    };

    loadCreditsData();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleUsageData = useMemo(() => {
    const count = RANGE_MONTHS[selectedRange];
    return usageData.slice(-count);
  }, [usageData, selectedRange]);

  const maxUsage = useMemo(() => {
    const max = Math.max(
      500,
      ...visibleUsageData.map((item) =>
        Math.max(item.studentProgram, item.employeeProgram, item.otherProgram),
      ),
    );
    return Math.ceil(max / 100) * 100;
  }, [visibleUsageData]);

  const yAxisTicks = useMemo(
    () => [maxUsage, maxUsage * 0.8, maxUsage * 0.6, maxUsage * 0.4, maxUsage * 0.2],
    [maxUsage],
  );

  const assessmentsLeft = Math.max(0, Math.floor(creditsBalance / 10));

  const getBarHeight = (value: number, minimumPx = 0) => {
    const scaled = (value / maxUsage) * BAR_MAX_HEIGHT_PX;
    return `${Math.max(minimumPx, Math.round(scaled))}px`;
  };

  const chartTrackWidth = useMemo(
    () =>
      visibleUsageData.length * GROUP_WIDTH_PX +
      Math.max(0, visibleUsageData.length - 1) * GROUP_GAP_PX,
    [visibleUsageData],
  );

  const normalizeUsageDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const addUsageMonths = (date: Date, months: number) =>
    new Date(date.getFullYear(), date.getMonth() + months, 1);
  const getUsageMonthLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const formatUsageShortNumericDate = (date: Date) => {
    const day = `${date.getDate()}`.padStart(2, "0");
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const year = `${date.getFullYear()}`.slice(-2);
    return `${day}/${month}/${year}`;
  };
  const formatUsageFilterRangeLabel = (start: Date, end: Date) => {
    const startDay = `${start.getDate()}`.padStart(2, "0");
    const endDay = `${end.getDate()}`.padStart(2, "0");
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const endYear = end.getFullYear();
    return `${startDay} ${startMonth} to ${endDay} ${endMonth} ${endYear}`;
  };

  const buildUsageMonthGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    for (let i = 0; i < startDayIndex; i += 1) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - startDayIndex + i + 1),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
    }

    while (cells.length < 42) {
      const nextDay = cells.length - (startDayIndex + daysInMonth) + 1;
      cells.push({ date: new Date(year, month + 1, nextDay), inCurrentMonth: false });
    }

    return cells;
  };

  const usageStartTime = usageRangeStart ? normalizeUsageDate(usageRangeStart) : null;
  const usageEndTime = usageRangeEnd ? normalizeUsageDate(usageRangeEnd) : null;
  const usageSelectedRangeText = usageRangeStart && usageRangeEnd
    ? `${formatUsageShortNumericDate(usageRangeStart)} - ${formatUsageShortNumericDate(usageRangeEnd)}`
    : "No range selected";
  const appliedDateLabel = usageDateFilter && usageDateFilter !== "Applied Date"
    ? usageDateFilter
    : "Applied Date";
  const isUsageDateFilterActive = Boolean(usageDateFilter && usageDateFilter !== "Applied Date");

  const handleUsageDateCellClick = (date: Date) => {
    setUsageCalendarPreset("Custom Range");

    if (!usageRangeStart || (usageRangeStart && usageRangeEnd)) {
      setUsageRangeStart(date);
      setUsageRangeEnd(null);
      return;
    }

    if (normalizeUsageDate(date) < normalizeUsageDate(usageRangeStart)) {
      setUsageRangeEnd(usageRangeStart);
      setUsageRangeStart(date);
      return;
    }

    setUsageRangeEnd(date);
  };

  const isUsageDateInRange = (date: Date) => {
    if (!usageStartTime) return false;
    const time = normalizeUsageDate(date);
    if (!usageEndTime) return time === usageStartTime;
    return time >= usageStartTime && time <= usageEndTime;
  };

  const isUsageRangeStart = (date: Date) =>
    usageStartTime !== null && normalizeUsageDate(date) === usageStartTime;
  const isUsageRangeEnd = (date: Date) =>
    usageEndTime !== null && normalizeUsageDate(date) === usageEndTime;

  const applyUsagePresetRange = (preset: string) => {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === "Any Time") {
      setUsageCalendarPreset("Any Time");
      setUsageRangeStart(null);
      setUsageRangeEnd(null);
      setUsageDateFilter("Any Time");
      setShowUsageDateModal(false);
      return;
    }

    if (preset === "Today") {
      setUsageCalendarPreset("Today");
      setUsageRangeStart(todayDate);
      setUsageRangeEnd(todayDate);
      setUsageDateFilter("Today");
      setShowUsageDateModal(false);
      return;
    }

    if (preset === "Yesterday") {
      const yesterday = new Date(todayDate);
      yesterday.setDate(todayDate.getDate() - 1);
      setUsageCalendarPreset("Yesterday");
      setUsageRangeStart(yesterday);
      setUsageRangeEnd(yesterday);
      setUsageDateFilter("Yesterday");
      setShowUsageDateModal(false);
      return;
    }

    if (preset === "Last 7 Days") {
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 6);
      setUsageCalendarPreset("Last 7 Days");
      setUsageRangeStart(start);
      setUsageRangeEnd(todayDate);
      setUsageDateFilter("Past Week");
      setShowUsageDateModal(false);
      return;
    }

    if (preset === "Last 30 Days") {
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 29);
      setUsageCalendarPreset("Last 30 Days");
      setUsageRangeStart(start);
      setUsageRangeEnd(todayDate);
      setUsageDateFilter("Past Month");
      setShowUsageDateModal(false);
      return;
    }

    if (preset === "This Month") {
      const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      const end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
      setUsageRangeStart(start);
      setUsageRangeEnd(end);
      setUsageLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setUsageCalendarPreset("Custom Range");
      return;
    }

    if (preset === "Last Month") {
      const start = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
      const end = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
      setUsageRangeStart(start);
      setUsageRangeEnd(end);
      setUsageLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setUsageCalendarPreset("Custom Range");
      return;
    }

    setUsageCalendarPreset("Custom Range");
  };

  const renderUsageCalendarMonth = (year: number, month: number, title: string) => {
    const cells = buildUsageMonthGrid(year, month);

    return (
      <div className="w-[344px] h-[300px] rounded-[12px] bg-white/[0.08] border border-white/[0.12] px-5 py-3.5">
        <div className="flex items-center justify-between mb-3 text-white/90 pb-3.5 border-b border-white/[0.12]">
          <button
            type="button"
            onClick={() => setUsageLeftCalendarMonth((prev) => addUsageMonths(prev, -1))}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="text-[14px] leading-[18px] font-semibold text-[#E7EFEB]">{title}</p>
          <button
            type="button"
            onClick={() => setUsageLeftCalendarMonth((prev) => addUsageMonths(prev, 1))}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 mb-2">
          {USAGE_WEEK_DAYS.map((day) => (
            <span key={`${title}-${day}`} className="text-center text-[13px] leading-[17px] font-normal text-white/80">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((cell) => {
            const day = cell.date.getDate();
            const inRange = isUsageDateInRange(cell.date);
            const start = isUsageRangeStart(cell.date);
            const end = isUsageRangeEnd(cell.date);
            const isMuted = !cell.inCurrentMonth;
            const rangePillClass = inRange
              ? `${start ? "rounded-l-[24px]" : ""} ${end ? "rounded-r-[100px]" : ""} ${!start && !end ? "rounded-none" : ""}`
              : "";

            return (
              <div key={`${title}-${cell.date.toISOString()}`} className={`h-[28px] flex items-center justify-center text-[13px] leading-[17px] ${inRange ? "bg-[#1ED36A]/[0.16]" : ""} ${rangePillClass}`}>
                <button
                  type="button"
                  onClick={() => handleUsageDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                  className={`h-9 w-9 flex items-center justify-center font-normal ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : ""} ${!start && !end && inRange ? "text-white" : ""} ${!inRange && !isMuted ? "text-white" : ""} ${isMuted ? "text-white/40" : ""}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredUsageHistoryRows = useMemo(() => {
    const term = usageSearchTerm.trim().toLowerCase();
    return USAGE_HISTORY_ROWS.filter((row) => {
      const matchesSearch = !term
        || [row.date, row.employeeAssessment, row.type, row.examRefNo, row.examStatus]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus = usageStatusFilter === "All" || row.examStatus === usageStatusFilter;

      const matchesDate = (() => {
        if (usageDateFilter === "Applied Date" || usageCalendarPreset === "Any Time") return true;

        const rowDate = parseUsageRowDate(row.date);
        if (!rowDate) return false;
        const rowTime = normalizeUsageDate(rowDate);

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayTime = normalizeUsageDate(todayDate);

        if (usageCalendarPreset === "Today" || usageDateFilter === "Today") {
          return rowTime === todayTime;
        }

        if (usageCalendarPreset === "Yesterday" || usageDateFilter === "Yesterday") {
          const yesterday = new Date(todayDate);
          yesterday.setDate(todayDate.getDate() - 1);
          return rowTime === normalizeUsageDate(yesterday);
        }

        if (usageCalendarPreset === "Last 7 Days" || usageDateFilter === "Past Week") {
          const start = new Date(todayDate);
          start.setDate(todayDate.getDate() - 6);
          const startTime = normalizeUsageDate(start);
          return rowTime >= startTime && rowTime <= todayTime;
        }

        if (usageCalendarPreset === "Last 30 Days" || usageDateFilter === "Past Month") {
          const start = new Date(todayDate);
          start.setDate(todayDate.getDate() - 29);
          const startTime = normalizeUsageDate(start);
          return rowTime >= startTime && rowTime <= todayTime;
        }

        if (usageStartTime && usageEndTime) {
          return rowTime >= usageStartTime && rowTime <= usageEndTime;
        }

        if (usageStartTime && !usageEndTime) {
          return rowTime === usageStartTime;
        }

        return true;
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    usageSearchTerm,
    usageStatusFilter,
    usageDateFilter,
    usageCalendarPreset,
    usageStartTime,
    usageEndTime,
  ]);

  const sortedUsageHistoryRows = useMemo(() => {
    const rows = [...filteredUsageHistoryRows];
    rows.sort((left, right) => {
      const direction = usageSortDirection === "asc" ? 1 : -1;

      if (usageSortColumn === "date") {
        return (parseUsageDate(left.date) - parseUsageDate(right.date)) * direction;
      }

      if (usageSortColumn === "creditsUsed" || usageSortColumn === "users") {
        return ((left[usageSortColumn] as number) - (right[usageSortColumn] as number)) * direction;
      }

      return String(left[usageSortColumn]).localeCompare(String(right[usageSortColumn])) * direction;
    });

    return rows;
  }, [filteredUsageHistoryRows, usageSortColumn, usageSortDirection]);

  const visibleUsageHistoryRows = useMemo(
    () => sortedUsageHistoryRows.slice(0, usageEntriesPerPage),
    [sortedUsageHistoryRows, usageEntriesPerPage],
  );

  const downloadUsageCSV = (
    headers: string[],
    rows: (string | number | null | undefined)[][],
    filename: string,
  ) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUsageExport = async () => {
    try {
      setIsUsageExporting(true);
      const headers = [
        "Date",
        "Employee / Assessment",
        "Type",
        "Exam Ref No.",
        "Credits Used",
        "Users",
        "Exam Status",
      ];

      const rows = sortedUsageHistoryRows.map((row) => [
        row.date,
        row.employeeAssessment,
        row.type,
        row.examRefNo,
        row.creditsUsed,
        row.users,
        row.examStatus,
      ]);

      downloadUsageCSV(
        headers,
        rows,
        `usage_history_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
    } catch (error) {
      console.error("Usage history export failed", error);
    } finally {
      setIsUsageExporting(false);
    }
  };

  const transactionStartTime = transactionRangeStart ? normalizeUsageDate(transactionRangeStart) : null;
  const transactionEndTime = transactionRangeEnd ? normalizeUsageDate(transactionRangeEnd) : null;
  const transactionSelectedRangeText = transactionRangeStart && transactionRangeEnd
    ? `${formatUsageShortNumericDate(transactionRangeStart)} - ${formatUsageShortNumericDate(transactionRangeEnd)}`
    : "No range selected";

  const filteredTransactionRows = useMemo(() => {
    const term = transactionSearchTerm.trim().toLowerCase();

    return TRANSACTION_HISTORY_ROWS.filter((row) => {
      const matchesSearch = !term
        || [
          row.date,
          row.transactionId,
          row.credits,
          row.amount,
          row.method,
          row.paymentStatus,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus = transactionStatusFilter === "All" || row.paymentStatus === transactionStatusFilter;

      const matchesDate = (() => {
        if (transactionCalendarPreset === "Any Time") return true;

        const rowDate = parseUsageRowDate(row.date);
        if (!rowDate) return false;
        const rowTime = normalizeUsageDate(rowDate);

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayTime = normalizeUsageDate(todayDate);

        if (transactionCalendarPreset === "Today") {
          return rowTime === todayTime;
        }

        if (transactionCalendarPreset === "Yesterday") {
          const yesterday = new Date(todayDate);
          yesterday.setDate(todayDate.getDate() - 1);
          return rowTime === normalizeUsageDate(yesterday);
        }

        if (transactionCalendarPreset === "Last 7 Days") {
          const start = new Date(todayDate);
          start.setDate(todayDate.getDate() - 6);
          const startTime = normalizeUsageDate(start);
          return rowTime >= startTime && rowTime <= todayTime;
        }

        if (transactionCalendarPreset === "Last 30 Days") {
          const start = new Date(todayDate);
          start.setDate(todayDate.getDate() - 29);
          const startTime = normalizeUsageDate(start);
          return rowTime >= startTime && rowTime <= todayTime;
        }

        if (transactionStartTime && transactionEndTime) {
          return rowTime >= transactionStartTime && rowTime <= transactionEndTime;
        }

        if (transactionStartTime && !transactionEndTime) {
          return rowTime === transactionStartTime;
        }

        return true;
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    transactionSearchTerm,
    transactionStatusFilter,
    transactionCalendarPreset,
    transactionStartTime,
    transactionEndTime,
  ]);

  const sortedTransactionRows = useMemo(() => {
    const rows = [...filteredTransactionRows];
    rows.sort((left, right) => {
      const direction = transactionSortDirection === "asc" ? 1 : -1;

      if (transactionSortColumn === "date") {
        return (parseUsageDate(left.date) - parseUsageDate(right.date)) * direction;
      }

      if (transactionSortColumn === "credits" || transactionSortColumn === "amount") {
        return ((left[transactionSortColumn] as number) - (right[transactionSortColumn] as number)) * direction;
      }

      return String(left[transactionSortColumn]).localeCompare(String(right[transactionSortColumn])) * direction;
    });

    return rows;
  }, [filteredTransactionRows, transactionSortColumn, transactionSortDirection]);

  const visibleTransactionRows = useMemo(
    () => sortedTransactionRows.slice(0, transactionEntriesPerPage),
    [sortedTransactionRows, transactionEntriesPerPage],
  );

  const handleTransactionExport = async () => {
    try {
      setIsTransactionExporting(true);
      const headers = [
        "Date",
        "Transaction ID",
        "Credits",
        "Amount",
        "Method",
        "Payment Status",
      ];

      const rows = sortedTransactionRows.map((row) => [
        row.date,
        row.transactionId,
        row.credits,
        row.amount,
        row.method,
        row.paymentStatus,
      ]);

      downloadUsageCSV(
        headers,
        rows,
        `transaction_history_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
    } catch (error) {
      console.error("Transaction history export failed", error);
    } finally {
      setIsTransactionExporting(false);
    }
  };

  const applyTransactionPresetRange = (preset: string) => {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === "Any Time") {
      setTransactionCalendarPreset("Any Time");
      setTransactionRangeStart(null);
      setTransactionRangeEnd(null);
      setTransactionDateFilter("Any Time");
      setShowTransactionDateModal(false);
      return;
    }
    if (preset === "Today") {
      setTransactionCalendarPreset("Today");
      setTransactionRangeStart(todayDate);
      setTransactionRangeEnd(todayDate);
      setTransactionDateFilter("Today");
      setShowTransactionDateModal(false);
      return;
    }
    if (preset === "Yesterday") {
      const yesterday = new Date(todayDate);
      yesterday.setDate(todayDate.getDate() - 1);
      setTransactionCalendarPreset("Yesterday");
      setTransactionRangeStart(yesterday);
      setTransactionRangeEnd(yesterday);
      setTransactionDateFilter("Yesterday");
      setShowTransactionDateModal(false);
      return;
    }
    if (preset === "Last 7 Days") {
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 6);
      setTransactionCalendarPreset("Last 7 Days");
      setTransactionRangeStart(start);
      setTransactionRangeEnd(todayDate);
      setTransactionDateFilter("Past Week");
      setShowTransactionDateModal(false);
      return;
    }
    if (preset === "Last 30 Days") {
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 29);
      setTransactionCalendarPreset("Last 30 Days");
      setTransactionRangeStart(start);
      setTransactionRangeEnd(todayDate);
      setTransactionDateFilter("Past Month");
      setShowTransactionDateModal(false);
      return;
    }
    if (preset === "This Month") {
      const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      const end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
      setTransactionRangeStart(start);
      setTransactionRangeEnd(end);
      setTransactionLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setTransactionCalendarPreset("Custom Range");
      return;
    }
    if (preset === "Last Month") {
      const start = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
      const end = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
      setTransactionRangeStart(start);
      setTransactionRangeEnd(end);
      setTransactionLeftCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setTransactionCalendarPreset("Custom Range");
      return;
    }

    setTransactionCalendarPreset("Custom Range");
  };

  const transactionAppliedDateLabel = transactionDateFilter && transactionDateFilter !== "Applied Date"
    ? transactionDateFilter
    : "Today (48)";
  const isTransactionDateFilterActive = Boolean(transactionDateFilter && transactionDateFilter !== "Applied Date");

  const handleTransactionDateCellClick = (date: Date) => {
    setTransactionCalendarPreset("Custom Range");

    if (!transactionRangeStart || (transactionRangeStart && transactionRangeEnd)) {
      setTransactionRangeStart(date);
      setTransactionRangeEnd(null);
      return;
    }

    if (normalizeUsageDate(date) < normalizeUsageDate(transactionRangeStart)) {
      setTransactionRangeEnd(transactionRangeStart);
      setTransactionRangeStart(date);
      return;
    }

    setTransactionRangeEnd(date);
  };

  const isTransactionDateInRange = (date: Date) => {
    if (!transactionStartTime) return false;
    const time = normalizeUsageDate(date);
    if (!transactionEndTime) return time === transactionStartTime;
    return time >= transactionStartTime && time <= transactionEndTime;
  };

  const isTransactionRangeStart = (date: Date) =>
    transactionStartTime !== null && normalizeUsageDate(date) === transactionStartTime;
  const isTransactionRangeEnd = (date: Date) =>
    transactionEndTime !== null && normalizeUsageDate(date) === transactionEndTime;

  const renderTransactionCalendarMonth = (year: number, month: number, title: string) => {
    const cells = buildUsageMonthGrid(year, month);

    return (
      <div className="w-[344px] h-[300px] rounded-[12px] bg-white/[0.08] border border-white/[0.12] px-5 py-3.5">
        <div className="flex items-center justify-between mb-3 text-white/90 pb-3.5 border-b border-white/[0.12]">
          <button
            type="button"
            onClick={() => setTransactionLeftCalendarMonth((prev) => addUsageMonths(prev, -1))}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="text-[14px] leading-[18px] font-semibold text-[#E7EFEB]">{title}</p>
          <button
            type="button"
            onClick={() => setTransactionLeftCalendarMonth((prev) => addUsageMonths(prev, 1))}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 mb-2">
          {USAGE_WEEK_DAYS.map((day) => (
            <span key={`${title}-${day}`} className="text-center text-[13px] leading-[17px] font-normal text-white/80">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((cell) => {
            const day = cell.date.getDate();
            const inRange = isTransactionDateInRange(cell.date);
            const start = isTransactionRangeStart(cell.date);
            const end = isTransactionRangeEnd(cell.date);
            const isMuted = !cell.inCurrentMonth;
            const rangePillClass = inRange
              ? `${start ? "rounded-l-[24px]" : ""} ${end ? "rounded-r-[100px]" : ""} ${!start && !end ? "rounded-none" : ""}`
              : "";

            return (
              <div key={`${title}-${cell.date.toISOString()}`} className={`h-[28px] flex items-center justify-center text-[13px] leading-[17px] ${inRange ? "bg-[#1ED36A]/[0.16]" : ""} ${rangePillClass}`}>
                <button
                  type="button"
                  onClick={() => handleTransactionDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                  className={`h-9 w-9 flex items-center justify-center font-normal ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : ""} ${!start && !end && inRange ? "text-white" : ""} ${!inRange && !isMuted ? "text-white" : ""} ${isMuted ? "text-white/40" : ""}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTransactionSortHeader = (label: string, column: TransactionSortKey) => {
    const isActive = transactionSortColumn === column;

    return (
      <button
        type="button"
        onClick={() => {
          if (isActive) {
            setTransactionSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          } else {
            setTransactionSortColumn(column);
            setTransactionSortDirection(column === "date" ? "desc" : "asc");
          }
        }}
        className="inline-flex items-center gap-1.5 cursor-pointer group"
      >
        <span className="text-[12px] leading-[16px] font-normal text-[#3A4741] dark:text-white/70">
          {label}
        </span>
        <SortIcon className="w-[10px] h-4 translate-y-[0px]" sort={isActive ? transactionSortDirection : null} />
      </button>
    );
  };

  const renderUsageSortHeader = (label: string, column: UsageSortKey) => {
    const isActive = usageSortColumn === column;

    return (
      <button
        type="button"
        onClick={() => {
          if (isActive) {
            setUsageSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          } else {
            setUsageSortColumn(column);
            setUsageSortDirection(column === "date" ? "desc" : "asc");
          }
        }}
        className="inline-flex items-center gap-1.5 cursor-pointer group"
      >
        <span className="text-[12px] leading-[16px] font-normal text-[#3A4741] dark:text-white/70">
          {label}
        </span>
        <SortIcon className="w-[10px] h-4 translate-y-[0px]" sort={isActive ? usageSortDirection : null} />
      </button>
    );
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-range-dropdown='true']")) {
        setOpenRangeDropdown(null);
      }
      if (usageEntriesRef.current && !usageEntriesRef.current.contains(target)) {
        setUsageEntriesMenuOpen(false);
      }
      if (usageFilterRef.current && !usageFilterRef.current.contains(target)) {
        setShowUsageFilterDropdown(false);
      }
      if (transactionEntriesRef.current && !transactionEntriesRef.current.contains(target)) {
        setTransactionEntriesMenuOpen(false);
      }
      if (transactionFilterRef.current && !transactionFilterRef.current.contains(target)) {
        setShowTransactionFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const renderTimeRangeSelect = (variant: "default" | "chart" = "default") => {
    const isOpen = openRangeDropdown === variant;

    return (
      <div className="relative" data-range-dropdown="true">
        <button
          type="button"
          onClick={() => setOpenRangeDropdown(isOpen ? null : variant)}
          className="h-[30px] w-[128px] rounded-[100px] border border-[#D4D8D5] bg-white/50 backdrop-blur-[8px] px-3 text-left text-[14px] leading-[18px] font-normal text-[#19211C] dark:border-white/10 dark:bg-white/[0.08] dark:text-white flex items-center justify-between"
        >
          <span className="truncate">{RANGE_LABELS[selectedRange]}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[#19211C]/70 dark:text-white/80 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-[148px] bg-white/40 dark:bg-[rgba(25,33,28,0.16)] border border-[#D4D8D5] dark:border-[rgba(255,255,255,0.2)] rounded-[10px] shadow-[0_10px_28px_rgba(25,33,28,0.08)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden box-border">
            {(["3m", "6m", "12m"] as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedRange(key);
                  setOpenRangeDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-[14px] leading-[18px] transition-colors ${selectedRange === key
                    ? "bg-[#A2E0BA]/35 dark:bg-[#32925B]/70 text-[#19211C] dark:text-white font-medium"
                    : "text-[#19211C] dark:text-white/90 font-normal hover:bg-white/18 dark:hover:bg-white/10"
                  }`}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-[12px]">
          <button
            onClick={() => router.push("/corporate/dashboard")}
            className="text-[#19211C]/60 dark:text-white/60 hover:text-[#1ED36A]"
          >
            Dashboard
          </button>
          <span className="text-[#19211C]/40 dark:text-white/30">&gt;</span>
          <span className="font-normal text-[#1ED36A]">Origin Credits</span>
        </div>

        <h1 className="text-[clamp(30px,2.2vw,44px)] font-medium text-[#150089] dark:text-white leading-none">
          Credits Management
        </h1>
      </div>

      <div className="mb-6 border-b border-[#D9E3DC] dark:border-white/10">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-[14px] whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "text-[#19211C] dark:text-white"
                  : "text-[#19211C]/50 dark:text-white/45 hover:text-[#19211C] dark:hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#1ED36A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "usage-history" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-end gap-2.5 text-[13px] text-[#19211C]/80 dark:text-white/60">
            <span className="font-light">Showing</span>
            <div className="relative" ref={usageEntriesRef}>
              <button
                type="button"
                onClick={() => setUsageEntriesMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-white/[0.04] dark:bg-white/10 border border-[#D4D8D5]/35 dark:border-white/10 px-2.5 py-1 rounded-[7px] text-[13px] text-[#1ED36A] font-medium min-w-[46px] justify-between transition-all backdrop-blur-[10px]"
              >
                {usageEntriesPerPage}
                <ChevronDown className={`w-3 h-3 text-[#19211C]/50 dark:text-white/50 transition-transform ${usageEntriesMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {usageEntriesMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white/18 dark:bg-[rgba(31,40,35,0.45)] border border-[#D4D8D5]/55 dark:border-white/15 rounded-lg shadow-lg z-50 py-1 backdrop-blur-[18px]">
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setUsageEntriesPerPage(size);
                        setUsageEntriesMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${usageEntriesPerPage === size
                          ? "text-[#1ED36A] font-semibold"
                          : "text-[#19211C]/70 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="whitespace-nowrap font-light">of {USAGE_HISTORY_TOTAL_ENTRIES.toLocaleString()} entries</span>
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#EEF1EE] dark:bg-white/10 flex items-center justify-center transition-all text-[#19211C]/70 dark:text-white/70 hover:bg-[#1ED36A] hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#1ED36A] text-white flex items-center justify-center transition-all hover:bg-[#16BD5C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-[16px] border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-white/[0.08]">
              <div className="relative w-full lg:w-[420px]">
                <input
                  type="text"
                  placeholder="Search by name, mobile, or Origin BI ID..."
                  value={usageSearchTerm}
                  onChange={(e) => setUsageSearchTerm(e.target.value)}
                  className="w-full h-[44px] rounded-xl border border-gray-300/80 dark:border-white/[0.24] bg-transparent px-4 text-[14px] text-[#19211C] dark:text-white placeholder:text-[#19211C]/45 dark:placeholder:text-white/35 transition-colors focus:outline-none focus:border-[#1ED36A]/60"
                />
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                <div className="relative" ref={usageFilterRef}>
                  <button
                    type="button"
                    onClick={() => setShowUsageFilterDropdown((prev) => !prev)}
                    className="h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-all whitespace-nowrap border border-[#D4D8D5]/35 dark:border-white/10 bg-white/[0.03] dark:bg-white/[0.12] backdrop-blur-[10px] text-[#33413B] dark:text-white/90 hover:bg-white/[0.08] dark:hover:bg-white/[0.16]"
                  >
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-[18px] shrink-0">
                      <path d="M17.0773 0H1.97844C1.59514 0.000301844 1.22016 0.111854 0.899022 0.321118C0.577883 0.530383 0.324388 0.828361 0.169304 1.17889C0.0142188 1.52942 -0.0357883 1.91743 0.0253517 2.29582C0.0864917 2.67422 0.25615 3.02673 0.513736 3.31059L7.05726 10.5071V17.2941C7.05732 17.4268 7.09476 17.5567 7.1653 17.6691C7.23584 17.7815 7.33662 17.8717 7.45608 17.9294C7.55156 17.9765 7.65669 18.0006 7.76314 18C7.92358 17.9999 8.07918 17.9451 8.20432 17.8447L9.52785 16.7859L11.7337 15.0212C11.8163 14.9551 11.8829 14.8713 11.9287 14.776C11.9745 14.6807 11.9984 14.5763 11.9984 14.4706V10.5071L18.542 3.31059C18.7995 3.02673 18.9692 2.67422 19.0303 2.29582C19.0915 1.91743 19.0415 1.52942 18.8864 1.17889C18.7313 0.828361 18.4778 0.530383 18.1567 0.321118C17.8355 0.111854 17.4606 0.000301844 17.0773 0Z" fill="#1ED36A"/>
                    </svg>
                    <span>{usageStatusFilter === "All" ? "Filter" : usageStatusFilter}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70 transition-transform ${showUsageFilterDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showUsageFilterDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white/16 dark:bg-[rgba(25,33,28,0.35)] border border-[#D4D8D5]/55 dark:border-white/15 rounded-xl shadow-[0_12px_28px_rgba(25,33,28,0.08)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1 backdrop-blur-[18px]">
                      {(["All", "Completed", "Partially Exp", "Expired"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setUsageStatusFilter(option);
                            setShowUsageFilterDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${usageStatusFilter === option
                              ? "text-[#1ED36A] bg-white/10 dark:bg-white/10"
                              : "text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10"
                            }`}
                        >
                          <span>{option}</span>
                          {usageStatusFilter === option && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1ED36A] shadow-[0_0_8px_rgba(30,211,106,0.6)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowUsageDateModal(true)}
                  className={`h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-all whitespace-nowrap border ${isUsageDateFilterActive
                    ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                    : "border-gray-300/80 bg-transparent text-[#33413B] hover:bg-black/[0.04] dark:border-transparent dark:bg-white/[0.12] dark:text-white/90 dark:hover:bg-white/[0.16]"
                    }`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-[#1ED36A]">
                    <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor"/>
                    <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor"/>
                  </svg>
                  <span>{appliedDateLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70" />
                </button>

                <ExcelExportButton
                  onClick={handleUsageExport}
                  isLoading={isUsageExporting}
                  className="h-[44px]"
                />
              </div>
            </div>

            {showUsageDateModal && (
              <div
                className="fixed inset-0 z-[80] bg-[#08120E]/80 backdrop-blur-[1.5px] flex items-center justify-center px-3"
                onClick={() => setShowUsageDateModal(false)}
              >
                <div
                  className="w-[900px] h-[480px] max-w-[95vw] rounded-[24px] border border-white/[0.2] bg-[#19211C]/40 shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-white/[0.12]">
                    <p className="text-[18px] leading-[23px] font-semibold text-white">Select Date Range</p>
                    <button
                      type="button"
                      onClick={() => setShowUsageDateModal(false)}
                      className="w-8 h-8 rounded-full bg-white/[0.12] text-[#1ED36A] hover:bg-[#1ED36A]/30 hover:text-white transition-colors flex items-center justify-center"
                      aria-label="Close date range picker"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                    <div className="w-[126px] shrink-0 border-r border-white/[0.12] pr-2.5">
                      {USAGE_CALENDAR_PRESETS.map((preset) => {
                        const isActivePreset = usageCalendarPreset === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setUsageCalendarPreset(preset);
                              applyUsagePresetRange(preset);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#1ED36A] text-white font-semibold" : "text-white/60 font-normal hover:bg-white/[0.08] hover:text-white"}`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-3">
                        {renderUsageCalendarMonth(
                          usageLeftCalendarMonth.getFullYear(),
                          usageLeftCalendarMonth.getMonth(),
                          getUsageMonthLabel(usageLeftCalendarMonth),
                        )}
                        {renderUsageCalendarMonth(
                          addUsageMonths(usageLeftCalendarMonth, 1).getFullYear(),
                          addUsageMonths(usageLeftCalendarMonth, 1).getMonth(),
                          getUsageMonthLabel(addUsageMonths(usageLeftCalendarMonth, 1)),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-white/[0.12] flex items-center justify-between gap-3">
                    <p className="text-[12px] leading-[16px] font-normal text-white">Selected Range : {usageSelectedRangeText}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUsageCalendarPreset("Any Time");
                          setUsageRangeStart(null);
                          setUsageRangeEnd(null);
                          setUsageDateFilter("Any Time");
                          setShowUsageDateModal(false);
                        }}
                        className="h-7 px-4 rounded-full border border-white text-white text-[12px] leading-[16px] font-medium hover:bg-white/10 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (usageCalendarPreset === "Any Time" || !usageRangeStart) {
                            setUsageDateFilter("Any Time");
                          } else if (usageRangeStart && !usageRangeEnd) {
                            setUsageDateFilter(formatUsageFilterRangeLabel(usageRangeStart, usageRangeStart));
                          } else if (usageRangeStart && usageRangeEnd) {
                            setUsageDateFilter(formatUsageFilterRangeLabel(usageRangeStart, usageRangeEnd));
                          }
                          setShowUsageDateModal(false);
                        }}
                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-medium hover:bg-[#16BD5C] transition-colors"
                      >
                        Apply changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1180px] text-[14px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.1]">
                    {[
                      "Date",
                      "Employee / Assessment",
                      "Type",
                      "Exam Ref No.",
                      "Credits Used",
                      "Users",
                      "Exam Status",
                      "Action",
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-5 py-3.5 whitespace-nowrap text-[12px] font-semibold text-[#3A4741] dark:text-white/70"
                      >
                        {header === "Action" ? (
                          <span>{header}</span>
                        ) : (
                          renderUsageSortHeader(
                            header,
                            header === "Date"
                              ? "date"
                              : header === "Employee / Assessment"
                                ? "employeeAssessment"
                                : header === "Type"
                                  ? "type"
                                  : header === "Exam Ref No."
                                    ? "examRefNo"
                                    : header === "Credits Used"
                                      ? "creditsUsed"
                                      : header === "Users"
                                        ? "users"
                                        : "examStatus",
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsageHistoryRows.map((row, idx) => (
                    <tr
                      key={`${row.examRefNo}-${idx}`}
                      className="border-b border-gray-200 dark:border-white/[0.08] transition-colors last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.date}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.employeeAssessment}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.type}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.examRefNo}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.creditsUsed}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.users}</td>
                      <td className="px-5 py-5 whitespace-nowrap">
                        {(() => {
                          const tone = idx === 0
                            ? "green"
                            : idx === 1
                              ? "yellow"
                              : idx === 2
                                ? "red"
                                : idx === 3
                                  ? "yellow"
                                  : "green";

                          const toneClass = tone === "green"
                            ? "border-[#10B981] text-white bg-[#1F6D4F]"
                            : tone === "yellow"
                              ? "border-[#D1A100] text-white bg-[#8A6E12]"
                              : "border-[#EF4444] text-white bg-[#8C3333]";

                          return (
                        <span
                          className={`inline-flex min-w-[114px] justify-center rounded-[6px] border px-3 py-2 text-[13px] font-light ${toneClass}`}
                        >
                          {row.examStatus}
                        </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-5">
                        <button
                          type="button"
                          className="group/eye flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                        >
                          <EyeIcon width={24} height={24} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "transaction-history" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-end gap-2.5 text-[13px] text-[#19211C]/80 dark:text-white/60">
            <span className="font-light">Showing</span>
            <div className="relative" ref={transactionEntriesRef}>
              <button
                type="button"
                onClick={() => setTransactionEntriesMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-white/[0.04] dark:bg-white/10 border border-[#D4D8D5]/35 dark:border-white/10 px-2.5 py-1 rounded-[7px] text-[13px] text-[#1ED36A] font-medium min-w-[46px] justify-between transition-all backdrop-blur-[10px]"
              >
                {transactionEntriesPerPage}
                <ChevronDown className={`w-3 h-3 text-[#19211C]/50 dark:text-white/50 transition-transform ${transactionEntriesMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {transactionEntriesMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white/18 dark:bg-[rgba(31,40,35,0.45)] border border-[#D4D8D5]/55 dark:border-white/15 rounded-lg shadow-lg z-50 py-1 backdrop-blur-[18px]">
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setTransactionEntriesPerPage(size);
                        setTransactionEntriesMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${transactionEntriesPerPage === size
                          ? "text-[#1ED36A] font-semibold"
                          : "text-[#19211C]/70 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="whitespace-nowrap font-light">of {TRANSACTION_HISTORY_TOTAL_ENTRIES.toLocaleString()} entries</span>
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#EEF1EE] dark:bg-white/10 flex items-center justify-center transition-all text-[#19211C]/70 dark:text-white/70 hover:bg-[#1ED36A] hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#1ED36A] text-white flex items-center justify-center transition-all hover:bg-[#16BD5C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-[16px] border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-white/[0.08]">
              <div className="relative w-full lg:w-[420px]">
                <input
                  type="text"
                  placeholder="Search by Transaction ID, amount, or method"
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                  className="w-full h-[44px] rounded-xl border border-gray-300/80 dark:border-white/[0.24] bg-transparent px-4 text-[14px] text-[#19211C] dark:text-white placeholder:text-[#19211C]/45 dark:placeholder:text-white/35 transition-colors focus:outline-none focus:border-[#1ED36A]/60"
                />
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                <div className="relative" ref={transactionFilterRef}>
                  <button
                    type="button"
                    onClick={() => setShowTransactionFilterDropdown((prev) => !prev)}
                    className="h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-all whitespace-nowrap border border-[#D4D8D5]/35 dark:border-white/10 bg-white/[0.03] dark:bg-white/[0.12] backdrop-blur-[10px] text-[#33413B] dark:text-white/90 hover:bg-white/[0.08] dark:hover:bg-white/[0.16]"
                  >
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-[18px] shrink-0">
                      <path d="M17.0773 0H1.97844C1.59514 0.000301844 1.22016 0.111854 0.899022 0.321118C0.577883 0.530383 0.324388 0.828361 0.169304 1.17889C0.0142188 1.52942 -0.0357883 1.91743 0.0253517 2.29582C0.0864917 2.67422 0.25615 3.02673 0.513736 3.31059L7.05726 10.5071V17.2941C7.05732 17.4268 7.09476 17.5567 7.1653 17.6691C7.23584 17.7815 7.33662 17.8717 7.45608 17.9294C7.55156 17.9765 7.65669 18.0006 7.76314 18C7.92358 17.9999 8.07918 17.9451 8.20432 17.8447L9.52785 16.7859L11.7337 15.0212C11.8163 14.9551 11.8829 14.8713 11.9287 14.776C11.9745 14.6807 11.9984 14.5763 11.9984 14.4706V10.5071L18.542 3.31059C18.7995 3.02673 18.9692 2.67422 19.0303 2.29582C19.0915 1.91743 19.0415 1.52942 18.8864 1.17889C18.7313 0.828361 18.4778 0.530383 18.1567 0.321118C17.8355 0.111854 17.4606 0.000301844 17.0773 0Z" fill="#1ED36A"/>
                    </svg>
                    <span>{transactionStatusFilter === "All" ? "Filter" : transactionStatusFilter}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70 transition-transform ${showTransactionFilterDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showTransactionFilterDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white/16 dark:bg-[rgba(25,33,28,0.35)] border border-[#D4D8D5]/55 dark:border-white/15 rounded-xl shadow-[0_12px_28px_rgba(25,33,28,0.08)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1 backdrop-blur-[18px]">
                      {(["All", "Completed", "Pending", "Failed", "Refunded"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTransactionStatusFilter(option);
                            setShowTransactionFilterDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${transactionStatusFilter === option
                              ? "text-[#1ED36A] bg-white/10 dark:bg-white/10"
                              : "text-[#33413B] dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10"
                            }`}
                        >
                          <span>{option}</span>
                          {transactionStatusFilter === option && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1ED36A] shadow-[0_0_8px_rgba(30,211,106,0.6)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowTransactionDateModal(true)}
                  className={`h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-all whitespace-nowrap border ${isTransactionDateFilterActive
                    ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                    : "border-gray-300/80 bg-transparent text-[#33413B] hover:bg-black/[0.04] dark:border-transparent dark:bg-white/[0.12] dark:text-white/90 dark:hover:bg-white/[0.16]"
                    }`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-[#1ED36A]">
                    <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor"/>
                    <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor"/>
                  </svg>
                  <span>{transactionAppliedDateLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70" />
                </button>

                <ExcelExportButton
                  onClick={handleTransactionExport}
                  isLoading={isTransactionExporting}
                  className="h-[44px]"
                />
              </div>
            </div>

            {showTransactionDateModal && (
              <div
                className="fixed inset-0 z-[80] bg-[#08120E]/80 backdrop-blur-[1.5px] flex items-center justify-center px-3"
                onClick={() => setShowTransactionDateModal(false)}
              >
                <div
                  className="w-[900px] h-[480px] max-w-[95vw] rounded-[24px] border border-white/[0.2] bg-[#19211C]/40 shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-white/[0.12]">
                    <p className="text-[18px] leading-[23px] font-semibold text-white">Select Date Range</p>
                    <button
                      type="button"
                      onClick={() => setShowTransactionDateModal(false)}
                      className="w-8 h-8 rounded-full bg-white/[0.12] text-[#1ED36A] hover:bg-[#1ED36A]/30 hover:text-white transition-colors flex items-center justify-center"
                      aria-label="Close date range picker"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                    <div className="w-[126px] shrink-0 border-r border-white/[0.12] pr-2.5">
                      {USAGE_CALENDAR_PRESETS.map((preset) => {
                        const isActivePreset = transactionCalendarPreset === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setTransactionCalendarPreset(preset);
                              applyTransactionPresetRange(preset);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#1ED36A] text-white font-semibold" : "text-white/60 font-normal hover:bg-white/[0.08] hover:text-white"}`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-3">
                        {renderTransactionCalendarMonth(
                          transactionLeftCalendarMonth.getFullYear(),
                          transactionLeftCalendarMonth.getMonth(),
                          getUsageMonthLabel(transactionLeftCalendarMonth),
                        )}
                        {renderTransactionCalendarMonth(
                          addUsageMonths(transactionLeftCalendarMonth, 1).getFullYear(),
                          addUsageMonths(transactionLeftCalendarMonth, 1).getMonth(),
                          getUsageMonthLabel(addUsageMonths(transactionLeftCalendarMonth, 1)),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-white/[0.12] flex items-center justify-between gap-3">
                    <p className="text-[12px] leading-[16px] font-normal text-white">Selected Range : {transactionSelectedRangeText}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionCalendarPreset("Any Time");
                          setTransactionRangeStart(null);
                          setTransactionRangeEnd(null);
                          setTransactionDateFilter("Any Time");
                          setShowTransactionDateModal(false);
                        }}
                        className="h-7 px-4 rounded-full border border-white text-white text-[12px] leading-[16px] font-medium hover:bg-white/10 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (transactionCalendarPreset === "Any Time" || !transactionRangeStart) {
                            setTransactionDateFilter("Any Time");
                          } else if (transactionRangeStart && !transactionRangeEnd) {
                            setTransactionDateFilter(formatUsageFilterRangeLabel(transactionRangeStart, transactionRangeStart));
                          } else if (transactionRangeStart && transactionRangeEnd) {
                            setTransactionDateFilter(formatUsageFilterRangeLabel(transactionRangeStart, transactionRangeEnd));
                          }
                          setShowTransactionDateModal(false);
                        }}
                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-medium hover:bg-[#16BD5C] transition-colors"
                      >
                        Apply changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1180px] text-[14px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.1]">
                    {[
                      "Date",
                      "Transaction ID",
                      "Credits",
                      "Amount",
                      "Method",
                      "Payment Status",
                      "Invoice",
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-5 py-3.5 whitespace-nowrap text-[12px] font-semibold text-[#3A4741] dark:text-white/70"
                      >
                        {header === "Invoice" ? (
                          <span>{header}</span>
                        ) : (
                          renderTransactionSortHeader(
                            header,
                            header === "Date"
                              ? "date"
                              : header === "Transaction ID"
                                ? "transactionId"
                                : header === "Credits"
                                  ? "credits"
                                  : header === "Amount"
                                    ? "amount"
                                    : header === "Method"
                                      ? "method"
                                      : "paymentStatus",
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactionRows.map((row, idx) => (
                    <tr
                      key={`${row.transactionId}-${idx}`}
                      className="border-b border-gray-200 dark:border-white/[0.08] transition-colors last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.date}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.transactionId}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.credits}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">₹{row.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.method}</td>
                      <td className="px-5 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex min-w-[114px] justify-center rounded-[6px] border px-3 py-2 text-[13px] font-light ${row.paymentStatus === "Completed"
                              ? "border-[#10B981] text-white bg-[#1F6D4F]"
                              : row.paymentStatus === "Pending"
                                ? "border-[#D1A100] text-white bg-[#8A6E12]"
                                : row.paymentStatus === "Failed"
                                  ? "border-[#EF4444] text-white bg-[#8C3333]"
                                  : "border-[#0EA5E9] text-white bg-[#1E4E68]"
                            }`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <button
                          type="button"
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent hover:bg-white/[0.10] dark:hover:bg-white/[0.14] transition-all text-[#1ED36A]"
                          aria-label={`Download invoice ${row.transactionId}`}
                        >
                          <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M1.15789 15.0526C1.79738 15.0526 2.31579 15.571 2.31579 16.2105V18.5263C2.31579 18.8334 2.43776 19.1278 2.65495 19.345C2.87208 19.5622 3.16658 19.6842 3.47368 19.6842H17.3684C17.6755 19.6842 17.9699 19.5623 18.1871 19.345C18.4044 19.1278 18.5263 18.8334 18.5263 18.5263V16.2105C18.5263 15.571 19.0447 15.0526 19.6842 15.0526C20.3237 15.0526 20.8421 15.571 20.8421 16.2105V18.5263C20.8421 19.4475 20.4762 20.3311 19.8246 20.9825C19.1732 21.634 18.2896 22 17.3684 22H3.47368C2.55243 22 1.66885 21.6341 1.0174 20.9825C0.365987 20.3311 0 19.4475 0 18.5263V16.2105C0 15.571 0.518401 15.0526 1.15789 15.0526Z"
                              fill="#1ED36A"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M3.81375 8.44437C4.26594 7.99218 4.99907 7.99218 5.45126 8.44437L10.422 13.4151L15.3927 8.44437C15.8448 7.99218 16.578 7.99218 17.0302 8.44437C17.4825 8.89653 17.4825 9.62971 17.0302 10.0819L11.2407 15.8713C10.7885 16.3235 10.0554 16.3235 9.60321 15.8713L3.81375 10.0819C3.36156 9.62971 3.36156 8.89653 3.81375 8.44437Z"
                              fill="#1ED36A"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M10.4216 0C11.0611 0 11.5795 0.518413 11.5795 1.1579V15.0526C11.5795 15.6922 11.0611 16.2105 10.4216 16.2105C9.78206 16.2105 9.26367 15.6922 9.26367 15.0526V1.1579C9.26367 0.518413 9.78206 0 10.4216 0Z"
                              fill="#1ED36A"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 max-w-[1220px]">
            <div className="glass-card dashboard-glass-card rounded-[26px] p-7 sm:p-8 min-h-[340px] sm:min-h-[360px] relative overflow-hidden border-0">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute -top-[70px] left-[48px] font-['Haskoy'] text-[clamp(330px,23vw,460px)] font-extrabold text-[rgba(216,210,230,0.45)] dark:text-white/[0.04] leading-none tracking-[0] select-none">
                  {creditsBalance}
                </span>
              </div>

              <div
                className="absolute z-[2] opacity-95 hidden sm:block"
                style={{
                  width: "181px",
                  height: "184px",
                  right: "156px",
                  top: "18px",
                }}
              >
                <img
                  src="/assets/coins/coin-top.png"
                  alt=""
                  aria-hidden
                  className="pointer-events-none select-none object-contain w-full h-full"
                />
              </div>
              <div className="absolute -right-[12px] -bottom-[20px] z-[2] opacity-95 w-[220px] h-[220px] sm:w-[240px] sm:h-[240px]">
                <img
                  src="/assets/coins/coin-bottom.png"
                  alt=""
                  aria-hidden
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>

              <div
                className="absolute z-[1] -bottom-[30%] -left-[10%] -right-[10%] h-[180px] blur-[50px] pointer-events-none opacity-100"
                style={{
                  background: "linear-gradient(90deg, #ED2F34 0%, #EF5921 33%, #FDC00C 66%, #1ED36A 100%)",
                }}
              />

              <div className="relative z-10 h-full flex flex-col">
                <h2 className="font-['Haskoy'] text-[20px] font-medium text-[#19211C] dark:text-white leading-none">Credits Balance</h2>
                <div className="mt-12 font-['Haskoy'] font-medium text-[clamp(84px,5.6vw,118px)] text-[#150089] dark:text-white leading-[0.88] tracking-[0.01em]">
                  {creditsBalance}
                </div>
                <p className="font-['Haskoy'] font-light text-[14px] text-[#19211C]/88 dark:text-white/88 mt-5">
                  Assesment Left {assessmentsLeft}
                </p>

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => setIsBuyCreditsOpen(true)}
                    className="font-['Haskoy'] inline-flex items-center rounded-full bg-[#1ED36A] hover:bg-[#16b058] px-5 py-2 text-[14px] leading-[18px] font-normal text-white shadow-md shadow-[#1ED36A]/20 transition-all"
                  >
                    Buy Credits
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card dashboard-glass-card rounded-[26px] p-7 sm:p-8 min-h-[340px] sm:min-h-[360px] relative overflow-hidden border-0">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute -top-[70px] left-[44px] font-['Haskoy'] text-[clamp(330px,23vw,460px)] font-extrabold text-[rgba(216,210,230,0.45)] dark:text-white/[0.04] leading-none tracking-[0] select-none">
                  {assessmentsConducted}
                </span>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-['Haskoy'] text-[20px] font-medium text-[#19211C] dark:text-white leading-none">Assessments Conducted</h2>
                  {renderTimeRangeSelect()}
                </div>

                <div className="mt-12 font-['Haskoy'] font-medium text-[clamp(84px,5.6vw,118px)] text-[#150089] dark:text-white leading-[0.88] tracking-[0.01em]">
                  {assessmentsConducted}
                </div>

                <div className="mt-auto pt-5 flex items-end justify-between gap-4">
                  <p className="font-['Haskoy'] font-regular text-[20px] text-[#19211C]/88 dark:text-white/88">
                    Total credits used:{totalCreditsUsed}
                  </p>
                  <button
                    onClick={() => router.push("/corporate/registrations")}
                    className="font-['Haskoy'] inline-flex items-center gap-1.5 rounded-full bg-[#1ED36A] hover:bg-[#16b058] px-5 py-2 text-[14px] leading-[18px] font-normal text-white shadow-md shadow-[#1ED36A]/20 transition-all"
                  >
                    Assign New exam
                    <Plus className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card dashboard-glass-card rounded-[24px] px-6 sm:px-7 pt-6 sm:pt-7 pb-6 sm:pb-7 min-h-[424px] overflow-visible bg-white/[0.08] border-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
              <h2 className="text-[20px] leading-[26px] font-medium text-[#19211C] dark:text-white">Credit Usage</h2>

              <div className="flex items-center justify-center gap-4 sm:gap-5 text-[14px] leading-[18px] font-normal text-[#19211C]/90 dark:text-white">
                <span className="inline-flex items-center gap-2">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#150089] dark:bg-[#EDFFF4]" />
                  Student Program
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#1ED36A]" />
                  Employee Program
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#FFB703]" />
                  Other Program
                </span>
              </div>

              <div className="flex justify-start lg:justify-end">
                {renderTimeRangeSelect("chart")}
              </div>
            </div>

            <div className="mt-6 flex gap-4 sm:gap-6">
              <div className="hidden lg:flex min-w-[30px] flex-col justify-between h-[239px] mt-[20px] text-[16px] leading-[21px] font-light text-[#19211C]/65 dark:text-white/80">
                {yAxisTicks.map((tick, index) => (
                  <span key={`${tick}-${index}`}>{Math.round(tick)}</span>
                ))}
              </div>

              <div className="relative flex-1 overflow-x-auto scrollbar-hide">
                <div className="relative h-[320px]" style={{ width: `${chartTrackWidth}px` }}>
                  <div className="absolute left-0 right-0 top-[20px] h-[300px] pointer-events-none">
                    <div className="h-full flex flex-col justify-between">
                      {[0, 1, 2, 3].map((line) => (
                        <div
                          key={line}
                          className="border-b border-dashed border-[#AFC2B7]/35 dark:border-white/20"
                        />
                      ))}
                      <div className="border-b border-[#AFC2B7]/45 dark:border-white/25" />
                    </div>
                  </div>
                  <div className="absolute left-0 right-0 top-[320px] border-b border-[#AFC2B7]/45 dark:border-white/25 pointer-events-none" />

                  <div className="absolute left-0 right-0 top-[20px] h-[284px] flex items-start gap-[131px]">
                    {visibleUsageData.map((item) => (
                      <div key={item.month} className="group relative h-[284px] w-[172px] shrink-0">
                        <div className="absolute left-0 top-0 h-[300px] w-[172px]">
                          <div
                            className="absolute left-0 bottom-0 w-[80px] rounded-[100px] bg-[#150089] dark:bg-[#EDFFF4]"
                            style={{ height: getBarHeight(item.studentProgram) }}
                          />
                          <div
                            className="absolute left-[92px] bottom-0 w-[80px] rounded-[100px] bg-[#1ED36A]"
                            style={{ height: getBarHeight(item.employeeProgram) }}
                          />
                        </div>

                        <div className="pointer-events-none absolute left-1/2 top-[0px] z-20 hidden -translate-x-1/2 group-hover:block">
                          <div className="relative w-[199px] rounded-[12px] border border-[#D4D8D5] dark:border-white/10 bg-white/80 dark:bg-[rgba(25,33,28,0.8)] px-3 py-2.5 text-[#19211C] dark:text-white shadow-[0px_8px_13.4px_-2px_rgba(0,0,0,0.25)] dark:shadow-[0px_8px_13.4px_-2px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
                            <div className="text-[14px] leading-[18px] font-normal mb-2">{item.month}</div>
                            <div className="border-b border-[#D4D8D5] dark:border-white/12 mb-2" />
                            <div className="space-y-2 text-[14px] leading-[18px] font-normal">
                              <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2"><span className="h-[10px] w-[10px] rounded-full bg-[#150089] dark:bg-[#EDFFF4]" />Student Program</span>
                                <span>{item.studentProgram}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2"><span className="h-[10px] w-[10px] rounded-full bg-[#1ED36A]" />Employee Program</span>
                                <span>{item.employeeProgram}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <span className="absolute left-0 right-0 top-[263px] text-center text-[16px] leading-[21px] font-light text-[#19211C]/80 dark:text-white/85">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-12 border-t border-gray-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row justify-between text-[13px] font-normal items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Privacy Policy</span>
          <span className="h-4 w-px bg-gray-300 dark:bg-white/20" />
          <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Terms & Conditions</span>
        </div>
        <div className="text-[#19211C] dark:text-white">
          (c) 2025 Origin BI, Made with care by <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
        </div>
      </div>

      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        currentBalance={creditsBalance}
        perCreditCost={perCreditCost}
        onBuy={(amount) => {
          setCreditsBalance((prev) => prev + amount);
          setIsBuyCreditsOpen(false);
        }}
      />
    </div>
  );
};

export default OriginCreditsDashboard;
