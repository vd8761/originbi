"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MetaphorExam from "../../../components/student/metaphor/MetaphorExam";

function MetaphorExamRoute() {
    const params = useSearchParams();
    const router = useRouter();
    const attemptId = params.get("attemptId");

    if (!attemptId) {
        return (
            <div style={{ padding: 40, color: "#888" }}>
                Missing <code>attemptId</code>. Open this page as
                <code> /student/metaphor?attemptId=&lt;id&gt;</code>.
            </div>
        );
    }
    return <MetaphorExam attemptId={attemptId} onExit={() => router.push("/student")} />;
}

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
            <MetaphorExamRoute />
        </Suspense>
    );
}
