import { AuthService } from "./auth.service";

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_MOCKS === "false";
const API_URL =
    process.env.NEXT_PUBLIC_REPORT_API_URL || "http://localhost:4006";

const simulateDelay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
            `${API_URL}/reports/${userId}?type=${reportType}`,
            {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            },
        );

        if (!res.ok) throw new Error("Failed to generate report");
        return res.blob();
    },
    async generateStudentReport(studentId: string) {
        try {
            const res = await fetch(
                `${API_URL}/generate/student/${studentId}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
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
                `${API_URL}/download/status/${jobId}?json=true`,
                {
                    headers: { Accept: "application/json" },
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
