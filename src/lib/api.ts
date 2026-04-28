import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/auth';

// API base URL - change in production
const API_URL = import.meta.env.VITE_API_URL || 'https://valiant-imagination-production-0462.up.railway.app/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Token storage key
const TOKEN_KEY = 'forma_pilates_token';
// Admin API token (separate from JWT) used by /evolution endpoints in balance-room-api
const ADMIN_TOKEN_KEY = 'balance_room_admin_token';

export function getAdminApiToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminApiToken(token: string): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminApiToken(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Get stored token
export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

// Store token
export function setStoredToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

// Remove token
export function removeStoredToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getStoredToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Attach admin token for /evolution/* endpoints (balance-room-api)
        const adminToken = getAdminApiToken();
        if (adminToken && config.headers && (config.url || '').startsWith('/evolution')) {
            config.headers['x-admin-token'] = adminToken;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        // Handle 401 - unauthorized
        if (error.response?.status === 401) {
            // Skip session bust for admin-token endpoints (Evolution): a 401 there
            // means "wrong/missing admin token", not "expired user session".
            const reqUrl = (error.config?.url || '').toString();
            if (!reqUrl.startsWith('/evolution')) {
                removeStoredToken();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;
        return apiError?.message || apiError?.error || 'Error de conexión';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Error desconocido';
}
