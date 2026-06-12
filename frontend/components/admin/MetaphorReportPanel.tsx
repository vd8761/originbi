import React, { useEffect, useState } from 'react';
import { MetaphorReportStatus, assessmentService } from '../../lib/services/assessment.service';
import { studentService } from '../../lib/services/student.service';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    DownloadIcon,
    LoadingIcon,
} from '../icons';

type MetaphorAnswer = MetaphorReportStatus['answers'][number];

interface MetaphorReportPanelProps {
    data: MetaphorReportStatus | null;
    loading: boolean;
    retrying: boolean;
    onRetry: () => Promise<void> | void;
    formatDate: (dateStr?: string) => string;
    stats: React.ReactNode;
    displayData: {
        title: string;
        program: string;
        type: string;
    };
    isStudent?: boolean;
    studentEmail?: string;
}

const SidebarItem = ({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className={`${small ? 'text-xs' : 'text-sm'} font-medium text-gray-800 dark:text-gray-200 break-all`}>{value}</p>
    </div>
);

const formatRetryEta = (value?: string | null) => {
    if (!value) return '';
    const diffMs = new Date(value).getTime() - Date.now();
    if (diffMs <= 0) return 'now';
    const minutes = Math.ceil(diffMs / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hr`;
};

const cleanMarkdownForStudent = (markdown: string): string => {
    let clean = markdown;

    // 1. Remove the top main title or change it
    clean = clean.replace(/#\s+DISC\s+Behaviour\s+Analysis\s+Report/gi, '# Metaphor Analysis Report');

    // 2. Remove the DISC Scores section (up to the next heading)
    clean = clean.replace(/##\s+DISC\s+Scores[\s\S]*?(?=##)/gi, '');

    // 3. Remove the Final DISC Pattern section (up to the next heading)
    clean = clean.replace(/##\s+Final\s+DISC\s+Pattern[\s\S]*?(?=##)/gi, '');

    // 4. Remove the DISC Pattern item in Behavioural Dimensions
    clean = clean.replace(/\*\*DISC\s+Pattern\*\*[\s\S]*?(?=\n\s*\n|\n\s*\*\*|\n\s*##)/gi, '');

    // Clean up multiple consecutive newlines
    clean = clean.replace(/\n{3,}/g, '\n\n');

    return clean.trim();
};

const answerStatusBadge = (answer: MetaphorAnswer, isStudent = false) => {
    if (answer.status === 'NOT_ANSWERED') {
        return { label: 'Not submitted', className: 'bg-gray-500/10 text-gray-500 border-gray-400/30' };
    }
    if (isStudent) {
        return { label: 'Submitted', className: 'bg-brand-green/10 text-brand-green border-brand-green/30' };
    }
    if (answer.transcriptionStatus === 'PROCESSING') {
        return { label: 'Processing audio', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    }
    if (answer.transcriptionStatus === 'PENDING') {
        const eta = formatRetryEta(answer.transcriptionNextRetryAt);
        return {
            label: eta ? `Retry scheduled in ${eta}` : 'Processing audio',
            className: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
        };
    }
    if (answer.transcriptionStatus === 'FAILED' && answer.transcriptionSource === 'web') {
        return { label: 'Failed, using web', className: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
    }
    if (answer.translationStatus === 'DONE') {
        return { label: 'Processed', className: 'bg-brand-green/10 text-brand-green border-brand-green/30' };
    }
    if (answer.translationStatus === 'FAILED') {
        return { label: 'Translation failed', className: 'bg-red-500/10 text-red-500 border-red-500/30' };
    }
    return { label: 'Translation pending', className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
};

const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\*[^*]+?\*)/g).filter(Boolean);
    return parts.map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
            return <strong key={index} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[0.92em]">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
};

const MarkdownPreview = ({ markdown }: { markdown: string }) => {
    const lines = markdown.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i += 1) {
        const raw = lines[i];
        const line = raw.trim();

        if (!line) {
            blocks.push(<div key={i} className="h-1" />);
            continue;
        }

        if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
            const tableRows: string[][] = [];
            tableRows.push(line.split('|').map((cell) => cell.trim()).filter(Boolean));
            i += 2;
            while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
                tableRows.push(lines[i].split('|').map((cell) => cell.trim()).filter(Boolean));
                i += 1;
            }
            i -= 1;
            const [head, ...body] = tableRows;
            blocks.push(
                <div key={`table-${i}`} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white">
                            <tr>{head.map((cell, idx) => <th key={idx} className="px-3 py-2 text-left font-semibold">{renderInlineMarkdown(cell)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {body.map((row, rowIdx) => (
                                <tr key={rowIdx}>{row.map((cell, idx) => <td key={idx} className="px-3 py-2 align-top">{renderInlineMarkdown(cell)}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>,
            );
            continue;
        }

        if (/^-{3,}$/.test(line)) {
            blocks.push(<div key={i} className="border-t border-gray-200 dark:border-white/10 my-4" />);
        } else if (line.startsWith('### ')) {
            blocks.push(<h4 key={i} className="text-sm font-semibold text-gray-900 dark:text-white pt-3">{renderInlineMarkdown(line.slice(4))}</h4>);
        } else if (line.startsWith('## ')) {
            blocks.push(<h3 key={i} className="text-base font-semibold text-[#150089] dark:text-white pt-4">{renderInlineMarkdown(line.slice(3))}</h3>);
        } else if (line.startsWith('# ')) {
            blocks.push(<h2 key={i} className="text-lg font-semibold text-[#150089] dark:text-white">{renderInlineMarkdown(line.slice(2))}</h2>);
        } else {
            const ordered = line.match(/^(\d+)\.\s+(.*)$/);
            if (ordered) {
                blocks.push(
                    <div key={i} className="grid grid-cols-[28px_1fr] gap-2 leading-7">
                        <span className="text-brand-green font-semibold">{ordered[1]}.</span>
                        <p>{renderInlineMarkdown(ordered[2])}</p>
                    </div>,
                );
            } else if (/^[-*]\s+/.test(line)) {
                blocks.push(
                    <div key={i} className="grid grid-cols-[20px_1fr] gap-2 leading-7">
                        <span className="text-brand-green">-</span>
                        <p>{renderInlineMarkdown(line.slice(2))}</p>
                    </div>,
                );
            } else if (line.startsWith('> ')) {
                blocks.push(<blockquote key={i} className="border-l-2 border-brand-green pl-3 text-gray-600 dark:text-gray-300">{renderInlineMarkdown(line.slice(2))}</blockquote>);
            } else {
                blocks.push(<p key={i} className="leading-7 whitespace-pre-wrap">{renderInlineMarkdown(line)}</p>);
            }
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/10 p-6 text-sm text-gray-700 dark:text-gray-200 space-y-3">
            {blocks}
        </div>
    );
};

const TranscriptBlock = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{label}</p>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 p-4 text-sm leading-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {value?.trim() || '-'}
        </div>
    </div>
);

const AnswerModal = ({
    answers,
    index,
    onClose,
    onNavigate,
    isStudent = false,
}: {
    answers: MetaphorAnswer[];
    index: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
    isStudent?: boolean;
}) => {
    const answer = answers[index];
    const badge = answer ? answerStatusBadge(answer, isStudent) : null;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft') onNavigate(Math.max(0, index - 1));
            if (event.key === 'ArrowRight') onNavigate(Math.min(answers.length - 1, index + 1));
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [answers.length, index, onClose, onNavigate]);

    if (!answer || !badge) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#19211C] shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 p-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question {answer.sequence}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badge.className}`}>{badge.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{index + 1} of {answers.length}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors" aria-label="Close">
                        x
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-150px)] p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
                        <div className="space-y-4">
                            {answer.imageUrl ? (
                                <img src={answer.imageUrl} alt={answer.imageDescriptionEn || `Metaphor question ${answer.sequence}`} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20 object-contain max-h-[420px]" />
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 p-8 text-center text-sm text-gray-500">No image attached</div>
                            )}
                            {!isStudent && answer.imageDescriptionEn && <TranscriptBlock label="Image Description" value={answer.imageDescriptionEn} />}
                        </div>

                        <div className="space-y-4">
                            <TranscriptBlock label="Context" value={answer.contextEn || answer.contextTa} />
                            <TranscriptBlock label="Question" value={answer.questionEn || answer.questionTa} />
                            {isStudent ? (
                                <TranscriptBlock label="Your Answer" value={answer.finalTranscript || answer.webTranscript || answer.englishText} />
                            ) : (
                                <>
                                    <TranscriptBlock label="Final Transcript" value={answer.finalTranscript} />
                                    <TranscriptBlock label="English Translation" value={answer.englishText} />
                                    <TranscriptBlock label="Browser Fallback Transcript" value={answer.webTranscript} />
                                    {answer.transcriptionError && <TranscriptBlock label="Processing Error" value={answer.transcriptionError} />}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-200 dark:border-white/10 p-4">
                    <button
                        onClick={() => onNavigate(Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Previous
                    </button>
                    <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">Use keyboard left and right arrows to navigate.</p>
                    <button
                        onClick={() => onNavigate(Math.min(answers.length - 1, index + 1))}
                        disabled={index >= answers.length - 1}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetaphorReportPanel: React.FC<MetaphorReportPanelProps> = ({
    data,
    loading,
    retrying,
    onRetry,
    formatDate,
    stats,
    displayData,
    isStudent = false,
    studentEmail,
}) => {
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const job = data?.job;
    const report = data?.report;
    const exhausted = job && job.status === 'FAILED' && Number(job.retryCount || 0) >= Number(job.maxRetries || 5);
    const answers = data?.answers || [];

    const handleDownloadPdf = async () => {
        if (!data?.attempt?.id || !report?.markdown) return;
        try {
            setDownloadingPdf(true);
            let blob: Blob;
            if (isStudent) {
                if (!studentEmail) {
                    throw new Error('Student email is required to download report');
                }
                blob = await studentService.downloadMetaphorReportPdf(data.attempt.id, studentEmail);
            } else {
                blob = await assessmentService.downloadMetaphorReportPdf(data.attempt.id);
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `metaphor-report-${data.attempt.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download Metaphor report PDF', error);
            alert('Failed to download Metaphor report PDF.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                    {/* The Generated / Submitted / Missing / Report Status
                        indicators are shown in the stats bar above (passed in
                        via `stats`); the duplicate card row was removed. */}
                    {stats}

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#150089] dark:text-white">
                                {isStudent ? "Your Responses" : "Answer Processing"}
                            </h3>
                            {loading && <LoadingIcon className="w-4 h-4 animate-spin text-brand-green" />}
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            {answers.map((answer, index) => {
                                const badge = answerStatusBadge(answer, isStudent);
                                return (
                                    <button
                                        key={answer.id}
                                        onClick={() => setSelectedAnswerIndex(index)}
                                        className="w-full text-left p-4 bg-gray-50 dark:bg-black/10 hover:bg-gray-100 dark:hover:bg-white/5 border-b last:border-b-0 border-gray-200 dark:border-white/10 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">Question {answer.sequence}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{answer.questionEn || answer.questionTa || 'Metaphor question'}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-2 line-clamp-1">{answer.finalTranscript || answer.webTranscript || '[No answer submitted]'}</p>
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                            {!loading && answers.length === 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-6 text-center">
                                    No Metaphor answers found for this session.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                        {!isStudent && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-[#150089] dark:text-white">Claude Markdown Report</h3>
                                    {report?.generatedAt && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generated {formatDate(report.generatedAt || undefined)}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {report?.markdown && (
                                        <button
                                            onClick={handleDownloadPdf}
                                            disabled={downloadingPdf}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                                        >
                                            {downloadingPdf ? <LoadingIcon className="w-3 h-3 animate-spin" /> : <DownloadIcon className="w-3 h-3" />}
                                            Download PDF
                                        </button>
                                    )}
                                    {exhausted && (
                                        <button
                                            onClick={onRetry}
                                            disabled={retrying}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                                        >
                                            {retrying ? <LoadingIcon className="w-3 h-3 animate-spin" /> : <ClockIcon className="w-3 h-3" />}
                                            Retry Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {report?.markdown ? (
                            <MarkdownPreview markdown={isStudent ? cleanMarkdownForStudent(report.markdown) : report.markdown} />
                        ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/10 p-6">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {exhausted
                                        ? (isStudent ? 'Report generation failed. Please contact support.' : 'Report generation failed after all retries.')
                                        : data?.readyForReport
                                            ? 'Report generation is queued or processing.'
                                            : 'Waiting for all generated questions to be accounted for.'}
                                </p>
                                {job?.lastError && !isStudent && <p className="text-xs text-red-500 mt-2">{job.lastError}</p>}
                                {job?.nextRetryAt && !exhausted && !isStudent && (
                                    <p className="text-xs text-amber-500 mt-2">Retry scheduled in {formatRetryEta(job.nextRetryAt)}.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4 h-fit">
                    <SidebarItem label="Assessment Title" value={displayData.title} />
                    <div className="border-t border-gray-200 dark:border-white/10" />
                    <SidebarItem label="Program Level" value={displayData.program} />
                    <SidebarItem label="Exam Type" value={displayData.type} />
                    {!isStudent && (
                        <>
                            <div className="border-t border-gray-200 dark:border-white/10" />
                            <SidebarItem label="Claude Model" value={report?.model || '--'} small />
                            <SidebarItem label="Report Attempts" value={job ? `${job.retryCount || 0}/${job.maxRetries || 5}` : '--'} />
                        </>
                    )}
                </div>
            </div>

            {selectedAnswerIndex !== null && (
                <AnswerModal
                    answers={answers}
                    index={selectedAnswerIndex}
                    onClose={() => setSelectedAnswerIndex(null)}
                    onNavigate={setSelectedAnswerIndex}
                    isStudent={isStudent}
                />
            )}
        </>
    );
};

export default MetaphorReportPanel;
