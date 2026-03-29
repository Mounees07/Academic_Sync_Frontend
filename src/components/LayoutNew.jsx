import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import './DashboardLayout.css';

const LayoutNew = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { userData } = useAuth();
    const homeRoute = userData?.role === 'ADMIN'
        ? '/admin/dashboard'
        : userData?.role === 'PLACEMENT_COORDINATOR'
            ? '/placement-coordinator/dashboard'
            : '/dashboard';

    // Force a fresh render
    return (
        <div className="dashboard-container">
            <div
                className="page-logo-container"
                onClick={() => window.location.assign(homeRoute)}
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
                <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="page-content animate-fade-in" style={{ flex: 1 }}>
                    {children ? children : <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default LayoutNew;
