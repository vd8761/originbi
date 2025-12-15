
// Use environment variable to toggle mock mode
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_MOCKS === 'false';
const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000";

const simulateDelay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const AuthService = {
    getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("accessToken");
        }
        return null;
    },

    setToken(token: string) {
        if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", token);
        }
    },

    logout() {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        }
    },

    async login(
        email: string,
        password: string,
        portalMode: string
    ): Promise<{ accessToken: string; user: any }> {
        if (!USE_REAL_API) {
            await simulateDelay(800);
            const mockResponse = {
                accessToken: "mock-jwt-token-123456",
                user: {
                    id: "1",
                    email: email,
                    name: "Test User",
                    role: portalMode,
                },
            };
            this.setToken(mockResponse.accessToken);
            if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(mockResponse.user));
            }
            return mockResponse;
        }

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, portalMode }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Login failed");
        }

        const data = await res.json();
        this.setToken(data.accessToken);
        if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(data.user));
        }
        return data;
    },
};
