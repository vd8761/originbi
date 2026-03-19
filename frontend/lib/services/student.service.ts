
const API_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL;

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
    },

    // ── AI Counsellor Subscription ──

    async getSubscriptionStatus(email: string) {
        try {
            const res = await fetch(`${API_URL}/student/subscription/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) return { hasAiCounsellor: false, plan: null };
            return await res.json();
        } catch (error) {
            console.error("Subscription status check failed", error);
            return { hasAiCounsellor: false, plan: null };
        }
    },

    async createCounsellorOrder(email: string) {
        try {
            const res = await fetch(`${API_URL}/student/subscription/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error("Failed to create order");
            return await res.json();
        } catch (error) {
            console.error("Create order failed", error);
            throw error;
        }
    },

    async verifyCounsellorPayment(payload: {
        email: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        try {
            const res = await fetch(`${API_URL}/student/subscription/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Payment verification failed");
            return await res.json();
        } catch (error) {
            console.error("Verify payment failed", error);
            throw error;
        }
    },

    async getStudentReport(studentId: string | number) {
        try {
            // Use the student-service URL or proxy if needed. 
            // Based on user request, the URL is student-service.sriharan.me
            // But we should use the configured API_URL if possible.
            // For now, I will use a path relative to API_URL if it's the same service, 
            // otherwise I'll use the user provided one as a fallback or if API_URL is not set for reports.

            const url = `${API_URL}/report/generate/student/${studentId}?api=true`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const result = await res.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error("Failed to fetch student report", error);
            return null;
        }
    }
};
