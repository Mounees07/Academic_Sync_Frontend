import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Bell, CheckCheck, X, AlertTriangle, Clock, CreditCard, FileText, Star } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentNotifications.css';

const TYPE_CONFIG = {
    LOW_ATTENDANCE: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Attendance' },
    ASSIGNMENT_DUE: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Assignment' },
    FEE_DUE: { icon: CreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Fee' },
    LEAVE_UPDATE: { icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Leave' },
    EXAM_REMINDER: { icon: Star, color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Exam' },
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
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!currentUser) return;
        api.get(`/notifications/user/${currentUser.uid}`)
            .then(res => setNotifications(res.data || []))
            .catch(() => setNotifications([]))
            .finally(() => setLoading(false));
    }, [currentUser]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (_) { /* ignore */ }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
                {['ALL', 'UNREAD', 'LOW_ATTENDANCE', 'ASSIGNMENT_DUE', 'FEE_DUE', 'LEAVE_UPDATE', 'EXAM_REMINDER'].map(f => (
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
                                onClick={() => !n.isRead && markRead(n.id)}>
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
