

import { RegistrationUser, Program, Department, ProgramData, CorporateRegistrationUser,CreateCorporateRegistrationDto } from './types';

// Toggle this to true when backend is ready for EVERYTHING.
// Programs will still use backend even if this is false.
const USE_REAL_API = false;
const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:3000/api';

// --- Shared Interfaces ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// --- MOCK DATA STORE ---

const MOCK_USERS: RegistrationUser[] = [
  { id: '1', name: 'Monishwar Rajasekaran', avatar: 'https://i.pravatar.cc/150?u=1', gender: 'Male', email: 'aarav.krishnan@gmail.com', mobile: '8787627634', status: true },
  { id: '2', name: 'Diya Ramesh', avatar: 'https://i.pravatar.cc/150?u=2', gender: 'Female', email: 'diya.ramesh@outlook.com', mobile: '9890176543', status: true },
  { id: '3', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=3', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
  { id: '4', name: 'Meera Vishwanath', avatar: 'https://i.pravatar.cc/150?u=4', gender: 'Female', email: 'meera.vishu@icloud.com', mobile: '9448822109', status: true },
  { id: '5', name: 'Pranav Arul', avatar: 'https://i.pravatar.cc/150?u=5', gender: 'Male', email: 'pranav.arul23@yahoo.com', mobile: '8147263985', status: true },
  { id: '6', name: 'Monishwar Rajasekaran (M)', avatar: 'https://i.pravatar.cc/150?u=6', gender: 'Male', email: 'aarav.krishnan@gmail.com', mobile: '8787627634', status: true },
  { id: '7', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=7', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
  { id: '8', name: 'Diya Ramesh', avatar: 'https://i.pravatar.cc/150?u=8', gender: 'Female', email: 'diya.ramesh@outlook.com', mobile: '9890176543', status: true },
  { id: '9', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=9', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
  { id: '10', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=10', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
  { id: '11', name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=11', gender: 'Female', email: 'sarah.j@gmail.com', mobile: '9876543210', status: false },
  { id: '12', name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=12', gender: 'Male', email: 'mike.ross@pearson.com', mobile: '8877665544', status: true },
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Computer Science' },
  { id: '2', name: 'Information Technology' },
  { id: '3', name: 'Mechanical Engineering' },
  { id: '4', name: 'Civil Engineering' },
  { id: '5', name: 'Electronics & Comm.' },
  { id: '6', name: 'Business Administration' },
];

const MOCK_QUESTIONS: Question[] = [
  {
    id: "1",
    preamble: "You walk into a lab and see a glowing blue liquid.",
    text: "What do you do?",
    options: [
      { id: 'a', text: "Ask the scientist what it is" },
      { id: 'b', text: "Watch from distance" },
      { id: 'c', text: "Take notes – could be useful later" },
      { id: 'd', text: "Wonder if it's safe to touch" },
    ]
  },
  // ... other mock questions
];

const MOCK_CORPORATE_REGISTRATIONS: CorporateRegistrationUser[] = [
  {
    id: "c1",
    name: "Arjun Menon",
    avatar: "https://i.pravatar.cc/150?u=c1",
    gender: "Male",
    email: "arjun.menon@infotech.com",
    countryCode: "+91",
    mobile: "9876543210",
    companyName: "Infotech Solutions",
    jobTitle: "HR Manager",
    employeeCode: "HR101",
    linkedinUrl: "https://linkedin.com/in/arjunmenon",
    sector: "IT_SOFTWARE",
    credits: 120,
    status: true,
    notes: "Bengaluru, Chennai, Hyderabad",
    createdAt: "2025-12-01T10:00:00.000Z",
  },
  {
    id: "c2",
    name: "Nisha Rao",
    avatar: "https://i.pravatar.cc/150?u=c2",
    gender: "Female",
    email: "nisha.rao@healthplus.com",
    countryCode: "+91",
    mobile: "9812233445",
    companyName: "HealthPlus Labs",
    jobTitle: "Talent Acquisition Lead",
    employeeCode: "TA204",
    linkedinUrl: "",
    sector: "IT_SOFTWARE",
    credits: 80,
    status: false,
    notes: "Mumbai, Pune",
    createdAt: "2025-11-28T09:30:00.000Z",
  },
  {
    id: "c3",
    name: "Vikram Sharma",
    avatar: "https://i.pravatar.cc/150?u=c3",
    gender: "Male",
    email: "vikram.sharma@finexbank.com",
    countryCode: "+91",
    mobile: "9988776655",
    companyName: "Finex Bank",
    jobTitle: "L&D Head",
    employeeCode: "FINX33",
    linkedinUrl: "https://linkedin.com/in/vikramsharma",
    sector: "IT_SOFTWARE",
    credits: 150,
    status: true,
    notes: "Delhi NCR, Kolkata",
    createdAt: "2025-11-20T08:15:00.000Z",
  },
  {
    id: "c4",
    name: "Priya Pillai",
    avatar: "https://i.pravatar.cc/150?u=c4",
    gender: "Female",
    email: "priya.pillai@retailmart.in",
    countryCode: "+91",
    mobile: "9776655443",
    companyName: "RetailMart India",
    jobTitle: "Training Coordinator",
    employeeCode: "RM562",
    linkedinUrl: "",
    sector: "IT_SOFTWARE",
    credits: 50,
    status: true,
    notes: "Chennai, Kochi",
    createdAt: "2025-10-10T11:00:00.000Z",
  },
  {
    id: "c5",
    name: "Suresh Kumar",
    avatar: "https://i.pravatar.cc/150?u=c5",
    gender: "Male",
    email: "suresh.k@logitrans.com",
    countryCode: "+91",
    mobile: "9654321876",
    companyName: "LogiTrans Global",
    jobTitle: "Operations Manager",
    employeeCode: "OPS456",
    linkedinUrl: "",
    sector: "IT_SOFTWARE",
    credits: 40,
    status: true,
    notes: "Chennai, Bengaluru",
    createdAt: "2025-09-05T13:45:00.000Z",
  },
];

// --- Helper for Authorized Requests (Mock Compatible) ---

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Service ---

export const AuthService = {
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  async login(email: string, password: string, portalMode: string): Promise<{ accessToken: string; user: any }> {
    if (!USE_REAL_API) {
      await simulateDelay(800);
      const mockResponse = {
        accessToken: 'mock-jwt-token-123456',
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: portalMode
        }
      };
      this.setToken(mockResponse.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(mockResponse.user));
      }
      return mockResponse;
    }

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, portalMode }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    this.setToken(data.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }
};

// --- Registration Service ---

export interface RegistrationParams {
  page: number;
  limit: number;
  tab: 'registrations' | 'assigned';
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
}

export const registrationService = {
  async getUsers(params: RegistrationParams): Promise<PaginatedResponse<RegistrationUser>> {
    if (!USE_REAL_API) {
      await simulateDelay(600);
      let data = [...MOCK_USERS];

      if (params.tab === 'assigned') {
        data = data.filter((_, i) => i % 3 === 0);
      }

      if (params.search) {
        const lowerSearch = params.search.toLowerCase();
        data = data.filter(u =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch) ||
          u.mobile.includes(lowerSearch)
        );
      }

      const total = data.length;
      const start = (params.page - 1) * params.limit;
      const pagedData = data.slice(start, start + params.limit);

      return {
        data: pagedData,
        total,
        page: params.page,
        limit: params.limit
      };
    }

    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      tab: params.tab,
    });
    if (params.search) query.append('search', params.search);

    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/registrations?${query.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  /**
   * Programs for Registration:
   * Always try to get from REAL API `/admin/programs`.
   * If it fails AND we're in mock mode, fall back to MOCK_PROGRAM_DATA.
   */
  async getPrograms(): Promise<Program[]> {
    try {
      const token = AuthService.getToken();
      const res = await fetch(`${API_URL}/programs`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data: Program[] = await res.json();
      return data;
    } catch (err) {
      console.error('[registrationService.getPrograms] API error, falling back to mock:', err);
      /*if (!USE_REAL_API) {
        await simulateDelay(200);
        return [...MOCK_PROGRAM_DATA] as Program[];
      }*/
      throw err;
    }
  },

  async getDepartments(): Promise<Department[]> {
    if (!USE_REAL_API) {
      await simulateDelay(200);
      return MOCK_DEPARTMENTS;
    }
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async createUser(data: CreateRegistrationDto): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(1000);
      console.log("Creating user with data:", data);
      MOCK_USERS.unshift({
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        mobile: `${data.countryCode} ${data.mobile}`,
        gender: data.gender as any,
        status: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
      });
      return;
    }

    const token = AuthService.getToken();
    await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
  },

  async toggleStatus(id: string, status: boolean): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(300);
      const user = MOCK_USERS.find(u => u.id === id);
      if (user) user.status = status;
      return;
    }

    const token = AuthService.getToken();
    await fetch(`${API_URL}/registrations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });
  },

  async bulkUpload(file: File): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(2000);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    const token = AuthService.getToken();

    const res = await fetch(`${API_URL}/registrations/bulk`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error('Bulk upload failed');
  }
};

// --- Exam Service ---

export interface Question {
  id: string;
  preamble?: string;
  text: string;
  options: { id: string; text: string }[];
}

export const examService = {
  async getQuestions(assessmentId: string): Promise<Question[]> {
    if (!USE_REAL_API) {
      await simulateDelay(500);
      return MOCK_QUESTIONS;
    }
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/exams/${assessmentId}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async submitAnswer(assessmentId: string, questionId: string, optionId: string): Promise<void> {
    if (!USE_REAL_API) {
      return;
    }
    const token = AuthService.getToken();
    await fetch(`${API_URL}/exams/${assessmentId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ questionId, optionId }),
    });
  },

  async finishExam(assessmentId: string): Promise<any> {
    if (!USE_REAL_API) {
      await simulateDelay(1000);
      return { score: 85 };
    }
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/exams/${assessmentId}/finish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// --- Reports Service ---

export const reportService = {
  async downloadReport(userId: string, reportType: 'full' | 'summary'): Promise<Blob> {
    if (!USE_REAL_API) {
      await simulateDelay(1500);
      return new Blob(['Mock PDF Content'], { type: 'application/pdf' });
    }
    const token = AuthService.getToken();
    const res = await fetch(`${API_URL}/reports/${userId}?type=${reportType}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to generate report');
    return res.blob();
  }
};

export const corporateRegistrationService = {
  // List registrations with pagination + search
  async getRegistrationsList(
    page: number,
    limit: number,
    search: string
  ): Promise<{ data: CorporateRegistrationUser[]; total: number }> {
    if (!USE_REAL_API) {
      await simulateDelay(500);

      let data = [...MOCK_CORPORATE_REGISTRATIONS];

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter((u) => {
          return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.mobile.includes(q) ||
            u.companyName.toLowerCase().includes(q) ||
            (u.jobTitle ? u.jobTitle.toLowerCase().includes(q) : false)
          );
        });
      }

      const total = data.length;
      const start = (page - 1) * limit;
      const paged = data.slice(start, start + limit);

      return {
        data: paged,
        total,
      };
    }

    // ---- REAL API MODE ----
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    }

    const res = await fetch(
      `${API_URL}/admin/registrations?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch corporate registrations");
    }

    return res.json();
  },

  // Create new registration
  async createRegistration(
    payload: CreateCorporateRegistrationDto
  ): Promise<any> {
    if (!USE_REAL_API) {
      await simulateDelay(600);

      const newItem: CorporateRegistrationUser = {
        id: Math.random().toString(36).substring(2, 9),
        name: payload.name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          payload.name
        )}&background=random`,
        gender: payload.gender,
        email: payload.email,
        countryCode: payload.countryCode,
        mobile: payload.mobile,
        companyName: payload.companyName,
        jobTitle: payload.jobTitle,
        employeeCode: payload.employeeCode,
        linkedinUrl: payload.linkedinUrl,
        sector: payload.sector,
        credits: payload.credits ?? 0,
        status: payload.status,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      };

      // Add to top
      MOCK_CORPORATE_REGISTRATIONS.unshift(newItem);
      return newItem;
    }

    // ---- REAL API MODE ----
    const res = await fetch(`${API_URL}/admin/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create corporate registration");
    }

    return res.json();
  },

  // Toggle active/inactive
  async toggleStatus(id: string, status: boolean): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(300);
      const item = MOCK_CORPORATE_REGISTRATIONS.find((u) => u.id === id);
      if (item) item.status = status;
      return;
    }

    const res = await fetch(`${API_URL}/admin/registrations/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error("Failed to update status");
    }
  },

  // Optional: single registration details
  async getRegistrationById(id: string): Promise<CorporateRegistrationUser> {
    if (!USE_REAL_API) {
      await simulateDelay(300);
      const item = MOCK_CORPORATE_REGISTRATIONS.find((u) => u.id === id);
      if (!item) {
        throw new Error("Corporate registration not found");
      }
      return item;
    }

    const res = await fetch(`${API_URL}/admin/registrations/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch registration details");
    }

    return res.json();
  },

  // Optional: update credits after creation
  async updateCredits(id: string, credits: number): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(300);
      const item = MOCK_CORPORATE_REGISTRATIONS.find((u) => u.id === id);
      if (item) item.credits = credits;
      return;
    }

    const res = await fetch(`${API_URL}/admin/registrations/${id}/credits`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credits }),
    });

    if (!res.ok) {
      throw new Error("Failed to update credits");
    }
  },
};
