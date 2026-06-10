import { AuthService } from "./auth.service";
import { PaginatedResponse } from "../types";
import { buildReportApiUrl } from "../utils/reportUrl";

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;

export interface AssessmentSession {
    id: string;
    userId: string;
    registrationId: string;
    programId: string;
    status: string;
    validFrom?: string;
    validTo?: string;
    createdAt: string;
    user?: {
        email: string;
    };
    program?: {
        name: string;
        assessment_title?: string;
        assessmentTitle?: string;
    };
    registration?: {
        fullName?: string;
        gender?: string;
        mobileNumber?: string;
        countryCode?: string;
        email?: string;
    };
    groupAssessment?: any; // GroupAssessment interface can be defined separately if needed
    groupName?: string;
    totalCandidates?: number;
    currentLevel?: number;
    totalLevels?: number;
    groupId?: number;
    isReportReady?: boolean;
    metadata?: any;
    currentAttempt?: any;
    attempts?: any[];
    // Bulk email data from sessions list
    emailSent?: boolean | null;
    emailSentTo?: string | null;
}

export interface MetaphorReportStatus {
    attempt: { id: number; status: string; startedAt?: string; completedAt?: string } | null;
    total: number;
    answered: number;
    missing: number;
    readyForReport: boolean;
    answers: Array<{
        id: number;
        sequence: number;
        status: string;
        spokenLanguage: string | null;
        webTranscript: string | null;
        finalTranscript: string | null;
        englishText: string | null;
        translationStatus: string;
        transcriptionStatus: string;
        transcriptionSource: string | null;
        transcriptionError: string | null;
        transcriptionRetryCount: number;
        transcriptionNextRetryAt: string | null;
        contextEn: string | null;
        contextTa: string | null;
        questionEn: string | null;
        questionTa: string | null;
        imageUrl: string | null;
        imageDescriptionEn: string | null;
        imageDescriptionTa: string | null;
    }>;
    job: {
        id: number;
        status: string;
        retryCount: number;
        maxRetries: number;
        nextRetryAt: string | null;
        lastError: string | null;
        startedAt: string | null;
        completedAt: string | null;
        updatedAt: string | null;
    } | null;
    report: {
        id: number;
        model: string | null;
        markdown: string;
        generatedAt: string | null;
        updatedAt: string | null;
    } | null;
}

export interface IatReportStatus {
    attempt: { id: number; status: string; startedAt?: string; completedAt?: string } | null;
    total: number;
    completed: number;
    modules: Array<{
        id: number;
        order: number;
        status: string;
        compatibleAverageMs: string | null;
        incompatibleAverageMs: string | null;
        speedGapMs: string | null;
        pattern: string | null;
        slowestWords: string[];
        errorWords: string[];
        errorRate: string | null;
        code: string;
        name: string;
        displayName: string;
    }>;
    job: {
        id: number;
        status: string;
        retryCount: number;
        maxRetries: number;
        nextRetryAt: string | null;
        lastError: string | null;
        startedAt: string | null;
        completedAt: string | null;
        updatedAt: string | null;
    } | null;
    report: {
        id: number;
        status: string;
        model: string | null;
        reportText: string | null;
        biasMap: any[];
        error: string | null;
        generatedAt: string | null;
        updatedAt: string | null;
    } | null;
}

