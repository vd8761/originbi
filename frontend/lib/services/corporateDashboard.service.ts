import { AuthService } from "./auth.service";
import { CorporateAccount } from "@/lib/types";

// Should be changed to Corporate Service URL (4003)
const API_URL =
    process.env.NEXT_PUBLIC_CORPORATE_SERVICE_URL || "http://127.0.0.1:4003";

export const corporateDashboardService = {
    async getProfile(email: string): Promise<any> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/profile?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch profile");
        }

        return res.json();
    },

    async getStats(email: string): Promise<any> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/stats?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch dashboard stats");
        }

        return res.json();
    },

    async getLedger(email: string, page = 1, limit = 10, search = ''): Promise<{ data: any[], total: number }> {
        const token = AuthService.getToken();
        const res = await fetch(
            `${API_URL}/dashboard/ledger?email=${encodeURIComponent(email)}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch ledger");
        }

        return res.json();
    },

    async topUpCredits(email: string, amount: number, reason: string) {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/top-up`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ email, amount, reason }),
        });

        if (!res.ok) {
            throw new Error("Failed to top up credits");
        }

        return res.json();
    },

    async createOrder(email: string, creditCount: number, reason?: string) {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ email, creditCount, reason }),
        });

        if (!res.ok) {
            throw new Error("Failed to create order");
        }
        return res.json();
    },

    async verifyPayment(email: string, paymentDetails: any) {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ email, paymentDetails }),
        });

        if (!res.ok) {
            throw new Error("Failed to verify payment");
        }
        return res.json();
    },

    async recordPaymentFailure(orderId: string, description: string) {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/dashboard/record-payment-failure`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ orderId, description }),
        });

        if (!res.ok) {
            // Log but don't block
            console.error("Failed to record payment failure");
            return { success: false };
        }
        return res.json();
    },

    async getMyEmployees(email: string, page = 1, limit = 10, search = '', filters: { start_date?: string, end_date?: string } = {}) {
        const token = AuthService.getToken();
        const query = new URLSearchParams({
            email,
            page: String(page),
            limit: String(limit),
            search,
            ...(filters.start_date && { startDate: filters.start_date }),
            ...(filters.end_date && { endDate: filters.end_date }),
        });

        const res = await fetch(
            `${API_URL}/dashboard/my-employees?${query.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch employees");
        }

        return res.json();
    },

    async getAssessmentSessions(
        email: string,
        page = 1,
        limit = 10,
        search = '',
        sortBy = '',
        sortOrder: 'ASC' | 'DESC' = 'DESC',
        filters: { start_date?: string, end_date?: string, status?: string, userId?: number, type?: string } = {}
    ) {
        const token = AuthService.getToken();
        const query = new URLSearchParams({
            email,
            page: String(page),
            limit: String(limit),
            search,
            sortBy,
            sortOrder,
            ...(filters.start_date && { startDate: filters.start_date }),
            ...(filters.end_date && { endDate: filters.end_date }),
            ...(filters.status && { status: filters.status }),
            ...(filters.userId && { userId: String(filters.userId) }),
            ...(filters.type && { type: filters.type }),
        });

        const res = await fetch(`${API_URL}/dashboard/assessment-sessions?${query.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch assessment sessions");
        }

        return res.json();
    }
};
