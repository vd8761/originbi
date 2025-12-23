
const API_URL = "http://localhost:4004";

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
};
