import axios from "axios";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // ⏱ 15 seconds
    withCredentials: true,
});

// Attach Bearer token (if available) to every outgoing request
api.interceptors.request.use((config) => {
    // Only run in the browser
    if (typeof window !== "undefined") {
        const token =
            localStorage.getItem("originbi_id_token") ||
            sessionStorage.getItem("idToken");
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Optional: global error logging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error?.response || error.message);
        return Promise.reject(error);
    }
);
