import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Bell, CheckCheck, X, AlertTriangle, Clock, CreditCard, FileText, Star, Calendar, Award, GraduationCap, ArrowRight } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentNotifications.css';

const TYPE_CONFIG = {
    LOW_ATTENDANCE: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Attendance' },
    ASSIGNMENT_DUE: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending Assignment' },
    MARK_UPDATE: { icon: Award, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Grades' },
    FEE_DUE: { icon: CreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Fee Due' },
    FEE_PAID: { icon: CheckCheck, color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Payment' },
    LEAVE_UPDATE: { icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Leave' },
    EXAM_REMINDER: { icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Exam' },
    RESULT_PUBLISHED: { icon: GraduationCap, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', label: 'Result' },
    SCHEDULE_PUBLISHED: { icon: Calendar, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', label: 'Schedule' },
    REGISTRATION_OPEN: { icon: FileText, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Registration' },
    GENERAL: { icon: Bell, color: '#64748b', bg: 'rgba(100,116,139,0.08)', label: 'General' },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const StudentNotifications = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!currentUser) return;

        const fetchOrSeed = async () => {
            try {
                const res = await api.get(`/notifications/user/${currentUser.uid}`);
                const data = res.data || [];

                // Sort newest first
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(data);
            } catch (err) {
                console.error("Failed to load notifications", err);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrSeed();
    }, [currentUser]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (_) { /* ignore */ }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const openNotification = async (notification) => {
        if (!notification) return;

        if (!notification.isRead) {
            await markRead(notification.id);
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put(`/notifications/user/${currentUser.uid}/read-all`);
        } catch (_) { /* ignore */ }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const filtered = filter === 'ALL' ? notifications
        : filter === 'UNREAD' ? notifications.filter(n => !n.isRead)
            : notifications.filter(n => n.type === filter);

    if (loading) return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;

    return (
        <div className="notif-page">
            <div className="notif-header">
                <div>
                    <h1><Bell size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />Notifications</h1>
                    <p className="notif-subtitle">
                        {unreadCount > 0 ? <span className="notif-unread-count">{unreadCount} unread</span> : 'All caught up! 🎉'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn-mark-all" onClick={markAllRead}>
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="notif-filters">
                {['ALL', 'UNREAD', ...Object.keys(TYPE_CONFIG).filter(k => k !== 'GENERAL')].map(f => (
                    <button key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}>
                        {f === 'ALL' ? 'All' : f === 'UNREAD' ? `Unread (${unreadCount})` : TYPE_CONFIG[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="notif-list">
                {filtered.length === 0 ? (
                    <div className="notif-empty">
                        <Bell size={48} opacity={0.2} />
                        <p>No notifications here.</p>
                    </div>
                ) : (
                    filtered.map((n) => {
                        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
                        const Icon = cfg.icon;
                        return (
                            <div key={n.id}
                                className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                                onClick={() => openNotification(n)}>
                                <div className="notif-icon-wrap" style={{ background: cfg.bg }}>
                                    <Icon size={18} color={cfg.color} />
                                </div>
                                <div className="notif-body">
                                    <div className="notif-title">
                                        {n.title}
                                        {!n.isRead && <span className="notif-dot" />}
                                    </div>
                                    <div className="notif-message">{n.message}</div>
                                    <div className="notif-meta">
                                        <span className="notif-type-tag" style={{ color: cfg.color, background: cfg.bg }}>
                                            {cfg.label}
                                        </span>
                                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                                        {n.actionUrl && (
                                            <span className="notif-link-tag">
                                                Open details <ArrowRight size={12} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <button className="notif-read-btn" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
