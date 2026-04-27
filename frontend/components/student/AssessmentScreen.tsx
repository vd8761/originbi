import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  ENG: {
    hello: "Hello",
    subtitle: "Keep going, you're one step closer to completing your personality journey. Unlock upcoming tests as you progress",
    overall: "Overall Completion",
    unlocksIn: "Unlocks In",
    completed: "Completed",
    start: "Start Assessment",
    resume: "Resume",
    finish: "Finish",
    noAssessments: "No Assessments Found."
  },
  TAM: {
    hello: "வணக்கம்",
    subtitle: "தொடருங்கள்! உங்கள் ஆளுமைப் பயணத்தை நிறைவு செய்ய ஒரு படி நெருங்கி விட்டீர்கள்.",
    overall: "மொத்த நிறைவு",
    unlocksIn: "திறக்கும் நேரம்",
    completed: "முடிந்தது",
    start: "மதிப்பீட்டைத் தொடங்க",
    resume: "தொடர",
    finish: "முடிக்க",
    noAssessments: "மதிப்பீடுகள் இல்லை."
  }
};

import { studentService } from '../../lib/services/student.service';
import { buildReportApiUrl } from '../../lib/utils/reportUrl';
import { ArrowRightWithoutLineIcon, Spinner } from '../icons';
import AssessmentModal from "./AssessmentModal";

const REPORT_PDF_POLL_INTERVAL_MS = 1200;
const REPORT_PDF_POLL_MAX_ATTEMPTS = 240;
const PDF_RENDER_MAX_WIDTH = 1080;
const PDF_RENDER_PIXEL_RATIO_CAP = 1.35;
const REPORT_PREVIEW_CACHE_VERSION = 'v3';
const REPORT_PREVIEW_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const REPORT_READY_COMPLETION_COUNT = 2;
const REPORT_READY_STORAGE_KEY = 'studentReportReady';

// =============================================
// LAYER 1: localStorage metadata flag (SYNC)
// - Small JSON with timestamp, studentId, email
// - Checked synchronously on mount to know if
//   a cached report exists in IndexedDB
// =============================================
const REPORT_CACHE_META_KEY = 'originbi_report_cache_meta';

interface ReportCacheMeta {
  studentId: number;
  userEmail: string;
  cachedAt: number;
  hasData: boolean;
}

/** Synchronously check if we have a valid cached report (localStorage flag) */
const hasValidCacheMeta = (studentId: number, userEmail: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(REPORT_CACHE_META_KEY);
    if (!raw) return false;
    const meta: ReportCacheMeta = JSON.parse(raw);
    if (!meta.hasData) return false;
    if (meta.studentId !== studentId) return false;
    if (meta.userEmail !== userEmail.toLowerCase()) return false;
    if (Date.now() - meta.cachedAt > REPORT_PREVIEW_CACHE_TTL_MS) {
      localStorage.removeItem(REPORT_CACHE_META_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(REPORT_CACHE_META_KEY);
    return false;
  }
};

/** Write the cache metadata flag to localStorage */
const setCacheMeta = (studentId: number, userEmail: string) => {
  if (typeof window === 'undefined') return;
  try {
    const meta: ReportCacheMeta = {
      studentId,
      userEmail: userEmail.toLowerCase(),
      cachedAt: Date.now(),
      hasData: true,
    };
    localStorage.setItem(REPORT_CACHE_META_KEY, JSON.stringify(meta));
  } catch { /* best effort */ }
};

/** Clear the cache metadata flag */
const clearCacheMeta = () => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(REPORT_CACHE_META_KEY); } catch { /* best effort */ }
};

// =============================================
// LAYER 2: IndexedDB binary storage (ASYNC)
// - Stores the actual PDF ArrayBuffer
// - Can handle files of 100MB+ easily
// =============================================
const IDB_NAME = 'originbi_report_cache';
const IDB_STORE = 'pdf_previews';
const IDB_VERSION = 1;

const openReportCacheDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbGet = async (key: string): Promise<any | null> => {
  try {
    const db = await openReportCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

const idbSet = async (key: string, value: any): Promise<void> => {
  try {
    const db = await openReportCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail — cache is best-effort
  }
};

const idbDelete = async (key: string): Promise<void> => {
  try {
    const db = await openReportCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail
  }
};

// =============================================
// LAYER 3: Combined read/write helpers
// =============================================
const buildReportDownloadUrl = (downloadUrl: string) => {
  return buildReportApiUrl(downloadUrl);
};

interface SessionAuthContext {
  token: string | null;
  userEmail: string | null;
}

const getSessionAuthContext = (): SessionAuthContext => {
  if (typeof window === 'undefined') {
    return { token: null, userEmail: null };
  }
  const token =
    sessionStorage.getItem('idToken') ||
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('originbi_id_token') ||
    localStorage.getItem('accessToken');
  const rawEmail =
    sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
  return {
    token: token?.trim() || null,
    userEmail: rawEmail?.trim().toLowerCase() || null,
  };
};

const buildSecureRequestHeaders = (
  authContext: SessionAuthContext,
  baseHeaders: Record<string, string> = {},
) => {
  const headers: Record<string, string> = { ...baseHeaders };
  if (authContext.token) {
    headers.Authorization = `Bearer ${authContext.token}`;
  }
  return headers;
};

const getReportPreviewCacheKey = (studentId: number, userEmail: string) =>
  `report_pdf:${REPORT_PREVIEW_CACHE_VERSION}:${studentId}:${userEmail.toLowerCase()}`;

/** Read cached report from IndexedDB */
const readReportFromIDB = async (
  studentId: number,
  userEmail: string,
): Promise<{ pdfBytes: Uint8Array; password: string | null } | null> => {
  if (typeof window === 'undefined') return null;

  const cacheKey = getReportPreviewCacheKey(studentId, userEmail);
  try {
    const cached = await idbGet(cacheKey) as {
      studentId: number;
      userEmail: string;
      cachedAt: number;
      password: string | null;
      pdfBytes: ArrayBuffer;
    } | null;

    if (!cached || !cached.pdfBytes) {
      clearCacheMeta();
      return null;
    }

    const isExpired = Date.now() - Number(cached.cachedAt || 0) > REPORT_PREVIEW_CACHE_TTL_MS;
    if (isExpired || cached.userEmail !== userEmail.toLowerCase() || Number(cached.studentId) !== studentId) {
      await idbDelete(cacheKey);
      clearCacheMeta();
      return null;
    }

    return {
      pdfBytes: new Uint8Array(cached.pdfBytes),
      password: cached.password || null,
    };
  } catch (error) {
    console.warn('[ReportCache] IndexedDB read failed', error);
    await idbDelete(cacheKey);
    clearCacheMeta();
    return null;
  }
};

/** Write report to IndexedDB + set localStorage flag */
const writeReportToCache = async (
  studentId: number,
  userEmail: string,
  pdfBytes: Uint8Array,
  password: string | null,
): Promise<void> => {
  if (typeof window === 'undefined') return;

  const cacheKey = getReportPreviewCacheKey(studentId, userEmail);
  try {
    await idbSet(cacheKey, {
      studentId,
      userEmail: userEmail.toLowerCase(),
      cachedAt: Date.now(),
      password: password?.trim() || null,
      pdfBytes: pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ),
    });
    // Set the sync flag so next mount knows cache exists
    setCacheMeta(studentId, userEmail);
  } catch (error) {
    console.warn('[ReportCache] IndexedDB write failed', error);
  }
};

interface ResponsivePdfRendererProps {
  pdfBytes: Uint8Array;
  password?: string | null;
}

const ResponsivePdfRenderer: React.FC<ResponsivePdfRendererProps> = ({
  pdfBytes,
  password,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pagesHostRef = useRef<HTMLDivElement | null>(null);
  const lastMeasuredWidthRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const fallbackContainerWidth =
    typeof window !== 'undefined'
      ? Math.max(320, Math.min(window.innerWidth - 96, PDF_RENDER_MAX_WIDTH + 24))
      : 0;

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      // Use border-box width so scrollbar appearance does not change measured width.
      const measuredWidth = Math.floor(
        container.getBoundingClientRect().width ||
        container.clientWidth ||
        0,
      );
      if (measuredWidth <= 0) {
        return;
      }

      // Ignore tiny width jitter (commonly caused by desktop scrollbar/layout churn)
      // to prevent repeated full PDF re-render loops.
      const shouldUpdate =
        lastMeasuredWidthRef.current === 0 ||
        Math.abs(measuredWidth - lastMeasuredWidthRef.current) >= 16;

      if (!shouldUpdate) {
        return;
      }

      lastMeasuredWidthRef.current = measuredWidth;
      setContainerWidth(measuredWidth);
    };

    updateWidth();

    // Modal layout can report 0 width briefly on first paint; retry once after layout settles.
    const retryTimer = window.setTimeout(updateWidth, 60);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(container);

      return () => {
        window.clearTimeout(retryTimer);
        observer.disconnect();
      };
    }

    window.addEventListener('resize', updateWidth);
    return () => {
      window.clearTimeout(retryTimer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    const effectiveContainerWidth = containerWidth > 0 ? containerWidth : fallbackContainerWidth;

    if (!pdfBytes || effectiveContainerWidth <= 0 || !pagesHostRef.current) {
      return;
    }

    let cancelled = false;
    let loadingTask: any = null;

    const renderPdfPages = async () => {
      const pagesHost = pagesHostRef.current;
      if (!pagesHost) {
        return;
      }

      setIsRendering(true);
      setRenderError(null);
      const shouldRenderIncrementally = pagesHost.childElementCount === 0;
      const renderedNodes: HTMLDivElement[] = [];

      try {
        const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
        }

        const documentConfig: { data: Uint8Array; password?: string } = {
          data: pdfBytes,
        };

        if (password) {
          documentConfig.password = password;
        }

        // PDF.js transfers ArrayBuffer ownership to its worker;
        // always pass a copied buffer so React state bytes stay valid.
        const workerSafeBytes = pdfBytes.slice();
        documentConfig.data = workerSafeBytes;

        loadingTask = pdfjsLib.getDocument(documentConfig);
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          return;
        }

        const availableWidth = Math.max(
          280,
          Math.min(effectiveContainerWidth - 24, PDF_RENDER_MAX_WIDTH),
        );
        const pixelRatio =
          typeof window !== 'undefined'
            ? Math.min(window.devicePixelRatio || 1, PDF_RENDER_PIXEL_RATIO_CAP)
            : 1;

        for (
          let pageNumber = 1;
          pageNumber <= pdfDocument.numPages;
          pageNumber += 1
        ) {
          if (cancelled) {
            return;
          }

          const page = await pdfDocument.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = availableWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });

          const wrapper = document.createElement('div');
          wrapper.style.width = '100%';
          wrapper.style.display = 'flex';
          wrapper.style.justifyContent = 'center';
          wrapper.style.contentVisibility = 'auto';
          wrapper.style.contain = 'layout paint';
          wrapper.style.containIntrinsicSize = `1px ${Math.max(320, Math.ceil(viewport.height))}px`;

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.maxWidth = '100%';
          canvas.style.borderRadius = '10px';
          canvas.style.background = '#ffffff';
          canvas.style.boxShadow = '0 2px 8px rgba(15, 20, 25, 0.12)';

          const context = canvas.getContext('2d', { alpha: false });
          if (!context) {
            throw new Error('Unable to initialize PDF canvas context.');
          }

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (cancelled) {
            return;
          }

          wrapper.appendChild(canvas);
          renderedNodes.push(wrapper);
          if (shouldRenderIncrementally) {
            pagesHost.appendChild(wrapper);
          }

          // Yield after each page so wheel/touch scrolling remains smooth.
          await new Promise<void>((resolve) => {
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
              window.requestAnimationFrame(() => resolve());
              return;
            }
            setTimeout(() => resolve(), 0);
          });
        }

        if (renderedNodes.length === 0) {
          throw new Error('Report pages are empty. Please refresh preview.');
        }

        if (!cancelled && !shouldRenderIncrementally) {
          pagesHost.replaceChildren(...renderedNodes);
        }
      } catch (error) {
        const rawMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : '';
        const normalizedMessage = rawMessage.toLowerCase();
        const isExpectedCancellation =
          cancelled ||
          normalizedMessage.includes('worker was destroyed') ||
          normalizedMessage.includes('renderingcancelledexception') ||
          normalizedMessage.includes('rendering cancelled');

        if (!isExpectedCancellation) {
          console.error('Failed to render PDF preview', error);
        }

        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Failed to render PDF preview.';

        if (isExpectedCancellation) {
          return;
        }

        if (/password/i.test(message)) {
          setRenderError(
            'Unable to unlock the report PDF automatically. Please try again in a moment.',
          );
        } else {
          setRenderError(message);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    void renderPdfPages();

    return () => {
      cancelled = true;
      if (loadingTask && typeof loadingTask.destroy === 'function') {
        void loadingTask.destroy();
      }
    };
  }, [pdfBytes, password, containerWidth, fallbackContainerWidth]);

  return (
    <div
      ref={viewportRef}
      className="h-full w-full overflow-x-auto overflow-y-scroll p-3 md:p-6"
      style={{
        overscrollBehavior: 'contain',
        scrollbarGutter: 'stable',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {isRendering && (
        <div className="sticky top-3 z-20 mb-4 mx-auto w-fit rounded-full bg-black/70 px-3 py-2 shadow-lg">
          <Spinner className="w-4 h-4 text-white animate-spin" />
        </div>
      )}

      {renderError && (
        <div className="mb-4 mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {renderError}
        </div>
      )}

      <div ref={pagesHostRef} className="mx-auto flex w-full flex-col gap-4" />
    </div>
  );
};

// --- Custom Lock Icon ---
const CustomLockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 12 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 6H10V4C10 1.794 8.206 0 6 0C3.794 0 2 1.794 2 4V6H1.5C0.673333 6 0 6.67267 0 7.5V14.5C0 15.3273 0.673333 16 1.5 16H10.5C11.3267 16 12 15.3273 12 14.5V7.5C12 6.67267 11.3267 6 10.5 6ZM3.33333 4C3.33333 2.52933 4.52933 1.33333 6 1.33333C7.47067 1.33333 8.66667 2.52933 8.66667 4V6H3.33333V4ZM6.66667 11.148V12.6667C6.66667 13.0347 6.36867 13.3333 6 13.3333C5.63133 13.3333 5.33333 13.0347 5.33333 12.6667V11.148C4.93667 10.9167 4.66667 10.4913 4.66667 10C4.66667 9.26467 5.26467 8.66667 6 8.66667C6.73533 8.66667 7.33333 9.26467 7.33333 10C7.33333 10.4913 7.06333 10.9167 6.66667 11.148Z"
      fill="currentColor"
    />
  </svg>
);

