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
  onClose: () => void;
  onSuccess: () => void;
}

const MoveGroupToCorporateModal: React.FC<MoveGroupToCorporateModalProps> = ({
  isOpen,
  groupAssessmentId,
  groupName,
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
        groupId: res.groupId,
      });
      onSuccess();
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-bold text-brand-text-light-primary dark:text-white">
              Move Group to Corporate
            </h2>
            {groupName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Group:{" "}
                <span className="font-semibold text-brand-green">{groupName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-black dark:hover:text-white transition-colors mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm">
                  Group moved successfully
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  <strong>{result.registrationsUpdated}</strong> registration
                  {result.registrationsUpdated !== 1 ? "s" : ""} updated and
                  linked to the corporate account.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="px-6 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Select a corporate account below. All users in group{" "}
              {groupName ? (
                <strong className="text-brand-text-light-primary dark:text-white">
                  {groupName}
                </strong>
              ) : (
                "this assessment"
              )}{" "}
              will have their registrations reassigned to that account
              (
              <code className="text-xs font-mono bg-gray-100 dark:bg-white/10 px-1 rounded">
                registration_source = &apos;CORPORATE&apos;
              </code>
              ).
            </p>

            {/* Search box */}
            <div className="relative mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company or contact name…"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-brand-text-light-primary dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
              />
              {loadingAccounts && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent inline-block" />
                </span>
              )}
            </div>

            {/* Account list */}
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
              {filtered.length === 0 && !loadingAccounts && (
                <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-8">
                  No corporate accounts found
                </p>
              )}
              {filtered.map((ca) => (
                <button
                  key={ca.id}
                  onClick={() =>
                    setSelectedAccount((prev) =>
                      prev?.id === ca.id ? null : ca
                    )
                  }
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    selectedAccount?.id === ca.id
                      ? "bg-brand-green/10 dark:bg-brand-green/20"
                      : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {/* Radio indicator */}
                  <span
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${
                      selectedAccount?.id === ca.id
                        ? "border-brand-green bg-brand-green"
                        : "border-gray-300 dark:border-white/20 bg-transparent"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-text-light-primary dark:text-white leading-tight">
                      {ca.company_name}
                    </p>
                    {(ca as any).full_name && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {(ca as any).full_name}
                      </p>
                    )}
                  </div>
                  {selectedAccount?.id === ca.id && (
                    <span className="ml-auto text-brand-green text-xs font-semibold mt-0.5">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected summary */}
            {selectedAccount && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 text-xs text-brand-green font-medium flex items-center gap-2">
                <span>🏢</span>
                Moving to:{" "}
                <strong>{selectedAccount.company_name}</strong>
              </div>
            )}

            {/* Confirmation warning */}
            {selectedAccount && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                ⚠️ This will update the{" "}
                <strong>corporate_account_id</strong> on the group assessment,
                the group, and <strong>all member registrations</strong>. This
                action is immediate and reversible only by running it again
                with a different account.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
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
                disabled={submitting || !selectedAccount}
                className="px-8 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Moving…
                  </>
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
