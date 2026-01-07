import axios from "axios";

const API_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ||
    "http://localhost:4001";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // ⏱ 15 seconds
    withCredentials: true,
});

// Optional: global error logging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error?.response || error.message);
        return Promise.reject(error);
    }
);
