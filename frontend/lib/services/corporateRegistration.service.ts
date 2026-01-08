import { CorporateAccount, CreateCorporateRegistrationDto, PaginatedResponse } from "@/lib/types";
import { AuthService } from "./auth.service";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4001";

export const corporateRegistrationService = {
    // List registrations with pagination + search
    async getRegistrationsList(
        page: number,
        limit: number,
        search: string,
        sortBy?: string,
        sortOrder?: "ASC" | "DESC"
    ): Promise<PaginatedResponse<CorporateAccount>> {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (search.trim()) {
            params.set("search", search.trim());
        }
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);

        const token = AuthService.getToken();

        const res = await fetch(
            `${API_URL}/admin/corporate-accounts?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch corporate registrations");
        }

        const body = await res.json();
        return body; // Expecting PaginatedResponse<CorporateAccount>
    },

    // Create new registration
    async createRegistration(
        payload: CreateCorporateRegistrationDto
    ): Promise<CorporateAccount> {
        const token = AuthService.getToken();

        const res = await fetch(`${API_URL}/admin/corporate-accounts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || "Failed to create corporate registration");
        }

        return res.json();
    },

    // Toggle active/inactive
    async toggleStatus(id: string, is_active: boolean): Promise<void> {
        const token = AuthService.getToken();

        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ is_active }),
        });

        if (!res.ok) {
            throw new Error("Failed to update status");
        }
    },

    // Get single details
    async getRegistrationById(id: string): Promise<CorporateAccount> {
        const token = AuthService.getToken();

        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error("Failed to fetch registration details");
        }

        return res.json();
    },

    // Update credits
    async updateCredits(id: string, credits: number): Promise<void> {
        const token = AuthService.getToken();

        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}/credits`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ credits }),
        });

        if (!res.ok) {
            throw new Error("Failed to update credits");
        }
    },

    // Top up credits
    async topUpCredits(id: string, amount: number, reason?: string): Promise<{ success: boolean; newAvailable: number; newTotal: number }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}/top-up`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ amount, reason }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || "Failed to top up credits");
        }
        return res.json();
    },

    // Get Ledger
    async getLedger(id: string, page = 1, limit = 10): Promise<{ data: import("../types").CorporateCreditLedger[], total: number }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}/ledger?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error("Failed to fetch credit ledger");
        }
        return res.json();
    },
    // Delete
    async deleteRegistration(id: string): Promise<void> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
        if (!res.ok) throw new Error("Failed to delete registration");
    },

    // Update (General)
    async updateRegistration(id: string, data: Partial<CreateCorporateRegistrationDto>): Promise<CorporateAccount> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update registration");
        return res.json();
    },

    // Block/Unblock
    async toggleBlockStatus(id: string, isBlocked: boolean): Promise<void> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/admin/corporate-accounts/${id}/block`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ is_blocked: isBlocked }),
        });
        if (!res.ok) throw new Error("Failed to update status");
    },

    // -------------------------------------------------------------
    // Bulk Upload (Corporate Self-Service)
    // -------------------------------------------------------------
    // Note: These endpoints point to Corporate Service, not Admin Service
    // We assume backend runs on Port 4003 or via Gateway.
    // For now, let's assume we use a BASE_CORP_URL or similar.

    // Preview CSV
    async bulkPreview(file: File, userId: string): Promise<{ importId: string; rows: any[] }> {
        const token = AuthService.getToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId); // Pass context

        // Assuming direct call to Corporate Service (4003) or via Gateway
        // Adjust URL based on your network config.
        const CORP_API = process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || 'http://127.0.0.1:4003';

        const res = await fetch(`${CORP_API}/corporate/registrations/bulk/preview`, {
            method: 'POST',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || 'Failed to preview CSV file');
        }
        return res.json();
    },

    // Execute Bulk Import
    async bulkExecute(importId: string, overrides: any[]): Promise<void> {
        const token = AuthService.getToken();
        const CORP_API = process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || 'http://127.0.0.1:4003';

        const res = await fetch(`${CORP_API}/corporate/registrations/bulk/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ importId, overrides }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || 'Failed to execute bulk import');
        }
    },

    // Get Bulk Job Status
    async getBulkJobStatus(importId: string): Promise<{ status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; total: number; success: number; failed: number }> {
        const token = AuthService.getToken();
        const CORP_API = process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || 'http://127.0.0.1:4003';

        const res = await fetch(`${CORP_API}/corporate/registrations/bulk/status/${importId}`, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        });

        if (!res.ok) throw new Error("Failed to fetch job status");
        return res.json();
    },

    // Get Bulk Job Rows (for review after partial failure)
    async getBulkJobRows(importId: string): Promise<any[]> {
        const token = AuthService.getToken();
        const CORP_API = process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || 'http://127.0.0.1:4003';

        const res = await fetch(`${CORP_API}/corporate/registrations/bulk/rows/${importId}`, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        });

        if (!res.ok) throw new Error("Failed to fetch job rows");
        return res.json();
    },

    // Get Groups (for dropdown in review table)
    async getGroups(userId: string): Promise<any[]> {
        const token = AuthService.getToken();
        const CORP_API = process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || 'http://127.0.0.1:4003';

        // Assuming endpoint exists or creating it
        const res = await fetch(`${CORP_API}/corporate/groups?userId=${userId}`, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        });

        if (!res.ok) return []; // Return empty if failed or not implemented
        return res.json();
    }
};
