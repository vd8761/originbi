import { AssessmentQuestion } from "@/lib/types";
import { AuthService } from "./auth.service";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4001";

export const examService = {
    // Get questions for a specific assessment/exam
    async getQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
        const token = AuthService.getToken();

        // Adjust endpoint based on actual backend route. Assuming /exams or /assessments
        const res = await fetch(`${API_URL}/exams/${assessmentId}/questions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to load questions");
        }

        return res.json();
    },

    // Submit single answer
    async submitAnswer(
        assessmentId: string,
        questionId: string,
        optionId: string
    ): Promise<void> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/exams/${assessmentId}/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ question_id: questionId, option_id: optionId }),
        });

        if (!res.ok) {
            throw new Error("Failed to submit answer");
        }
    },

    // Finish exam
    async finishExam(assessmentId: string): Promise<{ score: number; result: string }> {
        const token = AuthService.getToken();
        const res = await fetch(`${API_URL}/exams/${assessmentId}/finish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to finish exam");
        }

        return res.json();
    },
};
