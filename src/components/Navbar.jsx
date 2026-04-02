import React, { useEffect, useRef, useState } from 'react';
import { Bell, User, LogOut, Sun, Moon, Monitor, ArrowLeft, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import SessionCountdown from './SessionCountdown';
import './Navbar.css';

const toRoman = (num) => {
    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (const key in lookup) {
        while (num >= lookup[key]) {
            roman += key;
            num -= lookup[key];
        }
    }
    return roman;
};

const SessionTimer = ({ sessionTotalMs = 300000, deadlineAt = null }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        setNow(Date.now());
        const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [deadlineAt]);

    const safeMsLeft = Math.max(0, deadlineAt ? deadlineAt - now : sessionTotalMs);
    const pct = Math.min(1, Math.max(0, safeMsLeft / sessionTotalMs));
    const totalSecs = Math.floor(safeMsLeft / 1000);
    const mm = Math.floor(totalSecs / 60);
    const ss = totalSecs % 60;

    let strokeColor;
    let bgColor;
    let borderColor;
    if (pct > 0.4) {
        strokeColor = '#3b82f6';
        bgColor = 'rgba(59,130,246,0.09)';
        borderColor = 'rgba(59,130,246,0.30)';
    } else if (pct > 0.15) {
        strokeColor = '#818cf8';
        bgColor = 'rgba(129,140,248,0.10)';
        borderColor = 'rgba(129,140,248,0.35)';
    } else {
        strokeColor = '#ef4444';
        bgColor = 'rgba(239,68,68,0.12)';
        borderColor = 'rgba(239,68,68,0.45)';
    }

    const isUrgent = pct <= 0.15;
    const radius = 9;
    const circumference = 2 * Math.PI * radius;
    const filled = circumference * pct;
    const gap = circumference - filled;

    return (
        <div
            className={`session-timer-pill${isUrgent ? ' session-timer-urgent' : ''}`}
            style={{ background: bgColor, border: `1.5px solid ${borderColor}` }}
            title={`Session expires in ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
        >
            <svg width="30" height="30" viewBox="0 0 28 28" style={{ flexShrink: 0, display: 'block' }} aria-hidden="true">
                <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.8" />
                <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeDasharray={`${filled} ${gap}`}
                    transform="rotate(-90 14 14)"
                    style={{ filter: `drop-shadow(0 0 4px ${strokeColor}88)` }}
                />
                <circle cx="14" cy="14" r="3.5" fill="none" stroke={strokeColor} strokeWidth="1.2" opacity="0.85" />
                <line x1="14" y1="14" x2="14" y2="11.6" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
                <line x1="14" y1="14" x2="15.8" y2="14.9" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
                <circle cx="14" cy="14" r="0.75" fill={strokeColor} />
            </svg>

            <div className="session-timer-text">
                <span className="session-timer-label">Session</span>
                <SessionCountdown
                    deadlineAt={deadlineAt}
                    fallbackMs={sessionTotalMs}
                    className="session-timer-countdown"
                />
            </div>
        </div>
    );
};

const Navbar = ({ toggleSidebar, sessionTotalMs = 300000, sessionDeadlineAt = null }) => {
    const { userData, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    const themeMenuRef = useRef(null);
    const profileMenuRef = useRef(null);
    const notifMenuRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error('Logout failed', e);
        }
    };

    useEffect(() => {
        if (!userData?.uid) {
            return undefined;
        }

        const load = async () => {
            try {
                const { data } = await api.get(`/notifications/user/${userData.uid}`, {
                    skipSessionActivity: true,
                });
                if (Array.isArray(data)) {
                    setRecentNotifs(data.slice(0, 5));
                    setUnreadNotifCount(data.filter((n) => !n.isRead).length);
                }
            } catch {
                // Ignore notification polling errors.
            }
        };

        load();
        const intervalId = window.setInterval(load, 30000);
        return () => window.clearInterval(intervalId);
    }, [userData]);

    useEffect(() => {
        const handler = (e) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
                setIsThemeMenuOpen(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setIsProfileMenuOpen(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
                setIsNotifMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openNotification = async (notification) => {
        if (!notification) {
            return;
        }

        try {
            if (!notification.isRead) {
                await api.put(`/notifications/${notification.id}/read`, null, {
                    skipSessionActivity: true,
                });
            }
        } catch {
            // Ignore notification mark-as-read errors.
        }

        setRecentNotifs((prev) => prev.map((item) => (
            item.id === notification.id ? { ...item, isRead: true } : item
        )));
        setUnreadNotifCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
        setIsNotifMenuOpen(false);
        navigate(notification.actionUrl || '/notifications');
    };

    const getThemeIcon = () => {
        if (theme === 'light') {
            return <Sun size={20} />;
        }
        if (theme === 'system') {
            return <Monitor size={20} />;
        }
        return <Moon size={20} />;
    };

    const getPageTitle = (pathname) => {
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/courses')) return 'My Courses';
        if (pathname.includes('/schedule')) return 'Schedule';
        if (pathname.includes('/assignments')) return 'Assignments';
        if (pathname.includes('/results')) return 'Results';
        if (pathname.includes('/attendance')) return 'Attendance';
        if (pathname.includes('/leaves')) return 'Leave Management';
        if (pathname.includes('/settings')) return 'Settings';
        const last = pathname.split('/').at(-1);
        return last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ') : 'Dashboard';
    };

    const getRoleHome = () => {
        if (userData?.role === 'ADMIN') return '/admin/dashboard';
        if (userData?.role === 'PLACEMENT_COORDINATOR') return '/placement-coordinator/dashboard';
        return '/dashboard';
    };

    const isHomePage = location.pathname === getRoleHome();

    return (
        <>
            {!isHomePage && (
                <button className="nav-back-floating" onClick={() => navigate(getRoleHome())} title="Return to Dashboard">
                    <ArrowLeft size={18} />
                </button>
            )}

            <nav className="navbar">
                <div className="navbar-title">
                    <button className="mobile-menu-btn" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>
                    <span className="mobile-page-title">{getPageTitle(location.pathname)}</span>
                </div>

                <div className="nav-actions">
                    <SessionTimer
                        sessionTotalMs={sessionTotalMs}
                        deadlineAt={sessionDeadlineAt}
                    />

                    <div className="theme-wrapper" ref={themeMenuRef}>
                        <button className="icon-btn theme-toggle-btn" onClick={() => setIsThemeMenuOpen((p) => !p)} title="Change Theme">
                            {getThemeIcon()}
                        </button>
                        {isThemeMenuOpen && (
                            <div className="theme-menu animate-fade-in">
                                {[['light', <Sun size={16} />, 'Light'], ['dark', <Moon size={16} />, 'Dark'], ['system', <Monitor size={16} />, 'System']].map(([value, icon, label]) => (
                                    <button
                                        key={value}
                                        className={`theme-option ${theme === value ? 'active' : ''}`}
                                        onClick={() => {
                                            setTheme(value);
                                            setIsThemeMenuOpen(false);
                                        }}
                                    >
                                        {icon}
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="notif-nav-wrapper" ref={notifMenuRef} style={{ position: 'relative' }}>
                        <button
                            className={`icon-btn nav-secondary-action ${unreadNotifCount > 0 ? 'has-unread' : ''}`}
                            onClick={() => setIsNotifMenuOpen((p) => !p)}
                            title="Notifications"
                        >
                            <Bell size={20} />
                            {unreadNotifCount > 0 && <span className="notification-dot" />}
                        </button>
                        {isNotifMenuOpen && (
                            <div className="nav-notif-dropdown animate-fade-in custom-scrollbar">
                                <div className="nav-notif-header">
                                    <h4>Notifications</h4>
                                    {unreadNotifCount > 0 && <span>{unreadNotifCount} new</span>}
                                </div>
                                <div className="nav-notif-body">
                                    {recentNotifs.length === 0 ? (
                                        <div className="nav-notif-empty"><Bell size={32} opacity={0.2} /><p>No new notifications</p></div>
                                    ) : recentNotifs.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`nav-notif-item ${!notification.isRead ? 'unread' : ''} ${notification.actionUrl ? 'has-link' : ''}`}
                                            onClick={() => openNotification(notification)}
                                        >
                                            <div className="nav-notif-content">
                                                <h5>{notification.title}</h5>
                                                <p>{notification.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="nav-notif-footer" onClick={() => { setIsNotifMenuOpen(false); navigate('/notifications'); }}>
                                    View full inbox
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="icon-btn nav-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>

                    <div className="user-profile-wrapper" ref={profileMenuRef} onMouseEnter={() => setIsProfileMenuOpen(true)} onMouseLeave={() => setIsProfileMenuOpen(false)}>
                        <div className="user-profile" onClick={() => setIsProfileMenuOpen((p) => !p)} role="button" tabIndex={0}>
                            <div className="user-info">
                                <span className="user-name">{userData?.fullName || 'User'}</span>
                                <span className="user-role">{userData?.role || 'STUDENT'}</span>
                            </div>
                            <div className="avatar">
                                {userData?.profilePictureUrl
                                    ? <img src={userData.profilePictureUrl} alt="avatar" />
                                    : <User size={20} />}
                            </div>
                        </div>

                        {isProfileMenuOpen && (
                            <div className="profile-dropdown animate-fade-in">
                                <div className="dropdown-header">
                                    <div className="dropdown-user-details">
                                        <span className="dd-name">{userData?.fullName || 'User Name'}</span>
                                        <span className="dd-email">{userData?.email || ''}</span>
                                        <span className="dd-role">
                                            {userData?.department && `${userData.department}`}
                                            {userData?.rollNumber && ` • ${userData.rollNumber}`}
                                        </span>
                                    </div>
                                </div>

                                {userData?.role === 'STUDENT' && (
                                    <div className="dropdown-journey-section" style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ marginBottom: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Semester</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: 6, fontSize: '0.85rem' }}>
                                                Semester {toRoman(userData?.semester || 1)}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>In Progress</span>
                                        </div>
                                    </div>
                                )}

                                {userData?.role === 'STUDENT' && (
                                    <button className="dropdown-item" onClick={() => navigate('/my-profile')}>
                                        <User size={16} /><span>My Profile</span>
                                    </button>
                                )}

                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={16} /><span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
