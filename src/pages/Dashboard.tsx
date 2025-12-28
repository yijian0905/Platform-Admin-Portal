import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DashboardStats } from '../api';
import './Dashboard.css';

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        setError(null);

        const result = await api.dashboard.stats();

        if (result.success && result.data) {
            setStats(result.data);
        } else {
            // If admin endpoints don't exist yet, show placeholder data
            setStats({
                totalTenants: 0,
                activeTenants: 0,
                totalUsers: 0,
                activeUsers: 0,
                totalLicenses: 0,
                activeLicenses: 0,
                revenueThisMonth: 0,
                newTenantsThisMonth: 0,
            });
            setError('Admin API endpoints not yet implemented. Showing placeholder data.');
        }

        setIsLoading(false);
    };



    return (
        <div className="dashboard-page">
            <div className="content-header">
                <h2>Dashboard Overview</h2>
                <p>Monitor your ERP system's health and metrics</p>
            </div>

            {error && (
                <div className="warning-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner-lg"></div>
                    <p>Loading dashboard data...</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon tenants">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M21 7l-9-4-9 4" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats?.totalTenants ?? 0}</span>
                                <span className="stat-label">Total Tenants</span>
                            </div>
                            <div className="stat-badge positive">
                                {stats?.activeTenants ?? 0} active
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon users">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats?.totalUsers ?? 0}</span>
                                <span className="stat-label">Total Users</span>
                            </div>
                            <div className="stat-badge positive">
                                {stats?.activeUsers ?? 0} active
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon licenses">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats?.totalLicenses ?? 0}</span>
                                <span className="stat-label">Total Licenses</span>
                            </div>
                            <div className="stat-badge positive">
                                {stats?.activeLicenses ?? 0} active
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon revenue">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">${stats?.revenueThisMonth?.toLocaleString() ?? 0}</span>
                                <span className="stat-label">Revenue (This Month)</span>
                            </div>
                            <div className="stat-badge">
                                +{stats?.newTenantsThisMonth ?? 0} new
                            </div>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="actions-grid">
                            <Link to="/subscribers" className="action-card">
                                <div className="action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M21 7l-9-4-9 4" />
                                    </svg>
                                </div>
                                <span>訂閲用戶管理</span>
                            </Link>
                            <button className="action-card" disabled>
                                <div className="action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                                    </svg>
                                </div>
                                <span>Manage Users</span>
                                <span className="coming-soon">Coming Soon</span>
                            </button>
                            <Link to="/licenses" className="action-card">
                                <div className="action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <span>許可證管理</span>
                            </Link>
                            <Link to="/analytics" className="action-card">
                                <div className="action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20V10M6 20V4M18 20v-6" />
                                    </svg>
                                </div>
                                <span>數據分析</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>

    );
}

export default DashboardPage;
