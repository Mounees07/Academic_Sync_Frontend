import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Upload, CheckCircle, Target, Award, Briefcase } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentPlacement.css';

const SKILLS_LIST = [
    'Data Structures', 'Algorithms', 'System Design', 'SQL',
    'Python / Java', 'Web Development', 'Linux / Shell', 'Git / Version Control',
    'OOP Concepts', 'Problem Solving',
];

const RadialProgress = ({ value, size = 140, stroke = 10, color = '#6366f1' }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="var(--glass-border)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle"
                fontSize="22" fontWeight="800" fill={color}>{Math.round(value)}</text>
            <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
                fontSize="11" fill="var(--text-muted)">Readiness</text>
        </svg>
    );
};


const StudentPlacement = () => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        aptitudeScore: '',
        mockInterviewScore: '',
        preferredRole: '',
        preferredCompanies: '',
    });

    useEffect(() => {
        if (!currentUser) return;
        api.get(`/placement/student/${currentUser.uid}`)
            .then(res => {
                const data = res.data;
                setProfile(data || null);
                if (data) {
                    setForm({
                        aptitudeScore: data.aptitudeScore || '',
                        mockInterviewScore: data.mockInterviewScore || '',
                        preferredRole: data.preferredRole || '',
                        preferredCompanies: data.preferredCompanies || '',
                    });
                }
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [currentUser]);

    const toggleSkill = async (skill) => {
        if (!profile) return;
        const current = profile.completedSkillsList ? profile.completedSkillsList.split(',').filter(Boolean) : [];
        let updated;
        if (current.includes(skill)) {
            updated = current.filter(s => s !== skill);
        } else {
            updated = [...current, skill];
        }
        const updatedList = updated.join(',');
        const newProfile = {
            ...profile,
            completedSkillsList: updatedList,
            skillsCompleted: updated.length,
        };
        setProfile(newProfile);
        try {
            const res = await api.put(`/placement/student/${currentUser.uid}/update`, {
                completedSkillsList: updatedList,
                skillsCompleted: updated.length,
            });
            if (res.data) setProfile(res.data);
        } catch (_) { /* keep local update */ }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put(`/placement/student/${currentUser.uid}/update`, {
                aptitudeScore: parseFloat(form.aptitudeScore) || 0,
                mockInterviewScore: parseFloat(form.mockInterviewScore) || 0,
                preferredRole: form.preferredRole,
                preferredCompanies: form.preferredCompanies,
            });
            setProfile(res.data);
            setEditMode(false);
        } catch (_) {
            // Update locally
            setProfile(prev => ({
                ...prev,
                aptitudeScore: parseFloat(form.aptitudeScore) || prev.aptitudeScore,
                mockInterviewScore: parseFloat(form.mockInterviewScore) || prev.mockInterviewScore,
                preferredRole: form.preferredRole,
                preferredCompanies: form.preferredCompanies,
            }));
            setEditMode(false);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;

    if (!profile) return (
        <div className="placement-page">
            <div className="placement-header">
                <h1><Briefcase size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />Placement Readiness</h1>
            </div>
            <div className="saa-empty-state" style={{ marginTop: 48 }}>
                <span style={{ fontSize: '3.5rem' }}>💼</span>
                <p style={{ fontWeight: 700 }}>No placement profile found.</p>
                <span>Your placement readiness data will appear here once your profile is set up.</span>
            </div>
        </div>
    );

    const p = profile;
    const score = parseFloat(p.readinessScore) || 0;
    const completedSkills = p.completedSkillsList ? p.completedSkillsList.split(',').filter(Boolean) : [];
    const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const readinessLabel = score >= 70 ? 'Placement Ready! 🎯' : score >= 50 ? 'Getting There 🚀' : 'Needs Improvement 📚';

    return (
        <div className="placement-page">
            <div className="placement-header">
                <div>
                    <h1><Briefcase size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />Placement Readiness</h1>
                    <p className="placement-subtitle">Track your placement preparation progress</p>
                </div>
                <button className="btn-edit-profile" onClick={() => setEditMode(!editMode)}>
                    {editMode ? '✕ Cancel' : '✏️ Update Scores'}
                </button>
            </div>

            {/* Edit form */}
            {editMode && (
                <div className="placement-edit-card">
                    <div className="edit-grid">
                        {[
                            { label: 'Aptitude Test Score (0-100)', key: 'aptitudeScore', placeholder: 'e.g. 75' },
                            { label: 'Mock Interview Score (0-100)', key: 'mockInterviewScore', placeholder: 'e.g. 68' },
                            { label: 'Preferred Role', key: 'preferredRole', placeholder: 'e.g. Software Engineer' },
                            { label: 'Target Companies', key: 'preferredCompanies', placeholder: 'e.g. Google, TCS, Wipro' },
                        ].map(f => (
                            <div key={f.key} className="edit-field">
                                <label>{f.label}</label>
                                <input className="placement-input" type="text" placeholder={f.placeholder}
                                    value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                            </div>
                        ))}
                    </div>
                    <button className="btn-save-scores" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </div>
            )}

            <div className="placement-body">
                {/* Left — Score Radial + Summary */}
                <div className="placement-score-col">
                    <div className="placement-score-card">
                        <RadialProgress value={score} color={scoreColor} />
                        <div className="score-label" style={{ color: scoreColor }}>{readinessLabel}</div>
                        <div className="score-desc">Overall Placement Readiness Score</div>
                    </div>

                    {/* Checklist */}
                    <div className="placement-checklist-card">
                        <div className="pc-title">Checklist</div>
                        <div className="pc-item">
                            {p.resumeUploaded ? <CheckCircle size={16} color="#10b981" /> : <div className="pc-circle-empty" />}
                            <span className={p.resumeUploaded ? 'pc-done' : ''}>Resume Uploaded</span>
                        </div>
                        <div className="pc-item">
                            <Target size={16} color={p.aptitudeScore >= 60 ? '#10b981' : '#f59e0b'} />
                            <span>Aptitude: {p.aptitudeScore || 0}/100</span>
                        </div>
                        <div className="pc-item">
                            <Award size={16} color={p.mockInterviewScore >= 60 ? '#10b981' : '#f59e0b'} />
                            <span>Mock Interview: {p.mockInterviewScore || 0}/100</span>
                        </div>
                        <div className="pc-item">
                            <CheckCircle size={16} color={p.skillsCompleted >= 7 ? '#10b981' : '#6366f1'} />
                            <span>Skills: {p.skillsCompleted || 0}/{p.totalSkills || 10} completed</span>
                        </div>
                    </div>

                    {/* Career Prefs */}
                    {(p.preferredRole || p.preferredCompanies) && (
                        <div className="placement-prefs-card">
                            <div className="pc-title">Career Preferences</div>
                            {p.preferredRole && <div className="pref-item"><strong>Role:</strong> {p.preferredRole}</div>}
                            {p.preferredCompanies && <div className="pref-item"><strong>Target:</strong> {p.preferredCompanies}</div>}
                        </div>
                    )}
                </div>

                {/* Right — Skills Grid */}
                <div className="placement-skills-col">
                    <div className="skills-card">
                        <div className="skills-header">
                            <div className="pc-title">Skills Tracker ({completedSkills.length}/{SKILLS_LIST.length})</div>
                            <div className="skills-progress-text">Click to toggle</div>
                        </div>
                        <div className="skills-progress-bar">
                            <div className="skills-progress-fill"
                                style={{ width: `${(completedSkills.length / SKILLS_LIST.length) * 100}%` }} />
                        </div>
                        <div className="skills-grid">
                            {SKILLS_LIST.map((skill, i) => {
                                const done = completedSkills.includes(skill);
                                return (
                                    <button key={i}
                                        className={`skill-chip ${done ? 'done' : ''}`}
                                        onClick={() => toggleSkill(skill)}>
                                        {done && <CheckCircle size={12} />}
                                        {skill}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="score-breakdown-card">
                        <div className="pc-title">Score Breakdown</div>
                        {[
                            { label: 'Resume', value: p.resumeUploaded ? 20 : 0, max: 20, color: '#10b981' },
                            { label: 'Skills', value: Math.round((p.skillsCompleted / (p.totalSkills || 10)) * 30), max: 30, color: '#6366f1' },
                            { label: 'Aptitude', value: Math.round((p.aptitudeScore / 100) * 25), max: 25, color: '#f59e0b' },
                            { label: 'Mock Interview', value: Math.round((p.mockInterviewScore / 100) * 25), max: 25, color: '#ec4899' },
                        ].map((item, i) => (
                            <div key={i} className="bd-row">
                                <div className="bd-label">{item.label}</div>
                                <div className="bd-track">
                                    <div className="bd-fill" style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }} />
                                </div>
                                <div className="bd-val">{item.value}/{item.max}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPlacement;
