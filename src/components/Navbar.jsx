import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, User, LogOut, Sun, Moon, Monitor, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import './Navbar.css';

const toRoman = (num) => {
    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '', i;
    for (i in lookup) {
        while (num >= lookup[i]) { roman += i; num -= lookup[i]; }
    }
    return roman;
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TIMER WIDGET
// Renders the shared session countdown from the timeout hook.
// Format: MM:SS:MMM
// ─────────────────────────────────────────────────────────────────────────────
const SessionTimer = ({ sessionTotalMs = 300000, deadlineAt = null }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!deadlineAt) {
            return undefined;
        }

        setNow(Date.now());

        const id = setInterval(() => {
            setNow(Date.now());
        }, 50);

        return () => clearInterval(id);
    }, [deadlineAt]);

    // ── MM:SS:MMM display ───────────────────────────────────────────────────
    const safeMsLeft = Math.max(0, deadlineAt ? deadlineAt - now : sessionTotalMs);
    const totalSecs = Math.floor(safeMsLeft / 1000);
    const mm  = Math.floor(totalSecs / 60);
    const ss  = totalSecs % 60;
    const ms  = safeMsLeft % 1000;
    const display = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;

    // ── Progress 0→1 ────────────────────────────────────────────────────────
    const pct = Math.min(1, Math.max(0, safeMsLeft / sessionTotalMs));

    // ── Blue palette ────────────────────────────────────────────────────────
    let strokeColor, textColor, bgColor, borderColor;
    if (pct > 0.4) {
        strokeColor = '#3b82f6'; textColor = '#60a5fa';
        bgColor = 'rgba(59,130,246,0.09)'; borderColor = 'rgba(59,130,246,0.30)';
    } else if (pct > 0.15) {
        strokeColor = '#818cf8'; textColor = '#a5b4fc';
        bgColor = 'rgba(129,140,248,0.10)'; borderColor = 'rgba(129,140,248,0.35)';
    } else {
        strokeColor = '#a78bfa'; textColor = '#c4b5fd';
        bgColor = 'rgba(167,139,250,0.12)'; borderColor = 'rgba(167,139,250,0.45)';
    }
    const isUrgent = pct <= 0.15;

    // ── SVG ring ─────────────────────────────────────────────────────────────
    const R = 9, CIRC = 2 * Math.PI * R;
    const filled = CIRC * pct, gap = CIRC - filled;

    return (
        <div
            className={`session-timer-pill${isUrgent ? ' session-timer-urgent' : ''}`}
            style={{ background: bgColor, border: `1.5px solid ${borderColor}` }}
            title={`Session expires in ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`}
        >
            <svg width="30" height="30" viewBox="0 0 28 28" style={{ flexShrink: 0, display: 'block' }} aria-hidden="true">
                <circle cx="14" cy="14" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.8" />
                <circle
                    cx="14" cy="14" r={R} fill="none"
                    stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round"
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
                <span className="session-timer-countdown" style={{ color: textColor }}>
                    {display}
                </span>
            </div>
        </div>
    );
};


// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
const Navbar = ({ toggleSidebar, sessionTotalMs = 300000, sessionDeadlineAt = null }) => {
    const { userData, logout } = useAuth();
    const { theme, setTheme }  = useTheme();
    const navigate  = useNavigate();
    const location  = useLocation();

    const [isThemeMenuOpen,   setIsThemeMenuOpen]   = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotifMenuOpen,   setIsNotifMenuOpen]   = useState(false);
    const [recentNotifs,      setRecentNotifs]      = useState([]);
    const [unreadNotifCount,  setUnreadNotifCount]  = useState(0);

    const themeMenuRef   = useRef(null);
    const profileMenuRef = useRef(null);
    const notifMenuRef   = useRef(null);

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (e) { console.error('Logout failed', e); }
    };

    // Fetch notifications
    useEffect(() => {
        if (!userData?.uid) return;
        const load = async () => {
            try {
                const { data } = await api.get(`/notifications/user/${userData.uid}`);
                if (Array.isArray(data)) {
                    setRecentNotifs(data.slice(0, 5));
                    setUnreadNotifCount(data.filter(n => !n.isRead).length);
                }
            } catch { /* ignore */ }
        };
        load();
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, [userData]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (themeMenuRef.current   && !themeMenuRef.current.contains(e.target))   setIsThemeMenuOpen(false);
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setIsProfileMenuOpen(false);
            if (notifMenuRef.current   && !notifMenuRef.current.contains(e.target))   setIsNotifMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openNotification = async (n) => {
        if (!n) return;
        try { if (!n.isRead) await api.put(`/notifications/${n.id}/read`); } catch { /* ignore */ }
        setRecentNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setUnreadNotifCount(prev => Math.max(0, prev - (n.isRead ? 0 : 1)));
        setIsNotifMenuOpen(false);
        navigate(n.actionUrl || '/notifications');
    };

    const getThemeIcon = () => {
        if (theme === 'light')  return <Sun size={20} />;
        if (theme === 'system') return <Monitor size={20} />;
        return <Moon size={20} />;
    };

    const getPageTitle = (pathname) => {
        if (pathname.includes('/dashboard'))  return 'Dashboard';
        if (pathname.includes('/courses'))    return 'My Courses';
        if (pathname.includes('/schedule'))   return 'Schedule';
        if (pathname.includes('/assignments')) return 'Assignments';
        if (pathname.includes('/results'))    return 'Results';
        if (pathname.includes('/attendance')) return 'Attendance';
        if (pathname.includes('/leaves'))     return 'Leave Management';
        if (pathname.includes('/settings'))   return 'Settings';
        const last = pathname.split('/').at(-1);
        return last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ') : 'Dashboard';
    };

    const getRoleHome = () => {
        if (userData?.role === 'ADMIN')                  return '/admin/dashboard';
        if (userData?.role === 'PLACEMENT_COORDINATOR')  return '/placement-coordinator/dashboard';
        return '/dashboard';
    };

    const isHomePage = location.pathname === getRoleHome();

    return (
        <>
            {/* Floating back button on sub-pages */}
            {!isHomePage && (
                <button className="nav-back-floating" onClick={() => navigate(getRoleHome())} title="Return to Dashboard">
                    <ArrowLeft size={18} />
                </button>
            )}

            <nav className="navbar">
                {/* Left: hamburger + mobile page title */}
                <div className="navbar-title">
                    <button className="mobile-menu-btn" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>
                    <span className="mobile-page-title">{getPageTitle(location.pathname)}</span>
                </div>

                {/* Right: actions */}
                <div className="nav-actions">

                    {/* ── Session countdown timer pill ── */}
                    <SessionTimer
                        sessionTotalMs={sessionTotalMs}
                        deadlineAt={sessionDeadlineAt}
                    />


                    {/* Theme toggle */}
                    <div className="theme-wrapper" ref={themeMenuRef}>
                        <button className="icon-btn theme-toggle-btn" onClick={() => setIsThemeMenuOpen(p => !p)} title="Change Theme">
                            {getThemeIcon()}
                        </button>
                        {isThemeMenuOpen && (
                            <div className="theme-menu animate-fade-in">
                                {[['light', <Sun size={16} />, 'Light'], ['dark', <Moon size={16} />, 'Dark'], ['system', <Monitor size={16} />, 'System']].map(([val, icon, label]) => (
                                    <button key={val} className={`theme-option ${theme === val ? 'active' : ''}`} onClick={() => { setTheme(val); setIsThemeMenuOpen(false); }}>
                                        {icon}<span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="notif-nav-wrapper" ref={notifMenuRef} style={{ position: 'relative' }}>
                        <button
                            className={`icon-btn nav-secondary-action ${unreadNotifCount > 0 ? 'has-unread' : ''}`}
                            onClick={() => setIsNotifMenuOpen(p => !p)}
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
                                    ) : recentNotifs.map(n => (
                                        <div key={n.id} className={`nav-notif-item ${!n.isRead ? 'unread' : ''} ${n.actionUrl ? 'has-link' : ''}`} onClick={() => openNotification(n)}>
                                            <div className="nav-notif-content">
                                                <h5>{n.title}</h5>
                                                <p>{n.message}</p>
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

                    {/* Logout */}
                    <button className="icon-btn nav-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>

                    {/* User profile */}
                    <div className="user-profile-wrapper" ref={profileMenuRef} onMouseEnter={() => setIsProfileMenuOpen(true)} onMouseLeave={() => setIsProfileMenuOpen(false)}>
                        <div className="user-profile" onClick={() => setIsProfileMenuOpen(p => !p)} role="button" tabIndex={0}>
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
