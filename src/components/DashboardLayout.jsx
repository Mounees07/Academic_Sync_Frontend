import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { userData } = useAuth();

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const homeRoute = userData?.role === 'ADMIN'
        ? '/admin/dashboard'
        : userData?.role === 'PLACEMENT_COORDINATOR'
            ? '/placement-coordinator/dashboard'
            : '/dashboard';



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
                <Navbar toggleSidebar={toggleSidebar} />
                <div className="page-content animate-fade-in">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
