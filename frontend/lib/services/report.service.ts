import { AuthService } from "./auth.service";

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_MOCKS === 'false';
const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4001";

const simulateDelay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const reportService = {
    async downloadReport(
        userId: string,
        reportType: "full" | "summary"
    ): Promise<Blob> {
        if (!USE_REAL_API) {
            await simulateDelay(1500);
            return new Blob(["Mock PDF Content"], { type: "application/pdf" });
        }
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/reports/${userId}?type=${reportType}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to generate report");
        return res.blob();
    },
};
