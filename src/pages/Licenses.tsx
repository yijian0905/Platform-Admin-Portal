import { useEffect, useState, useCallback } from 'react';
import { api, type License } from '../api';
import './Licenses.css';

type LicenseStatus = 'all' | 'active' | 'expiring' | 'expired';

export function LicensesPage() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<LicenseStatus>('all');

    const loadLicenses = useCallback(async () => {
        setIsLoading(true);
        const result = await api.licenses.list({
            page,
            pageSize,
            status: statusFilter === 'all' ? 'all' : statusFilter === 'expiring' ? 'active' : statusFilter,
        });

        if (result.success && result.data) {
            let filteredLicenses = result.data.items;

            // Client-side filtering for expiring soon
            if (statusFilter === 'expiring') {
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                filteredLicenses = filteredLicenses.filter(l =>
                    new Date(l.expiresAt) <= thirtyDaysFromNow && new Date(l.expiresAt) > new Date()
                );
            }

            setLicenses(filteredLicenses);
            setTotal(result.data.total);
        } else {
            // Show placeholder if API not implemented
            setLicenses([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [page, pageSize, statusFilter]);

    useEffect(() => {
        loadLicenses();
    }, [loadLicenses]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDaysRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (license: License) => {
        if (!license.isActive) {
            return <span className="status-badge inactive">Inactive</span>;
        }
        const days = getDaysRemaining(license.expiresAt);
        if (days <= 0) {
            return <span className="status-badge expired">Expired</span>;
        }
        if (days <= 30) {
            return <span className="status-badge expiring">Expiring in {days}d</span>;
        }
        return <span className="status-badge active">Active</span>;
    };

    const getTierBadge = (tier: string) => {
        const tierMap: Record<string, { label: string; className: string }> = {
            L1: { label: 'Basic', className: 'tier-l1' },
            L2: { label: 'Pro', className: 'tier-l2' },
            L3: { label: 'Enterprise', className: 'tier-l3' },
        };
        const tierInfo = tierMap[tier] || { label: tier, className: 'tier-l1' };
        return <span className={`tier-badge ${tierInfo.className}`}>{tierInfo.label}</span>;
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="licenses-page">
            <div className="page-header">
                <div className="page-title">
                    <h1>Licenses</h1>
                    <span className="page-subtitle">許可證管理</span>
                </div>
            </div>

            <div className="filters-bar">
                <div className="filter-tabs">
                    {(['all', 'active', 'expiring', 'expired'] as const).map((status) => (
                        <button
                            key={status}
                            className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                        >
                            {status === 'all' && 'All'}
                            {status === 'active' && 'Active'}
                            {status === 'expiring' && '⚠️ Expiring Soon'}
                            {status === 'expired' && 'Expired'}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner-lg"></div>
                    <p>Loading licenses...</p>
                </div>
            ) : licenses.length === 0 ? (
                <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>No licenses found</p>
                </div>
            ) : (
                <>
                    <div className="licenses-table-container">
                        <table className="licenses-table">
                            <thead>
                                <tr>
                                    <th>License Key</th>
                                    <th>Tier</th>
                                    <th>Max Users</th>
                                    <th>Starts</th>
                                    <th>Expires</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map((license) => (
                                    <tr key={license.id}>
                                        <td className="license-key">
                                            <code>{license.licenseKey.substring(0, 16)}...</code>
                                        </td>
                                        <td>{getTierBadge(license.tier)}</td>
                                        <td>{license.maxUsers}</td>
                                        <td>{formatDate(license.startsAt)}</td>
                                        <td>{formatDate(license.expiresAt)}</td>
                                        <td>{getStatusBadge(license)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="page-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default LicensesPage;
