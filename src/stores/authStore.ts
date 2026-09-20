import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setStoredToken, removeStoredToken, getStoredToken } from '@/lib/api';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

let pendingAuthCheck: { token: string; promise: Promise<void> } | null = null;

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    authCheckError: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    updateUser: (user: User) => void;
    setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: getStoredToken(),
            isAuthenticated: false,
            isLoading: true,
            error: null,
            authCheckError: null,

            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null, authCheckError: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/login', credentials);
                    const { user, token } = response.data;

                    setStoredToken(token);
                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        authCheckError: null,
                    });
                } catch (error: any) {
                    const message = error.response?.data?.message || error.response?.data?.error || 'Error al iniciar sesión';
                    set({ isLoading: false, error: message });
                    throw new Error(message);
                }
            },

            register: async (data: RegisterData) => {
                set({ isLoading: true, error: null, authCheckError: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/register', data);
                    const { user, token } = response.data;

                    setStoredToken(token);
                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        authCheckError: null,
                    });
                } catch (error: any) {
                    const message = error.response?.data?.message || error.response?.data?.error || 'Error al crear cuenta';
                    set({ isLoading: false, error: message });
                    throw new Error(message);
                }
            },

            logout: () => {
                removeStoredToken();
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                    authCheckError: null,
                });
            },

            checkAuth: async () => {
                const token = getStoredToken();
                if (!token) {
                    set({ token: null, isLoading: false, isAuthenticated: false, user: null, authCheckError: null });
                    return;
                }
                if (pendingAuthCheck?.token === token) return pendingAuthCheck.promise;

                set({ isLoading: true, authCheckError: null });
                const request = (async () => {
                    try {
                        const response = await api.get<{ user: User }>('/auth/me', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (getStoredToken() !== token) return;
                        set({ user: response.data.user, token, isAuthenticated: true, isLoading: false, authCheckError: null });
                    } catch (error: any) {
                        // A response from a previous login must not overwrite the
                        // current session, including after an explicit logout.
                        if (getStoredToken() !== token) return;
                        if (error.response?.status === 401) {
                            removeStoredToken(token);
                            set({ user: null, token: null, isAuthenticated: false, isLoading: false, authCheckError: null });
                        } else {
                            set({ isLoading: false, authCheckError: 'No pudimos conectar con el studio. Tu sesión sigue guardada.' });
                        }
                    }
                })();
                pendingAuthCheck = { token, promise: request };
                try { await request; } finally {
                    if (pendingAuthCheck?.promise === request) pendingAuthCheck = null;
                }
            },

            clearError: () => set({ error: null }),

            updateUser: (user: User) => set({ user }),

            setAuth: (user: User, token: string) => {
                setStoredToken(token);
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    authCheckError: null,
                });
            },
        }),
        {
            name: 'altitud2707-auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// API errors outside /auth/me must also clear only the rejected session.
window.addEventListener('altitud:session-expired', (event: Event) => {
    const rejectedToken = (event as CustomEvent<{ token: string }>).detail.token;
    if (useAuthStore.getState().token !== rejectedToken) return;
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null, authCheckError: null });
});
