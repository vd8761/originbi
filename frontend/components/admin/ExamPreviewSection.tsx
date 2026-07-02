"use client";

import React, { useEffect, useState } from "react";
import {
  assessmentService,
  ExamPatternPreview,
  ExamPreviewLevel,
} from "../../lib/services/assessment.service";

interface ExamPreviewSectionProps {
  programId?: string | number | null;
  departmentDegreeId?: string | number | null;
  studentBoard?: string | null;
  employeeLevel?: string | null;
  schoolLevel?: string | null;
  currentYear?: string | number | null;
}

const StatusPill: React.FC<{ status: ExamPreviewLevel["status"] }> = ({ status }) => {
  const map: Record<ExamPreviewLevel["status"], { label: string; cls: string }> = {
    enabled: { label: "Assigned", cls: "bg-brand-green/15 text-brand-green border-brand-green/30" },
    disabled: { label: "Disabled", cls: "bg-gray-400/15 text-gray-500 border-gray-400/30" },
    unavailable: { label: "Unavailable", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  };
  const s = map[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

const LevelCard: React.FC<{ level: ExamPreviewLevel }> = ({ level }) => {
  const isActive = level.status === "enabled";
  return (
    <div
      className={`rounded-2xl border p-6 transition-colors ${
        isActive
          ? "border-brand-green/25 bg-brand-green/[0.03] dark:bg-brand-green/[0.06]"
          : "border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] opacity-90"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-base font-bold ${
              isActive
                ? "bg-brand-green text-white"
                : "bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-gray-300"
            }`}
          >
            {level.levelNumber}
          </span>
          <span className="text-lg font-bold text-brand-text-light-primary dark:text-white">
            {level.name} — {level.title}
          </span>
        </div>
        <StatusPill status={level.status} />
      </div>

      {isActive ? (
        <>
          {level.items.length > 0 && (
            <div className="space-y-3">
              {level.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-base">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{it.label}</span>
                  <span className="text-gray-900 dark:text-white font-bold text-lg">{it.value}</span>
                </div>
              ))}
            </div>
          )}
          {level.tags.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 font-bold mb-2">
                Open Question Type
              </p>
              <div className="flex flex-wrap gap-2">
                {level.tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-md text-sm font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {level.note && (
            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400 italic">{level.note}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {level.reason ||
            (level.status === "disabled"
              ? "This level is disabled for this candidate."
              : "This level is not available for this candidate.")}
        </p>
      )}
    </div>
  );
};

const ExamPreviewSection: React.FC<ExamPreviewSectionProps> = ({
  programId,
  departmentDegreeId,
  studentBoard,
  employeeLevel,
  schoolLevel,
  currentYear,
}) => {
  const [preview, setPreview] = useState<ExamPatternPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      setPreview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await assessmentService.getExamPatternPreview({
          programId,
          departmentDegreeId,
          studentBoard,
          employeeLevel,
          schoolLevel,
          currentYear,
        });
        if (!cancelled) setPreview(res);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load exam preview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [programId, departmentDegreeId, studentBoard, employeeLevel, schoolLevel, currentYear]);

  if (!programId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 p-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a program (and its sub-category) to preview the assessment this candidate will receive.
        </p>
      </div>
    );
  }

  if (loading && !preview) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-6">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        Loading exam preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="space-y-5">
      <p className="text-base text-gray-600 dark:text-gray-300">
        Based on the current settings, this candidate
        {preview.program ? (
          <>
            {" "}
            (<span className="font-semibold">{preview.program.assessmentTitle || preview.program.name}</span>)
          </>
        ) : null}{" "}
        will be assigned the following:
      </p>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${loading ? "opacity-60" : ""}`}>
        {preview.levels.map((lvl) => (
          <LevelCard key={lvl.levelNumber} level={lvl} />
        ))}
      </div>
    </div>
  );
};

export default ExamPreviewSection;