export const assessmentService = {
    async getSessions(
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
        filters?: {
            start_date?: string;
            end_date?: string;
            status?: string;
            userId?: string;
            type?: "individual" | "group";
            emailStatus?: 'sent' | 'not_sent' | 'third_party';
            groupBy?: "group" | "assessment";
        },
    ): Promise<PaginatedResponse<AssessmentSession>> {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (search && search.trim()) params.set("search", search.trim());
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        if (filters?.start_date) params.set("startDate", filters.start_date);
        if (filters?.end_date) params.set("endDate", filters.end_date);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.userId) params.set("userId", filters.userId);
        if (filters?.type) params.set("type", filters.type);
        if (filters?.emailStatus) params.set("emailStatus", filters.emailStatus);
        // Combined "By Group" aggregation (one row per group+program).
        if (filters?.type === "group" && filters?.groupBy === "group")
            params.set("groupBy", "group");

        const token = AuthService.getToken();

        const res = await fetch(
            `${API_URL}/admin/assessments/sessions?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            },
        );

        if (!res.ok) {
            throw new Error("Failed to fetch assessment sessions");
        }

        return res.json();
    },

    async sendBulkReportEmails(userIds: number[]): Promise<{ message: string; enqueued: number; failed: number[] }> {
        const STUDENT_API_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002';
        const token = AuthService.getToken();
        const res = await fetch(`${STUDENT_API_URL}/student/send-bulk-report-emails`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ userIds }),
        });
        if (!res.ok) throw new Error('Failed to queue bulk emails');
        return res.json();
    },
    async getLevels(): Promise<any[]> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/levels`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to fetch assessment levels");
        return res.json();
    },

    async getSessionDetails(id: string): Promise<AssessmentSession> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/sessions/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok)
            throw new Error("Failed to fetch assessment session details");
        return res.json();
    },

    async getGroupSession(id: string): Promise<any> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/group/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok)
            throw new Error("Failed to fetch group assessment details");
        return res.json();
    },

    async getSurveyAnswers(sessionId: string | number): Promise<{
        setNumber: number | null;
        total: number;
        answered: number;
        answers: Array<{
            sequence: number;
            questionId: number;
            setNumber: number | null;
            theme: string | null;
            contextEn: string | null;
            contextTa: string | null;
            questionEn: string | null;
            questionTa: string | null;
            status: string;
            answered: boolean;
            selectedOptionId: number | null;
            options: Array<{ id: number; displayOrder: number; textEn: string | null; textTa: string | null; selected: boolean }>;
        }>;
    }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/sessions/${sessionId}/survey-answers`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to fetch survey answers");
        return res.json();
    },

    async getMetaphorReport(sessionId: string | number): Promise<MetaphorReportStatus> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/sessions/${sessionId}/metaphor-report`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to fetch metaphor report");
        return res.json();
    },

    async downloadMetaphorReportPdf(attemptId: string | number): Promise<Blob> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/metaphor/${attemptId}/report/pdf`, {
            method: "GET",
            headers: {
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to download metaphor report PDF");
        return res.blob();
    },

    async retryMetaphorReport(attemptId: string | number): Promise<{ success: boolean; queued?: boolean; reason?: string }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/metaphor/${attemptId}/report/retry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to retry metaphor report");
        return res.json();
    },

    async getIatReport(sessionId: string | number): Promise<IatReportStatus> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/sessions/${sessionId}/iat-report`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to fetch IAT report");
        return res.json();
    },

    async retryIatReport(attemptId: string | number): Promise<{ success: boolean; queued?: boolean; reason?: string }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/assessments/iat/${attemptId}/report/retry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to retry IAT report");
        return res.json();
    },

    async getGroupCombined(groupId: string | number, programId: string | number): Promise<any> {
        const token = AuthService.getToken();
        const res = await fetch(
            `${API_URL}/admin/assessments/group-combined/${groupId}/${programId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            },
        );
        if (!res.ok)
            throw new Error("Failed to fetch combined group details");
        return res.json();
    },

    async getGroupDepartmentStats(
        groupId: string,
    ): Promise<{ departments: any[] }> {
        const token = AuthService.getToken();
        const res = await fetch(
            `${API_URL}/admin/assessments/group/${groupId}/department-stats`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            },
        );
        if (!res.ok) throw new Error("Failed to fetch group department stats");
        return res.json();
    },

    /**
     * Starts generation of a student report.
     * @param studentId  the student/user id
     * @param reportType `'short'` for the program short report, `'level1'` for
     *                   the Level 1 Behavioural (DISC-only) report. Omit for the
     *                   full report. A boolean `true` is accepted for backward
     *                   compatibility and maps to `'short'`.
     */
    async generateStudentReport(
        studentId: string,
        reportType?: boolean | 'short' | 'level1',
    ): Promise<{ success: boolean; jobId: string; statusUrl: string }> {
        const variant =
            reportType === true ? 'short' : reportType || undefined;
        const query = variant ? `&reportType=${variant}` : '';
        const res = await fetch(
            buildReportApiUrl(`/generate/student/${studentId}?json=true${query}`),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (!res.ok) {
            throw new Error("Failed to start report generation");
        }
        return res.json();
    },

    async getDownloadStatus(jobId: string): Promise<{
        status: string;
        progress?: string;
        downloadUrl?: string;
        error?: string;
    }> {
        const res = await fetch(
            buildReportApiUrl(`/download/status/${jobId}?json=true`),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (!res.ok) {
            throw new Error("Failed to fetch download status");
        }
        return res.json();
    },

    async sendReportEmail(
        userId: string,
        toEmail?: string,
    ): Promise<{ message: string }> {
        const STUDENT_API_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL || "";

        const res = await fetch(
            `${STUDENT_API_URL}/student/send-report-email`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: Number(userId), toEmail }),
            },
        );

        if (!res.ok) {
            throw new Error("Failed to send report email");
        }
        return res.json();
    },

    async getEligibleCandidatesForGroupAssessment(
        groupAssessmentId: string | number,
        search?: string,
    ): Promise<{
        registrationId: number;
        userId: number;
        fullName: string;
        email: string | null;
        mobileNumber: string;
        countryCode: string;
    }[]> {
        const token = AuthService.getToken();
        const params = new URLSearchParams();
        if (search && search.trim()) params.set("search", search.trim());
        const qs = params.toString();
        const res = await fetch(
            `${API_URL}/admin/assessments/group/${groupAssessmentId}/eligible-candidates${qs ? `?${qs}` : ""}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            },
        );
        if (!res.ok) return [];
        return res.json();
    },

    async addCandidateToGroupAssessment(
        groupAssessmentId: string | number,
        registrationId: number,
    ): Promise<{
        groupAssessmentId: number;
        sessionId: number;
        registrationId: number;
        totalCandidates: number;
    }> {
        const token = AuthService.getToken();
        const res = await fetch(
            `${API_URL}/admin/assessments/group/${groupAssessmentId}/candidates`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify({ registrationId }),
            },
        );
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || "Failed to add candidate");
        }
        return res.json();
    },

    async assignGroupExam(payload: {
        groupId: number;
        programId: number;
        examStart?: string;
        examEnd?: string;
        sendEmail?: boolean;
    }): Promise<{
        groupAssessmentId: number;
        totalRegistrations: number;
        created: number;
        skipped: number;
        failed: number;
        failures: { registrationId: number; reason: string }[];
    }> {
        const token = AuthService.getToken();
        const res = await fetch(
            `${API_URL}/admin/assessments/assign-group-exam`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify(payload),
            },
        );
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || "Failed to assign group exam");
        }
        return res.json();
    },
};
