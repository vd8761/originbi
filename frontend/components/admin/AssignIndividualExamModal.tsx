"use client";

import React, { useEffect, useState } from "react";
import CustomDatePicker from "../ui/CustomDatePicker";

export interface IndividualExamPreviewData {
  program: { id: number; name: string; assessmentTitle?: string } | null;
  levels: Array<{
    id: number;
    levelNumber: number;
    name: string;
    patternType?: string | null;
  }>;
  canAssign: boolean;
  ongoingStatus: string | null;
}

interface AssignIndividualExamModalProps {
  isOpen: boolean;
  fullName?: string;
  /** Loads the level/program preview for the user. */
  loadPreview: () => Promise<IndividualExamPreviewData>;
  /** Creates the exam for the chosen window. */
  assignExam: (examStart: string, examEnd: string) => Promise<unknown>;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignIndividualExamModal: React.FC<AssignIndividualExamModalProps> = ({
  isOpen,
  fullName,
  loadPreview,
  assignExam,
  onClose,
  onSuccess,
}) => {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<IndividualExamPreviewData | null>(null);
  const [examStart, setExamStart] = useState("");
  const [examEnd, setExamEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDone(false);
    setExamStart("");
    setExamEnd("");
    setPreview(null);
    setLoadingPreview(true);

    let cancelled = false;
    (async () => {
      try {
        const res = await loadPreview();
        if (!cancelled) setPreview(res);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Failed to load exam preview.");
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!examStart || !examEnd) return setError("Please pick exam dates.");
    setSubmitting(true);
    try {
      await assignExam(examStart, examEnd);
      setDone(true);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to assign exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const blocked = preview ? !preview.canAssign : false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-text-light-primary dark:text-white">
            Assign New Exam
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A new exam has been assigned
              {fullName ? (
                <>
                  {" "}
                  to <strong>{fullName}</strong>
                </>
              ) : null}
              . This is now their latest exam.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Pick an exam window. The exam below — based on current settings —
              will be assigned{fullName ? ` to ${fullName}` : ""}. The previous
              exam is not affected; this becomes the latest.
            </p>

            {loadingPreview ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-6">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
                Loading exam preview…
              </div>
            ) : (
              preview && (
                <div className="mb-5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Program
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {preview.program?.assessmentTitle ||
                        preview.program?.name ||
                        "N/A"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    Levels to be assigned ({preview.levels.length})
                  </p>
                  {preview.levels.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      No levels are currently enabled for this user.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {preview.levels.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200"
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold">
                            {l.levelNumber}
                          </span>
                          <span>{l.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            )}

            {blocked && (
              <div className="mb-5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-100 dark:border-amber-500/20">
                This user has an ongoing assessment
                {preview?.ongoingStatus ? ` (${preview.ongoingStatus})` : ""}. A
                new exam can only be assigned once their current exam is
                completed or expired.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-black/70 dark:text-white font-semibold ml-1">
                Schedule Exam <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={
                  examStart ? { start: examStart, end: examEnd || "" } : undefined
                }
                onChange={(start, end) => {
                  setExamStart(start);
                  setExamEnd(end);
                }}
              />
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting || loadingPreview || blocked || !preview
                }
                className="px-8 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Assigning…
                  </>
                ) : (
                  "Assign Exam"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignIndividualExamModal;
