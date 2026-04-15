import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import SessionTimeoutModal from './SessionTimeoutModal';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { SESSION_DURATION_MS, SESSION_WARNING_MS } from '../utils/session';
import './DashboardLayout.css';

// ── Session timeout configuration ─────────────────────────────────────────────
const SESSION_TIMEOUT_MS  = SESSION_DURATION_MS;
const WARN_BEFORE_MS      = SESSION_WARNING_MS;
const WARNING_SECONDS     = WARN_BEFORE_MS / 1000;
// ────────────────────────────────────────────────────────────────────────────

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const { userData, logout } = useAuth();

    const homeRoute = userData?.role === 'ADMIN'
        ? '/admin/dashboard'
        : userData?.role === 'PLACEMENT_COORDINATOR'
            ? '/placement-coordinator/dashboard'
            : '/dashboard';

    const navigate = useNavigate();

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    // Called 1 minute before session ends
    const handleWarn = useCallback(() => {
        setShowTimeoutModal(true);
    }, []);

    // Called when the session expires — sign out and go to login
    const handleTimeout = useCallback(async () => {
        setShowTimeoutModal(false);
        await logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    const { refresh, deadlineAt } = useSessionTimeout({
        timeout:    SESSION_TIMEOUT_MS,
        warnBefore: WARN_BEFORE_MS,
        onWarn:     handleWarn,
        onTimeout:  handleTimeout,
        enabled:    !!userData,
    });

    // User chose to stay — dismiss modal and reset the activity timer
    const handleStay = useCallback(() => {
        setShowTimeoutModal(false);
        refresh();
    }, [refresh]);

    // User chose to manually log out from the warning modal
    const handleLogoutNow = useCallback(() => {
        setShowTimeoutModal(false);
        logout();
    }, [logout]);

    return (
        <div className="dashboard-container">
            <div
                className="page-logo-container"
                onClick={() => window.location.assign(homeRoute)}
                style={{ cursor: 'pointer' }}
            >
                <BrandLogo />
            </div>

            {/* Mobile overlay — closes sidebar when tapping outside */}
            {isSidebarOpen && (
                <div
                    className="mobile-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <FloatingSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="main-content">
                <Navbar
                    toggleSidebar={toggleSidebar}
                    sessionTotalMs={SESSION_TIMEOUT_MS}
                    sessionDeadlineAt={deadlineAt}
                />
                <div className="page-content animate-fade-in">
                    {children || <Outlet />}
                </div>
            </main>

            {/* Session timeout warning modal */}
            <SessionTimeoutModal
                visible={showTimeoutModal}
                secondsLeft={WARNING_SECONDS}
                onStay={handleStay}
                onLogout={handleLogoutNow}
            />
        </div>
    );
};

export default DashboardLayout;
