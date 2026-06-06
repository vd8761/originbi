// ============================================================
// Level 3 "Metaphor" — frontend API connectors (no UI).
// Talks to the student-service `metaphor` module. The exam page
// design plugs into these functions + the useMetaphorSpeech hook.
// ============================================================

const STUDENT_API_URL =
    process.env.NEXT_PUBLIC_STUDENT_API_URL || "http://localhost:3002";

export interface MetaphorSpokenLanguage {
    code: string; // BCP-47 e.g. "en-IN"
    label: string;
    native: string;
}

export interface MetaphorConfig {
    questionCount: number;
    allowTyping: boolean;
    durationOverride: boolean;
    durationMinutes: number;
    audioTranscriptionEnabled: boolean;
    supportedLanguages: MetaphorSpokenLanguage[];
    sttProvider: { provider: string; params?: any };
}

export interface MetaphorQuestionItem {
    answerId: number;
    questionId: number;
    sequence: number;
    status: "NOT_ANSWERED" | "ANSWERED";
    answered: boolean;
    spokenLanguage: string | null;
    savedAnswer: string;
    imageUrl: string | null;
    imageDescEn: string | null;
    imageDescTa: string | null;
    contextEn: string | null;
    contextTa: string | null;
    questionEn: string | null;
    questionTa: string | null;
}

export interface MetaphorQuestionsResponse {
    config: MetaphorConfig;
    total: number;
    questions: MetaphorQuestionItem[];
}

export interface MetaphorSttConfig {
    provider: string; // web_speech | elevenlabs | azure | google | deepgram
    params: any;
    token: string | null; // ephemeral token for cloud providers; null for web_speech
}

async function json<T>(res: Response, action: string): Promise<T> {
    if (!res.ok) throw new Error(`Failed to ${action} (${res.status})`);
    return res.json() as Promise<T>;
}

export const metaphorService = {
    /** The candidate's generated questions + page config (resumable). */
    async getQuestions(attemptId: number | string): Promise<MetaphorQuestionsResponse> {
        const res = await fetch(
            `${STUDENT_API_URL}/metaphor/attempt/${attemptId}/questions`,
            { method: "GET", headers: { "Content-Type": "application/json" } },
        );
        return json<MetaphorQuestionsResponse>(res, "load metaphor questions");
    },

    /** STT provider config (+ ephemeral token for cloud providers). */
    async getSttConfig(): Promise<MetaphorSttConfig> {
        const res = await fetch(`${STUDENT_API_URL}/metaphor/stt-config`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        return json<MetaphorSttConfig>(res, "load STT config");
    },

    /** Save one question's assembled answer, then the caller advances. */
    async saveAnswer(payload: {
        attemptId: number | string;
        metaphorQuestionId: number;
        spokenLanguage?: string;
        answerText: string;
        audioBlob?: Blob | null;
    }): Promise<{ success: boolean }> {
        if (payload.audioBlob) {
            const form = new FormData();
            form.append("attemptId", String(payload.attemptId));
            form.append("metaphorQuestionId", String(payload.metaphorQuestionId));
            if (payload.spokenLanguage) form.append("spokenLanguage", payload.spokenLanguage);
            form.append("answerText", payload.answerText);
            form.append("audio", payload.audioBlob, "answer.webm");
            const res = await fetch(`${STUDENT_API_URL}/metaphor/answers`, {
                method: "POST",
                body: form,
            });
            return json(res, "save metaphor answer");
        }

        const res = await fetch(`${STUDENT_API_URL}/metaphor/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                attemptId: payload.attemptId,
                metaphorQuestionId: payload.metaphorQuestionId,
                spokenLanguage: payload.spokenLanguage,
                answerText: payload.answerText,
            }),
        });
        return json(res, "save metaphor answer");
    },

    /** Complete the Level 3 attempt (marks complete + queues translation). */
    async finish(attemptId: number | string): Promise<{ success: boolean; translationsPending: number }> {
        const res = await fetch(
            `${STUDENT_API_URL}/metaphor/attempt/${attemptId}/finish`,
            { method: "POST", headers: { "Content-Type": "application/json" } },
        );
        return json(res, "finish metaphor attempt");
    },

    /** Admin: manually (re-)queue translation for an attempt. */
    async translateNow(attemptId: number | string): Promise<{ success: boolean; queued: boolean }> {
        const res = await fetch(
            `${STUDENT_API_URL}/metaphor/admin/translate/${attemptId}`,
            { method: "POST", headers: { "Content-Type": "application/json" } },
        );
        return json(res, "queue translation");
    },
};
