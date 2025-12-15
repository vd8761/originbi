import { CorporateAccount, CreateCorporateRegistrationDto, PaginatedResponse } from "@/lib/types";
import { AuthService } from "./auth.service";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000";

export const corporateRegistrationService = {
    // List registrations with pagination + search
    async getRegistrationsList(
        page: number,
        limit: number,
        search: string
    ): Promise<PaginatedResponse<CorporateAccount>> {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (search.trim()) {
            params.set("search", search.trim());
        }

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
};
