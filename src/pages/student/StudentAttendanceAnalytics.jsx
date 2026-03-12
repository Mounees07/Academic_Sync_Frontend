import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle, RefreshCw } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentAttendanceAnalytics.css';

const COLORS = {
    GREEN: '#10b981',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
};

const POLL_INTERVAL = 15000; // 15 seconds live refresh

const getColor = (pct) =>
    pct >= 80 ? COLORS.GREEN : pct >= 75 ? COLORS.YELLOW : COLORS.RED;

/* Number of extra classes needed to reach 75% */
const classesNeeded = (attended, total) => {
    if (total === 0) return 0;
    if ((attended / total) * 100 >= 75) return 0;
    return Math.ceil((0.75 * total - attended) / 0.25);
};

const SubjectCard = ({ subject }) => {
    const pct = subject.percentage || 0;
    const color = getColor(pct);
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;
    const needed = classesNeeded(subject.attendedClasses, subject.totalClasses);

    return (
        <div className="subj-card">
            <div className="subj-header">
                <div>
                    <div className="subj-name">{subject.subjectName}</div>
                    <div className="subj-code">{subject.subjectCode || '—'}</div>
                </div>
                <div className="subj-ring-wrap">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r={radius} fill="none"
                            stroke="var(--glass-border)" strokeWidth="6" />
                        <circle cx="44" cy="44" r={radius} fill="none"
                            stroke={color} strokeWidth="6"
                            strokeDasharray={circ}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 44 44)" />
                        <text x="44" y="49" textAnchor="middle"
                            fontSize="14" fontWeight="700" fill={color}>
                            {pct}%
                        </text>
                    </svg>
                </div>
            </div>

            <div className="subj-stats">
                <div className="subj-stat-item">
                    <span className="subj-stat-label">Total</span>
                    <span className="subj-stat-val">{subject.totalClasses}</span>
                </div>
                <div className="subj-stat-item">
                    <span className="subj-stat-label">Present</span>
                    <span className="subj-stat-val" style={{ color: COLORS.GREEN }}>{subject.attendedClasses}</span>
                </div>
                <div className="subj-stat-item">
                    <span className="subj-stat-label">Absent</span>
                    <span className="subj-stat-val" style={{ color: COLORS.RED }}>
                        {subject.totalClasses - subject.attendedClasses}
                    </span>
                </div>
            </div>

            <div className="subj-progress-bar">
                <div className="subj-progress-fill"
                    style={{ width: `${pct}%`, background: color }} />
            </div>

            {pct < 75 ? (
                <>
                    <div className="subj-risk-badge">
                        <AlertTriangle size={12} /> Below 75% — At Risk
                    </div>
                    {needed > 0 && (
                        <div className="subj-need-tip">
                            Attend {needed} more class{needed > 1 ? 'es' : ''} to reach 75%
                        </div>
                    )}
                </>
            ) : (
                <div className="subj-risk-badge" style={{ background: 'rgba(16,185,129,0.08)', color: COLORS.GREEN }}>
                    <CheckCircle size={12} /> Safe
                </div>
            )}
        </div>
    );
};

