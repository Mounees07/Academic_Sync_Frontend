import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, ClipboardList, Award, FileText, Users,
    TrendingUp, BarChart2, UserCheck, AlertTriangle,
    CheckCircle, ArrowRight, ChevronRight, Star,
    Activity, Target, Zap, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './StudentAcademic.css';

/* ─── tiny demo data fallbacks ────────────────────────────── */
/* ─── color helpers ─────────────────────────────────────── */
const getAttColor = (pct) =>
    pct >= 80 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444';

const getMarkColor = (pct) =>
    pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

const getRiskBadge = (pct) =>
    pct >= 80 ? { label: 'Safe', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
    : pct >= 75 ? { label: 'Warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    : { label: 'At Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };

/* ─── mini SVG ring ─────────────────────────────────────────── */
const MiniRing = ({ pct, color, size = 46 }) => {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth="5" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
            <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{Math.round(pct)}%</text>
        </svg>
    );
};

const StudentAcademic = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [attendance, setAttendance] = useState(null);
    const [marks, setMarks] = useState(null);
    const [recentSessions, setRecentSessions] = useState([]);

    useEffect(() => {
        if (!currentUser) return;
        api.get(`/subject-attendance/student/${currentUser.uid}`)
            .then(res => setAttendance(res.data || []))
            .catch(() => setAttendance([]));

        api.get(`/internal-marks/student/${currentUser.uid}`)
            .then(res => setMarks(res.data || []))
            .catch(() => setMarks([]));

        api.get(`/course-attendance/student/${currentUser.uid}/timeline`)
            .then(res => setRecentSessions((res.data || []).slice(0, 4)))
            .catch(() => setRecentSessions([]));
    }, [currentUser]);

    const attData = attendance || [];
    const marksData = marks || [];

    const avgAtt = attData.length
        ? Math.round(attData.reduce((s, a) => s + parseFloat(a.percentage || 0), 0) / attData.length)
        : 0;
    const avgMark = marksData.length
        ? Math.round(marksData.reduce((s, m) => s + parseFloat(m.percentageScore || 0), 0) / marksData.length)
        : 0;
    const atRiskCount = attData.filter(a => parseFloat(a.percentage) < 75).length;

    const QUICK_LINKS = [
        { label: 'My Courses',    icon: <BookOpen  size={26} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  to: '/student/courses' },
        { label: 'Choose Faculty',icon: <Users     size={26} />, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', to: '/student/course-registration' },
        { label: 'Assignments',   icon: <ClipboardList size={26} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', to: '/student/assignments' },
        { label: 'Result',        icon: <Award     size={26} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', to: '/student/results' },
        { label: 'Exam Seating',  icon: <FileText  size={26} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  to: '/student/exam-seating' },
        { label: 'Academic Timetable', icon: <Activity size={26} />, color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', to: '/schedule' },
       
    ];

    return (
        <div className="sa-page">
            {/* ── Header ── */}
            <div className="sa-header">
                <div>
                    <h1 className="sa-title">Academic Hub</h1>
                    <p className="sa-sub">All your academic tools and progress at a glance</p>
                </div>
                <div className="sa-header-stats">
                    <div className="sa-hstat" style={{ borderColor: getAttColor(avgAtt) }}>
                        <span className="sa-hstat-val" style={{ color: getAttColor(avgAtt) }}>{avgAtt}%</span>
                        <span className="sa-hstat-label">Avg Attendance</span>
                    </div>
                    <div className="sa-hstat" style={{ borderColor: getMarkColor(avgMark) }}>
                        <span className="sa-hstat-val" style={{ color: getMarkColor(avgMark) }}>{avgMark}%</span>
                        <span className="sa-hstat-label">Avg Marks</span>
                    </div>
                </div>
            </div>

            {/* ── Quick Links Grid ── */}
            <section className="sa-section">
                <div className="sa-section-title">
                    <Zap size={16} color="#f59e0b" /> Quick Access
                </div>
                <div className="sa-quick-grid">
                    {QUICK_LINKS.map((q, i) => (
                        <button key={i} className="sa-quick-btn" onClick={() => navigate(q.to)}>
                            <div className="sa-quick-icon" style={{ background: q.bg, color: q.color }}>
                                {q.icon}
                            </div>
                            <span className="sa-quick-label">{q.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Two big cards ── */}
            <div className="sa-cards-row">

                {/* ── ATTENDANCE STATUS CARD ── */}
                <div className="sa-big-card">
                    <div className="sa-card-header">
                        <div className="sa-card-icon-wrap" style={{ background: 'rgba(99,102,241,0.1)' }}>
                            <UserCheck size={20} color="#6366f1" />
                        </div>
                        <div>
                            <div className="sa-card-title">Attendance Status</div>
                            <div className="sa-card-sub">Subject-wise attendance tracking</div>
                        </div>
                        {atRiskCount > 0 && (
                            <div className="sa-risk-badge">
                                <AlertTriangle size={12} /> {atRiskCount} at risk
                            </div>
                        )}
                    </div>

                    {/* Overall bar */}
                    <div className="sa-overall-row">
                        <div className="sa-overall-label">Overall Avg</div>
                        <div className="sa-overall-bar-wrap">
                            <div className="sa-overall-bar">
                                <div className="sa-overall-fill"
                                    style={{ width: `${avgAtt}%`, background: getAttColor(avgAtt) }} />
                            </div>
                            <span className="sa-overall-pct" style={{ color: getAttColor(avgAtt) }}>
                                {avgAtt}%
                            </span>
                        </div>
                    </div>

                    {/* Subject rows */}
                    <div className="sa-subject-list">
                        {attData.slice(0, 4).map((sub, i) => {
                            const pct = parseFloat(sub.percentage || 0);
                            const badge = getRiskBadge(pct);
                            return (
                                <div key={i} className="sa-subject-row">
                                    <MiniRing pct={pct} color={getAttColor(pct)} />
                                    <div className="sa-subject-info">
                                        <div className="sa-subject-name">
                                            {sub.subjectName?.length > 22 ? sub.subjectName.slice(0, 22) + '…' : sub.subjectName}
                                        </div>
                                        <div className="sa-subject-meta">
                                            {sub.attendedClasses ?? '—'} / {sub.totalClasses ?? '—'} classes
                                        </div>
                                    </div>
                                    <span className="sa-risk-chip"
                                        style={{ color: badge.color, background: badge.bg }}>
                                        {badge.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button className="sa-view-btn indigo" onClick={() => navigate('/student/attendance-analytics')}>
                        View Detailed Analytics <ArrowRight size={15} />
                    </button>

                    {recentSessions.length > 0 && (
                        <div className="sa-grade-strip" style={{ marginTop: 14, justifyContent: 'space-between', gap: 10 }}>
                            {recentSessions.map((session) => (
                                <div key={session.id} className="sa-grade-item" style={{ alignItems: 'flex-start', minWidth: 0 }}>
                                    <span className="sa-grade-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {session.courseCode || session.courseName}
                                    </span>
                                    <span className="sa-grade-label">
                                        {session.date || '—'} · {session.session || '—'}
                                    </span>
                                    <span className="sa-grade-label">
                                        {session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : 'Slot not mapped'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── ACADEMIC PERFORMANCE CARD ── */}
                <div className="sa-big-card">
                    <div className="sa-card-header">
                        <div className="sa-card-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <BarChart2 size={20} color="#10b981" />
                        </div>
                        <div>
                            <div className="sa-card-title">Academic Performance</div>
                            <div className="sa-card-sub">Internal marks across subjects</div>
                        </div>
                        <div className="sa-avg-chip"
                            style={{ color: getMarkColor(avgMark), background: `${getMarkColor(avgMark)}18` }}>
                            Avg {avgMark}%
                        </div>
                    </div>

                    {/* Subject mark bars */}
                    <div className="sa-marks-list">
                        {marksData.slice(0, 4).map((m, i) => {
                            const pct = parseFloat(m.percentageScore || 0);
                            const color = getMarkColor(pct);
                            return (
                                <div key={i} className="sa-mark-row">
                                    <div className="sa-mark-header-row">
                                        <span className="sa-mark-name">
                                            {m.subjectName?.length > 24 ? m.subjectName.slice(0, 24) + '…' : m.subjectName}
                                        </span>
                                        <span className="sa-mark-pct" style={{ color }}>{Math.round(pct)}%</span>
                                    </div>
                                    <div className="sa-mark-bar-wrap">
                                        <div className="sa-mark-bar">
                                            <div className="sa-mark-fill"
                                                style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Grade summary */}
                    <div className="sa-grade-strip">
                        {[
                            { label: 'Excellent', threshold: 75, color: '#10b981' },
                            { label: 'Average',   threshold: 50, color: '#f59e0b' },
                            { label: 'Low',       threshold: 0,  color: '#ef4444' },
                        ].map((g, i) => {
                            const count = marksData.filter(m =>
                                g.label === 'Excellent' ? m.percentageScore >= 75
                                : g.label === 'Average' ? m.percentageScore >= 50 && m.percentageScore < 75
                                : m.percentageScore < 50
                            ).length;
                            return (
                                <div key={i} className="sa-grade-item">
                                    <div className="sa-grade-dot" style={{ background: g.color }} />
                                    <span className="sa-grade-count" style={{ color: g.color }}>{count}</span>
                                    <span className="sa-grade-label">{g.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <button className="sa-view-btn green" onClick={() => navigate('/student/performance')}>
                        View Full Performance <ArrowRight size={15} />
                    </button>
                </div>
            </div>

            {/* ── Bottom tips strip ── */}
            <div className="sa-tips-strip">
                <div className="sa-tip">
                    <Target size={16} color="#6366f1" />
                    <span>Maintain <strong>75%+</strong> attendance to avoid detention</span>
                </div>
                <div className="sa-tip">
                    <Star size={16} color="#f59e0b" />
                    <span>Score <strong>50%+</strong> in all internal assessments</span>
                </div>
                <div className="sa-tip">
                    <Activity size={16} color="#10b981" />
                    <span>Check the <strong>Academic Health Card</strong> on your dashboard</span>
                </div>
            </div>
        </div>
    );
};

export default StudentAcademic;
