/**
 * @file AuthContext.tsx - Context quản lý trạng thái xác thực.
 *
 * Cung cấp:
 * - Bootstrap auth: tự động gọi refresh khi app load lần đầu.
 * - State: user, isAuthenticated, isLoading, isInitialized.
 * - Actions: login, register, logout, refreshUser.
 * - Session expired handler: tự động logout khi token hết hạn.
 */

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    useMemo,
    type ReactNode,
} from 'react';
import {
    authApi,
    authTokenStore,
    setAuthSessionExpiredHandler,
    type AuthUser,
    type Role,
} from '../lib/authApi';
import { logError } from '../lib/appError';
import { toast } from 'sonner';

type AuthState = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
};

type AuthContextValue = AuthState & {
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (fullName: string, email: string, password: string, role?: 'STUDENT' | 'MENTOR') => Promise<AuthUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isInitialized: false,
    });

    const setUser = useCallback((user: AuthUser | null) => {
        setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            isInitialized: true,
        });
    }, []);

    // Bootstrap: try refresh on mount
    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                const result = await authApi.refresh();
                if (!cancelled && result.accessToken && result.user) {
                    authTokenStore.set(result.accessToken);
                    setUser(result.user);
                    return;
                }
            } catch {
                // No session — that's fine
            }
            if (!cancelled) {
                authTokenStore.set(null);
                setUser(null);
            }
        };

        bootstrap();
        return () => { cancelled = true; };
    }, [setUser]);

    // Session expired handler
    useEffect(() => {
        setAuthSessionExpiredHandler(() => {
            authTokenStore.set(null);
            setUser(null);
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        });
        return () => setAuthSessionExpiredHandler(null);
    }, [setUser]);

    const login = useCallback(async (email: string, password: string) => {
        setState((s) => ({ ...s, isLoading: true }));
        try {
            const result = await authApi.login({ email, password });
            authTokenStore.set(result.accessToken);
            setUser(result.user);
            return result.user;
        } catch (error) {
            setState((s) => ({ ...s, isLoading: false }));
            throw error;
        }
    }, [setUser]);

    const register = useCallback(
        async (fullName: string, email: string, password: string, role: 'STUDENT' | 'MENTOR' = 'STUDENT') => {
            setState((s) => ({ ...s, isLoading: true }));
            try {
                const result = await authApi.register({ fullName, email, password, role });
                authTokenStore.set(result.accessToken);
                setUser(result.user);
                return result.user;
            } catch (error) {
                setState((s) => ({ ...s, isLoading: false }));
                throw error;
            }
        },
        [setUser],
    );

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            logError(error, { scope: 'AuthContext.logout' });
        } finally {
            authTokenStore.set(null);
            setUser(null);
        }
    }, [setUser]);

    const refreshUser = useCallback(async () => {
        try {
            const result = await authApi.me();
            setUser(result.user);
        } catch (error) {
            logError(error, { scope: 'AuthContext.refreshUser' });
        }
    }, [setUser]);

    const hasRole = useCallback(
        (...roles: Role[]) => !!state.user && roles.includes(state.user.role),
        [state.user],
    );

    const value = useMemo<AuthContextValue>(
        () => ({ ...state, login, register, logout, refreshUser, hasRole }),
        [state, login, register, logout, refreshUser, hasRole],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
