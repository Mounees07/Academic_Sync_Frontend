import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from './BrandLogo';
import useSessionTimeout from '../hooks/useSessionTimeout';
import {
    SESSION_DURATION_MS,
    SESSION_EVENT_TYPES,
    SESSION_EXPIRED_MESSAGE,
} from '../utils/session';
import './DashboardLayout.css';

const LayoutNew = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { userData, logout } = useAuth();
    const { resolvedTheme } = useTheme();
    const navigate = useNavigate();
    const homeRoute = userData?.role === 'ADMIN'
        ? '/admin/dashboard'
        : userData?.role === 'PLACEMENT_COORDINATOR'
            ? '/placement-coordinator/dashboard'
            : '/dashboard';

    const handleTimeout = React.useCallback(async () => {
        await logout({
            reason: SESSION_EXPIRED_MESSAGE,
            broadcastType: SESSION_EVENT_TYPES.EXPIRED,
        });
        navigate('/login', {
            replace: true,
            state: { message: SESSION_EXPIRED_MESSAGE },
        });
    }, [logout, navigate]);

    const { deadlineAt } = useSessionTimeout({
        timeout: SESSION_DURATION_MS,
        onTimeout: handleTimeout,
        enabled: Boolean(userData),
    });

    React.useEffect(() => {
        const root = document.documentElement;
        const role = userData?.role || '';

        if (role) {
            root.setAttribute('data-app-role', role);
            document.body.setAttribute('data-app-role', role);
        } else {
            root.removeAttribute('data-app-role');
            document.body.removeAttribute('data-app-role');
        }

        root.setAttribute('data-theme', resolvedTheme === 'light' ? 'light' : 'dark');

        return () => {
            root.removeAttribute('data-app-role');
            document.body.removeAttribute('data-app-role');
        };
    }, [resolvedTheme, userData?.role]);

    return (
        <div className="dashboard-container">
            <div
                className="page-logo-container"
                onClick={() => navigate(homeRoute)}
                style={{ cursor: 'pointer' }}
            >
                <BrandLogo />
            </div>

            <FloatingSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="mobile-sidebar-overlay" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="main-content">
                <Navbar
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    sessionTotalMs={SESSION_DURATION_MS}
                    sessionDeadlineAt={deadlineAt}
                />
                <div className="page-content animate-fade-in" style={{ flex: 1 }}>
                    {children ? children : <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default LayoutNew;
