import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks';
import { ProtectedRoute, Layout } from './components';
import { LoginPage, DashboardPage, SubscribersPage, LicensesPage, AnalyticsPage } from './pages';
import './App.css';

// Wrapper component to handle layout with auth context
function AppRoutes() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout
                            userName={user?.name || user?.email}
                            userRole={user?.role}
                            onLogout={handleLogout}
                        >
                            <DashboardPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/subscribers"
                element={
                    <ProtectedRoute>
                        <Layout
                            userName={user?.name || user?.email}
                            userRole={user?.role}
                            onLogout={handleLogout}
                        >
                            <SubscribersPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/licenses"
                element={
                    <ProtectedRoute>
                        <Layout
                            userName={user?.name || user?.email}
                            userRole={user?.role}
                            onLogout={handleLogout}
                        >
                            <LicensesPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <Layout
                            userName={user?.name || user?.email}
                            userRole={user?.role}
                            onLogout={handleLogout}
                        >
                            <AnalyticsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