export interface AssessmentData {
  id: string;
  attemptId?: string; // UUID from backend
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  status: "completed" | "in-progress" | "locked" | "not-started";
  dateCompleted?: string;
  unlockTime?: string;
  duration?: string;
}

interface AssessmentCardProps extends AssessmentData {
  progress: number;
  onAction: (id: string) => void;
}

// Updated StepStatus to include more states
type StepStatus = "completed" | "in-progress" | "not-started" | "locked";

interface StepperProps {
  overallProgress: number;
  steps: { label: string; status: StepStatus; progress: number }[];
}

interface AssessmentScreenProps {
  onStartAssessment?: () => void;
}

const Stepper: React.FC<StepperProps> = ({ steps }) => {
  const lineCount = Math.max(steps.length - 1, 0);
  const lines = Array.from({ length: lineCount }, (_, i) => i);
  const gap = 4;
  const colCount = steps.length || 1;
  const colWidth = 100 / colCount;
  const maxContainerWidth = Math.min(steps.length * 280, 1000);

  return (
    <div className="w-full flex justify-start md:justify-center mb-6">
      <div
        className="relative grid isolate md:mx-auto w-full transition-all duration-300"
        style={{
          maxWidth: `${maxContainerWidth}px`,
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          minWidth: `${Math.max(steps.length * 120, 280)}px`
        }}
      >
        {lines.map((lineIndex) => {
          const stepForLine = steps[lineIndex];
          if (!stepForLine) return null;

          const assessmentProgress = stepForLine.progress;
          const status = stepForLine.status;

          const center = (colWidth / 2) + (lineIndex * colWidth);
          const leftPosition = center + gap;
          const width = colWidth - (gap * 2);

          return (
            <div
              key={lineIndex}
              className="absolute top-[20px] -translate-y-1/2 h-1.5 -z-20 transition-colors duration-500 rounded-full bg-brand-light-tertiary dark:bg-white/10"
              style={{
                left: `${leftPosition}%`,
                width: `${width}%`,
              }}
            >
              {(status === "completed") && (
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                  style={{ width: `100%` }}
                />
              )}
              {(status === "in-progress") && (
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${assessmentProgress}%` }}
                />
              )}
            </div>
          );
        })}

        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1.5 relative z-10"
          >
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary rounded-full z-20 p-1">
              {step.status === "completed" ? (
                /* Completed - Dot Format (No Tick) */
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center shadow-[0_0_12px_rgba(30,211,106,0.4)]">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : step.status === "in-progress" ? (
                /* In Progress - Green Dot */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center border border-brand-green/20 dark:border-brand-green/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-green shadow-[0_0_8px_#1ED36A]" />
                </div>
              ) : step.status === "not-started" ? (
                /* Not Started - Grey Dot (New Request) */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-white/30" />
                </div>
              ) : (
                /* Locked - Lock Icon */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center transition-all duration-300">
                  <CustomLockIcon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                </div>
              )}
            </div>
            <span
              className={`text-[clamp(9px,0.8vw,11px)] font-semibold text-center mt-1 px-1 break-words max-w-[100px] ${step.status === "locked"
                ? "text-brand-text-light-secondary dark:text-brand-text-secondary opacity-70"
                : "text-brand-text-light-primary dark:text-brand-text-primary"
                }`}
            >
              {step.status === 'locked' ? "Locked" : step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LockTimerProps {
  time: string;
  onTimerExpire?: () => void;
}

const LockTimer: React.FC<LockTimerProps> = ({ time, onTimerExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [percentRemaining, setPercentRemaining] = useState(1); // 0 to 1
  const { language } = useLanguage();
  const t = translations[language];
  const radius = 100;
  const stroke = 12;
  // Path 'd' uses radius 100 (A 100 100), so we must match that for dasharray calculations.
  // Previous calculation (radius - stroke/2) was incorrect for this manually defined path.
  const circumference = radius * Math.PI;

  useEffect(() => {
    let fired = false;
    const calculateTimeLeft = () => {
      const difference = +new Date(time) - +new Date();

      // Calculate progress (Visual scale: 24h)
      // If remaining time > 24h, bar is full.
      const maxVisualDuration = 24 * 60 * 60 * 1000;
      const ratio = Math.max(0, Math.min(difference / maxVisualDuration, 1));
      setPercentRemaining(ratio);

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        return `${hours}h:${minutes}Min`;
      }

      if (!fired && difference <= 0 && onTimerExpire) {
        fired = true;
        onTimerExpire();
        return "0h:00Min";
      }

      return "0h:00Min";
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 30000);
    return () => clearInterval(timer);
  }, [time, onTimerExpire]);

  // If ratio=1 (full time), offset=0 (Full stroke).
  // If ratio=0 (empty), offset=circumference (Empty stroke).
  const strokeDashoffset = circumference * (1 - percentRemaining);

  return (
    <div className="relative w-[100px] h-[55px] flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 224 118">
        <path
          className="stroke-brand-light-tertiary dark:stroke-brand-dark-tertiary"
          d="M 12 106 A 100 100 0 0 1 212 106"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          className="stroke-brand-green transition-all duration-1000 ease-linear"
          d="M 12 106 A 100 100 0 0 1 212 106"
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end mb-1">
        <span className="text-[9px] font-medium text-brand-green py-1.5 tracking-wide mb-0">
          {t.unlocksIn}
        </span>
        <span className="text-base font-bold text-brand-text-light-primary dark:text-white leading-none">
          {timeLeft}
        </span>
      </div>
    </div>
  );
};

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  id,
  title,
  description,
  progress,
  totalQuestions,
  completedQuestions,
  status,
  dateCompleted,
  unlockTime,
  onAction,
}) => {
  const { language } = useLanguage();
  const t = translations[language];

  // Local state to handle auto-unlock when timer expires
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  // Derive status
  // If original status is 'locked' BUT timer has expired, treat as 'not-started'
  const effectiveStatus = (status === "locked" && isTimerExpired) ? "not-started" : status;

  const isLocked = effectiveStatus === "locked";
  const isNotStarted = effectiveStatus === "not-started";
  const showBlurOverlay = isLocked && !unlockTime;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 h-full overflow-hidden ${isLocked
        ? "bg-brand-light-secondary/50 dark:bg-brand-dark-secondary/50 border-brand-light-tertiary dark:border-brand-dark-tertiary/50"
        : "bg-brand-light-secondary dark:bg-brand-dark-secondary border-brand-light-tertiary dark:border-brand-dark-tertiary hover:border-brand-green/50"
        }`}
    >
      <div
        className={`flex flex-col h-full transition-all duration-300 ${showBlurOverlay
          ? "opacity-0"
          : isLocked
            ? "opacity-80"
            : ""
          }`}
        aria-hidden={showBlurOverlay}
      >
        <div className="flex justify-between items-start mb-4 relative z-20">
          <div className="flex flex-col pr-4 flex-grow">
            <h3 className="text-[clamp(13px,1.1vw,16px)] font-bold text-brand-text-light-primary dark:text-brand-text-primary leading-tight mb-2">
              {title}
            </h3>
            <p className="text-[clamp(10px,0.8vw,12px)] w-[90%] text-brand-text-light-secondary dark:text-brand-text-secondary leading-normal">
              {description}
            </p>
          </div>
          {/* Only show timer if actually locked on server (status) and not yet expired locally */}
          {status === "locked" && unlockTime && !isTimerExpired && (
            <LockTimer
              time={unlockTime}
              onTimerExpire={() => setIsTimerExpired(true)}
            />
          )}
        </div>

        <div className="mb-4 mt-auto relative z-20">
          <div className="h-2 w-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-full">
            {!isLocked && !isNotStarted ? (
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-full bg-transparent rounded-full" />
            )}
          </div>
          <div className="flex justify-end mt-1">
            <span className={`text-[10px] font-semibold text-brand-green`}>
              {(isLocked || isNotStarted) && progress === 0
                ? "NA"
                : `${progress}%`}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between relative z-20">
          <div className="flex flex-col gap-0.5">
            <span className="text-[clamp(10px,0.9vw,13px)] font-semibold text-brand-green">
              {completedQuestions}/{totalQuestions}
            </span>
            <span className="text-[clamp(8px,0.7vw,11px)] text-brand-text-light-white dark:text-brand-text-white">
              {effectiveStatus === 'completed' ? `Completed on ${dateCompleted}` : 'Questions Completed'}
            </span>
          </div>
          {!isLocked && (
            <button
              onClick={() => onAction(id)}
              disabled={effectiveStatus === "completed"}
              className={`px-4 py-1.5 rounded-full text-[clamp(8px,0.75vw,11px)] font-medium transition-colors duration-300 ${effectiveStatus === "completed"
                ? "bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-white dark:text-brand-text-white cursor-default"
                : effectiveStatus === "in-progress" || effectiveStatus === "not-started"
                  ? "bg-brand-green text-white hover:bg-brand-green/90 shadow-lg shadow-brand-green/20"
                  : "bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-white dark:text-brand-text-white cursor-not-allowed"
                }`}
            >
              {effectiveStatus === "completed"
                ? t.completed
                : effectiveStatus === "in-progress"
                  ? (completedQuestions === totalQuestions ? t.finish : t.resume)
                  : t.start}
            </button>
          )}
        </div>
      </div>

      {showBlurOverlay && (
        <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl flex flex-col items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-white/95 dark:bg-brand-dark-primary/95 backdrop-blur-md z-10" />
          <svg className="absolute inset-0 w-full h-full z-10 opacity-[0.05]" width="100%" height="100%">
            <pattern id="pattern-circles" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-brand-text-light-primary dark:text-white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#pattern-circles)" />
          </svg>

          <div className="relative z-20 w-16 h-16 mb-4 rounded-3xl bg-gray-100 dark:bg-[#19211C] flex items-center justify-center shadow-lg border border-gray-200 dark:border-white/5">
            <CustomLockIcon className="w-6 h-8 text-gray-400 dark:text-[#9CA3AF]" />
          </div>

          <h4 className="relative z-20 text-lg font-bold text-brand-text-light-primary dark:text-white mb-2 tracking-wide">
            Locked
          </h4>
          <p className="relative z-20 text-xs text-brand-text-light-secondary dark:text-brand-text-secondary max-w-[200px] leading-relaxed">
            Complete previous assessments to unlock this module
          </p>
        </div>
      )}
    </div>
  );
};

const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  onStartAssessment,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null);
  const [fetchedSteps, setFetchedSteps] = useState<any[]>([]);
  const [userName, setUserName] = useState("Student");
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportPdfBytes, setReportPdfBytes] = useState<Uint8Array | null>(null);
  const [reportPdfPassword, setReportPdfPassword] = useState<string | null>(null);
  const [isPdfPreviewLoading, setIsPdfPreviewLoading] = useState(false);
  const [pdfPreviewProgress, setPdfPreviewProgress] = useState('');
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  // Whether we're currently restoring from cache (blocks generation trigger)
  const [isRestoringFromCache, setIsRestoringFromCache] = useState(false);
  const [forceReportPageMode, setForceReportPageMode] = useState(false);
  // Lock ref set IMMEDIATELY (synchronously) to prevent any concurrent generation calls
  const reportGenerationLockRef = useRef(false);
  // Track if cache restore has been attempted this mount
  const cacheRestoreAttemptedRef = useRef(false);

  // Dynamic API URL for Mobile Support

  useEffect(() => {
    const fetchProgress = async () => {
      const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
      setActiveUserEmail(email?.trim().toLowerCase() || null);
      if (email) {
        try {
          const [progressData, profileData] = await Promise.all([
            studentService.getAssessmentProgress(email),
            studentService.getProfile(email)
          ]);

          if (progressData && Array.isArray(progressData)) {
            setFetchedSteps(progressData);
          }
          if (profileData && profileData.metadata?.fullName) {
            setUserName(profileData.metadata.fullName);
          }
          if (profileData?.id) {
            setStudentId(Number(profileData.id));
          }
        } catch (err) {
          console.error("Error fetching assessment data:", err);
        }
      }
      setLoading(false);
    };
    fetchProgress();
  }, []);

  const assessments: AssessmentData[] = useMemo(() => {
    if (fetchedSteps.length === 0) return [];

    return fetchedSteps.map((step, index) => {
      const normalizedStatus = String(step?.status || '').toUpperCase();

      let status: "completed" | "in-progress" | "locked" | "not-started" = "not-started";
      if (normalizedStatus === 'COMPLETED') status = 'completed';
      else if (normalizedStatus === 'IN_PROGRESS') status = 'in-progress';
      else if (normalizedStatus === 'LOCKED') status = 'locked';
      else status = 'not-started';

      const prev = fetchedSteps[index - 1];
      const previousNormalizedStatus = String(prev?.status || '').toUpperCase();
      if (index > 0) {
        if (prev && previousNormalizedStatus !== 'COMPLETED' && status !== 'completed' && status !== 'in-progress') {
          status = 'locked';
        }
      }

      // Robust ID Mapping
      const foundAttemptId = step.id || step.attempt_id || step.assessment_attempt_id || step.uuid;

      return {
        id: String(step.levelNumber || index + 1),
        attemptId: foundAttemptId,
        title: step.stepName,
        description: step.description || step.stepName,
        totalQuestions: step.totalQuestions || ((step.levelNumber === 1 || step.stepName.includes('Level 1')) ? 60 : (step.levelNumber === 2 || step.stepName.includes('ACI') ? 25 : 40)),
        completedQuestions: status === 'completed'
          ? (step.totalQuestions || ((step.levelNumber === 1 || step.stepName.includes('Level 1')) ? 60 : (step.levelNumber === 2 || step.stepName.includes('ACI') ? 25 : 40)))
          : (step.completedQuestions || 0),
        status: status,
        unlockTime: step.unlockTime,
        dateCompleted: step.dateCompleted,
        duration: (step.levelNumber === 1 || step.stepName.includes('Level 1')) ? "60 minutes" : "45 minutes"
      };
    });
  }, [fetchedSteps]);

  const completedAssessmentCount = useMemo(
    () => assessments.filter((assessment) => assessment.status === 'completed').length,
    [assessments],
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const reportReady = completedAssessmentCount >= REPORT_READY_COMPLETION_COUNT;
    setForceReportPageMode(reportReady);

    if (typeof window !== 'undefined') {
      if (reportReady) {
        sessionStorage.setItem(REPORT_READY_STORAGE_KEY, 'true');
        localStorage.setItem(REPORT_READY_STORAGE_KEY, 'true');
        sessionStorage.removeItem('isAssessmentMode');
      } else {
        sessionStorage.removeItem(REPORT_READY_STORAGE_KEY);
        localStorage.removeItem(REPORT_READY_STORAGE_KEY);
      }
    }
  }, [completedAssessmentCount, loading]);

  const { totalQuestions, totalCompleted } = useMemo(() => {
    return assessments.reduce(
      (acc, curr) => ({
        totalQuestions: acc.totalQuestions + curr.totalQuestions,
        totalCompleted: acc.totalCompleted + curr.completedQuestions,
      }),
      { totalQuestions: 0, totalCompleted: 0 }
    );
  }, [assessments]);

  const overallPercentage = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  const isReportPageMode =
    completedAssessmentCount >= REPORT_READY_COMPLETION_COUNT || forceReportPageMode;
  const canPreviewReport = isReportPageMode;

  const loadPdfIntoViewer = async (
    absoluteDownloadUrl: string,
    authContext: SessionAuthContext,
    password?: string | null,
  ) => {
    setPdfPreviewProgress('Loading report document...');

    const pdfResponse = await fetch(absoluteDownloadUrl, {
      headers: buildSecureRequestHeaders(authContext, { Accept: 'application/pdf' }),
      cache: 'no-store',
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(errorText || 'Failed to load report PDF.');
    }

    const pdfBlob = await pdfResponse.blob();
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    setReportPdfBytes(pdfBytes);
    setReportPdfPassword(password?.trim() ? password.trim() : null);

    if (studentId && authContext.userEmail) {
      // Write to IndexedDB + localStorage flag (async, fire-and-forget)
      void writeReportToCache(
        studentId,
        authContext.userEmail,
        pdfBytes,
        password?.trim() ? password.trim() : null,
      );
    }

    setPdfPreviewProgress('');
    setIsPdfPreviewLoading(false);
  };

  const stepperSteps = useMemo(() => assessments.map((assessment) => {
    const isLocked = assessment.status === 'locked';

    let status: StepStatus = 'locked';
    if (assessment.status === 'completed') status = 'completed';
    else if (assessment.status === 'in-progress') status = 'in-progress';
    else if (assessment.status === 'not-started') status = 'not-started';

    if (isLocked) status = 'locked';

    return {
      label: assessment.title,
      status,
      progress: Math.round(
        (assessment.completedQuestions / assessment.totalQuestions) * 100
      ),
    };
  }), [assessments]);

  const handleCardAction = (id: string) => {
    const assessment = assessments.find((a) => a.id === id);
    if (assessment) {
      setSelectedAssessment(assessment);
    }
  };

  const handleStartAssessment = () => {
    if (selectedAssessment?.attemptId) {
      // Optimistic Update: Set status to IN_PROGRESS immediately
      setFetchedSteps((prevSteps) =>
        prevSteps.map((step) => {
          const foundAttemptId = step.id || step.attempt_id || step.assessment_attempt_id || step.uuid;
          if (foundAttemptId === selectedAssessment.attemptId) {
            return { ...step, status: 'IN_PROGRESS' };
          }
          return step;
        })
      );
      router.push(`/student/assessment/start?attempt_id=${selectedAssessment.attemptId}`);
    } else {
      console.error("No attempt ID found. Selected Assessment:", selectedAssessment);
      alert("Error: Unable to start assessment. No Assessment Attempt ID found. Please check console (F12) for details.");
    }

    if (onStartAssessment) {
      onStartAssessment();
    }
    setSelectedAssessment(null);
  };

  // ============================================================
  // CACHE RESTORE: Runs once on mount when studentId is ready.
  // Reads from IndexedDB and populates state BEFORE the
  // generation trigger useEffect can fire.
  // ============================================================
  useEffect(() => {
    if (!studentId || !isReportPageMode || loading) return;
    if (cacheRestoreAttemptedRef.current) return; // Only attempt once per mount
    cacheRestoreAttemptedRef.current = true;

    const authContext = getSessionAuthContext();
    if (!authContext.userEmail) return;

    // SYNC CHECK: Does localStorage flag say we have cached data?
    const hasCacheFlag = hasValidCacheMeta(studentId, authContext.userEmail);
    if (!hasCacheFlag) {
      return;
    }

    // We have a cache flag! Block generation and start async restore.
    setIsRestoringFromCache(true);
    setIsPdfPreviewLoading(true);
    setPdfPreviewError(null);
    setPdfPreviewProgress('Loading cached report...');
    reportGenerationLockRef.current = true; // Block generation immediately

    const restoreFromCache = async () => {
      try {
        const cached = await readReportFromIDB(studentId, authContext.userEmail!);
        if (cached) {
          setReportPdfBytes(cached.pdfBytes);
          setReportPdfPassword(cached.password);
        } else {
          clearCacheMeta();
        }
      } catch (err) {
        console.warn('[ReportCache] Cache restore failed', err);
        clearCacheMeta();
      } finally {
        setIsRestoringFromCache(false);
        setIsPdfPreviewLoading(false);
        setPdfPreviewProgress('');
        reportGenerationLockRef.current = false;
      }
    };

    void restoreFromCache();
  }, [studentId, isReportPageMode, loading]);

  // ============================================================
  // GENERATION TRIGGER: Only fires if there's no cached data
  // AND the cache restore has completed.
  // ============================================================
  const ensureReportPreviewData = async ({
    forceRefresh = false,
    openModal = false,
  }: {
    forceRefresh?: boolean;
    openModal?: boolean;
  } = {}) => {
    if (openModal) {
      setShowReportPreview(true);
    }

    // IMMEDIATE LOCK: Set ref synchronously before any async work
    if (!studentId || reportGenerationLockRef.current) return;
    if (!forceRefresh && (isPdfPreviewLoading || isRestoringFromCache)) return;

    // If we already have PDF bytes in state and not forcing refresh, skip
    if (!forceRefresh && reportPdfBytes) {
      return;
    }

    // Lock IMMEDIATELY to prevent any concurrent calls
    reportGenerationLockRef.current = true;

    const authContext = getSessionAuthContext();

    setPdfPreviewError(null);
    setPdfPreviewProgress('Initializing report preview...');

    if (!authContext.token || !authContext.userEmail) {
      setPdfPreviewError('Your login session has expired. Please login again to view the report securely.');
      setIsPdfPreviewLoading(false);
      setPdfPreviewProgress('');
      reportGenerationLockRef.current = false;
      return;
    }

    if (activeUserEmail && authContext.userEmail !== activeUserEmail) {
      setPdfPreviewError('Session mismatch detected. Please login again with the correct student account.');
      setIsPdfPreviewLoading(false);
      setPdfPreviewProgress('');
      reportGenerationLockRef.current = false;
      return;
    }

    // Try IndexedDB cache one more time (covers edge cases)
    if (!forceRefresh) {
      try {
        const cachedPreview = await readReportFromIDB(studentId, authContext.userEmail);
        if (cachedPreview) {
          setReportPdfBytes(cachedPreview.pdfBytes);
          setReportPdfPassword(cachedPreview.password);
          setIsPdfPreviewLoading(false);
          setPdfPreviewProgress('');
          reportGenerationLockRef.current = false;
          return;
        }
      } catch {
        // Fall through to generation
      }
    }

    // ===== NO CACHE — GENERATE FRESH REPORT =====
    setIsPdfPreviewLoading(true);
    setReportPdfBytes(null);
    setReportPdfPassword(null);

    try {
      const startResponse = await fetch(buildReportApiUrl(`/generate/student/${studentId}`), {
        method: 'GET',
        headers: buildSecureRequestHeaders(authContext, {
          Accept: 'application/json',
        }),
        cache: 'no-store',
      });

      if (!startResponse.ok) {
        const startErrorText = await startResponse.text();
        throw new Error(startErrorText || 'Unable to start secure report generation.');
      }

      const startData = await startResponse.json() as {
        success?: boolean;
        jobId?: string;
      };

      if (!startData?.success || !startData?.jobId) {
        throw new Error('Unable to start report generation.');
      }

      const jobId = String(startData.jobId);
      let attempts = 0;

      while (attempts < REPORT_PDF_POLL_MAX_ATTEMPTS) {
        const statusResponse = await fetch(buildReportApiUrl(`/download/status/${jobId}?json=true`), {
          headers: buildSecureRequestHeaders(authContext, {
            Accept: 'application/json',
          }),
          cache: 'no-store',
        });

        if (!statusResponse.ok) {
          if (statusResponse.status === 404) {
            setPdfPreviewProgress('Preparing report job...');
            attempts += 1;
            await new Promise((resolve) => setTimeout(resolve, REPORT_PDF_POLL_INTERVAL_MS));
            continue;
          }
          const errorText = await statusResponse.text();
          throw new Error(errorText || 'Failed to check report status.');
        }

        const statusData = await statusResponse.json() as {
          status?: string;
          progress?: string;
          downloadUrl?: string;
          password?: string;
          error?: string;
        };

        if (statusData?.status === 'COMPLETED' && statusData?.downloadUrl) {
          const downloadUrl = buildReportDownloadUrl(String(statusData.downloadUrl));
          let autoPassword = statusData?.password || null;

          if (!autoPassword) {
            try {
              const assessmentStatus = await studentService.getAssessmentStatus(studentId);
              autoPassword = assessmentStatus?.reportPassword || null;
            } catch (statusError) {
              console.warn('Unable to fetch fallback report password', statusError);
            }
          }

          await loadPdfIntoViewer(downloadUrl, authContext, autoPassword);
          return;
        }

        if (statusData?.status === 'ERROR') {
          throw new Error(statusData?.error || 'Report generation failed.');
        }

        setPdfPreviewProgress(statusData?.progress || 'Generating report PDF...');
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, REPORT_PDF_POLL_INTERVAL_MS));
      }

      throw new Error('Report generation timed out. Please try again.');
    } catch (error) {
      console.error('Failed to open report PDF preview', error);
      const message =
        error instanceof TypeError
          ? 'Unable to reach report service (network/CORS). Please retry once. If it continues, backend CORS must allow this portal origin.'
          : error instanceof Error
            ? error.message
            : 'Failed to open report preview.';
      setPdfPreviewError(message);
      setIsPdfPreviewLoading(false);
      setPdfPreviewProgress('');
    } finally {
      reportGenerationLockRef.current = false;
    }
  };

  const openReportPreview = async (forceRefresh = false) => {
    await ensureReportPreviewData({ forceRefresh, openModal: true });
  };

  // Auto-trigger generation ONLY when:
  // - In report mode, data loaded, studentId ready
  // - No PDF in state, not loading, not restoring from cache, not locked
  useEffect(() => {
    if (!isReportPageMode || loading || !studentId) return;
    if (reportPdfBytes || isPdfPreviewLoading || isRestoringFromCache) return;
    if (reportGenerationLockRef.current) return;

    void ensureReportPreviewData({ forceRefresh: false, openModal: false });
  }, [
    isReportPageMode,
    loading,
    studentId,
    reportPdfBytes,
    isPdfPreviewLoading,
    isRestoringFromCache,
  ]);

  const handleCloseReportPreview = () => {
    setShowReportPreview(false);
    setPdfPreviewProgress('');
    setPdfPreviewError(null);
  };

  const getReportPdfBlob = () => {
    if (!reportPdfBytes || reportPdfBytes.length === 0) {
      return null;
    }

    const normalizedBytes = new Uint8Array(reportPdfBytes.byteLength);
    normalizedBytes.set(reportPdfBytes);

    return new Blob([normalizedBytes], { type: 'application/pdf' });
  };

  const handleDownloadReportPdf = () => {
    const pdfBlob = getReportPdfBlob();
    if (!pdfBlob) return;

    const objectUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    const suffix = new Date().toISOString().slice(0, 10);

    anchor.href = objectUrl;
    anchor.download = `assessment-report-${studentId || 'student'}-${suffix}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  };

  const handlePrintReportPdf = () => {
    const pdfBlob = getReportPdfBlob();
    if (!pdfBlob) {
      setPdfPreviewError('Report PDF is not ready yet. Please wait a moment and try again.');
      return;
    }

    setPdfPreviewError(null);

    const objectUrl = URL.createObjectURL(pdfBlob);

    const printWindow = window.open(objectUrl, '_blank');
    if (printWindow) {
      let hasTriggeredPrint = false;

      const triggerWindowPrint = () => {
        if (hasTriggeredPrint) {
          return;
        }

        hasTriggeredPrint = true;
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Ignore, iframe fallback below handles blocked/failed cases.
        }
      };

      printWindow.addEventListener('load', triggerWindowPrint, { once: true });
      setTimeout(triggerWindowPrint, 1200);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return;
    }

    const printFrame = document.createElement('iframe');

    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    printFrame.src = objectUrl;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      URL.revokeObjectURL(objectUrl);
      if (printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }
    };

    printFrame.onload = () => {
      try {
        const frameWindow = printFrame.contentWindow;
        if (frameWindow) {
          const handleAfterPrint = () => {
            frameWindow.removeEventListener('afterprint', handleAfterPrint);
            cleanup();
          };

          frameWindow.addEventListener('afterprint', handleAfterPrint);
          frameWindow.focus();
          frameWindow.print();
          // Fallback cleanup for browsers that do not fire afterprint reliably.
          setTimeout(cleanup, 30000);
        }
      } finally {
        setTimeout(cleanup, 30000);
      }
    };

    printFrame.onerror = () => {
      cleanup();
      setPdfPreviewError('Unable to open print preview. Please use Download and print from the saved file.');
    };

    document.body.appendChild(printFrame);
  };

  const reportPreviewModal = showReportPreview && (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleCloseReportPreview}
      />

      <div className="relative mt-[clamp(70px,7.6vh,100px)] h-[calc(100%-clamp(70px,7.6vh,100px))] w-full p-2 md:p-4">
        <div className="relative h-full w-full rounded-2xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#0F1419] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-brand-light-tertiary dark:border-white/10">
            <h2 className="text-base md:text-lg font-semibold text-brand-text-light-primary dark:text-white">
              Assessment Report PDF Preview
            </h2>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {!isPdfPreviewLoading && !pdfPreviewError && reportPdfBytes && (
                <>
                  <button
                    onClick={handlePrintReportPdf}
                    className="px-4 py-2 rounded-full border border-[#EEF4F1] dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#19211C] dark:text-white hover:bg-[#F7FAF8] dark:hover:bg-white/15 transition-colors"
                  >
                    Print
                  </button>

                  <button
                    onClick={handleDownloadReportPdf}
                    className="px-4 py-2 rounded-full border border-brand-green bg-brand-green text-white text-xs font-semibold hover:bg-brand-green/90 transition-colors"
                  >
                    Download
                  </button>
                </>
              )}

              <button
                onClick={handleCloseReportPreview}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close report preview"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-brand-light-primary dark:bg-black overflow-auto">
            {isPdfPreviewLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-10 p-6 text-center">
                <Spinner className="w-10 h-10 text-brand-green" />
                <p className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                  {pdfPreviewProgress || 'Preparing report PDF...'}
                </p>
                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">
                  This opens the full report with scroll and all pages.
                </p>
              </div>
            )}

            {!isPdfPreviewLoading && pdfPreviewError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                  {pdfPreviewError}
                </p>
                <button
                  onClick={() => { void openReportPreview(true); }}
                  className="px-4 py-2 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green/90 transition-colors"
                >
                  Retry Preview
                </button>
              </div>
            )}

            {!isPdfPreviewLoading && !pdfPreviewError && reportPdfBytes && (
              <ResponsivePdfRenderer
                pdfBytes={reportPdfBytes}
                password={reportPdfPassword}
              />
            )}

            {!isPdfPreviewLoading && !pdfPreviewError && !reportPdfBytes && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary">
                  Report preview is being prepared.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const reportIsReady = Boolean(reportPdfBytes) && !pdfPreviewError;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <Spinner className="w-10 h-10 text-brand-green" />
      </div>
    );
  }

  if (!loading && assessments.length === 0 && !isReportPageMode) {
    return (
      <div className="relative min-h-screen bg-transparent font-sans transition-colors duration-300 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="p-20 text-center text-brand-text-light-primary dark:text-white text-lg">{t.noAssessments}</div>
        </div>
      </div>
    );
  }

  if (isReportPageMode) {
    return (
      <div className="relative min-h-screen bg-transparent font-sans transition-colors duration-300 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 w-full max-w-[2000px] mx-auto">
          <div className="flex items-center text-xs text-black dark:text-white font-normal flex-wrap">
            <Link
              href="/student/dashboard"
              className="hover:text-gray-700 dark:hover:text-[#1ED36A] transition-colors"
            >
              Dashboard
            </Link>
            <span className="mx-2 text-gray-400 dark:text-gray-600">
              <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
            </span>
            <span className="text-brand-green font-semibold">Report</span>
          </div>

          <div className="rounded-[24px] bg-white dark:bg-white/[0.08] border border-[#EEF4F1] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(25,33,28,0.04)] dark:shadow-none p-7 lg:p-[1.5vw] flex flex-col items-center justify-center text-center gap-3 min-h-[180px] transition-colors duration-300 hover:border-[#EAF1ED] dark:hover:border-white/[0.2]">
            <h1 className="font-semibold text-[#19211C] dark:text-white text-[clamp(20px,2vw,42px)] leading-tight">
              You have successfully completed the assessment <span aria-hidden="true">🎉</span>
            </h1>
            <p className="text-[#19211C]/70 dark:text-white/70 text-sm lg:text-[0.95vw] leading-relaxed max-w-3xl mx-auto">
              Your report is being generated. Once ready, it is available below and also shared to your registered mail.
            </p>

            {isPdfPreviewLoading && (
              <p className="text-brand-green text-sm lg:text-[0.95vw] font-medium text-center">
                {pdfPreviewProgress || 'Generating report...'}
              </p>
            )}
          </div>

          <div className="rounded-[24px] bg-white dark:bg-white/[0.08] border border-[#EEF4F1] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(25,33,28,0.04)] dark:shadow-none h-[68vh] min-h-[440px] flex flex-col overflow-hidden transition-colors duration-300 hover:border-[#EAF1ED] dark:hover:border-white/[0.2]">
            <div className="px-6 pt-6 pb-4 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.833vw] flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-semibold text-[#19211C] dark:text-white text-[18px]">Your Report Document</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { void openReportPreview(); }}
                  className="px-4 py-2 rounded-full border border-[#EEF4F1] dark:border-white/10 bg-white dark:bg-white/10 text-xs lg:text-[0.833vw] font-semibold text-[#19211C] dark:text-white hover:bg-[#F7FAF8] dark:hover:bg-white/15 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Open Fullpage View
                </button>

                <button
                  onClick={handlePrintReportPdf}
                  disabled={!reportIsReady}
                  className="px-4 py-2 rounded-full border border-[#EEF4F1] dark:border-white/10 bg-white dark:bg-white/10 text-xs lg:text-[0.833vw] font-semibold text-[#19211C] dark:text-white hover:bg-[#F7FAF8] dark:hover:bg-white/15 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Print
                </button>

                <button
                  onClick={handleDownloadReportPdf}
                  disabled={!reportIsReady}
                  className="px-4 py-2 rounded-full border border-brand-green bg-brand-green text-white text-xs lg:text-[0.833vw] font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Download
                </button>
              </div>
            </div>
            <hr className="border-[#19211C]/6 dark:border-white/10" />

            {isPdfPreviewLoading && !reportPdfBytes && (
              <div className="flex-1 w-full px-6 pt-4 pb-6 lg:px-[1.25vw] lg:pt-[0.41vw] lg:pb-[0.833vw] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Spinner className="w-6 h-6 text-brand-green" />
                  <p className="text-sm font-medium text-[#19211C] dark:text-white">
                    {pdfPreviewProgress || 'Preparing report PDF...'}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="h-7 rounded-lg bg-white/80 dark:bg-white/10 animate-pulse" />
                  <div className="h-7 rounded-lg bg-white/80 dark:bg-white/10 animate-pulse" />
                  <div className="h-7 rounded-lg bg-white/80 dark:bg-white/10 animate-pulse" />
                </div>
                <div className="flex-1 rounded-xl border border-dashed border-[#19211C]/6 dark:border-white/10 bg-white/60 dark:bg-white/5" />
              </div>
            )}

            {!isPdfPreviewLoading && pdfPreviewError && (
              <div className="flex-1 w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm font-semibold text-red-500 dark:text-red-400 max-w-3xl">
                  {pdfPreviewError}
                </p>
              </div>
            )}

            {!showReportPreview && !isPdfPreviewLoading && !pdfPreviewError && reportPdfBytes && (
              <ResponsivePdfRenderer
                pdfBytes={reportPdfBytes}
                password={reportPdfPassword}
              />
            )}

            {!isPdfPreviewLoading && !pdfPreviewError && !reportPdfBytes && (
              <div className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center gap-3">
                <p className="text-sm font-medium text-[#19211C]/60 dark:text-white/60">
                  Report is in queue. Please wait while we prepare it.
                </p>
              </div>
            )}
          </div>
        </div>

        {reportPreviewModal}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent font-sans transition-colors duration-300 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 w-full max-w-[2000px] mx-auto">
        <div className="mb-4 overflow-x-auto pb-4 px-4 scrollbar-hide md:overflow-visible md:pb-0 md:mx-0 md:px-0">
          <Stepper overallProgress={overallPercentage} steps={stepperSteps} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="w-full md:w-auto">
            <h1 className="text-[clamp(18px,1.8vw,28px)] font-semibold text-brand-text-light-primary dark:text-brand-text-primary mb-1">
              {t.hello} {userName}
            </h1>
            <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-[clamp(10px,0.8vw,12px)] max-w-xl">
              {t.subtitle}
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 md:items-end">
            <div
              className="relative overflow-hidden rounded-r-2xl rounded-l-none p-3 min-w-[160px] text-white self-start md:self-center w-full md:w-auto text-right"
              style={{
                background: "linear-gradient(90deg, transparent 0%, #1ED36A 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <p className="text-[clamp(8px,0.7vw,10px)] opacity-90 mb-0.5 text-white">
                {t.overall}
              </p>
              <p className="text-[clamp(16px,1.5vw,22px)] font-semibold text-white">
                {overallPercentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              {...assessment}
              progress={Math.round(
                (assessment.completedQuestions / assessment.totalQuestions) * 100
              )}
              onAction={handleCardAction}
            />
          ))}
        </div>

        <AssessmentModal
          isOpen={!!selectedAssessment}
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onStart={handleStartAssessment}
        />

        {reportPreviewModal}
      </div>
    </div>
  );
};

export default AssessmentScreen;
