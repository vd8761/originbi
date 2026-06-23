"use client";

import React, { useEffect, useRef, useState } from "react";
import { assessmentService } from "../../lib/services/assessment.service";

interface Candidate {
  registrationId: number;
  userId: number;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  countryCode: string;
}

interface AddCandidateModalProps {
  isOpen: boolean;
  groupAssessmentId: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  groupAssessmentId,
  onClose,
  onSuccess,
}) => {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setError(null);
    setPendingCandidate(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const rows =
          await assessmentService.getEligibleCandidatesForGroupAssessment(
            groupAssessmentId,
            search,
          );
        setCandidates(rows || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load candidates");
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, groupAssessmentId, search]);

  const handleConfirmAdd = async () => {
    if (!pendingCandidate) return;
    setSubmittingId(pendingCandidate.registrationId);
    setError(null);
    try {
      await assessmentService.addCandidateToGroupAssessment(
        groupAssessmentId,
        pendingCandidate.registrationId,
      );
      setCandidates((prev) =>
        prev.filter((c) => c.registrationId !== pendingCandidate.registrationId),
      );
      setPendingCandidate(null);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to add candidate");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => submittingId === null && onClose()}
      />
      <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-text-light-primary dark:text-white">
            Add Candidate to this Group
          </h2>
          <button
            onClick={onClose}
            disabled={submittingId !== null}
            className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {pendingCandidate ? (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Add the following user to this group?
            </p>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-brand-text-light-primary dark:text-white">
                {pendingCandidate.fullName || "(no name)"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {pendingCandidate.email || "-"}
                {pendingCandidate.mobileNumber
                  ? ` · ${pendingCandidate.countryCode || ""} ${pendingCandidate.mobileNumber}`
                  : ""}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Their existing assessment will be re-linked into this group. No
              new exam is scheduled.
            </p>

            {error && (
              <div className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPendingCandidate(null)}
                disabled={submittingId !== null}
                className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={submittingId !== null}
                className="px-8 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 disabled:opacity-50 flex items-center"
              >
                {submittingId === pendingCandidate.registrationId ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding…
                  </>
                ) : (
                  "Confirm Add"
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Showing admin-registered users for this program who aren&apos;t in any
              group yet. Adding a user re-links their existing assessment into this
              group - no new exam is created.
            </p>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or mobile"
              className="w-full h-[44px] bg-gray-50 dark:bg-white/10 border border-transparent rounded-xl px-4 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/70 focus:border-brand-green focus:outline-none transition-all mb-4"
            />

            <div className="max-h-[360px] overflow-y-auto custom-scrollbar border border-gray-100 dark:border-white/5 rounded-xl">
              {loading ? (
                <div className="px-4 py-8 text-sm text-gray-500 text-center">
                  Loading…
                </div>
              ) : candidates.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-500 text-center">
                  No eligible users found.
                </div>
              ) : (
                candidates.map((c) => (
                  <div
                    key={c.registrationId}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-text-light-primary dark:text-white truncate">
                        {c.fullName || "(no name)"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {c.email || "-"}
                        {c.mobileNumber
                          ? ` · ${c.countryCode || ""} ${c.mobileNumber}`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setError(null);
                        setPendingCandidate(c);
                      }}
                      className="px-4 py-1.5 rounded-full bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddCandidateModal;
