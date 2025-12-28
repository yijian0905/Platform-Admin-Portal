import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
    userName?: string;
    userRole?: string;
    onLogout: () => void;
}

export function Layout({ children, userName, userRole, onLogout }: LayoutProps) {
    return (
        <div className="layout">
            <Sidebar
                userName={userName}
                userRole={userRole}
                onLogout={onLogout}
            />
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
}

export default Layout;
