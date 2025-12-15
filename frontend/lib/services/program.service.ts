import { Program, PaginatedResponse } from "@/lib/types";
import { AuthService } from "@/lib/services";

const API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4001";

// ------------------------------
// Program Service (Updated)
// ------------------------------

export const programService = {
  async getProgramsList(
    page: number,
    limit: number,
    search?: string
  ): Promise<PaginatedResponse<Program>> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search && search.trim()) params.set("search", search.trim());

    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/programs?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch programs");
    }

    const body = await res.json();

    // Handle NestJS typical response or direct array
    if (Array.isArray(body)) {
      return { data: body, total: body.length, page, limit };
    }

    return {
      data: body.data || [],
      total: body.total ?? (body.data || []).length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
    };
  },

  async createProgram(data: Omit<Program, "id" | "created_at" | "updated_at">): Promise<Program> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/programs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to create program");
    }

    return res.json();
  },

  async updateProgram(
    id: string,
    data: Partial<Program>
  ): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/programs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to update program");
    }
  },

  async toggleStatus(id: string, status: boolean): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/programs/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ is_active: status }),
    });

    if (!res.ok) {
      throw new Error("Failed to update program status");
    }
  },

  async deleteProgram(id: string): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/programs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to delete program");
    }
  },
};