import { ProgramData } from "@/lib/types";
import { AuthService } from "@/lib/services";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

// ------------------------------
// Mapping helpers
// ------------------------------

const mapFromApi = (raw: any): ProgramData => ({
  id: String(raw.id),
  programCode: raw.code,
  programName: raw.name,
  description: raw.description ?? "",
  assessmentTitle: raw.assessmentTitle ?? raw.assessment_title ?? "",
  reportTitle: raw.reportTitle ?? raw.report_title ?? "",
  isDemo: raw.isDemo ?? raw.is_demo ?? false,
  status: raw.isActive ?? raw.is_active ?? false,
  createdAt: raw.createdAt ?? raw.created_at,
  updatedAt: raw.updatedAt ?? raw.updated_at,
});

const mapToApi = (data: Omit<ProgramData, "id">) => ({
  code: data.programCode,
  name: data.programName,
  description: data.description,
  assessment_title: data.assessmentTitle,
  report_title: data.reportTitle,
  is_demo: data.isDemo,
  is_active: data.status,
});

// ------------------------------
// Program Service
// ------------------------------

export const programService = {
  async getProgramsList(
    page: number,
    limit: number,
    search?: string
  ): Promise<PaginatedResponse<ProgramData>> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search && search.trim()) params.set("search", search.trim());

    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/programs?${params.toString()}`, {
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

    if (Array.isArray(body)) {
      const data = body.map(mapFromApi);
      return { data, total: data.length, page, limit };
    }

    return {
      data: (body.data || []).map(mapFromApi),
      total: body.total ?? (body.data || []).length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
    };
  },

  async createProgram(data: Omit<ProgramData, "id">): Promise<ProgramData> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/programs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(mapToApi(data)),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to create program");
    }

    return mapFromApi(await res.json());
  },

  async updateProgram(
    id: string,
    data: Omit<ProgramData, "id">
  ): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/programs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(mapToApi(data)),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to update program");
    }
  },

  async toggleStatus(id: string, status: boolean): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/programs/${id}/status`, {
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

    const res = await fetch(`${API_URL}/programs/${id}`, {
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
