import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import './AcademicHealthCard.css';


const gradeColors = {
    A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444',
};

const riskColors = {
    LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444',
};

const AcademicHealthCard = () => {
    const { currentUser } = useAuth();
    const [health, setHealth] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        api.get(`/academic-health/student/${currentUser.uid}`)
            .then(res => setHealth(res.data?.overallHealthScore !== undefined ? res.data : null))
            .catch(() => setHealth(null));
    }, [currentUser]);

    if (!health) return (
        <div className="health-card" style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Academic health data not available yet.
        </div>
    );

    const h = health;
    const score = parseFloat(h.overallHealthScore) || 0;
    const gradeColor = gradeColors[h.grade] || '#64748b';

    const r = 52;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;

    return (
        <div className="health-card">
            <div className="hc-header">
                <div className="hc-icon-wrap">
                    <Activity size={18} color="#6366f1" />
                </div>
                <div>
                    <div className="hc-title">Academic Health Overview</div>
                    <div className="hc-subtitle">Live score based on all modules</div>
                </div>
            </div>

            <div className="hc-body">
                {/* Score Ring */}
                <div className="hc-score-ring">
                    <svg width="128" height="128" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r={r} fill="none"
                            stroke="var(--glass-border)" strokeWidth="10" />
                        <circle cx="64" cy="64" r={r} fill="none"
                            stroke={gradeColor} strokeWidth="10"
                            strokeDasharray={circ} strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 64 64)"
                            style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
                        <text x="64" y="59" textAnchor="middle"
                            fontSize="22" fontWeight="800" fill={gradeColor}>{Math.round(score)}</text>
                        <text x="64" y="76" textAnchor="middle"
                            fontSize="11" fill="var(--text-muted)">Grade {h.grade}</text>
                    </svg>
                </div>

                {/* Pillars */}
                <div className="hc-pillars">
                    {[
                        {
                            label: 'Attendance',
                            value: `${h.avgAttendance?.toFixed(1)}%`,
                            risk: h.attendanceRisk,
                            color: riskColors[h.attendanceRisk] || '#64748b',
                        },
                        {
                            label: 'Fee Status',
                            value: h.feeStatus === 'PAID' ? 'Paid ✓' : 'Pending',
                            risk: h.feeStatus === 'PAID' ? 'LOW' : 'HIGH',
                            color: h.feeStatus === 'PAID' ? '#10b981' : '#ef4444',
                        },
                        {
                            label: 'Performance',
                            value: `${h.performanceScore?.toFixed(1)}%`,
                            risk: h.performanceStatus,
                            color: h.performanceScore >= 75 ? '#10b981' : h.performanceScore >= 50 ? '#f59e0b' : '#ef4444',
                        },
                    ].map((p, i) => (
                        <div key={i} className="hc-pillar">
                            <div className="hc-pillar-label">{p.label}</div>
                            <div className="hc-pillar-value" style={{ color: p.color }}>{p.value}</div>
                            <div className="hc-pillar-risk"
                                style={{ color: p.color, background: `${p.color}18` }}>
                                {p.risk}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            {h.alerts && h.alerts.length > 0 && (
                <div className="hc-alerts">
                    {h.alerts.map((alert, i) => (
                        <div key={i} className="hc-alert-item">
                            <AlertTriangle size={13} color="#f59e0b" />
                            <span>{alert}</span>
                        </div>
                    ))}
                </div>
            )}

            {!h.alerts?.length && (
                <div className="hc-all-good">
                    <CheckCircle size={13} color="#10b981" />
                    <span>All systems looking healthy!</span>
                </div>
            )}
        </div>
    );
};

export default AcademicHealthCard;
