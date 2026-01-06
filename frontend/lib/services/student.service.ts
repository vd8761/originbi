
const API_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL || "http://localhost:4004";

export const studentService = {
    async getAssessmentStatus(userId: number) {
        try {
            const res = await fetch(`${API_URL}/student/assessment-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) {
                // If 404/500, assume not started or handle error
                return { isCompleted: false, status: 'ERROR' };
            }

            return await res.json();
        } catch (error) {
            console.error("Failed to check assessment status", error);
            return { isCompleted: false, status: 'ERROR' };
        }
    },

    async getProfile(email: string) {
        try {
            const res = await fetch(`${API_URL}/student/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                return null;
            }

            return await res.json();
        } catch (error) {
            console.error("Failed to fetch profile", error);
            return null;
        }
    },

    async checkLoginStatus(email: string) {
        try {
            const res = await fetch(`${API_URL}/student/login-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error("Check login status failed", error);
            return null;
        }
    },

    async getAssessmentProgress(email: string) {
        try {
            const res = await fetch(`${API_URL}/student/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                console.error(`[StudentService] getAssessmentProgress failed: ${res.status} ${res.statusText}`);
                return [];
            }
            return await res.json();
        } catch (error) {
            console.error("Fetch progress failed", error);
            return [];
        }
    }
};
