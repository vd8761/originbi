"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Level2Exam from "../../../components/student/level2/Level2Exam";

function Level2ExamRoute() {
    const params = useSearchParams();
    const router = useRouter();
    const attemptId = params.get("attemptId") || params.get("attempt_id");

    if (!attemptId) {
        return (
            <div style={{ padding: 40, color: "#888", backgroundColor: "#0A0E0C", minHeight: "100vh" }}>
                Missing <code>attemptId</code>. Open this page as
                <code> /student/level2?attemptId=&lt;id&gt;</code>.
            </div>
        );
    }
    return <Level2Exam attemptId={attemptId} onExit={() => router.push("/student/assessment")} />;
}

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 40, color: "#fff", backgroundColor: "#0A0E0C", minHeight: "100vh" }}>Loading…</div>}>
            <Level2ExamRoute />
        </Suspense>
    );
}
