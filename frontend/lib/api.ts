import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import { clearAuthStorage } from "./auth-helpers";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // ⏱ 15 seconds
    withCredentials: true,
});

// Attach Bearer token (if available) to every outgoing request
api.interceptors.request.use(async (config) => {
    // Only run in the browser
    if (typeof window !== "undefined") {
        try {
            // Use Amplify to get the current session (refreshes token if needed)
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                // Sync back for legacy components reading directly from storage
                localStorage.setItem("originbi_id_token", token);
                sessionStorage.setItem("idToken", token);
            }
        } catch (err) {
            // Fallback to storage if Amplify check fails
            const token =
                localStorage.getItem("originbi_id_token") ||
                sessionStorage.getItem("idToken");
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    }
    return config;
});

// Global response interceptor for 401 handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            console.warn("Unauthorized request (401). Redirecting to login...");
            
            if (typeof window !== "undefined") {
                // Prevent infinite redirect loops if we're already on a login page
                const path = window.location.pathname;
                if (!path.includes('/login')) {
                    clearAuthStorage();
                    
                    // Determine login route based on current path
                    if (path.includes('/admin')) {
                        window.location.href = "/admin/login";
                    } else if (path.includes('/corporate')) {
                        window.location.href = "/corporate/login";
                    } else if (path.includes('/affiliate')) {
                        window.location.href = "/affiliate/login";
                    } else {
                        window.location.href = "/student/login";
                    }
                }
            }
        }

        console.error("API Error:", error?.response || error.message);
        return Promise.reject(error);
    }
);
