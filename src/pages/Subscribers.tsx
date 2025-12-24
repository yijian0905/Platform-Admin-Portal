import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Subscriber, type SubscriberDetail, type SubscriberUser, type PaginatedResponse } from '../api';
import './Subscribers.css';

type StatusFilter = 'all' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
type TierFilter = 'all' | 'L1' | 'L2' | 'L3';

interface SubscriberModalProps {
    subscriber: SubscriberDetail;
    users: SubscriberUser[];
    isLoadingUsers: boolean;
    onClose: () => void;
    onStatusChange: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}

function SubscriberDetailModal({
    subscriber,
    users,
    isLoadingUsers,
    onClose,
    onStatusChange,
    onRemove
}: SubscriberModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    const handleStatusChange = async (status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') => {
        setIsUpdating(true);
        await onStatusChange(subscriber.id, status);
        setIsUpdating(false);
    };

    const handleRemove = async () => {
        setIsUpdating(true);
        await onRemove(subscriber.id);
        setIsUpdating(false);
        onClose();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '從未登錄';
        return new Date(dateStr).toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTierName = (tier: string) => {
        const tierNames: Record<string, string> = {
            'L1': 'Basic',
            'L2': 'Pro',
            'L3': 'Enterprise',
        };
        return tierNames[tier] || tier;
    };

    const isLicenseExpiringSoon = () => {
        if (!subscriber.license) return false;
        const expiresAt = new Date(subscriber.license.expiresAt);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isLicenseExpired = () => {
        if (!subscriber.license) return true;
        return new Date(subscriber.license.expiresAt) < new Date();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h2>{subscriber.name}</h2>
                        <span className={`status-badge ${subscriber.status.toLowerCase()}`}>
                            {subscriber.status}
                        </span>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Company Info */}
                    <section className="detail-section">
                        <h3>公司信息</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">公司名稱</span>
                                <span className="info-value">{subscriber.name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">標識符</span>
                                <span className="info-value">{subscriber.slug}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">套餐等級</span>
                                <span className="info-value">
                                    <span className={`tier-badge tier-${subscriber.tier.toLowerCase()}`}>
                                        {getTierName(subscriber.tier)}
                                    </span>
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">創建日期</span>
                                <span className="info-value">{formatDate(subscriber.createdAt)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">用戶數量</span>
                                <span className="info-value">{subscriber.userCount} 人</span>
                            </div>
                            {subscriber.domain && (
                                <div className="info-item">
                                    <span className="info-label">域名</span>
                                    <span className="info-value">{subscriber.domain}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* License Info */}
                    <section className="detail-section">
                        <h3>許可證信息</h3>
                        {subscriber.license ? (
                            <div className="license-card">
                                <div className="license-key">
                                    <span className="info-label">許可證密鑰</span>
                                    <code>{subscriber.license.licenseKey}</code>
                                </div>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">最大用戶數</span>
                                        <span className="info-value">{subscriber.license.maxUsers}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">開始日期</span>
                                        <span className="info-value">{formatDate(subscriber.license.startsAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">到期日期</span>
                                        <span className={`info-value ${isLicenseExpired() ? 'text-danger' : isLicenseExpiringSoon() ? 'text-warning' : ''}`}>
                                            {formatDate(subscriber.license.expiresAt)}
                                            {isLicenseExpired() && <span className="badge-inline danger">已過期</span>}
                                            {isLicenseExpiringSoon() && <span className="badge-inline warning">即將到期</span>}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">狀態</span>
                                        <span className={`info-value ${subscriber.license.isActive ? 'text-success' : 'text-danger'}`}>
                                            {subscriber.license.isActive ? '有效' : '無效'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-license">
                                <p>沒有有效的許可證</p>
                            </div>
                        )}
                    </section>

                    {/* Users List */}
                    <section className="detail-section">
                        <h3>用戶列表 ({subscriber.userCount})</h3>
                        {isLoadingUsers ? (
                            <div className="loading-users">
                                <div className="spinner"></div>
                                <span>加載用戶...</span>
                            </div>
                        ) : users.length > 0 ? (
                            <div className="users-table-wrapper">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>姓名</th>
                                            <th>郵箱</th>
                                            <th>角色</th>
                                            <th>狀態</th>
                                            <th>最後登錄</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
                                                        {user.isActive ? '活躍' : '停用'}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{formatDateTime(user.lastLoginAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-users">暫無用戶</p>
                        )}
                    </section>

                    {/* Actions */}
                    <section className="detail-section actions-section">
                        <h3>狀態管理</h3>
                        <div className="action-buttons">
                            {subscriber.status !== 'ACTIVE' && (
                                <button
                                    className="action-btn activate"
                                    onClick={() => handleStatusChange('ACTIVE')}
                                    disabled={isUpdating}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                    啓用
                                </button>
                            )}
                            {subscriber.status !== 'SUSPENDED' && (
                                <button
                                    className="action-btn suspend"
                                    onClick={() => handleStatusChange('SUSPENDED')}
                                    disabled={isUpdating}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="6" y="4" width="4" height="16" />
                                        <rect x="14" y="4" width="4" height="16" />
                                    </svg>
                                    暫停
                                </button>
                            )}
                            <button
                                className="action-btn remove"
                                onClick={() => setShowRemoveConfirm(true)}
                                disabled={isUpdating}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6" />
                                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                                </svg>
                                移除
                            </button>
                        </div>
                        {isUpdating && <div className="updating-indicator">更新中...</div>}
                    </section>
                </div>

                {/* Remove Confirmation */}
                {showRemoveConfirm && (
                    <div className="confirm-overlay">
                        <div className="confirm-dialog">
                            <h3>確認移除</h3>
                            <p>確定要移除 <strong>{subscriber.name}</strong> 嗎？</p>
                            <p className="confirm-warning">此操作將停用該租戶及其所有用戶和許可證。</p>
                            <div className="confirm-buttons">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowRemoveConfirm(false)}
                                    disabled={isUpdating}
                                >
                                    取消
                                </button>
                                <button
                                    className="btn-confirm-remove"
                                    onClick={handleRemove}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? '處理中...' : '確認移除'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function SubscribersPage() {
    const navigate = useNavigate();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');

    // Modal
    const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberDetail | null>(null);
    const [subscriberUsers, setSubscriberUsers] = useState<SubscriberUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const loadSubscribers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await api.subscribers.list({
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            tier: tierFilter !== 'all' ? tierFilter : undefined,
        });

        if (result.success && result.data) {
            const data = result.data as PaginatedResponse<Subscriber>;
            setSubscribers(data.items);
            setPagination(prev => ({
                ...prev,
                total: data.total,
                totalPages: data.totalPages,
            }));
        } else {
            setError(result.error?.message || '無法加載訂閲用戶');
        }

        setIsLoading(false);
    }, [pagination.page, pagination.pageSize, searchTerm, statusFilter, tierFilter]);

    useEffect(() => {
        loadSubscribers();
    }, [loadSubscribers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleViewSubscriber = async (subscriber: Subscriber) => {
        // Get full details
        const result = await api.subscribers.get(subscriber.id);
        if (result.success && result.data) {
            setSelectedSubscriber(result.data);
            loadSubscriberUsers(subscriber.id);
        }
    };

    const loadSubscriberUsers = async (subscriberId: string) => {
        setIsLoadingUsers(true);
        const result = await api.subscribers.getUsers(subscriberId, { pageSize: 100 });
        if (result.success && result.data) {
            setSubscriberUsers((result.data as PaginatedResponse<SubscriberUser>).items);
        }
        setIsLoadingUsers(false);
    };

    const handleStatusChange = async (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') => {
        const result = await api.subscribers.updateStatus(id, status);
        if (result.success) {
            // Refresh the list and modal
            loadSubscribers();
            if (selectedSubscriber?.id === id) {
                const updated = await api.subscribers.get(id);
                if (updated.success && updated.data) {
                    setSelectedSubscriber(updated.data);
                }
            }
        }
    };

    const handleRemove = async (id: string) => {
        const result = await api.subscribers.remove(id);
        if (result.success) {
            loadSubscribers();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTierName = (tier: string) => {
        const tierNames: Record<string, string> = {
            'L1': 'Basic',
            'L2': 'Pro',
            'L3': 'Enterprise',
        };
        return tierNames[tier] || tier;
    };

    const isLicenseExpiringSoon = (subscriber: Subscriber) => {
        if (!subscriber.license) return false;
        const expiresAt = new Date(subscriber.license.expiresAt);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    return (
        <div className="subscribers-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    返回 Dashboard
                </button>
                <h1>訂閲用戶管理</h1>
                <p>管理所有訂閲租戶和許可證</p>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="搜索公司名稱..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="search-btn">搜索</button>
                </form>

                <div className="filter-group">
                    <select
                        value={statusFilter}
                        onChange={e => {
                            setStatusFilter(e.target.value as StatusFilter);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="all">所有狀態</option>
                        <option value="ACTIVE">活躍</option>
                        <option value="SUSPENDED">暫停</option>
                        <option value="TRIAL">試用</option>
                        <option value="EXPIRED">已過期</option>
                    </select>

                    <select
                        value={tierFilter}
                        onChange={e => {
                            setTierFilter(e.target.value as TierFilter);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="all">所有套餐</option>
                        <option value="L1">Basic</option>
                        <option value="L2">Pro</option>
                        <option value="L3">Enterprise</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner-lg"></div>
                    <p>加載訂閲用戶...</p>
                </div>
            ) : subscribers.length === 0 ? (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <h3>暫無訂閲用戶</h3>
                    <p>沒有找到符合條件的訂閲用戶</p>
                </div>
            ) : (
                <>
                    <div className="subscribers-table-wrapper">
                        <table className="subscribers-table">
                            <thead>
                                <tr>
                                    <th>公司名稱</th>
                                    <th>套餐</th>
                                    <th>狀態</th>
                                    <th>用戶數</th>
                                    <th>許可證到期</th>
                                    <th>創建日期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map(subscriber => (
                                    <tr key={subscriber.id}>
                                        <td className="company-name">{subscriber.name}</td>
                                        <td>
                                            <span className={`tier-badge tier-${subscriber.tier.toLowerCase()}`}>
                                                {getTierName(subscriber.tier)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${subscriber.status.toLowerCase()}`}>
                                                {subscriber.status}
                                            </span>
                                        </td>
                                        <td>{subscriber.userCount}</td>
                                        <td>
                                            {subscriber.license ? (
                                                <span className={isLicenseExpiringSoon(subscriber) ? 'text-warning' : ''}>
                                                    {formatDate(subscriber.license.expiresAt)}
                                                    {isLicenseExpiringSoon(subscriber) && (
                                                        <span className="expiry-warning" title="即將到期">⚠️</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-muted">無許可證</span>
                                            )}
                                        </td>
                                        <td className="text-muted">{formatDate(subscriber.createdAt)}</td>
                                        <td>
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewSubscriber(subscriber)}
                                            >
                                                查看詳情
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                上一頁
                            </button>
                            <span className="page-info">
                                第 {pagination.page} 頁，共 {pagination.totalPages} 頁
                                （{pagination.total} 條記錄）
                            </span>
                            <button
                                className="page-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                下一頁
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedSubscriber && (
                <SubscriberDetailModal
                    subscriber={selectedSubscriber}
                    users={subscriberUsers}
                    isLoadingUsers={isLoadingUsers}
                    onClose={() => {
                        setSelectedSubscriber(null);
                        setSubscriberUsers([]);
                    }}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                />
            )}
        </div>
    );
}

export default SubscribersPage;
