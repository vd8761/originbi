import { AuthService } from "@/lib/services/auth.service";
import {
  Registration,
  Program,
  PaginatedResponse,
  Department,
  RegistrationStatus,
  SchoolLevel,
  SchoolStream,
  PaymentStatus,
} from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000";

// DTO for creating a new registration (from frontend form)
export interface CreateRegistrationDto {
  full_name: string;
  gender: string;
  email: string;
  country_code: string;
  mobile_number: string;
  program_id: string; // Linking to Program
  group_id?: string;
  send_email?: boolean;
  exam_start?: string;
  exam_end?: string;

  // Dynamic fields based on program type
  school_level?: SchoolLevel;
  school_stream?: SchoolStream;
  department_degree_id?: string; // For college
  current_year?: string;
  group_name?: string;

  password?: string;

  // Internal tracking
  registration_source?: string;
}

export const registrationService = {
  // 🔹 LIST registrations
  async getRegistrations(
    page: number,
    limit: number,
    search: string = "",
    filters?: {
      status?: RegistrationStatus;
      program_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<PaginatedResponse<Registration>> {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (search.trim()) params.set("search", search.trim());
    if (filters?.status) params.set("status", filters.status);
    if (filters?.program_id) params.set("program_id", filters.program_id);
    if (filters?.start_date) params.set("start_date", filters.start_date);
    if (filters?.end_date) params.set("end_date", filters.end_date);

    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/registrations?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load registrations");
    }

    return res.json();
  },

  // 🔹 PROGRAMS (for Dropdown)
  async getPrograms(): Promise<Program[]> {
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/admin/programs?is_active=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch programs");
    }

    const body = await res.json();
    // Support both paginated and list response for safety
    return Array.isArray(body) ? body : (body.data || []);
  },

  // 🔹 DEPARTMENTS (for College Dropdown)
  async getDepartments(): Promise<Department[]> {
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/admin/departments?is_active=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch departments");
    }

    const body = await res.json();
    // Support both paginated and list response for safety
    return Array.isArray(body) ? body : (body.data || []);
  },

  // 🔹 CREATE registration
  async createRegistration(payload: CreateRegistrationDto): Promise<Registration> {
    const token = AuthService.getToken();

    // Map frontend snake_case to backend camelCase
    const backendPayload = {
      name: payload.full_name,
      email: payload.email,
      gender: payload.gender,
      countryCode: payload.country_code,
      mobile: payload.mobile_number,
      programType: payload.program_id, // Mapping program_id to programType for now
      groupName: payload.group_name,
      sendEmail: payload.send_email,
      examStart: payload.exam_start,
      examEnd: payload.exam_end,
      schoolLevel: payload.school_level,
      schoolStream: payload.school_stream,
      departmentId: payload.department_degree_id,
      currentYear: payload.current_year,
      password: payload.password,
    };

    const res = await fetch(`${API_URL}/admin/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to create registration");
    }

    return res.json();
  },

  // 🔹 Toggle Status
  async toggleStatus(id: string, status: RegistrationStatus): Promise<void> {
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/admin/registrations/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error("Failed to update status");
    }
  },

  // 🔹 BULK UPLOAD
  async bulkUpload(file: File): Promise<any> {
    const token = AuthService.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/admin/registrations/bulk-upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to upload file");
    }

    return res.json();
  },

  // 🔹 Get Single Registration
  async getRegistrationById(id: string): Promise<Registration> {
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/admin/registrations/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch registration");
    }

    return res.json();
  }
};
