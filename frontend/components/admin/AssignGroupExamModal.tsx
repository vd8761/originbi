"use client";

import React, { useEffect, useState } from "react";
import CustomSelect from "../ui/CustomSelect";
import CustomDatePicker from "../ui/CustomDatePicker";
import { registrationService } from "../../lib/services/registration.service";
import { assessmentService } from "../../lib/services/assessment.service";
import { Program } from "../../lib/types";

interface AssignGroupExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignGroupExamModal: React.FC<AssignGroupExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groupId, setGroupId] = useState("");
  const [programId, setProgramId] = useState("");
  const [examStart, setExamStart] = useState("");
  const [examEnd, setExamEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    relinked: number;
    skipped: number;
    failed: number;
    totalRegistrations: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setResult(null);

    (async () => {
      try {
        const [groupsRes, programsRes] = await Promise.all([
          registrationService.getGroups(),
          registrationService.getPrograms(),
        ]);
        const opts = (Array.isArray(groupsRes) ? groupsRes : [])
          .filter((g: any) => g && g.name)
          .map((g: any) => ({ value: String(g.id), label: String(g.name) }));
        setGroupOptions(opts);
        setPrograms(programsRes || []);
      } catch (err) {
        console.error("Failed to load groups/programs", err);
        setError("Failed to load groups or programs.");
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const programOptions = programs.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const handleSubmit = async () => {
    setError(null);

    if (!groupId) return setError("Please select a group.");
    if (!programId) return setError("Please select a program.");
    if (!examStart || !examEnd) return setError("Please pick exam dates.");

    setSubmitting(true);
    try {
      const res = await assessmentService.assignGroupExam({
        groupId: Number(groupId),
        programId: Number(programId),
        examStart,
        examEnd,
      });
      setResult({
        created: res.created,
        relinked: (res as any).relinked || 0,
        skipped: res.skipped,
        failed: res.failed,
        totalRegistrations: res.totalRegistrations,
      });
      if (res.failed === 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to assign exam.");
    } finally {
      setSubmitting(false);
    }
  };

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

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Exam assigned. Summary across{" "}
              <strong>{result.totalRegistrations}</strong> users in the group:
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 pl-4 list-disc">
              <li>
                <strong className="text-brand-green">{result.created}</strong>{" "}
                new sessions created
              </li>
              <li>
                <strong className="text-brand-green">{result.relinked}</strong>{" "}
                existing sessions re-linked (no double scheduling)
              </li>
              <li>
                <strong>{result.skipped}</strong> already had this exam
              </li>
              <li>
                <strong className={result.failed > 0 ? "text-red-500" : ""}>
                  {result.failed}
                </strong>{" "}
                failed
              </li>
            </ul>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Pick a group, program, and exam window. Every user already in the
              group will get a new assessment session (users who already have
              this exam are skipped).
            </p>

            <div className="space-y-5">
              <CustomSelect
                label="Group"
                required
                options={groupOptions}
                value={groupId}
                onChange={setGroupId}
                placeholder="Select Group"
              />

              <CustomSelect
                label="Program"
                required
                options={programOptions}
                value={programId}
                onChange={setProgramId}
                placeholder="Select Program"
              />

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
                disabled={submitting}
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

export default AssignGroupExamModal;
