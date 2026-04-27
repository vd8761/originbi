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

    async generateStudentReport(
        studentId: string,
    ): Promise<{ success: boolean; jobId: string; statusUrl: string }> {
        const res = await fetch(
            buildReportApiUrl(`/generate/student/${studentId}?json=true`),
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
};
