import React from "react";
import { formatDistanceToNow } from "date-fns";
import { AssessmentSession } from "../../lib/services/assessment.service";
import { SortIcon } from "../icons";
import ReactCountryFlag from "react-country-flag";
import { COUNTRY_CODES } from "../../lib/countryCodes";
import { capitalizeWords } from "../../lib/utils";
import ExtendControl from "./ExtendControl";

interface ExtendAssessmentsTableProps {
  sessions: AssessmentSession[];
  loading: boolean;
  error: string | null;
  isGroupView?: boolean;
  sortColumn?: string;
  sortOrder?: "ASC" | "DESC";
  onSort?: (column: string) => void;
  onView?: (id: string) => void;
  /** Extend a row to a new ISO expiry. Should throw on failure. */
  onExtend: (session: AssessmentSession, newDateISO: string) => Promise<void>;
  /** Fired after the success tick — parent removes the row. */
  onExtended?: (session: AssessmentSession) => void;
  /** Ids currently animating out (swipe-up). */
  removingIds?: Set<string>;
}

function EyeActionIcon({ width = 26, height = 17 }: { width?: number; height?: number }) {
  return (
    <span className="inline-flex items-center justify-center">
      <svg width={width} height={height} viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.4697 20C9.67887 20 4.13428 15.7396 0.474369 11.3165C-0.158123 10.5521 -0.158123 9.44246 0.474369 8.67809C1.39456 7.566 3.32293 5.42048 5.89892 3.5454C12.3871 -1.17724 18.5398 -1.18635 25.0405 3.5454C28.0668 5.74819 30.4651 8.63677 30.4651 8.67809C31.0975 9.44246 31.0975 10.5521 30.4651 11.3165C26.8057 15.739 21.2619 20 15.4697 20ZM15.4697 1.89989C9.05465 1.89989 3.49375 8.01767 1.94226 9.8927C1.89213 9.95331 1.89213 10.0413 1.94226 10.1019C3.49381 11.9769 9.05465 18.0947 15.4697 18.0947C21.8848 18.0947 27.4457 11.9769 28.9972 10.1019C29.0876 9.99255 28.9912 9.8927 28.9972 9.8927C27.4456 8.01767 21.8848 1.89989 15.4697 1.89989Z" fill="#1ED36A" />
        <path d="M15.4702 16.6658C11.7932 16.6658 8.80176 13.6743 8.80176 9.99732C8.80176 6.32032 11.7932 3.32886 15.4702 3.32886C19.1472 3.32886 22.1387 6.32032 22.1387 9.99732C22.1387 13.6743 19.1472 16.6658 15.4702 16.6658ZM15.4702 5.23413C12.8438 5.23413 10.707 7.3709 10.707 9.99732C10.707 12.6237 12.8438 14.7605 15.4702 14.7605C18.0966 14.7605 20.2334 12.6237 20.2334 9.99732C20.2334 7.3709 18.0966 5.23413 15.4702 5.23413Z" fill="#1ED36A" />
      </svg>
    </span>
  );
}

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 55 + (Math.abs(hash) % 20);
  const l = 45 + (Math.abs(hash) % 10);
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `${f(0)}${f(8)}${f(4)}`;
  };
  return hslToHex(h, s, l);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const getStatusParams = (status: string) => {
  switch (status) {
    case "EXPIRED":
      return { label: "Expired", color: "bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]" };
    case "PARTIALLY_EXPIRED":
    case "PARTIALLY_EXP":
      return { label: "Partially Expired", color: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]" };
    case "NOT_STARTED":
      return { label: "Not Started", color: "bg-gray-100 text-gray-600 border-gray-200" };
    case "IN_PROGRESS":
    case "ON_GOING":
      return { label: "In Progress", color: "bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]" };
    case "COMPLETED":
      return { label: "Completed", color: "bg-[#00B69B] text-white border-[#00B69B]" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  }
};

const Th: React.FC<{
  label: string;
  col?: string;
  sortColumn?: string;
  sortOrder?: "ASC" | "DESC";
  onSort?: (c: string) => void;
  center?: boolean;
  className?: string;
}> = ({ label, col, sortColumn, sortOrder, onSort, center, className }) => (
  <th
    onClick={() => col && onSort?.(col)}
    className={`p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider ${
      col ? "cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5" : ""
    } transition-colors ${className || ""}`}
  >
    <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
      {label}
      {col && (
        <SortIcon sort={sortColumn === col ? (sortOrder === "ASC" ? "asc" : "desc") : null} />
      )}
    </div>
  </th>
);

const ExtendAssessmentsTable: React.FC<ExtendAssessmentsTableProps> = ({
  sessions,
  loading,
  error,
  isGroupView,
  sortColumn,
  sortOrder,
  onSort,
  onView,
  onExtend,
  onExtended,
  removingIds,
}) => {
  const colSpan = isGroupView ? 7 : 8;

  return (
    <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
      {loading && sessions.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-30 flex items-center justify-center backdrop-blur-sm rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
      )}

      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <table className="w-full border-collapse relative min-w-[1200px]">
          <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
            <tr className="text-left">
              {!isGroupView ? (
                <>
                  <Th label="Candidate Name" col="candidate_name" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="w-[15%] min-w-[150px]" />
                  <Th label="Email" col="email" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="w-[18%] min-w-[200px]" />
                  <Th label="Exam Status" col="exam_status" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} center className="w-[10%] min-w-[140px]" />
                  <Th label="Mobile Number" col="mobile_number" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="w-[12%] min-w-[160px]" />
                  <Th label="Program Name" col="program_name" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="w-[12%] min-w-[140px]" />
                </>
              ) : (
                <>
                  <Th label="Group Name" col="group_name" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="min-w-[160px]" />
                  <Th label="Exam Status" col="exam_status" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} center className="w-[10%] min-w-[140px]" />
                  <Th label="Program Name" col="program_name" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
                  <Th label="No. of Candidates" center className="min-w-[120px]" />
                </>
              )}
              <Th label="Exam Expired On" col="exam_ends_on" sortColumn={sortColumn} sortOrder={sortOrder} onSort={onSort} className="w-[12%] min-w-[150px]" />
              <Th label="Extend" center className="w-[14%] min-w-[170px]" />
              <Th label="Action" center className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
            {loading && sessions.length === 0 ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(colSpan)].map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={colSpan} className="p-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No expired assessments found.
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const status = getStatusParams(session.status);
                const removing = removingIds?.has(session.id);
                return (
                  <tr
                    key={session.id}
                    className={`hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] group transition-all duration-500 ease-in ${
                      removing ? "-translate-y-4 opacity-0" : "opacity-100"
                    }`}
                  >
                    {!isGroupView ? (
                      <>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                capitalizeWords(session.registration?.fullName || session.user?.email || "User"),
                              )}&background=${getAvatarColor(session.registration?.fullName || session.user?.email || "User")}&color=fff&font-size=0.4`}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                            />
                            <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                              {capitalizeWords(session.registration?.fullName || session.user?.email || "-")}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">
                          {session.registration?.email || session.user?.email || "-"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded text-[10px] font-semibold border inline-block min-w-[130px] text-center ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                          <div className="flex items-center gap-2">
                            <ReactCountryFlag
                              countryCode={COUNTRY_CODES.find((c) => c.dial_code === session.registration?.countryCode)?.code || "IN"}
                              svg
                              style={{ width: "1.4em", height: "1.4em", borderRadius: "2px" }}
                            />
                            <span className="text-brand-text-light-secondary dark:text-gray-500 font-medium">
                              {session.registration?.countryCode || "+91"}
                            </span>
                            <span>{session.registration?.mobileNumber || "-"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                          {session.program?.name || "-"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                          {session.groupName || "-"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded text-[10px] font-semibold border inline-block min-w-[130px] text-center ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary">
                          {session.program?.name || "-"}
                        </td>
                        <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary text-center">
                          {session.totalCandidates || 0}
                        </td>
                      </>
                    )}
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#19211C] dark:text-white">
                        {session.validTo
                          ? formatDistanceToNow(new Date(session.validTo), { addSuffix: true })
                          : "-"}
                      </div>
                      <div className="text-xs text-[#EF3826] font-medium">
                        {formatDate(session.validTo)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <ExtendControl
                        onExtend={(iso) => onExtend(session, iso)}
                        onExtended={() => onExtended?.(session)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onView?.(session.id)}
                        className="inline-flex items-center justify-center w-[34px] h-[24px] rounded-[4px] bg-transparent transition-all duration-150 cursor-pointer"
                        title="View details"
                      >
                        <EyeActionIcon />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExtendAssessmentsTable;
