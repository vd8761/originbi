import React from 'react';
import { IatReportStatus } from '../../lib/services/assessment.service';

interface Props {
  data: IatReportStatus | null;
  loading?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
  formatDate: (date?: string) => string;
  stats?: React.ReactNode;
  isStudent?: boolean;
}

const patternClass: Record<string, string> = {
  strong: 'bg-red-500',
  moderate: 'bg-amber-500',
  low: 'bg-emerald-500',
};

/** Slowest words from STRONG-pattern modules — used to flag scenario paragraphs. */
function collectStrongWords(modules: IatReportStatus['modules']): string[] {
  const words = new Set<string>();
  (modules || []).forEach((m) => {
    if (String(m.pattern || '').toLowerCase() === 'strong') {
      (m.slowestWords || []).forEach((w) => {
        const clean = String(w || '').trim();
        if (clean) words.add(clean.toLowerCase());
      });
    }
  });
  return [...words];
}

const SECTION_RE = /^section\s+\d/i;
const RESET_RE = /90[\s-]*day|reset/i;

/**
 * Renders the letter as flowing prose with SKILL.md highlight treatment:
 * - paragraphs referencing a strong bias's slowest word -> red left-border block
 * - the 90-day reset section -> green left-border block
 * - the final line -> emphasized with extra spacing
 * Section header lines are shown as small muted labels; coloring is keyed off
 * the structured score data, so we never mis-highlight arbitrary prose.
 */
function ReportLetter({ text, strongWords }: { text: string; strongWords: string[] }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  let inReset = false;

  return (
    <div className="mt-5 space-y-4 text-sm leading-7 text-gray-700 dark:text-gray-200">
      {paragraphs.map((para, index) => {
        const isHeader = SECTION_RE.test(para) && para.length < 80;
        if (isHeader) {
          inReset = RESET_RE.test(para);
          return (
            <p
              key={index}
              className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green"
            >
              {para}
            </p>
          );
        }

        const isLast = index === paragraphs.length - 1;
        const lower = para.toLowerCase();
        const isScenario = strongWords.some((w) => lower.includes(w));

        if (isScenario) {
          return (
            <p
              key={index}
              className="whitespace-pre-wrap border-l-4 border-red-400 bg-red-50 py-2 pl-4 dark:border-red-500/60 dark:bg-red-500/10"
            >
              {para}
            </p>
          );
        }
        if (inReset) {
          return (
            <p
              key={index}
              className={`whitespace-pre-wrap border-l-4 border-emerald-400 bg-emerald-50 py-2 pl-4 dark:border-emerald-500/60 dark:bg-emerald-500/10 ${
                isLast ? 'text-base font-medium leading-8' : ''
              }`}
            >
              {para}
            </p>
          );
        }
        return (
          <p
            key={index}
            className={`whitespace-pre-wrap ${isLast ? 'pt-2 text-base font-medium leading-8' : ''}`}
          >
            {para}
          </p>
        );
      })}
    </div>
  );
}

const IatReportPanel: React.FC<Props> = ({
  data,
  loading,
  retrying,
  onRetry,
  formatDate,
  stats,
  isStudent = false,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-white/10 dark:bg-[#19211C] dark:text-gray-400">
        Loading IATGen report...
      </div>
    );
  }

  if (!data?.attempt) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-white/10 dark:bg-[#19211C]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IATGen</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {isStudent
            ? "Your implicit bias report is not available yet."
            : "This candidate did not receive IATGen for Level 2."}
        </p>
      </div>
    );
  }

  const jobStatus = data.job?.status || data.report?.status || 'PENDING';
  const ready = data.report?.status === 'DONE' && data.report?.reportText;
  const canRetry = Boolean(onRetry && data.attempt && !ready && jobStatus !== 'PROCESSING' && !isStudent);

  return (
    <div className="space-y-6">
      {stats}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#19211C]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">IATGen</p>
            <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Corporate India Bias Profile
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Modules completed: {data.completed}/{data.total}
              {!isStudent && ` - Report status: ${jobStatus}`}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            {data.report?.generatedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Generated {formatDate(data.report.generatedAt)}
              </span>
            )}
            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="rounded-xl bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 disabled:opacity-50"
              >
                {retrying ? 'Queueing...' : 'Retry report'}
              </button>
            )}
          </div>
        </div>

        {data.job?.lastError && !ready && !isStudent && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {data.job.lastError}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.modules.map((module) => {
          const pattern = String(module.pattern || 'pending').toLowerCase();
          const barClass = patternClass[pattern] || 'bg-gray-300';
          return (
            <div key={module.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#19211C]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Module {module.order}</p>
                  <h4 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {module.displayName || module.name}
                  </h4>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-white/10 dark:text-gray-200">
                  {module.pattern || module.status}
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: pattern === 'strong' ? '100%' : pattern === 'moderate' ? '66%' : pattern === 'low' ? '35%' : '15%' }} />
              </div>
              <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <p>Slowest words: {(module.slowestWords || []).join(', ') || '-'}</p>
                <p>Error words: {(module.errorWords || []).join(', ') || '-'}</p>
                <p>Error rate: {module.errorRate == null ? '-' : `${Number(module.errorRate).toFixed(1)}%`}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#19211C]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">A letter to you</h3>
        {ready ? (
          <ReportLetter
            text={String(data.report?.reportText || '')}
            strongWords={collectStrongWords(data.modules)}
          />
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {isStudent
              ? "Your implicit bias report is being prepared. It will appear here when the job completes."
              : "The candidate can continue normally. The admin-only Claude report will appear here when the queued job completes."}
          </p>
        )}
      </div>
    </div>
  );
};

export default IatReportPanel;
