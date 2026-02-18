import { AuthService } from "./auth.service";
import { PaginatedResponse } from "../types";

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
        // This connects to the report service via the proxy or direct URL if configured
        // Based on previous files, it seems we might need to hit the report service URL directly or via a specific path
        // However, the existing patterns use API_URL. Let's assume the report routes are exposed via the same gateway/proxy.
        // If not, we might need a separate REPORT_API_URL.
        // Looking at GroupAssessmentPreview.tsx, it uses process.env.NEXT_PUBLIC_REPORT_API_BASE_URL

        const REPORT_API_URL =
            process.env.NEXT_PUBLIC_REPORT_API_BASE_URL ||
            "http://localhost:4006";

        const res = await fetch(
            `${REPORT_API_URL}/generate/student/${studentId}?json=true`,
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

    async getDownloadStatus(
        jobId: string,
    ): Promise<{
        status: string;
        progress?: string;
        downloadUrl?: string;
        error?: string;
    }> {
        const REPORT_API_URL =
            process.env.NEXT_PUBLIC_REPORT_API_BASE_URL ||
            "http://localhost:4006";

        const res = await fetch(
            `${REPORT_API_URL}/download/status/${jobId}?json=true`,
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
};
