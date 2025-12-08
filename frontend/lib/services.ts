import { RegistrationUser, Program, Department, ProgramData } from './types';

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

// Rich mock that matches your Programs table (for fallback)
const MOCK_PROGRAM_DATA: ProgramData[] = [
  { id: '1', programCode: 'SCHOOL_STUDENT',  programName: 'School Students',      status: true,  description: 'For students from class 6 to 12', assessmentTitle: 'School Gen Assessment', reportTitle: 'Student Growth Report',  isDemo: false },
  { id: '2', programCode: 'COLLEGE_STUDENT', programName: 'College Students',     status: true,  description: 'For undergrads and postgrads',     assessmentTitle: 'Career Readiness',      reportTitle: 'Employability Report',   isDemo: false },
  { id: '3', programCode: 'EMPLOYEE_PRO',    programName: 'Professional Employee', status: true, description: 'Corporate training program',       assessmentTitle: 'Pro Skills',            reportTitle: 'Performance Analysis',   isDemo: false },
  { id: '4', programCode: 'CXO_LEADER',      programName: 'CXO Leadership',       status: false, description: 'Executive leadership assessment',  assessmentTitle: 'Leadership DNA',        reportTitle: 'Executive Summary',      isDemo: false },
  { id: '5', programCode: 'DEMO_TEST',       programName: 'Demo Program',         status: true,  description: 'Trial program for new users',      assessmentTitle: 'General Aptitude',      reportTitle: 'Basic Report',           isDemo: true },
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

// --- Program Service (Admin Programs Page) ---

export const programService = {
  /**
   * Admin Programs list.
   * Try DB `/admin/programs` first, fall back to mock when in dev.
   */
  async getProgramsList(page: number, limit: number, search?: string): Promise<PaginatedResponse<ProgramData>> {
    try {
      const token = AuthService.getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/admin/programs?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to fetch programs list');
      }

      // If your backend returns PaginatedResponse<ProgramData>, this just works.
      // If it returns a plain array, we can easily adjust later.
      const data: PaginatedResponse<ProgramData> = await res.json();
      return data;
    } catch (err) {
      console.error('[programService.getProgramsList] API error, falling back to mock:', err);
      if (!USE_REAL_API) {
        await simulateDelay(500);
        let data = [...MOCK_PROGRAM_DATA];
        if (search) {
          const lower = search.toLowerCase();
          data = data.filter(p =>
            p.programName.toLowerCase().includes(lower) ||
            p.programCode.toLowerCase().includes(lower)
          );
        }
        const total = data.length;
        const start = (page - 1) * limit;
        return {
          data: data.slice(start, start + limit),
          total,
          page,
          limit
        };
      }
      throw err;
    }
  },

  async createProgram(data: Omit<ProgramData, 'id'>): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(800);
      MOCK_PROGRAM_DATA.unshift({ ...data, id: Math.random().toString(36).substr(2, 9) });
      return;
    }
    // Real API create can be added later
  },

  async toggleStatus(id: string, status: boolean): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(300);
      const p = MOCK_PROGRAM_DATA.find(x => x.id === id);
      if (p) p.status = status;
      return;
    }
    // Real API toggle can be added later
  },

  async deleteProgram(id: string): Promise<void> {
    if (!USE_REAL_API) {
      await simulateDelay(500);
      const idx = MOCK_PROGRAM_DATA.findIndex(p => p.id === id);
      if (idx > -1) MOCK_PROGRAM_DATA.splice(idx, 1);
      return;
    }
    // Real API delete can be added later
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
