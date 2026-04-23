import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../ui/Loader';
import type { Role } from '../../lib/authApi';

type ProtectedRouteProps = {
    requireRoles?: Role[];
};

export function ProtectedRoute({ requireRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isInitialized, user } = useAuth();
    const location = useLocation();

    if (!isInitialized) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ redirectTo: location.pathname }} replace />;
    }

    if (requireRoles && user && !requireRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
