const STUDENT_API_URL =
  process.env.NEXT_PUBLIC_STUDENT_API_URL || "http://localhost:3002";

export interface IatTrial {
  id: number;
  sequence: number;
  stepNumber: number;
  blockType: string;
  wordShown: string;
  leftLabel: string | null;
  rightLabel: string | null;
  expectedKey: "E" | "I";
  status: "PENDING" | "ANSWERED";
}

export interface IatModuleProgress {
  id: number;
  moduleId: number;
  code: string;
  name: string;
  displayName: string;
  order: number;
  status: string;
  pattern?: string;
  speedGapMs?: number;
  slowestWords?: string[];
  errorWords?: string[];
  errorRate?: number;
}

export interface IatState {
  attempt: {
    id: number;
    status: string;
    assessmentKind: "IAT_GEN";
    startedAt?: string;
    completedAt?: string;
  };
  intake: {
    studentName?: string | null;
    age?: number | null;
    gender?: string | null;
    hometownTier?: string | null;
    collegeTier?: string | null;
    undergraduateStream?: string | null;
    workExperienceYears?: number | null;
  };
  modules: IatModuleProgress[];
  currentModuleId: number | null;
  trials: IatTrial[];
  reportStatus: string;
}

async function json<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to ${action} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const iatService = {
  async getState(attemptId: number | string): Promise<IatState> {
    const res = await fetch(`${STUDENT_API_URL}/iat/attempt/${attemptId}/state`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return json<IatState>(res, "load IAT state");
  },

  async saveIntake(attemptId: number | string, payload: Record<string, any>) {
    const res = await fetch(`${STUDENT_API_URL}/iat/attempt/${attemptId}/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return json<{ success: boolean; intake: IatState["intake"] }>(res, "save IAT intake");
  },

  async saveTrialEvents(
    attemptId: number | string,
    events: Array<{
      trialId: number;
      keyPressed: "E" | "I";
      responseTimeMs: number;
      eventSequence: number;
      shownAt?: string;
      answeredAt?: string;
    }>,
  ) {
    const res = await fetch(`${STUDENT_API_URL}/iat/attempt/${attemptId}/trial-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    return json<{ success: boolean; saved: number }>(res, "save IAT trial events");
  },

  async completeModule(attemptId: number | string, attemptModuleId: number) {
    const res = await fetch(
      `${STUDENT_API_URL}/iat/attempt/${attemptId}/modules/${attemptModuleId}/complete`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );
    return json<{ success: boolean; module: IatModuleProgress }>(res, "complete IAT module");
  },

  async finish(attemptId: number | string) {
    const res = await fetch(`${STUDENT_API_URL}/iat/attempt/${attemptId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return json<{ success: boolean; reportQueued: boolean }>(res, "finish IAT attempt");
  },
};
