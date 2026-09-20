import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authUrl } from '@/lib/auth-redirect';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children?: ReactNode; // Make optional
    requiredRoles?: UserRole[];
    redirectTo?: string;
}

export function AuthGuard({ children, requiredRoles, redirectTo = '/login' }: AuthGuardProps) {
    const navigate = useNavigate();
    const { pathname, search, hash } = useLocation();
    const { user, isAuthenticated, isLoading, authCheckError, checkAuth } = useAuthStore();

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Handle redirects
    useEffect(() => {
        if (isLoading || authCheckError) return;

        // Not authenticated
        if (!isAuthenticated) {
            navigate(authUrl(redirectTo, pathname + search + hash), { replace: true });
            return;
        }

        // Check role if specified
        if (requiredRoles && user && !requiredRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on role
            if (user.role === 'admin' || user.role === 'super_admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (user.role === 'reception') {
                navigate('/admin/bookings', { replace: true });
            } else {
                navigate('/app', { replace: true });
            }
        }
    }, [isLoading, authCheckError, isAuthenticated, user, requiredRoles, navigate, redirectTo, pathname, search, hash]);

    if (authCheckError && !isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background px-6">
                <div className="max-w-sm text-center space-y-5" role="alert">
                    <h1 className="text-2xl font-heading">Volvemos en un momento</h1>
                    <p className="text-muted-foreground">{authCheckError}</p>
                    <button type="button" onClick={() => void checkAuth()} className="min-h-12 rounded-full bg-primary px-8 py-3 text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        Intentar de nuevo
                    </button>
                </div>
            </main>
        );
    }

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    // Not authenticated or wrong role
    if (!isAuthenticated) {
        return null;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        return null;
    }

    // Render children if provided (wrapper mode), otherwise Outlet (layout mode)
    return children ? <>{children}</> : <Outlet />;
}

// HOC version for simpler usage
export function withAuthGuard<P extends object>(
    Component: React.ComponentType<P>,
    requiredRoles?: UserRole[]
) {
    return function WrappedComponent(props: P) {
        return (
            <AuthGuard requiredRoles={requiredRoles}>
                <Component {...props} />
            </AuthGuard>
        );
    };
}
