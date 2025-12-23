import { AuthService } from "@/lib/services/auth.service";
import { PaginatedResponse, Registration } from "../types";
import { CreateRegistrationDto } from "./registration.service";

const CORPORATE_API_URL =
    process.env.NEXT_PUBLIC_CORPORATE_API_BASE_URL || "http://localhost:4003";

export const corporateRegistrationService = {
    // 🔹 CORPORATE - Create Candidate
    async createCorporateRegistration(payload: CreateRegistrationDto): Promise<any> {
        const token = AuthService.getToken();

        // Get logged-in user ID
        let userId: number | null = null;
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user.id;
            }
        }

        if (!userId) {
            throw new Error("Unable to identify corporate account (User ID missing)");
        }

        const backendPayload = {
            fullName: payload.full_name,
            email: payload.email,
            mobile: payload.mobile_number,
            gender: payload.gender ? payload.gender.toUpperCase() : "MALE",
            programType: payload.program_id, // Sent as string e.g. "Employee"
            groupName: payload.group_name,
            password: payload.password,
            examStart: payload.exam_start,
            examEnd: payload.exam_end,
        };

        const res = await fetch(
            `${CORPORATE_API_URL}/corporate/registrations?userId=${userId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify(backendPayload),
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || "Failed to create corporate registration");
        }

        return res.json();
    },

    // 🔹 CORPORATE - List Employees
    async getMyEmployees(
        page: number,
        limit: number,
        search: string = "",
    ): Promise<PaginatedResponse<Registration>> {
        const token = AuthService.getToken();

        // Get logged-in user email
        let corporateEmail = "";
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                corporateEmail = user.email;
            }
        }

        const params = new URLSearchParams();
        params.set("email", corporateEmail);
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`${CORPORATE_API_URL}/dashboard/my-employees?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch employees");
        }

        return res.json();
    }
};
