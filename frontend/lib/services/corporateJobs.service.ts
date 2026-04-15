import { AuthService } from './auth.service';

const API_URL = process.env.NEXT_PUBLIC_CORPORATE_API_URL;

export interface CorporateJobPayload {
  title: string;
  department?: string;
  location?: string;
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
  shift?: 'DAY' | 'NIGHT' | 'ROTATIONAL' | 'FLEXIBLE';
  experienceLevel?: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
  minCtc?: number | string;
  maxCtc?: number | string;
  currencyCode?: string;
  openings?: number | string;
  status?: 'DRAFT' | 'ACTIVE' | 'HOLD' | 'CLOSED' | 'ARCHIVED';
  postingStartAt?: string;
  postingEndAt?: string;
  description: string;
  responsibilities?: string;
  eligibility?: string;
  niceToHave?: string;
  whatYouWillLearn?: string;
  companyDetails?: string;
  metadata?: Record<string, unknown>;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

function authHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const corporateJobsService = {
  async createJob(email: string, payload: CorporateJobPayload) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to create job');
    }

    return res.json();
  },

  async listJobs(
    email: string,
    params: {
      page?: number;
      limit?: number;
      tab?: string;
      status?: string;
      search?: string;
      location?: string;
      workMode?: string;
      employmentType?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {
    const token = AuthService.getToken();
    const query = new URLSearchParams({
      email,
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {}),
      ...(params.tab ? { tab: params.tab } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.location ? { location: params.location } : {}),
      ...(params.workMode ? { workMode: params.workMode } : {}),
      ...(params.employmentType ? { employmentType: params.employmentType } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    });

    const res = await fetch(`${API_URL}/corporate/jobs?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(token),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to fetch jobs');
    }

    return res.json();
  },

  async getJobById(email: string, jobId: number) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: authHeaders(token),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to fetch job details');
    }

    return res.json();
  },

  async updateJob(email: string, jobId: number, payload: Partial<CorporateJobPayload>) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}?email=${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to update job');
    }

    return res.json();
  },

  async updateJobStatus(
    email: string,
    jobId: number,
    status: 'DRAFT' | 'ACTIVE' | 'HOLD' | 'CLOSED' | 'ARCHIVED',
    note?: string,
  ) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}/status?email=${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status, note }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to update job status');
    }

    return res.json();
  },

  async listJobCandidates(
    email: string,
    jobId: number,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {
    const token = AuthService.getToken();
    const query = new URLSearchParams({
      email,
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    });

    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}/candidates?${query.toString()}`,
      {
        method: 'GET',
        headers: authHeaders(token),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to fetch job candidates');
    }

    return res.json();
  },

  async updateCandidateStatus(
    email: string,
    jobId: number,
    applicationId: number,
    payload: {
      toStatus: 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
      reason?: string;
      note?: string;
    },
  ) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}/candidates/${applicationId}/status?email=${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to update candidate status');
    }

    return res.json();
  },

  async bulkApplyCandidates(
    email: string,
    jobId: number,
    payload: {
      registrationIds: number[];
      source?: 'INTERNAL' | 'EXTERNAL' | 'REFERRAL' | 'BULK_IMPORT';
    },
  ) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/jobs/${jobId}/candidates/bulk-apply?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to bulk apply candidates');
    }

    return res.json();
  },

  async listCandidates(
    email: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      trait?: string;
      status?: string;
      jobId?: number;
      appliedDateFrom?: string;
      appliedDateTo?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {
    const token = AuthService.getToken();
    const query = new URLSearchParams({
      email,
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.trait ? { trait: params.trait } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.jobId ? { jobId: String(params.jobId) } : {}),
      ...(params.appliedDateFrom ? { appliedDateFrom: params.appliedDateFrom } : {}),
      ...(params.appliedDateTo ? { appliedDateTo: params.appliedDateTo } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    });

    const res = await fetch(
      `${API_URL}/corporate/candidates?${query.toString()}`,
      {
        method: 'GET',
        headers: authHeaders(token),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to fetch candidates');
    }

    return res.json();
  },

  async getCandidateApplications(email: string, registrationId: number) {
    const token = AuthService.getToken();
    const res = await fetch(
      `${API_URL}/corporate/candidates/${registrationId}/applications?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: authHeaders(token),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to fetch candidate applications');
    }

    return res.json();
  },
};
