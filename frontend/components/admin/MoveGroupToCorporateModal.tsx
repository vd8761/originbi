"use client";

import React, { useEffect, useState, useCallback } from "react";
import { assessmentService } from "../../lib/services/assessment.service";
import { corporateRegistrationService } from "../../lib/services/corporateRegistration.service";
import { CorporateAccount } from "../../lib/types";

interface MoveGroupToCorporateModalProps {
  isOpen: boolean;
  /** The group_assessments.id to move */
  groupAssessmentId: number | string;
  /** Human-readable label shown in the title (e.g. "CMS-NAMAKKAL-2026") */
  groupName?: string;
  /** Current corporate account if already assigned */
  currentCorporateAccount?: { id: number; company_name: string } | null;
  onClose: () => void;
  onSuccess: (info?: { companyName: string; count: number }) => void;
}

const MoveGroupToCorporateModal: React.FC<MoveGroupToCorporateModalProps> = ({
  isOpen,
  groupAssessmentId,
  groupName,
  currentCorporateAccount,
  onClose,
  onSuccess,
}) => {
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    registrationsUpdated: number;
    corporateAccountId: number;
    companyName: string;
    groupId: number;
  } | null>(null);

  // ── Load corporate accounts ──────────────────────────────────────────────
  const loadAccounts = useCallback(async (q: string) => {
    setLoadingAccounts(true);
    try {
      const res = await corporateRegistrationService.getRegistrationsList(
        1,
        50,
        q,
        "company_name",
        "ASC",
      );
      const list = Array.isArray(res?.data) ? res.data : [];
      setCorporateAccounts(list);
    } catch {
      setCorporateAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setResult(null);
    setSearch("");
    setSelectedAccount(null);
    loadAccounts("");
  }, [isOpen, loadAccounts]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => loadAccounts(search), 300);
    return () => clearTimeout(t);
  }, [search, isOpen, loadAccounts]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedAccount) return setError("Please select a corporate account.");
    if (currentCorporateAccount && selectedAccount.id === currentCorporateAccount.id) {
      return setError("This group is already assigned to " + currentCorporateAccount.company_name + ".");
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await assessmentService.moveGroupToCorporate(
        groupAssessmentId,
        selectedAccount.id,
      );
      setResult({
        registrationsUpdated: res.registrationsUpdated,
        corporateAccountId: res.corporateAccountId,
        companyName: selectedAccount.company_name,
        groupId: res.groupId,
      });
      onSuccess({
        companyName: selectedAccount.company_name,
        count: res.registrationsUpdated,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to move group to corporate account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filtered = corporateAccounts.filter((ca) => {
    const q = search.toLowerCase();
    return (
      !q ||
      ca.company_name?.toLowerCase().includes(q) ||
      (ca as any).full_name?.toLowerCase().includes(q)
    );
  });

  const isCurrentSelection =
    currentCorporateAccount && selectedAccount?.id === currentCorporateAccount.id;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => !submitting && onClose()}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏢</span>
              <h2 className="text-xl font-bold text-brand-text-light-primary dark:text-white">
                {currentCorporateAccount ? "Reassign Group to Corporate" : "Move Group to Corporate"}
              </h2>
            </div>
            {groupName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Group Assessment:{" "}
                <span className="font-semibold text-brand-green">{groupName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="space-y-5 py-2">
            <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300">
              <div className="flex items-start gap-3">
                <span className="text-3xl">✅</span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-green-800 dark:text-green-300">
                    Group Moved Successfully!
                  </h3>
                  <p className="text-xs text-green-700/90 dark:text-green-300/80 leading-relaxed">
                    All <strong className="underline">{result.registrationsUpdated} candidate registrations</strong> in{" "}
                    <strong>{groupName || "this group"}</strong> have been linked to{" "}
                    <strong className="text-brand-green font-bold">{result.companyName}</strong>.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-green-500/20 text-[11px] text-green-700/80 dark:text-green-300/70 space-y-1">
                <p>• <strong>Corporate Portal:</strong> They are now visible under <em>Employees</em> and <em>Group Assessments</em> for {result.companyName}.</p>
                <p>• <strong>Registration Source:</strong> Updated to <code className="font-mono bg-green-500/20 px-1 py-0.5 rounded">CORPORATE</code>.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-all"
              >
                Done & View Summary
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Current assignment status if exists */}
            {currentCorporateAccount ? (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span className="text-blue-900 dark:text-blue-200">
                    Currently Assigned To:{" "}
                    <strong>{currentCorporateAccount.company_name}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  Active
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Assigning this group will transfer all registered candidates to the chosen corporate account with{" "}
                <code className="font-mono bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">
                  registration_source = &apos;CORPORATE&apos;
                </code>.
              </p>
            )}

            {/* Search box */}
            <div className="relative mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company or contact name…"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-brand-text-light-primary dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 transition-all"
              />
              {loadingAccounts && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent inline-block" />
                </span>
              )}
            </div>

            {/* Account list */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5 scrollbar-thin">
              {filtered.length === 0 && !loadingAccounts && (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                  No corporate accounts found
                </div>
              )}
              {filtered.map((ca) => {
                const isSelected = selectedAccount?.id === ca.id;
                const isCurrent = currentCorporateAccount && ca.id === currentCorporateAccount.id;

                return (
                  <button
                    key={ca.id}
                    onClick={() =>
                      setSelectedAccount((prev) =>
                        prev?.id === ca.id ? null : ca
                      )
                    }
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-brand-green/10 dark:bg-brand-green/20"
                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Radio indicator */}
                    <span
                      className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors flex items-center justify-center ${
                        isSelected
                          ? "border-brand-green bg-brand-green"
                          : "border-gray-300 dark:border-white/20 bg-transparent"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand-text-light-primary dark:text-white truncate">
                          {ca.company_name}
                        </p>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                            Current
                          </span>
                        )}
                      </div>
                      {(ca as any).full_name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {(ca as any).full_name}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="ml-auto text-brand-green text-xs font-semibold whitespace-nowrap">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {selectedAccount && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/30 text-xs text-brand-green font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🏢</span>
                  <span>
                    Target Account: <strong>{selectedAccount.company_name}</strong>
                  </span>
                </div>
                {isCurrentSelection && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                    Already Assigned
                  </span>
                )}
              </div>
            )}

            {/* Confirmation warning */}
            {selectedAccount && !isCurrentSelection && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                ⚠️ All registrations in group <strong>{groupName || "this assessment"}</strong> will be linked immediately to <strong>{selectedAccount.company_name}</strong>.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold text-sm disabled:opacity-50 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedAccount || isCurrentSelection}
                className="px-8 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-green/20 transition-all"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating…
                  </>
                ) : currentCorporateAccount ? (
                  "Confirm Reassignment"
                ) : (
                  "Move to Corporate"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MoveGroupToCorporateModal;
