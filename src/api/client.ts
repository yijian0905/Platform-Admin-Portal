/**
 * API Client for ERP Admin Portal
 * Connects to the ERP-System backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    tenantId: string;
    tenantName: string;
    tier: string;
    permissions: string[];
}

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    department?: string;
}

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    admin?: AdminUser;  // Admin login returns admin object
    user?: User;        // Keep for compatibility
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    tier: string;
    status: string;
    billingEmail?: string;
    billingName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface License {
    id: string;
    tenantId: string;
    licenseKey: string;
    tier: string;
    maxUsers: number;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================================
// Token Management
// ============================================================================

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem('admin_access_token', access);
    localStorage.setItem('admin_refresh_token', refresh);
}

export function getTokens() {
    if (!accessToken) {
        accessToken = localStorage.getItem('admin_access_token');
        refreshToken = localStorage.getItem('admin_refresh_token');
    }
    return { accessToken, refreshToken };
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
}

export function getStoredUser(): User | null {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
        try {
            return JSON.parse(stored) as User;
        } catch {
            return null;
        }
    }
    return null;
}

export function setStoredUser(user: User) {
    localStorage.setItem('admin_user', JSON.stringify(user));
}

// ============================================================================
// API Request Handler
// ============================================================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const tokens = getTokens();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (tokens.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 401 - try to refresh token
        if (response.status === 401 && tokens.refreshToken) {
            const refreshResult = await refreshAccessToken();
            if (refreshResult.success) {
                // Retry the request with new token
                headers['Authorization'] = `Bearer ${getTokens().accessToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers,
                });
                return await retryResponse.json();
            } else {
                // Refresh failed, clear tokens
                clearTokens();
                window.location.href = '/login';
                return {
                    success: false,
                    error: {
                        code: 'SESSION_EXPIRED',
                        message: 'Your session has expired. Please login again.',
                    },
                };
            }
        }

        const data = await response.json();
        return data as ApiResponse<T>;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: 'Failed to connect to server. Please check your connection.',
            },
        };
    }
}

// ============================================================================
// Admin Auth API (uses /admin/auth/* endpoints)
// ============================================================================

export async function login(email: string, password: string): Promise<ApiResponse<LoginResult>> {
    const result = await apiRequest<LoginResult>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
        setTokens(result.data.accessToken, result.data.refreshToken);
        // Map admin response to User type for compatibility
        const adminData = result.data as unknown as { admin: AdminUser };
        if (adminData.admin) {
            setStoredUser({
                id: adminData.admin.id,
                email: adminData.admin.email,
                name: adminData.admin.name,
                avatar: adminData.admin.avatar,
                role: adminData.admin.role,
                tenantId: '', // Admin users don't belong to tenants
                tenantName: 'Platform Admin',
                tier: 'ADMIN',
                permissions: [],
            });
        }
    }

    return result;
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
    const tokens = getTokens();
    const result = await apiRequest<{ message: string }>('/admin/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    clearTokens();
    return result;
}

export async function refreshAccessToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>> {
    const tokens = getTokens();
    if (!tokens.refreshToken) {
        return {
            success: false,
            error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token available' },
        };
    }

    const result = await apiRequest<{ accessToken: string; refreshToken: string; expiresIn: number }>('/admin/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (result.success && result.data) {
        setTokens(result.data.accessToken, result.data.refreshToken);
    }

    return result;
}

export async function getCurrentAdmin(): Promise<ApiResponse<{ admin: AdminUser }>> {
    return apiRequest('/admin/auth/me');
}

// ============================================================================
// Tenants API (Admin)
// ============================================================================

export async function getTenants(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
}): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return apiRequest(`/api/v1/admin/tenants${query ? `?${query}` : ''}`);
}

export async function getTenant(id: string): Promise<ApiResponse<Tenant>> {
    return apiRequest(`/api/v1/admin/tenants/${id}`);
}

// ============================================================================
// Users API (Admin)
// ============================================================================

export async function getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    tenantId?: string;
}): Promise<ApiResponse<PaginatedResponse<User>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tenantId) searchParams.set('tenantId', params.tenantId);

    const query = searchParams.toString();
    return apiRequest(`/api/v1/admin/users${query ? `?${query}` : ''}`);
}

// ============================================================================
// Licenses API (Admin)
// ============================================================================

export async function getLicenses(params?: {
    page?: number;
    pageSize?: number;
    tenantId?: string;
    status?: 'active' | 'expired' | 'all';
}): Promise<ApiResponse<PaginatedResponse<License>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.tenantId) searchParams.set('tenantId', params.tenantId);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return apiRequest(`/api/v1/admin/licenses${query ? `?${query}` : ''}`);
}

// ============================================================================
// Subscribers API (Admin - Platform Management)
// ============================================================================

export interface Subscriber {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    tier: 'L1' | 'L2' | 'L3';
    status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
    createdAt: string;
    updatedAt: string;
    userCount: number;
    license: SubscriberLicense | null;
}

export interface SubscriberLicense {
    id: string;
    licenseKey: string;
    tier: string;
    maxUsers: number;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
    features?: Record<string, unknown>;
}

export interface SubscriberDetail extends Subscriber {
    settings?: Record<string, unknown>;
    allLicenses?: SubscriberLicense[];
}

export interface SubscriberUser {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export async function getSubscribers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'all';
    tier?: 'L1' | 'L2' | 'L3' | 'all';
}): Promise<ApiResponse<PaginatedResponse<Subscriber>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tier) searchParams.set('tier', params.tier);

    const query = searchParams.toString();
    return apiRequest(`/api/v1/admin/subscribers${query ? `?${query}` : ''}`);
}

export async function getSubscriber(id: string): Promise<ApiResponse<SubscriberDetail>> {
    return apiRequest(`/api/v1/admin/subscribers/${id}`);
}

export async function getSubscriberUsers(subscriberId: string, params?: {
    page?: number;
    pageSize?: number;
}): Promise<ApiResponse<PaginatedResponse<SubscriberUser>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return apiRequest(`/api/v1/admin/subscribers/${subscriberId}/users${query ? `?${query}` : ''}`);
}

export async function updateSubscriberStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED'
): Promise<ApiResponse<{ id: string; name: string; status: string; updatedAt: string }>> {
    return apiRequest(`/api/v1/admin/subscribers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function removeSubscriber(id: string): Promise<ApiResponse<{ message: string; id: string; name: string }>> {
    return apiRequest(`/api/v1/admin/subscribers/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// Dashboard Stats API (Admin)
// ============================================================================

export interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalLicenses: number;
    activeLicenses: number;
    revenueThisMonth: number;
    newTenantsThisMonth: number;
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiRequest('/api/v1/admin/dashboard/stats');
}

// ============================================================================
// Export API client
// ============================================================================

export const api = {
    auth: {
        login,
        logout,
        refresh: refreshAccessToken,
        me: getCurrentAdmin,
    },
    tenants: {
        list: getTenants,
        get: getTenant,
    },
    users: {
        list: getUsers,
    },
    licenses: {
        list: getLicenses,
    },
    subscribers: {
        list: getSubscribers,
        get: getSubscriber,
        getUsers: getSubscriberUsers,
        updateStatus: updateSubscriberStatus,
        remove: removeSubscriber,
    },
    dashboard: {
        stats: getDashboardStats,
    },
};

export default api;
