import { AuthService } from "./auth.service";
import { PaginatedResponse } from "../types";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000";

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
        assessment_title: string;
    };
}

export const assessmentService = {
    async getSessions(
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC",
        filters?: { start_date?: string; end_date?: string; status?: string }
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

        const token = AuthService.getToken();

        const res = await fetch(`${API_URL}/admin/assessments/sessions?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch assessment sessions");
        }

        return res.json();
    },
};