const StudentAttendanceAnalytics = () => {
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setRefreshing(true);
        try {
            const [subRes, analytRes, predRes] = await Promise.all([
                api.get(`/subject-attendance/student/${currentUser.uid}`).catch(() => ({ data: [] })),
                api.get(`/subject-attendance/analytics/${currentUser.uid}`).catch(() => ({ data: {} })),
                api.get(`/subject-attendance/prediction/${currentUser.uid}`).catch(() => ({ data: { predictions: [] } })),
            ]);
            setSubjects(subRes.data || []);
            setAnalytics(analytRes.data || {});
            setPredictions(predRes.data?.predictions || []);
            setLastUpdated(new Date());
        } finally {
            setLoading(false);
            setRefreshing(false);
            setCountdown(POLL_INTERVAL / 1000);
        }
    }, [currentUser]);

    // Initial load
    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    // Live polling
    useEffect(() => {
        if (!currentUser) return;
        intervalRef.current = setInterval(() => fetchData(true), POLL_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [currentUser, fetchData]);

    // Countdown timer
    useEffect(() => {
        countdownRef.current = setInterval(() => {
            setCountdown(prev => (prev <= 1 ? POLL_INTERVAL / 1000 : prev - 1));
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, []);

    const handleManualRefresh = () => {
        clearInterval(intervalRef.current);
        clearInterval(countdownRef.current);
        fetchData(false).then(() => {
            intervalRef.current = setInterval(() => fetchData(true), POLL_INTERVAL);
            countdownRef.current = setInterval(() => {
                setCountdown(prev => (prev <= 1 ? POLL_INTERVAL / 1000 : prev - 1));
            }, 1000);
        });
    };

    if (loading) return (
        <div className="loading-screen">
            <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" />
        </div>
    );

    const trend = analytics?.trend || 'STABLE';
    const monthlyData = analytics?.monthlyData || [];
    const hasRisk = subjects.some(s => s.percentage < 75);

    const totalClasses = subjects.reduce((s, sub) => s + (sub.totalClasses || 0), 0);
    const totalAttended = subjects.reduce((s, sub) => s + (sub.attendedClasses || 0), 0);
    const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
    const safeCount = subjects.filter(s => s.percentage >= 75).length;
    const riskCount = subjects.filter(s => s.percentage < 75).length;

    const TrendIcon = trend === 'IMPROVING' ? TrendingUp : trend === 'DECLINING' ? TrendingDown : Minus;
    const trendColor = trend === 'IMPROVING' ? COLORS.GREEN : trend === 'DECLINING' ? COLORS.RED : COLORS.YELLOW;

    const formattedTime = lastUpdated
        ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '—';

    return (
        <div className="saa-page">
            {/* Header */}
            <div className="saa-header">
                <div>
                    <h1>📊 Attendance Analytics</h1>
                    <p className="saa-subtitle">Subject-wise breakdown &amp; trend analysis</p>
                </div>
                <div className="saa-header-right">
                    <div className="saa-trend-badge" style={{ borderColor: trendColor, color: trendColor }}>
                        <TrendIcon size={16} />
                        <span>{trend === 'IMPROVING' ? 'Improving' : trend === 'DECLINING' ? 'Declining' : 'Stable'}</span>
                    </div>
                    <div className="saa-live-strip">
                        <div className="saa-live-dot" />
                        <span className="saa-live-label">Live</span>
                        <span className="saa-live-countdown">↻ {countdown}s</span>
                    </div>
                    <button
                        className={`saa-refresh-btn${refreshing ? ' spinning' : ''}`}
                        onClick={handleManualRefresh}
                        title="Refresh now"
                        disabled={refreshing}
                    >
                        <RefreshCw size={15} />
                        <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Last Updated bar */}
            <div className="saa-last-updated">
                Last updated at <strong>{formattedTime}</strong> — auto-refreshes every {POLL_INTERVAL / 1000}s
            </div>

            {/* Summary Stats */}
            <div className="saa-stats-strip">
                <div className="saa-stat-box">
                    <div className="saa-stat-label">Overall Attendance</div>
                    <div className="saa-stat-value" style={{ color: getColor(overallPct) }}>{overallPct}%</div>
                    <div className="saa-stat-sub">{totalAttended} / {totalClasses} classes</div>
                </div>
                <div className="saa-stat-box">
                    <div className="saa-stat-label">Total Subjects</div>
                    <div className="saa-stat-value">{subjects.length}</div>
                    <div className="saa-stat-sub">registered subjects</div>
                </div>
                <div className="saa-stat-box">
                    <div className="saa-stat-label">Safe Subjects</div>
                    <div className="saa-stat-value" style={{ color: COLORS.GREEN }}>{safeCount}</div>
                    <div className="saa-stat-sub">above 75%</div>
                </div>
                <div className="saa-stat-box">
                    <div className="saa-stat-label">At Risk</div>
                    <div className="saa-stat-value" style={{ color: riskCount > 0 ? COLORS.RED : COLORS.GREEN }}>{riskCount}</div>
                    <div className="saa-stat-sub">below 75%</div>
                </div>
            </div>

            {/* Risk Warning Banner */}
            {hasRisk && (
                <div className="saa-risk-banner">
                    <AlertTriangle size={18} />
                    <span>
                        <strong>Attendance Risk Detected!</strong> {riskCount} subject{riskCount > 1 ? 's are' : ' is'} below the 75% threshold.
                        Take immediate action to avoid detention.
                    </span>
                </div>
            )}

            {/* Subject Cards */}
            <div className="saa-section-title">Subject-wise Attendance</div>
            {subjects.length === 0 ? (
                <div className="saa-empty-state">
                    <span style={{ fontSize: '3rem' }}>📊</span>
                    <p>No attendance records found yet.</p>
                    <span>Your subject-wise attendance will appear here once your teacher records classes.</span>
                </div>
            ) : (
                <div className="saa-subjects-grid">
                    {subjects.map((s, i) => <SubjectCard key={i} subject={s} />)}
                </div>
            )}

            {/* Monthly Chart + Predictions */}
            <div className="saa-bottom-row">
                {/* Monthly Bar Chart */}
                <div className="saa-chart-card">
                    <div className="saa-card-title">Monthly Attendance Chart</div>
                    <div className="saa-card-subtitle">Average across all subjects per month</div>
                    {monthlyData.length === 0 ? (
                        <div className="saa-empty-state" style={{ marginBottom: 0 }}>
                            <span style={{ fontSize: '2rem' }}>📅</span>
                            <p style={{ fontSize: '0.9rem' }}>No monthly data yet.</p>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit="%" />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: 12, color: 'var(--text-primary)' }}
                                        formatter={(v) => [`${v}%`, 'Attendance']}
                                    />
                                    <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={32}>
                                        {monthlyData.map((entry, idx) => (
                                            <Cell key={idx}
                                                fill={entry.percentage >= 80 ? COLORS.GREEN : entry.percentage >= 75 ? COLORS.YELLOW : COLORS.RED} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                <span className="legend-dot" style={{ background: COLORS.GREEN }} /> &gt;80%
                                <span className="legend-dot" style={{ background: COLORS.YELLOW, marginLeft: 12 }} /> 75–80%
                                <span className="legend-dot" style={{ background: COLORS.RED, marginLeft: 12 }} /> &lt;75%
                            </div>
                        </>
                    )}
                </div>

                {/* Prediction Panel */}
                <div className="saa-pred-card">
                    <div className="saa-card-title">🔮 Attendance Prediction</div>
                    <div className="saa-card-subtitle">Expected final attendance at current rate</div>
                    <div className="pred-list">
                        {predictions.length > 0 ? predictions.map((p, i) => (
                            <div key={i} className="pred-item">
                                <div className="pred-subject">{p.subjectName}</div>
                                <div className="pred-values">
                                    <span className="pred-current">Now: {p.currentPercentage}%</span>
                                    <span className="pred-arrow">→</span>
                                    <span className="pred-final"
                                        style={{ color: p.atRisk ? COLORS.RED : COLORS.GREEN }}>
                                        Final: {p.expectedFinalPercentage}%
                                    </span>
                                    {p.atRisk && <span className="pred-risk-tag">⚠️ Risk</span>}
                                </div>
                            </div>
                        )) : (
                            <div className="saa-empty-state" style={{ padding: '24px 16px', marginBottom: 0 }}>
                                <span style={{ fontSize: '2rem' }}>🔮</span>
                                <p style={{ fontSize: '0.85rem' }}>No prediction data yet.</p>
                                <span>Predictions will appear once enough attendance data is recorded.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendanceAnalytics;
