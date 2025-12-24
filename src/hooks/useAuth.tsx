import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, getStoredUser, clearTokens, type User } from '../api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const storedUser = getStoredUser();
        if (!storedUser) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        // Verify admin token is still valid
        const result = await api.auth.me();
        if (result.success && result.data?.admin) {
            // Map admin data to User interface for compatibility
            setUser({
                id: result.data.admin.id,
                email: result.data.admin.email,
                name: result.data.admin.name,
                avatar: result.data.admin.avatar,
                role: result.data.admin.role,
                tenantId: '',
                tenantName: 'Platform Admin',
                tier: 'ADMIN',
                permissions: [],
            });
        } else {
            clearTokens();
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        const result = await api.auth.login(email, password);
        if (result.success) {
            // User was already set in the login function via setStoredUser
            const storedUser = getStoredUser();
            if (storedUser) {
                setUser(storedUser);
            }
            return { success: true };
        }
        return {
            success: false,
            error: result.error?.message || 'Login failed'
        };
    };

    const logout = async () => {
        await api.auth.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            checkAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
