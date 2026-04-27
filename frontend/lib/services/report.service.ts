import { AuthService } from "./auth.service";
import { buildReportApiUrl } from "../utils/reportUrl";

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_MOCKS === "false";

const simulateDelay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const getSessionToken = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return (
        sessionStorage.getItem("idToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("originbi_id_token") ||
        AuthService.getToken()
    );
};

const buildSecureHeaders = (baseHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...baseHeaders };
    const token = getSessionToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

export const reportService = {
    async downloadReport(
        userId: string,
        reportType: "full" | "summary",
    ): Promise<Blob> {
        if (!USE_REAL_API) {
            await simulateDelay(1500);
            return new Blob(["Mock PDF Content"], { type: "application/pdf" });
        }
        const token = AuthService.getToken();
        const res = await fetch(
            buildReportApiUrl(`/reports/${userId}?type=${reportType}`),
            {
                method: "GET",
                headers: buildSecureHeaders({
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                }),
            },
        );

        if (!res.ok) throw new Error("Failed to generate report");
        return res.blob();
    },
    async generateStudentReport(studentId: string) {
        try {
            const res = await fetch(
                buildReportApiUrl(`/generate/student/${studentId}`),
                {
                    method: "GET",
                    headers: buildSecureHeaders({
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    }),
                    cache: "no-store",
                },
            );
            if (!res.ok) throw new Error("Failed to start report generation");
            return await res.json();
        } catch (error) {
            console.error("Generate student report failed", error);
            throw error;
        }
    },

    async checkStatus(jobId: string) {
        try {
            const res = await fetch(
                buildReportApiUrl(`/download/status/${jobId}?json=true`),
                {
                    headers: buildSecureHeaders({
                        Accept: "application/json",
                    }),
                    cache: "no-store",
                },
            );
            if (!res.ok) throw new Error("Failed to check status");
            return await res.json();
        } catch (error) {
            console.error("Check status failed", error);
            throw error;
        }
    },
};
