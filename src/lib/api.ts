import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authUrl } from './auth-redirect';
import type { ApiError } from '@/types/auth';

// API base URL - change in production
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Token storage key
const TOKEN_KEY = 'altitud2707_token';
// Admin API token (separate from JWT) used by /evolution endpoints in altitud2707-api
const ADMIN_TOKEN_KEY = 'altitud2707_admin_token';

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
export function removeStoredToken(expectedToken?: string): boolean {
    if (expectedToken !== undefined && getStoredToken() !== expectedToken) return false;
    localStorage.removeItem(TOKEN_KEY);
    return true;
}

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getStoredToken();
        if (token && config.headers && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Attach admin token for /evolution/* endpoints (altitud2707-api)
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
            const authorization = error.config?.headers?.Authorization;
            const requestToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
                ? authorization.slice(7) : null;
            const credentialRequest = /^\/auth\/(login|register|forgot-password|reset-password|change-password|coach\/login|coach\/change-password|instructor\/verify-magic-link)\/?$/.test(reqUrl);
            const sessionRejected = (error.response.data as ApiError & { code?: string })?.code === 'AUTH_SESSION_INVALID';
            if (!reqUrl.startsWith('/evolution') && (!credentialRequest || sessionRejected) &&
                requestToken && removeStoredToken(requestToken)) {
                window.dispatchEvent(new CustomEvent('altitud:session-expired', { detail: { token: requestToken } }));
                if (!['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
                    window.location.href = authUrl('/login', window.location.pathname + window.location.search + window.location.hash);
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
