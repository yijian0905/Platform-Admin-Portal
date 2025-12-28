import { Link, useLocation } from 'react-router-dom';

interface NavItem {
    path: string;
    label: string;
    labelCN?: string;
    icon: React.ReactNode;
    disabled?: boolean;
}

const navItems: NavItem[] = [
    {
        path: '/',
        label: 'Dashboard',
        labelCN: '儀表板',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
        ),
    },
    {
        path: '/subscribers',
        label: 'Subscribers',
        labelCN: '訂閱用戶',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M21 7l-9-4-9 4" />
            </svg>
        ),
    },
    {
        path: '/licenses',
        label: 'Licenses',
        labelCN: '許可證',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        path: '/analytics',
        label: 'Analytics',
        labelCN: '數據分析',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10M6 20V4M18 20v-6" />
            </svg>
        ),
    },
];

interface SidebarProps {
    onLogout: () => void;
    userName?: string;
    userRole?: string;
}

export function Sidebar({ onLogout, userName, userRole }: SidebarProps) {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                        <rect width="48" height="48" rx="12" fill="url(#sidebarGradient)" />
                        <path d="M14 18h20M14 24h16M14 30h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="sidebarGradient" x1="0" y1="0" x2="48" y2="48">
                                <stop stopColor="#6366F1" />
                                <stop offset="1" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="sidebar-title">
                    <h1>Admin Portal</h1>
                    <span>ERP System Management</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                        onClick={(e) => item.disabled && e.preventDefault()}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">
                            {item.label}
                            {item.labelCN && <small>{item.labelCN}</small>}
                        </span>
                        {item.disabled && <span className="coming-soon-badge">Soon</span>}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {userName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{userName || 'Admin'}</span>
                        <span className="user-role">{userRole || 'Platform Admin'}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout} title="Logout">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
