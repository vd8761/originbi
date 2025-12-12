// src/lib/registrationService.ts

import { RegistrationUser, Program, Department } from "./types";

// All admin-side APIs (programs, departments, registrations) from NestJS admin-service
const API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4001";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RegistrationParams {
  page: number;
  limit: number;
  tab: "registrations" | "assigned";
  search?: string;
}

export interface CreateRegistrationDto {
  name: string;
  gender: string;
  email: string;
  countryCode: string;
  mobile: string;
  programType: string;
  groupName?: string;
  sendEmail: boolean;
  examStart?: string;
  examEnd?: string;
  // Dynamic fields
  schoolLevel?: string;
  schoolStream?: string;
  currentYear?: string;
  departmentId?: string;
  password?: string;
}

const AuthService = {
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  },
};

export const registrationService = {
  // 🔹 LIST registrations (if you have this API)
  async getUsers(
    params: RegistrationParams
  ): Promise<PaginatedResponse<RegistrationUser>> {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      tab: params.tab,
    });
    if (params.search) query.append("search", params.search);

    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/registrations?${query.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load registrations");
    }

    return res.json();
  },

  // 🔹 PROGRAMS for "Program Type" dropdown – from DB
  async getPrograms(): Promise<Program[]> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/programs`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch programs from DB, status:", res.status);
      throw new Error("Failed to fetch programs");
    }

    const body = await res.json();

    // Can be either:
    // [ {...}, ... ]  OR  { data: [ {...}, ... ], total, ... }
    const list = Array.isArray(body)
      ? body
      : Array.isArray((body as any).data)
      ? (body as any).data
      : [];

    //console.log("Programs loaded from API:", list);

    return list.map((p: any) => ({
      id: String(p.id),
      name: p.name,
      code: p.code,
    }));
  },

  // 🔹 DEPARTMENTS (for College program – load from DB)
  async getDepartments(): Promise<Department[]> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/departments`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (res.status === 404) {
      console.warn("Departments API not found, returning empty list");
      return [];
    }

    if (!res.ok) {
      throw new Error("Failed to fetch departments");
    }

    const body = await res.json();

    const list = Array.isArray(body)
      ? body
      : Array.isArray((body as any).data)
      ? (body as any).data
      : [];

    return list.map((d: any) => ({
      id: String(d.id),
      name: d.name,
      // support both camelCase and snake_case from backend
      courseDuration: d.courseDuration ?? d.course_duration ?? undefined,
    }));
  },

  // 🔹 CREATE registration (on Submit of AddRegistrationForm)
  async createUser(data: CreateRegistrationDto): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to create registration");
    }
  },

  // 🔹 Toggle status from list (if you use it)
  async toggleStatus(id: string, status: boolean): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/registrations/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error("Failed to update registration status");
    }
  },
  // 🔹 BULK UPLOAD registrations
  async bulkUpload(file: File): Promise<void> {
    const token = AuthService.getToken();

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/registrations/bulk-upload`, {
      method: "POST",
      headers: {
        // Do NOT set Content-Type manually; browser will set multipart boundary
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to upload file");
    }
  },
};
