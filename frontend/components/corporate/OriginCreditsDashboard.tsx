"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
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
const GROUP_TOTAL_HEIGHT_PX = 284;
const BAR_MAX_HEIGHT_PX = 284;
const CHART_BASE_VISIBLE_GROUPS = 6;

const MONTH_FULL_LABELS: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

const USE_MOCK_USAGE_DATA = true;

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

function EyeIcon({ width = 31, height = 20 }: { width?: number; height?: number }) {
  return (
    <span className="inline-flex items-center justify-center">
      <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block group-hover/eye:hidden">
        <path d="M15.4697 20C9.67887 20 4.13428 15.7396 0.474369 11.3165C-0.158123 10.5521 -0.158123 9.44246 0.474369 8.67809C1.39456 7.566 3.32293 5.42048 5.89892 3.5454C12.3871 -1.17724 18.5398 -1.18635 25.0405 3.5454C28.0668 5.74819 30.4651 8.63677 30.4651 8.67809C31.0975 9.44246 31.0975 10.5521 30.4651 11.3165C26.8057 15.739 21.2619 20 15.4697 20ZM15.4697 1.89989C9.05465 1.89989 3.49375 8.01767 1.94226 9.8927C1.89213 9.95331 1.89213 10.0413 1.94226 10.1019C3.49381 11.9769 9.05465 18.0947 15.4697 18.0947C21.8848 18.0947 27.4457 11.9769 28.9972 10.1019C29.0876 9.99255 28.9912 9.8927 28.9972 9.8927C27.4456 8.01767 21.8848 1.89989 15.4697 1.89989Z" fill="#1ED36A"/>
        <path d="M15.4702 16.6658C11.7932 16.6658 8.80176 13.6743 8.80176 9.99732C8.80176 6.32032 11.7932 3.32886 15.4702 3.32886C19.1472 3.32886 22.1387 6.32032 22.1387 9.99732C22.1387 13.6743 19.1472 16.6658 15.4702 16.6658ZM15.4702 5.23413C12.8438 5.23413 10.707 7.3709 10.707 9.99732C10.707 12.6237 12.8438 14.7605 15.4702 14.7605C18.0966 14.7605 20.2334 12.6237 20.2334 9.99732C20.2334 7.3709 18.0966 5.23413 15.4702 5.23413Z" fill="#1ED36A"/>
      </svg>
      <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden group-hover/eye:block">
        <path d="M15.4692 14.7659C18.0999 14.7659 20.2324 12.6333 20.2324 10.0027C20.2324 7.37205 18.0999 5.2395 15.4692 5.2395C12.8386 5.2395 10.7061 7.37205 10.7061 10.0027C10.7061 12.6333 12.8386 14.7659 15.4692 14.7659Z" fill="#1ED36A"/>
        <path d="M30.4649 8.68329C26.8035 4.25888 21.2613 0 15.4698 0C9.67716 0 4.13358 4.26186 0.474681 8.68329C-0.158227 9.44778 -0.158227 10.5576 0.474681 11.3221C1.39457 12.4337 3.32307 14.5795 5.89876 16.4544C12.3856 21.1766 18.5397 21.1871 25.0408 16.4544C27.6165 14.5795 29.545 12.4337 30.4649 11.3221C31.096 10.5591 31.0992 9.45028 30.4649 8.68329ZM15.4698 3.33423C19.147 3.33423 22.1382 6.32551 22.1382 10.0027C22.1382 13.6799 19.147 16.6711 15.4698 16.6711C11.7926 16.6711 8.80132 13.6799 8.80132 10.0027C8.80132 6.32551 11.7926 3.33423 15.4698 3.33423Z" fill="#1ED36A"/>
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
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageEntriesMenuOpen, setUsageEntriesMenuOpen] = useState(false);
  const [usageStatusFilter, setUsageStatusFilter] = useState<"All" | UsageHistoryRow["examStatus"]>("All");
  const [showUsageFilterDropdown, setShowUsageFilterDropdown] = useState(false);
  const [showUsageDateModal, setShowUsageDateModal] = useState(false);
  const [usageDateModalAnchorStyle, setUsageDateModalAnchorStyle] = useState<{ top: number; left: number } | null>(null);
  const [usageDateFilter, setUsageDateFilter] = useState<string>("Applied Date");
  const [usageCalendarPreset, setUsageCalendarPreset] = useState<string>("Any Time");
  const [usageRangeStart, setUsageRangeStart] = useState<Date | null>(null);
  const [usageRangeEnd, setUsageRangeEnd] = useState<Date | null>(null);
  const [usageLeftCalendarMonth, setUsageLeftCalendarMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [isUsageExporting, setIsUsageExporting] = useState(false);
  const [usageSortColumn, setUsageSortColumn] = useState<UsageSortKey>("date");
  const [usageSortDirection, setUsageSortDirection] = useState<"asc" | "desc">("asc");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [transactionEntriesPerPage, setTransactionEntriesPerPage] = useState(10);
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionEntriesMenuOpen, setTransactionEntriesMenuOpen] = useState(false);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<"All" | TransactionHistoryRow["paymentStatus"]>("All");
  const [showTransactionFilterDropdown, setShowTransactionFilterDropdown] = useState(false);
  const [showTransactionDateModal, setShowTransactionDateModal] = useState(false);
  const [transactionDateModalAnchorStyle, setTransactionDateModalAnchorStyle] = useState<{ top: number; left: number } | null>(null);
  const [transactionDateFilter, setTransactionDateFilter] = useState<string>("Any Time");
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
  const [hoveredUsageBar, setHoveredUsageBar] = useState<{ index: number; series: "student" | "employee" } | null>(null);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [perCreditCost, setPerCreditCost] = useState<number | undefined>(undefined);
  const usageEntriesRef = useRef<HTMLDivElement | null>(null);
  const usageFilterRef = useRef<HTMLDivElement | null>(null);
  const usageDateFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const transactionEntriesRef = useRef<HTMLDivElement | null>(null);
  const transactionFilterRef = useRef<HTMLDivElement | null>(null);
  const transactionDateFilterButtonRef = useRef<HTMLButtonElement | null>(null);

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

        if (!USE_MOCK_USAGE_DATA) {
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

  const chartScaleFactor = useMemo(() => {
    const rawPeak = Math.max(
      0,
      ...visibleUsageData.map((item) =>
        Math.max(item.studentProgram, item.employeeProgram, item.otherProgram),
      ),
    );

    if (rawPeak <= 0 || rawPeak >= 120) return 1;
    return Math.min(20, 500 / rawPeak);
  }, [visibleUsageData]);

  const scaledUsageData = useMemo(
    () =>
      visibleUsageData.map((item) => ({
        ...item,
        chartStudentProgram: item.studentProgram * chartScaleFactor,
        chartEmployeeProgram: item.employeeProgram * chartScaleFactor,
        chartOtherProgram: item.otherProgram * chartScaleFactor,
      })),
    [visibleUsageData, chartScaleFactor],
  );

  const maxUsage = useMemo(() => {
    const peak = Math.max(
      0,
      ...scaledUsageData.map((item) =>
        Math.max(item.chartStudentProgram, item.chartEmployeeProgram, item.chartOtherProgram),
      ),
    );

    if (peak <= 0) return 500;
    return Math.max(500, Math.ceil(peak / 100) * 100);
  }, [scaledUsageData]);

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
    () => {
      const computedWidth =
        visibleUsageData.length * GROUP_WIDTH_PX +
        Math.max(0, visibleUsageData.length - 1) * GROUP_GAP_PX;

      const baselineWidth =
        CHART_BASE_VISIBLE_GROUPS * GROUP_WIDTH_PX +
        Math.max(0, CHART_BASE_VISIBLE_GROUPS - 1) * GROUP_GAP_PX;

      if (visibleUsageData.length >= 5) {
        return Math.max(computedWidth, baselineWidth);
      }

      return computedWidth;
    },
    [visibleUsageData],
  );

  const shouldStretchChartGroups = visibleUsageData.length >= 5;

  const toFullMonthLabel = (month: string) => {
    const key = month.slice(0, 3);
    return MONTH_FULL_LABELS[key] ?? month;
  };

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
  const isUsageDateFilterActive = Boolean(
    usageDateFilter
    && usageDateFilter !== "Applied Date"
    && usageDateFilter !== "Any Time",
  );

  const openUsageDateModal = () => {
    const presetByFilter: Record<string, string> = {
      "Applied Date": "Any Time",
      "Any Time": "Any Time",
      "Today": "Today",
      "Yesterday": "Yesterday",
      "Past Week": "Last 7 Days",
      "Past Month": "Last 30 Days",
      "This Month": "This Month",
      "Last Month": "Last Month",
    };

    const preset = presetByFilter[usageDateFilter ?? "Applied Date"] ?? "Custom Range";
    setUsageCalendarPreset(preset);

    const trigger = usageDateFilterButtonRef.current;
    if (trigger && typeof window !== "undefined") {
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = Math.min(900, viewportWidth - 24);
      const modalHeight = 446;
      const gap = 12;

      const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
      const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
      setUsageDateModalAnchorStyle({ top, left });
    }

    setShowUsageDateModal(true);
  };

  useEffect(() => {
    if (!showUsageDateModal) return;

    const updateAnchorPosition = () => {
      const trigger = usageDateFilterButtonRef.current;
      if (!trigger || typeof window === "undefined") return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = Math.min(900, viewportWidth - 24);
      const modalHeight = 446;
      const gap = 12;

      const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
      const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
      setUsageDateModalAnchorStyle({ top, left });
    };

    updateAnchorPosition();
    window.addEventListener("resize", updateAnchorPosition);
    window.addEventListener("scroll", updateAnchorPosition, true);
    return () => {
      window.removeEventListener("resize", updateAnchorPosition);
      window.removeEventListener("scroll", updateAnchorPosition, true);
    };
  }, [showUsageDateModal]);

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
      <div className="w-[344px] h-[300px] rounded-[12px] bg-[#F6F9F7] dark:bg-white/[0.08] border border-[#DDE6E1] dark:border-white/[0.12] px-4 py-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2.5 text-[#22302A] dark:text-white/90 pb-2.5 border-b border-[#DDE6E1] dark:border-white/[0.12]">
          <button
            type="button"
            onClick={() => setUsageLeftCalendarMonth((prev) => addUsageMonths(prev, -1))}
            className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="text-[14px] leading-[18px] font-normal text-[#22302A] dark:text-[#E7EFEB]">{title}</p>
          <button
            type="button"
            onClick={() => setUsageLeftCalendarMonth((prev) => addUsageMonths(prev, 1))}
            className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1.5">
          {USAGE_WEEK_DAYS.map((day) => (
            <span key={`${title}-${day}`} className="text-center text-[12px] leading-[16px] font-light text-[#63716B] dark:text-white/75">{day}</span>
          ))}
        </div>
        <div className="h-[202px] grid grid-cols-7 grid-rows-6 gap-y-[2px]">
          {cells.map((cell, index) => {
            const day = cell.date.getDate();
            const inRange = isUsageDateInRange(cell.date);
            const start = isUsageRangeStart(cell.date);
            const end = isUsageRangeEnd(cell.date);
            const isMuted = !cell.inCurrentMonth;
            const colIndex = index % 7;
            const prevCell = colIndex > 0 ? cells[index - 1] : null;
            const nextCell = colIndex < 6 ? cells[index + 1] : null;
            const prevInRange = Boolean(prevCell && isUsageDateInRange(prevCell.date));
            const nextInRange = Boolean(nextCell && isUsageDateInRange(nextCell.date));
            const isRangeSegmentStart = inRange && !prevInRange;
            const isRangeSegmentEnd = inRange && !nextInRange;
            const rangePillClass = inRange
              ? `${isRangeSegmentStart ? "rounded-l-[100px]" : ""} ${isRangeSegmentEnd ? "rounded-r-[100px]" : ""}`
              : "";

            return (
              <div key={`${title}-${cell.date.toISOString()}`} className="h-full relative flex items-center justify-center text-[12px] leading-[16px] isolate">
                {inRange && (
                  <div className={`absolute inset-y-[5px] z-0 bg-[#DDEFE5] dark:bg-[#204E35] ${rangePillClass}`} style={{
                    left: isRangeSegmentStart ? "4px" : "0px",
                    right: isRangeSegmentEnd ? "4px" : "0px",
                  }} />
                )}
                <button
                  type="button"
                  onClick={() => handleUsageDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                  className={`relative z-10 h-8 w-8 flex items-center justify-center text-[12px] leading-[16px] font-light text-[#22302A] dark:text-white ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_2px_10px_rgba(30,211,106,0.28)] dark:shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : "rounded-full"} ${!start && !end && inRange ? "text-[#1F6A45] dark:text-white" : ""} ${!inRange && !isMuted ? "text-[#22302A] dark:text-white" : ""} ${isMuted ? "text-[#A3B1AA] dark:text-white/40" : ""}`}
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

  const usageTotalEntries = sortedUsageHistoryRows.length;
  const usageSuggestedEntriesOptions = useMemo(() => {
    if (usageTotalEntries <= 0) {
      return [usageEntriesPerPage];
    }

    const baseOptions = [10, 25, 50].filter((size) => size < usageTotalEntries);
    return Array.from(new Set([...baseOptions, usageTotalEntries, usageEntriesPerPage])).sort((a, b) => a - b);
  }, [usageTotalEntries, usageEntriesPerPage]);
  const usageTotalPages = Math.max(1, Math.ceil(usageTotalEntries / usageEntriesPerPage));
  const safeUsageCurrentPage = Math.min(usageCurrentPage, usageTotalPages);

  useEffect(() => {
    if (usageCurrentPage > usageTotalPages) {
      setUsageCurrentPage(usageTotalPages);
    }
  }, [usageCurrentPage, usageTotalPages]);

  const visibleUsageHistoryRows = useMemo(
    () => {
      const startIndex = (safeUsageCurrentPage - 1) * usageEntriesPerPage;
      return sortedUsageHistoryRows.slice(startIndex, startIndex + usageEntriesPerPage);
    },
    [sortedUsageHistoryRows, safeUsageCurrentPage, usageEntriesPerPage],
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

  const transactionTotalEntries = sortedTransactionRows.length;
  const transactionSuggestedEntriesOptions = useMemo(() => {
    if (transactionTotalEntries <= 0) {
      return [transactionEntriesPerPage];
    }

    const baseOptions = [10, 25, 50].filter((size) => size < transactionTotalEntries);
    return Array.from(new Set([...baseOptions, transactionTotalEntries, transactionEntriesPerPage])).sort((a, b) => a - b);
  }, [transactionTotalEntries, transactionEntriesPerPage]);
  const transactionTotalPages = Math.max(1, Math.ceil(transactionTotalEntries / transactionEntriesPerPage));
  const safeTransactionCurrentPage = Math.min(transactionCurrentPage, transactionTotalPages);

  useEffect(() => {
    if (transactionCurrentPage > transactionTotalPages) {
      setTransactionCurrentPage(transactionTotalPages);
    }
  }, [transactionCurrentPage, transactionTotalPages]);

  const visibleTransactionRows = useMemo(
    () => {
      const startIndex = (safeTransactionCurrentPage - 1) * transactionEntriesPerPage;
      return sortedTransactionRows.slice(startIndex, startIndex + transactionEntriesPerPage);
    },
    [sortedTransactionRows, safeTransactionCurrentPage, transactionEntriesPerPage],
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
    : "Any Time";
  const isTransactionDateFilterActive = Boolean(
    transactionDateFilter
    && transactionDateFilter !== "Applied Date"
    && transactionDateFilter !== "Any Time",
  );

  const openTransactionDateModal = () => {
    const presetByFilter: Record<string, string> = {
      "Applied Date": "Any Time",
      "Any Time": "Any Time",
      "Today": "Today",
      "Today (48)": "Today",
      "Yesterday": "Yesterday",
      "Past Week": "Last 7 Days",
      "Past Month": "Last 30 Days",
      "This Month": "This Month",
      "Last Month": "Last Month",
    };

    const preset = presetByFilter[transactionDateFilter ?? "Any Time"] ?? "Custom Range";
    setTransactionCalendarPreset(preset);

    const trigger = transactionDateFilterButtonRef.current;
    if (trigger && typeof window !== "undefined") {
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = Math.min(900, viewportWidth - 24);
      const modalHeight = 446;
      const gap = 12;

      const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
      const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
      setTransactionDateModalAnchorStyle({ top, left });
    }

    setShowTransactionDateModal(true);
  };

  useEffect(() => {
    if (!showTransactionDateModal) return;

    const updateAnchorPosition = () => {
      const trigger = transactionDateFilterButtonRef.current;
      if (!trigger || typeof window === "undefined") return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = Math.min(900, viewportWidth - 24);
      const modalHeight = 446;
      const gap = 12;

      const left = Math.max(12, Math.min(rect.right - modalWidth, viewportWidth - modalWidth - 12));
      const top = Math.max(88, Math.min(rect.bottom + gap, viewportHeight - modalHeight - 12));
      setTransactionDateModalAnchorStyle({ top, left });
    };

    updateAnchorPosition();
    window.addEventListener("resize", updateAnchorPosition);
    window.addEventListener("scroll", updateAnchorPosition, true);
    return () => {
      window.removeEventListener("resize", updateAnchorPosition);
      window.removeEventListener("scroll", updateAnchorPosition, true);
    };
  }, [showTransactionDateModal]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!showUsageDateModal && !showTransactionDateModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showUsageDateModal, showTransactionDateModal]);

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
      <div className="w-[344px] h-[300px] rounded-[12px] bg-[#F6F9F7] dark:bg-white/[0.08] border border-[#DDE6E1] dark:border-white/[0.12] px-4 py-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2.5 text-[#22302A] dark:text-white/90 pb-2.5 border-b border-[#DDE6E1] dark:border-white/[0.12]">
          <button
            type="button"
            onClick={() => setTransactionLeftCalendarMonth((prev) => addUsageMonths(prev, -1))}
            className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="text-[14px] leading-[18px] font-normal text-[#22302A] dark:text-[#E7EFEB]">{title}</p>
          <button
            type="button"
            onClick={() => setTransactionLeftCalendarMonth((prev) => addUsageMonths(prev, 1))}
            className="p-1 text-[#63716B] hover:text-[#22302A] dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1.5">
          {USAGE_WEEK_DAYS.map((day) => (
            <span key={`${title}-${day}`} className="text-center text-[12px] leading-[16px] font-light text-[#63716B] dark:text-white/75">{day}</span>
          ))}
        </div>
        <div className="h-[202px] grid grid-cols-7 grid-rows-6 gap-y-[2px]">
          {cells.map((cell, index) => {
            const day = cell.date.getDate();
            const inRange = isTransactionDateInRange(cell.date);
            const start = isTransactionRangeStart(cell.date);
            const end = isTransactionRangeEnd(cell.date);
            const isMuted = !cell.inCurrentMonth;
            const colIndex = index % 7;
            const prevCell = colIndex > 0 ? cells[index - 1] : null;
            const nextCell = colIndex < 6 ? cells[index + 1] : null;
            const prevInRange = Boolean(prevCell && isTransactionDateInRange(prevCell.date));
            const nextInRange = Boolean(nextCell && isTransactionDateInRange(nextCell.date));
            const isRangeSegmentStart = inRange && !prevInRange;
            const isRangeSegmentEnd = inRange && !nextInRange;
            const rangePillClass = inRange
              ? `${isRangeSegmentStart ? "rounded-l-[100px]" : ""} ${isRangeSegmentEnd ? "rounded-r-[100px]" : ""}`
              : "";

            return (
              <div key={`${title}-${cell.date.toISOString()}`} className="h-full relative flex items-center justify-center text-[12px] leading-[16px] isolate">
                {inRange && (
                  <div className={`absolute inset-y-[5px] z-0 bg-[#DDEFE5] dark:bg-[#204E35] ${rangePillClass}`} style={{
                    left: isRangeSegmentStart ? "4px" : "0px",
                    right: isRangeSegmentEnd ? "4px" : "0px",
                  }} />
                )}
                <button
                  type="button"
                  onClick={() => handleTransactionDateCellClick(new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()))}
                  className={`relative z-10 h-8 w-8 flex items-center justify-center text-[12px] leading-[16px] font-light text-[#22302A] dark:text-white ${start || end ? "rounded-full bg-[#1ED36A] text-white shadow-[0px_2px_10px_rgba(30,211,106,0.28)] dark:shadow-[0px_4px_6.7px_rgba(0,0,0,0.4),0px_2px_17.9px_rgba(30,211,106,0.4)]" : "rounded-full"} ${!start && !end && inRange ? "text-[#1F6A45] dark:text-white" : ""} ${!inRange && !isMuted ? "text-[#22302A] dark:text-white" : ""} ${isMuted ? "text-[#A3B1AA] dark:text-white/40" : ""}`}
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
          className="h-[30px] w-[128px] rounded-[100px] border border-[#C9D7CF] bg-white px-3 text-left text-[14px] leading-[18px] font-medium text-[#19211C] dark:border-white/[0.12] dark:bg-white/[0.16] dark:text-white/[0.95] flex items-center justify-between transition-colors hover:bg-[#F3F7F5] dark:hover:bg-white/[0.22]"
        >
          <span className="truncate">{RANGE_LABELS[selectedRange]}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[#19211C]/80 dark:text-white/80 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-[148px] bg-white dark:bg-[#1B2621] border border-[#C9D7CF] dark:border-white/[0.3] rounded-[10px] shadow-[0_10px_24px_rgba(25,33,28,0.16)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden box-border">
            {(["3m", "6m", "12m"] as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedRange(key);
                  setOpenRangeDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-[14px] leading-[18px] transition-colors ${selectedRange === key
                    ? "bg-[#D9F1E4] dark:bg-[#2E9B62] text-[#173526] dark:text-white font-semibold"
                    : "text-[#1E2A24] dark:text-[#E8F4EE] font-medium hover:bg-[#EFF5F1] dark:hover:bg-[#24322C]"
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-3 text-[16px] whitespace-nowrap transition-colors ${
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

          {activeTab === "usage-history" && (
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 pb-2 text-[13px] text-[#19211C]/80 dark:text-white/60">
              <span className="font-light">Showing</span>
              <div className="relative" ref={usageEntriesRef}>
                <button
                  type="button"
                  onClick={() => setUsageEntriesMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 bg-white dark:bg-white/10 border border-[#C9D7CF] dark:border-white/15 px-2.5 py-1 rounded-[7px] text-[13px] text-[#1ED36A] font-medium min-w-[46px] justify-between transition-colors hover:bg-[#EEF5F1] dark:hover:bg-white/[0.16]"
                >
                  {usageEntriesPerPage}
                  <ChevronDown className={`w-3 h-3 text-[#19211C]/50 dark:text-white/50 transition-transform ${usageEntriesMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {usageEntriesMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white dark:bg-[#1F2823] border border-[#D4D8D5]/55 dark:border-white/15 rounded-lg shadow-lg z-50 py-1">
                    {usageSuggestedEntriesOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setUsageEntriesPerPage(size);
                          setUsageCurrentPage(1);
                          setUsageEntriesMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${usageEntriesPerPage === size
                            ? "text-[#1ED36A] font-semibold"
                            : "text-[#19211C]/70 dark:text-gray-300 hover:bg-[#EAF4EE] dark:hover:bg-[#2A3A33] dark:hover:text-white"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="whitespace-nowrap font-light">of {usageTotalEntries.toLocaleString()} entries</span>
              <div className="flex items-center gap-1.5 ml-0 sm:ml-1">
                <button
                  type="button"
                  onClick={() => setUsageCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeUsageCurrentPage === 1}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setUsageCurrentPage((prev) => Math.min(usageTotalPages, prev + 1))}
                  disabled={safeUsageCurrentPage === usageTotalPages}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === "transaction-history" && (
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 pb-2 text-[13px] text-[#19211C]/80 dark:text-white/60">
              <span className="font-light">Showing</span>
              <div className="relative" ref={transactionEntriesRef}>
                <button
                  type="button"
                  onClick={() => setTransactionEntriesMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 bg-white dark:bg-white/10 border border-[#C9D7CF] dark:border-white/15 px-2.5 py-1 rounded-[7px] text-[13px] text-[#1ED36A] font-medium min-w-[46px] justify-between transition-colors hover:bg-[#EEF5F1] dark:hover:bg-white/[0.16]"
                >
                  {transactionEntriesPerPage}
                  <ChevronDown className={`w-3 h-3 text-[#19211C]/50 dark:text-white/50 transition-transform ${transactionEntriesMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {transactionEntriesMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[72px] bg-white dark:bg-[#1F2823] border border-[#D4D8D5]/55 dark:border-white/15 rounded-lg shadow-lg z-50 py-1">
                    {transactionSuggestedEntriesOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setTransactionEntriesPerPage(size);
                          setTransactionCurrentPage(1);
                          setTransactionEntriesMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${transactionEntriesPerPage === size
                            ? "text-[#1ED36A] font-semibold"
                            : "text-[#19211C]/70 dark:text-gray-300 hover:bg-[#EAF4EE] dark:hover:bg-[#2A3A33] dark:hover:text-white"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="whitespace-nowrap font-light">of {transactionTotalEntries.toLocaleString()} entries</span>
              <div className="flex items-center gap-1.5 ml-0 sm:ml-1">
                <button
                  type="button"
                  onClick={() => setTransactionCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeTransactionCurrentPage === 1}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionCurrentPage((prev) => Math.min(transactionTotalPages, prev + 1))}
                  disabled={safeTransactionCurrentPage === transactionTotalPages}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-gray-600 dark:text-white/70 hover:bg-brand-green dark:hover:bg-brand-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "usage-history" ? (
        <div className="space-y-5">
          <div className="rounded-[16px] border border-transparent bg-white dark:bg-white/[0.08] overflow-hidden">
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

              <div className="flex w-full flex-wrap items-center justify-end gap-5 lg:gap-6 lg:w-auto">
                <div className="relative" ref={usageFilterRef}>
                  <button
                    type="button"
                    onClick={() => setShowUsageFilterDropdown((prev) => !prev)}
                    className="h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-colors whitespace-nowrap border border-[#D4D8D5]/35 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#33413B] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.2]"
                  >
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-[18px] shrink-0">
                      <path d="M17.0773 0H1.97844C1.59514 0.000301844 1.22016 0.111854 0.899022 0.321118C0.577883 0.530383 0.324388 0.828361 0.169304 1.17889C0.0142188 1.52942 -0.0357883 1.91743 0.0253517 2.29582C0.0864917 2.67422 0.25615 3.02673 0.513736 3.31059L7.05726 10.5071V17.2941C7.05732 17.4268 7.09476 17.5567 7.1653 17.6691C7.23584 17.7815 7.33662 17.8717 7.45608 17.9294C7.55156 17.9765 7.65669 18.0006 7.76314 18C7.92358 17.9999 8.07918 17.9451 8.20432 17.8447L9.52785 16.7859L11.7337 15.0212C11.8163 14.9551 11.8829 14.8713 11.9287 14.776C11.9745 14.6807 11.9984 14.5763 11.9984 14.4706V10.5071L18.542 3.31059C18.7995 3.02673 18.9692 2.67422 19.0303 2.29582C19.0915 1.91743 19.0415 1.52942 18.8864 1.17889C18.7313 0.828361 18.4778 0.530383 18.1567 0.321118C17.8355 0.111854 17.4606 0.000301844 17.0773 0Z" fill="#1ED36A"/>
                    </svg>
                    <span>{usageStatusFilter === "All" ? "Filter" : usageStatusFilter}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70 transition-transform ${showUsageFilterDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showUsageFilterDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#1F2823] border border-[#D4D8D5]/55 dark:border-white/15 rounded-xl shadow-[0_12px_28px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1">
                      {(["All", "Completed", "Partially Exp", "Expired"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setUsageStatusFilter(option);
                            setShowUsageFilterDropdown(false);
                          }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${usageStatusFilter === option
                              ? "text-[#1ED36A] bg-[#E7F8EE] dark:bg-[#1ED36A]/20"
                              : "text-[#33413B] dark:text-white/90 hover:bg-[#EAF4EE] hover:text-[#19211C] dark:hover:bg-white/[0.14] dark:hover:text-white"
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

                <div className={`relative ${showUsageDateModal ? "z-[90]" : ""}`}>
                  <button
                    type="button"
                    ref={usageDateFilterButtonRef}
                    onClick={openUsageDateModal}
                    className={`h-[44px] rounded-[8px] px-4 py-[9px] text-[14px] flex items-center gap-2 font-normal cursor-pointer transition-colors whitespace-nowrap border shadow-sm dark:shadow-none ${isUsageDateFilterActive
                      ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                      : "border-[#D4D8D5]/35 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#33413B] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.2]"
                      }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-[#1ED36A]">
                      <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor"/>
                      <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor"/>
                    </svg>
                    <span>{appliedDateLabel}</span>
                    <ChevronDown className={`w-2.5 h-2.5 ${isUsageDateFilterActive ? "text-[#1F3B2A]/70 dark:text-white/80" : "text-gray-500 dark:text-white/60"}`} />
                  </button>
                </div>

                <ExcelExportButton
                  onClick={handleUsageExport}
                  isLoading={isUsageExporting}
                  className="h-[44px]"
                />
              </div>
            </div>

            {showUsageDateModal && (
              <div
                className="fixed inset-0 z-[80] bg-[#FFFFFF99] dark:bg-[#19211CCC]"
                onClick={() => setShowUsageDateModal(false)}
              >
                <div
                  className="fixed"
                  style={{
                    top: `${usageDateModalAnchorStyle?.top ?? 188}px`,
                    left: `${usageDateModalAnchorStyle?.left ?? 12}px`,
                    width: "min(900px, calc(100vw - 24px))",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full h-[446px] rounded-[24px] border border-[#D7E3DD] dark:border-white/[0.18] bg-white/95 dark:bg-[#19211CCC] shadow-[0px_16px_40px_rgba(25,33,28,0.18)] dark:shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5">
                  <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-[#E1E9E4] dark:border-white/[0.12]">
                    <p className="text-[18px] leading-[23px] font-normal text-[#19211C] dark:text-white">Select Date Range</p>
                    <button
                      type="button"
                      onClick={() => setShowUsageDateModal(false)}
                      className="w-8 h-8 rounded-full bg-[#F2F6F4] dark:bg-[rgba(50,64,57,0.82)] border border-[#DDE6E1] dark:border-white/[0.08] text-[#1ED36A] hover:bg-[#E7F3ED] dark:hover:bg-[#1ED36A]/25 hover:text-[#139555] dark:hover:text-white transition-colors flex items-center justify-center"
                      aria-label="Close date range picker"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                    <div className="w-[126px] shrink-0 border-r border-[#E1E9E4] dark:border-white/[0.12] pr-2.5">
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
                            className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#E7F8EE] dark:bg-[#1ED36A] text-[#1F6A45] dark:text-white font-normal" : "text-[#5F6E67] dark:text-white/60 font-light hover:bg-[#F3F7F5] dark:hover:bg-white/[0.08] hover:text-[#19211C] dark:hover:text-white"}`}
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

                  <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-[#E1E9E4] dark:border-white/[0.12] flex items-center justify-between gap-3">
                    <p className="text-[12px] leading-[16px] font-light text-[#4A5B53] dark:text-white">Selected Range : {usageSelectedRangeText}</p>
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
                        className="h-7 px-4 rounded-full border border-[#CAD8D0] dark:border-white text-[#19211C] dark:text-white text-[12px] leading-[16px] font-normal hover:bg-[#EEF5F1] dark:hover:bg-white/10 transition-colors"
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
                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-normal hover:bg-[#16BD5C] transition-colors"
                      >
                        Apply changes
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1180px] text-[14px]">
                <thead>
                  <tr className="border-b-0 bg-[#F2F5F3] dark:bg-[#FFFFFF1F]">
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
                        className={`${header === "Action" ? "text-center" : "text-left"} px-5 py-3.5 whitespace-nowrap text-[12px] font-semibold text-[#3A4741] dark:text-white`}
                      >
                        {header === "Action" ? (
                          <span className="text-[#3A4741] dark:text-white">{header}</span>
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
                      className="border-b border-[#E3ECE6] dark:border-[#FFFFFF26] transition-colors last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
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
                            ? "border-[#1ED36A] bg-[rgba(30,211,106,0.24)]"
                            : tone === "yellow"
                              ? "border-[#FFB703] bg-[rgba(255,183,3,0.24)]"
                              : "border-[#ED2F34] bg-[rgba(237,47,52,0.24)]";

                          return (
                        <span
                          className={`inline-flex w-[114px] h-[34px] items-center justify-center rounded-[4px] border px-3 py-2 text-[13px] font-light text-black dark:text-white ${toneClass}`}
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
                          <EyeIcon width={31} height={20} />
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
          <div className="rounded-[16px] border border-transparent bg-white dark:bg-white/[0.08] overflow-hidden">
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

              <div className="flex w-full flex-wrap items-center justify-end gap-5 lg:gap-6 lg:w-auto">
                <div className="relative" ref={transactionFilterRef}>
                  <button
                    type="button"
                    onClick={() => setShowTransactionFilterDropdown((prev) => !prev)}
                    className="h-[44px] rounded-xl px-4 text-[13px] flex items-center gap-2 font-medium cursor-pointer transition-colors whitespace-nowrap border border-[#D4D8D5]/35 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#33413B] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.2]"
                  >
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-[18px] shrink-0">
                      <path d="M17.0773 0H1.97844C1.59514 0.000301844 1.22016 0.111854 0.899022 0.321118C0.577883 0.530383 0.324388 0.828361 0.169304 1.17889C0.0142188 1.52942 -0.0357883 1.91743 0.0253517 2.29582C0.0864917 2.67422 0.25615 3.02673 0.513736 3.31059L7.05726 10.5071V17.2941C7.05732 17.4268 7.09476 17.5567 7.1653 17.6691C7.23584 17.7815 7.33662 17.8717 7.45608 17.9294C7.55156 17.9765 7.65669 18.0006 7.76314 18C7.92358 17.9999 8.07918 17.9451 8.20432 17.8447L9.52785 16.7859L11.7337 15.0212C11.8163 14.9551 11.8829 14.8713 11.9287 14.776C11.9745 14.6807 11.9984 14.5763 11.9984 14.4706V10.5071L18.542 3.31059C18.7995 3.02673 18.9692 2.67422 19.0303 2.29582C19.0915 1.91743 19.0415 1.52942 18.8864 1.17889C18.7313 0.828361 18.4778 0.530383 18.1567 0.321118C17.8355 0.111854 17.4606 0.000301844 17.0773 0Z" fill="#1ED36A"/>
                    </svg>
                    <span>{transactionStatusFilter === "All" ? "Filter" : transactionStatusFilter}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#19211C]/70 dark:text-white/70 transition-transform ${showTransactionFilterDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showTransactionFilterDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#1F2823] border border-[#D4D8D5]/55 dark:border-white/15 rounded-xl shadow-[0_12px_28px_rgba(25,33,28,0.12)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] z-50 overflow-hidden py-1">
                      {(["All", "Completed", "Pending", "Failed", "Refunded"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTransactionStatusFilter(option);
                            setShowTransactionFilterDropdown(false);
                          }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${transactionStatusFilter === option
                              ? "text-[#1ED36A] bg-[#E7F8EE] dark:bg-[#1ED36A]/20"
                              : "text-[#33413B] dark:text-white/90 hover:bg-[#EAF4EE] hover:text-[#19211C] dark:hover:bg-white/[0.14] dark:hover:text-white"
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

                <div className={`relative ${showTransactionDateModal ? "z-[90]" : ""}`}>
                  <button
                    type="button"
                    ref={transactionDateFilterButtonRef}
                    onClick={openTransactionDateModal}
                    className={`h-[44px] rounded-[8px] px-4 py-[9px] text-[14px] flex items-center gap-2 font-normal cursor-pointer transition-colors whitespace-nowrap border shadow-sm dark:shadow-none ${isTransactionDateFilterActive
                      ? "border-[#1ED36A]/50 bg-[#E7F8EE]/60 text-[#1F3B2A] hover:bg-[#DDF4E7]/80 dark:border-transparent dark:bg-[#1ED36A33] dark:text-white dark:hover:bg-[#1ED36A45]"
                      : "border-[#D4D8D5]/35 dark:border-white/10 bg-white dark:bg-white/[0.12] text-[#33413B] dark:text-white/90 hover:bg-[#EEF5F1] dark:hover:bg-white/[0.2]"
                      }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-[#1ED36A]">
                      <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="currentColor"/>
                      <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="currentColor"/>
                    </svg>
                    <span>{transactionAppliedDateLabel}</span>
                    <ChevronDown className={`w-2.5 h-2.5 ${isTransactionDateFilterActive ? "text-[#1F3B2A]/70 dark:text-white/80" : "text-gray-500 dark:text-white/60"}`} />
                  </button>
                </div>

                <ExcelExportButton
                  onClick={handleTransactionExport}
                  isLoading={isTransactionExporting}
                  className="h-[44px]"
                />
              </div>
            </div>

            {showTransactionDateModal && (
              <div
                className="fixed inset-0 z-[80] bg-[#FFFFFF99] dark:bg-[#19211CCC]"
                onClick={() => setShowTransactionDateModal(false)}
              >
                <div
                  className="fixed"
                  style={{
                    top: `${transactionDateModalAnchorStyle?.top ?? 188}px`,
                    left: `${transactionDateModalAnchorStyle?.left ?? 12}px`,
                    width: "min(900px, calc(100vw - 24px))",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full h-[446px] rounded-[24px] border border-[#D7E3DD] dark:border-white/[0.18] bg-white/95 dark:bg-[#19211CCC] shadow-[0px_16px_40px_rgba(25,33,28,0.18)] dark:shadow-[0px_16px_40px_#19211C] backdrop-blur-[50px] p-5">
                  <div className="w-[860px] max-w-full mx-auto flex items-center justify-between pb-3.5 border-b border-[#E1E9E4] dark:border-white/[0.12]">
                    <p className="text-[18px] leading-[23px] font-normal text-[#19211C] dark:text-white">Select Date Range</p>
                    <button
                      type="button"
                      onClick={() => setShowTransactionDateModal(false)}
                      className="w-8 h-8 rounded-full bg-[#F2F6F4] dark:bg-[rgba(50,64,57,0.82)] border border-[#DDE6E1] dark:border-white/[0.08] text-[#1ED36A] hover:bg-[#E7F3ED] dark:hover:bg-[#1ED36A]/25 hover:text-[#139555] dark:hover:text-white transition-colors flex items-center justify-center"
                      aria-label="Close date range picker"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="w-[860px] max-w-full mx-auto pt-3.5 flex gap-4 h-[318px]">
                    <div className="w-[126px] shrink-0 border-r border-[#E1E9E4] dark:border-white/[0.12] pr-2.5">
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
                            className={`w-full text-left px-3 py-1.5 rounded-r-[4px] text-[13px] leading-[17px] transition-colors mb-[2px] ${isActivePreset ? "bg-[#E7F8EE] dark:bg-[#1ED36A] text-[#1F6A45] dark:text-white font-normal" : "text-[#5F6E67] dark:text-white/60 font-light hover:bg-[#F3F7F5] dark:hover:bg-white/[0.08] hover:text-[#19211C] dark:hover:text-white"}`}
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

                  <div className="w-[860px] max-w-full mx-auto pt-3 mt-3 border-t border-[#E1E9E4] dark:border-white/[0.12] flex items-center justify-between gap-3">
                    <p className="text-[12px] leading-[16px] font-light text-[#4A5B53] dark:text-white">Selected Range : {transactionSelectedRangeText}</p>
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
                        className="h-7 px-4 rounded-full border border-[#CAD8D0] dark:border-white text-[#19211C] dark:text-white text-[12px] leading-[16px] font-normal hover:bg-[#EEF5F1] dark:hover:bg-white/10 transition-colors"
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
                        className="h-7 px-4 rounded-full bg-[#1ED36A] text-white text-[12px] leading-[16px] font-normal hover:bg-[#16BD5C] transition-colors"
                      >
                        Apply changes
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1180px] text-[14px]">
                <thead>
                  <tr className="border-b-0 bg-[#F2F5F3] dark:bg-[#FFFFFF1F]">
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
                        className={`text-left px-5 py-3.5 whitespace-nowrap text-[12px] font-semibold text-[#3A4741] dark:text-white`}
                      >
                        {header === "Invoice" ? (
                          <span className="inline-block pl-1 text-[#3A4741] dark:text-white">{header}</span>
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
                      className="border-b border-[#E3ECE6] dark:border-[#FFFFFF26] transition-colors last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.date}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.transactionId}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.credits}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">₹{row.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-5 whitespace-nowrap text-[#19211C] dark:text-white text-[16px] leading-[21px] font-light">{row.method}</td>
                      <td className="px-5 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex w-[114px] h-[34px] items-center justify-center rounded-[4px] border px-3 py-2 text-[13px] font-light text-black dark:text-white ${row.paymentStatus === "Completed"
                              ? "border-[#1ED36A] bg-[rgba(30,211,106,0.24)]"
                              : row.paymentStatus === "Pending"
                                ? "border-[#FFB703] bg-[rgba(255,183,3,0.24)]"
                                : row.paymentStatus === "Failed"
                                  ? "border-[#ED2F34] bg-[rgba(237,47,52,0.24)]"
                                  : "border-[#00ACEE] bg-[rgba(0,172,238,0.24)]"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full max-w-[1260px]">
            <div className="glass-card dashboard-glass-card rounded-[34px] p-8 sm:p-9 h-[332px] relative overflow-hidden border border-[#D7E3DD] dark:border-white/[0.1]">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute -top-[72px] right-[-170px] font-['Haskoy'] text-[clamp(312px,21.5vw,452px)] font-extrabold text-[rgba(216,210,230,0.36)] dark:text-white/[0.04] leading-none tracking-[-0.02em] select-none whitespace-nowrap">
                  {creditsBalance}
                </span>
              </div>

              <div
                className="absolute z-[2] opacity-95 hidden sm:block"
                style={{
                  width: "170px",
                  height: "172px",
                  right: "164px",
                  top: "20px",
                }}
              >
                <img
                  src="/assets/coins/coin-top.png"
                  alt=""
                  aria-hidden
                  className="pointer-events-none select-none object-contain w-full h-full"
                />
              </div>
              <div className="absolute -right-[10px] -bottom-[18px] z-[2] opacity-95 w-[236px] h-[236px] sm:w-[256px] sm:h-[256px]">
                <img
                  src="/assets/coins/coin-bottom.png"
                  alt=""
                  aria-hidden
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>

              <div
                className="absolute z-[1] -bottom-[36%] -left-[10%] -right-[10%] h-[188px] blur-[50px] pointer-events-none opacity-100"
                style={{
                  background: "linear-gradient(90deg, #ED2F34 0%, #EF5921 33%, #FDC00C 66%, #1ED36A 100%)",
                }}
              />

              <div className="relative z-10 h-full flex flex-col">
                <h2 className="font-['Haskoy'] text-[20px] font-medium text-[#19211C] dark:text-white leading-none">Credits Balance</h2>
                <div className="mt-10 font-['Haskoy'] font-medium text-[clamp(72px,5vw,98px)] text-[#150089] dark:text-white leading-[0.9] tracking-[0.01em]">
                  {creditsBalance}
                </div>
                <p className="font-['Haskoy'] font-light text-[14px] text-[#19211C]/88 dark:text-white/88 mt-3">
                  Assesment Left {assessmentsLeft}
                </p>

                <div className="mt-auto pt-3">
                  <button
                    onClick={() => setIsBuyCreditsOpen(true)}
                    className="font-['Haskoy'] inline-flex items-center rounded-full bg-[#1ED36A] hover:bg-[#16b058] px-5 py-2 text-[14px] leading-[18px] font-normal text-white shadow-md shadow-[#1ED36A]/20 transition-all"
                  >
                    Buy Credits
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card dashboard-glass-card rounded-[34px] p-8 sm:p-9 h-[332px] relative overflow-hidden border border-[#D7E3DD] dark:border-white/[0.1]">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute -top-[72px] right-[10px] font-['Haskoy'] text-[clamp(312px,21.5vw,452px)] font-extrabold text-[rgba(216,210,230,0.36)] dark:text-white/[0.04] leading-none tracking-[-0.02em] select-none whitespace-nowrap">
                  {assessmentsConducted}
                </span>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-['Haskoy'] text-[20px] font-medium text-[#19211C] dark:text-white leading-none">Assessments Conducted</h2>
                  {renderTimeRangeSelect()}
                </div>

                <div className="mt-10 font-['Haskoy'] font-medium text-[clamp(72px,5vw,98px)] text-[#150089] dark:text-white leading-[0.9] tracking-[0.01em]">
                  {assessmentsConducted}
                </div>

                <div className="mt-auto pt-3 flex items-end justify-between gap-4">
                  <p className="font-['Haskoy'] font-regular text-[20px] text-[#19211C]/88 dark:text-white/88">
                    Total credits used: {totalCreditsUsed}
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

          <div className="glass-card dashboard-glass-card rounded-[24px] px-6 sm:px-7 pt-6 sm:pt-7 pb-6 sm:pb-7 min-h-[420px] overflow-visible bg-white/[0.08] border-0">
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
              <div className="hidden lg:flex min-w-[34px] flex-col justify-between h-[284px] mt-[20px] text-[16px] leading-[21px] font-light text-[#19211C]/65 dark:text-white/80">
                {yAxisTicks.map((tick, index) => (
                  <span key={`${tick}-${index}`}>{Math.round(tick)}</span>
                ))}
              </div>

              <div className="relative flex-1 overflow-x-auto overflow-y-visible scrollbar-hide">
                <div
                  className="relative h-[360px]"
                  style={{ width: shouldStretchChartGroups ? "100%" : `${Math.max(860, chartTrackWidth)}px` }}
                >
                  <div className="absolute left-0 right-0 top-[20px] h-[284px] pointer-events-none">
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

                  <div className={`absolute left-0 right-0 top-[20px] h-[284px] flex items-start ${shouldStretchChartGroups ? "justify-between" : "gap-[131px]"}`}>
                    {scaledUsageData.map((item, index) => {
                      const studentBarLeftPx = 0;
                      const studentHeightPx = Math.max(
                        0,
                        Math.round((item.chartStudentProgram / maxUsage) * GROUP_TOTAL_HEIGHT_PX),
                      );
                      const employeeHeightPx = Math.max(
                        0,
                        Math.round((item.chartEmployeeProgram / maxUsage) * GROUP_TOTAL_HEIGHT_PX),
                      );
                      const studentBarTopPx = GROUP_TOTAL_HEIGHT_PX - studentHeightPx;
                      const employeeBarTopPx = GROUP_TOTAL_HEIGHT_PX - employeeHeightPx;
                      const tooltipWidthPx = 204;
                      const tooltipTopPx = -12;
                      const tooltipPointerWidthPx = 16;
                      const tooltipPointerHeightPx = 14;
                      const tooltipPointerTopPx = 40;
                      const tooltipPointerTipOffsetPx = tooltipPointerWidthPx / 2;
                      const tooltipPointerCenterY = tooltipPointerTopPx + tooltipPointerHeightPx / 2;
                      const isGroupActive = hoveredUsageBar?.index === index;
                      const activeBarTopPx = studentBarTopPx;
                      const activeBarCenterX = studentBarLeftPx + BAR_WIDTH_PX / 2;
                      const markerCenterY = Math.max(8, activeBarTopPx);
                      const studentBarHeight = item.chartStudentProgram > 0 ? getBarHeight(item.chartStudentProgram, 4) : "0px";
                      const employeeBarHeight = item.chartEmployeeProgram > 0 ? getBarHeight(item.chartEmployeeProgram, 4) : "0px";
                      const isNearRightEdge = index >= scaledUsageData.length - 1;
                      const tooltipOffsetPx = 58;
                      const tooltipLeftPx = isNearRightEdge ? -(tooltipWidthPx + 14) : tooltipOffsetPx;
                      const tooltipEdgeX = isNearRightEdge
                        ? tooltipLeftPx + tooltipWidthPx + tooltipPointerTipOffsetPx
                        : tooltipLeftPx - tooltipPointerTipOffsetPx;
                      const tooltipEdgeY = tooltipTopPx + tooltipPointerCenterY;
                      const connectorDx = tooltipEdgeX - activeBarCenterX;
                      const connectorDy = tooltipEdgeY - markerCenterY;
                      const connectorLength = Math.max(8, Math.hypot(connectorDx, connectorDy));
                      const connectorAngle = (Math.atan2(connectorDy, connectorDx) * 180) / Math.PI;
                      const markerClass = "bg-[#150089] dark:bg-[#0F1713] border-white dark:border-[#DCE9E2]";
                      const tooltipPointerClass = "absolute bg-[#FFFFFFEF] dark:bg-[rgba(22,33,28,0.88)]";
                      const tooltipPointerStyle: React.CSSProperties = isNearRightEdge
                        ? {
                          right: -tooltipPointerTipOffsetPx,
                          top: tooltipPointerTopPx,
                          width: tooltipPointerWidthPx,
                          height: tooltipPointerHeightPx,
                          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                        }
                        : {
                          left: -tooltipPointerTipOffsetPx,
                          top: tooltipPointerTopPx,
                          width: tooltipPointerWidthPx,
                          height: tooltipPointerHeightPx,
                          clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
                        };

                      const setHoveredStudentBar = () => {
                        setHoveredUsageBar((current) => (
                          current?.index === index && current.series === "student"
                            ? current
                            : { index, series: "student" }
                        ));
                      };

                      return (
                      <div
                        key={item.month}
                        className="group relative h-[284px] w-[172px] shrink-0"
                        onMouseLeave={() => setHoveredUsageBar(null)}
                      >
                        <div className="absolute left-0 top-0 h-[284px] w-[172px]">
                          <div
                            className="absolute left-0 bottom-0 w-[80px] rounded-[100px] bg-[#150089] dark:bg-[#EDFFF4]"
                            style={{ height: studentBarHeight }}
                            onMouseEnter={setHoveredStudentBar}
                            onMouseMove={setHoveredStudentBar}
                          />
                          <div
                            className="absolute left-[92px] bottom-0 w-[80px] rounded-[100px] bg-[#1ED36A]"
                            style={{ height: employeeBarHeight }}
                            onMouseEnter={setHoveredStudentBar}
                            onMouseMove={setHoveredStudentBar}
                          />
                        </div>

                        <div
                          className={`pointer-events-none absolute z-10 ${isGroupActive ? "block" : "hidden"}`}
                          style={{
                            left: `${activeBarCenterX - 6}px`,
                            top: `${Math.max(0, markerCenterY - 6)}px`,
                          }}
                        >
                          <span className={`block h-3 w-3 rounded-full border ${markerClass} shadow-[0px_1px_6px_rgba(30,211,106,0.35)]`} />
                        </div>

                        <div
                          className={`pointer-events-none absolute z-10 ${isGroupActive ? "block" : "hidden"}`}
                          style={{
                            left: `${activeBarCenterX}px`,
                            top: `${markerCenterY}px`,
                            width: `${connectorLength}px`,
                            transform: `rotate(${connectorAngle}deg)`,
                            transformOrigin: "0 0",
                          }}
                        >
                          <span className="block h-px w-full bg-[#AABCB3]/85 dark:bg-white/18" />
                        </div>

                        <div
                          className={`pointer-events-none absolute z-20 ${isGroupActive ? "block" : "hidden"}`}
                          style={{
                            left: `${tooltipLeftPx}px`,
                            top: `${tooltipTopPx}px`,
                          }}
                        >
                          <div className="relative w-[204px] rounded-[11px] border border-[#C9D6CF] dark:border-white/[0.12] bg-[#FFFFFFEF] dark:bg-[rgba(22,33,28,0.88)] backdrop-blur-[2px] px-3.5 py-3 text-[#19211C] dark:text-white shadow-[0px_10px_24px_rgba(15,23,18,0.22)] dark:shadow-[0px_12px_24px_rgba(0,0,0,0.42)]">
                            <span className={tooltipPointerClass} style={tooltipPointerStyle} />
                            <div className="text-[13px] leading-[17px] font-medium mb-2.5">{toFullMonthLabel(item.month)}</div>
                            <div className="h-px bg-[#B8C9C0] dark:bg-white/10 mb-2.5" />
                            <div className="space-y-2 text-[12px] leading-[16px] font-normal">
                              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                <span className="inline-flex items-center gap-2 whitespace-nowrap"><span className="h-[10px] w-[10px] rounded-full bg-[#150089] dark:bg-[#EDFFF4]" />Student Program</span>
                                <span className="font-medium tabular-nums text-right">{item.studentProgram}</span>
                              </div>
                              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                <span className="inline-flex items-center gap-2 whitespace-nowrap"><span className="h-[10px] w-[10px] rounded-full bg-[#1ED36A]" />Employee Program</span>
                                <span className="font-medium tabular-nums text-right">{item.employeeProgram}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <span className="absolute left-0 right-0 top-[320px] text-center text-[16px] leading-[21px] font-light text-[#19211C]/80 dark:text-white/85">
                          {item.month}
                        </span>
                      </div>
                      );
                    })}
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
