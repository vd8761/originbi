"use client";

import { useRouter, useSearchParams } from "next/navigation";
import IatExam from "../../../components/student/iat/IatExam";

export default function IatPage() {
  const params = useSearchParams();
  const router = useRouter();
  const attemptId = params.get("attemptId");

  if (!attemptId) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-light-primary px-6 text-brand-text-light-primary dark:bg-brand-dark-primary dark:text-white">
        <div className="max-w-md rounded-3xl border border-brand-light-tertiary bg-white/80 p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#19211C]/80">
          <h1 className="text-xl font-bold">Missing attempt</h1>
          <p className="mt-2 text-sm text-brand-text-light-secondary dark:text-white/60">
            This page needs an{" "}
            <code className="rounded bg-brand-light-tertiary px-1.5 py-0.5 dark:bg-white/10">
              attemptId
            </code>{" "}
            to load your assessment.
          </p>
          <button
            onClick={() => router.push("/student/assessment")}
            className="mt-6 rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return <IatExam attemptId={attemptId} onExit={() => router.push("/student/assessment")} />;
}
