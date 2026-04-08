import React, { useEffect, useState } from 'react';
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

const emptyPlacementProfile = {
    resumeUploaded: false,
    resumeUrl: '',
    skillsCompleted: 0,
    totalSkills: 10,
    aptitudeScore: 0,
    mockInterviewScore: 0,
    readinessScore: 0,
    completedSkillsList: '',
    preferredRole: '',
    preferredCompanies: '',
    placementStatus: 'NOT_READY',
    resumeReviewStatus: 'PENDING',
    resumeRemarks: '',
    availableDrives: [],
};

const RadialProgress = ({ value, size = 140, stroke = 10, color = '#6366f1' }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--glass-border)"
                strokeWidth={stroke}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text
                x={size / 2}
                y={size / 2 - 6}
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill={color}
            >
                {Math.round(value)}
            </text>
            <text
                x={size / 2}
                y={size / 2 + 14}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted)"
            >
                Readiness
            </text>
        </svg>
    );
};

const StudentPlacement = () => {
    const { currentUser, userData } = useAuth();
    const [profile, setProfile] = useState(null);
    const [driveApplyingId, setDriveApplyingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resumeSaving, setResumeSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [form, setForm] = useState({
        resumeUrl: '',
        aptitudeScore: '',
        mockInterviewScore: '',
        preferredRole: '',
        preferredCompanies: '',
    });

    const canManagePlacement = userData?.role === 'PLACEMENT_COORDINATOR' || userData?.role === 'ADMIN';

    const formatDriveDate = (dateValue) => {
        if (!dateValue) return 'To be announced';
        return new Date(dateValue).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getRegistrationStatus = (drive) => {
        const status = String(drive?.applicationStatus || '').toUpperCase();
        return Boolean(drive?.appliedAt) || ['APPLIED', 'SHORTLISTED', 'REJECTED'].includes(status);
    };

    const getAttendanceStatus = (drive) => {
        return Boolean(drive?.attended);
    };

    useEffect(() => {
        if (!currentUser) return;

        api.get(`/placement/student/${currentUser.uid}`)
            .then((res) => {
                const data = { ...emptyPlacementProfile, ...(res.data || {}) };
                setProfile(data);
                setLoadError('');
                setForm({
                    resumeUrl: data.resumeUrl || '',
                    aptitudeScore: data.aptitudeScore || '',
                    mockInterviewScore: data.mockInterviewScore || '',
                    preferredRole: data.preferredRole || '',
                    preferredCompanies: data.preferredCompanies || '',
                });
            })
            .catch((error) => {
                console.error('Failed to load student placement profile', error);
                setProfile(emptyPlacementProfile);
                setLoadError('Some placement details could not be loaded. You can still update your resume and try again shortly.');
            })
            .finally(() => setLoading(false));
    }, [currentUser]);

    const toggleSkill = async (skill) => {
        if (!canManagePlacement || !profile) return;

        const current = profile.completedSkillsList
            ? profile.completedSkillsList.split(',').filter(Boolean)
            : [];

        const updated = current.includes(skill)
            ? current.filter((item) => item !== skill)
            : [...current, skill];

        const updatedList = updated.join(',');
        const nextProfile = {
            ...profile,
            completedSkillsList: updatedList,
            skillsCompleted: updated.length,
        };

        setProfile(nextProfile);

        try {
            const res = await api.put(`/placement/student/${currentUser.uid}/update`, {
                completedSkillsList: updatedList,
                skillsCompleted: updated.length,
            });
            if (res.data) setProfile({ ...emptyPlacementProfile, ...res.data });
        } catch (_) {
            // Keep the optimistic UI.
        }
    };

    const handleSave = async () => {
        if (!canManagePlacement) return;

        setSaving(true);
        try {
            const res = await api.put(`/placement/student/${currentUser.uid}/update`, {
                aptitudeScore: parseFloat(form.aptitudeScore) || 0,
                mockInterviewScore: parseFloat(form.mockInterviewScore) || 0,
                preferredRole: form.preferredRole,
                preferredCompanies: form.preferredCompanies,
            });
            setProfile({ ...emptyPlacementProfile, ...res.data });
            setEditMode(false);
        } catch (_) {
            setProfile((prev) => ({
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

    const handleResumeSave = async () => {
        if (!currentUser) return;

        setResumeSaving(true);
        try {
            const payload = {
                resumeUrl: form.resumeUrl.trim(),
                resumeUploaded: Boolean(form.resumeUrl.trim()),
            };
            const res = await api.put(`/placement/student/${currentUser.uid}/update`, payload);
            setProfile({ ...emptyPlacementProfile, ...res.data });
            setForm((prev) => ({ ...prev, resumeUrl: res.data.resumeUrl || '' }));
        } catch (error) {
            console.error('Failed to update resume:', error);
        } finally {
            setResumeSaving(false);
        }
    };

    const handleApplyToDrive = async (driveId) => {
        if (!currentUser) return;
        setDriveApplyingId(driveId);
        try {
            const res = await api.put(`/placement/student/${currentUser.uid}/drives/${driveId}/apply`);
            setProfile((prev) => ({ ...prev, availableDrives: res.data || [] }));
        } catch (error) {
            console.error('Failed to apply for drive:', error);
        } finally {
            setDriveApplyingId(null);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="placement-page">
                <div className="placement-header">
                    <h1>
                        <Briefcase size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />
                        Placement Readiness
                    </h1>
                </div>
                <div className="saa-empty-state" style={{ marginTop: 48 }}>
                    <span style={{ fontSize: '3.5rem' }}>💼</span>
                    <p style={{ fontWeight: 700 }}>No placement profile found.</p>
                    <span>Your placement readiness data will appear here once your profile is set up.</span>
                </div>
            </div>
        );
    }

    const p = profile;
    const score = parseFloat(p.readinessScore) || 0;
    const completedSkills = p.completedSkillsList ? p.completedSkillsList.split(',').filter(Boolean) : [];
    const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const readinessLabel = score >= 70
        ? 'Placement Ready!'
        : score >= 50
            ? 'Getting There'
            : 'Needs Improvement';
    const attendedDrives = profile.availableDrives || [];

    return (
        <div className="placement-page">
            <div className="placement-header">
                <div>
                    <h1>
                        <Briefcase size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />
                        Placement Readiness
                    </h1>
                    <p className="placement-subtitle">Track your placement preparation progress</p>
                </div>
                {canManagePlacement ? (
                    <button className="btn-edit-profile" onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Cancel' : 'Update Scores'}
                    </button>
                ) : null}
            </div>

            {loadError ? (
                <div className="pc-status-banner error">
                    {loadError}
                </div>
            ) : null}

            {canManagePlacement && editMode ? (
                <div className="placement-edit-card">
                    <div className="edit-grid">
                        {[
                            { label: 'Aptitude Test Score (0-100)', key: 'aptitudeScore', placeholder: 'e.g. 75' },
                            { label: 'Mock Interview Score (0-100)', key: 'mockInterviewScore', placeholder: 'e.g. 68' },
                            { label: 'Preferred Role', key: 'preferredRole', placeholder: 'e.g. Software Engineer' },
                            { label: 'Target Companies', key: 'preferredCompanies', placeholder: 'e.g. Google, TCS, Wipro' },
                        ].map((field) => (
                            <div key={field.key} className="edit-field">
                                <label>{field.label}</label>
                                <input
                                    className="placement-input"
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={form[field.key]}
                                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                    <button className="btn-save-scores" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            ) : null}

            <div className="placement-body">
                <div className="placement-score-col">
                    <div className="placement-score-card">
                        <RadialProgress value={score} color={scoreColor} />
                        <div className="score-label" style={{ color: scoreColor }}>{readinessLabel}</div>
                        <div className="score-desc">Overall Placement Readiness Score</div>
                    </div>

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
                        <div className="pc-item">
                            <Briefcase size={16} color={p.placementStatus === 'PLACED' ? '#10b981' : '#6366f1'} />
                            <span>Placement Status: {p.placementStatus || 'NOT_READY'}</span>
                        </div>
                        <div className="pc-item">
                            <CheckCircle size={16} color={p.resumeReviewStatus === 'APPROVED' ? '#10b981' : p.resumeReviewStatus === 'REJECTED' ? '#ef4444' : '#f59e0b'} />
                            <span>Resume Review: {p.resumeReviewStatus || 'PENDING'}</span>
                        </div>
                    </div>

                    {!canManagePlacement ? (
                        <div className="placement-prefs-card">
                            <div className="pc-title">Resume Upload</div>
                            <div className="pref-item">
                                Students can upload only their resume. Placement details are updated by the placement officer.
                            </div>
                            <div className="resume-upload-stack">
                                <label htmlFor="resumeUrl" className="resume-upload-label">Resume link</label>
                                <input
                                    id="resumeUrl"
                                    className="placement-input"
                                    type="url"
                                    placeholder="Paste your resume drive link"
                                    value={form.resumeUrl}
                                    onChange={(e) => setForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                                />
                                <button className="btn-save-scores btn-resume-upload" onClick={handleResumeSave} disabled={resumeSaving}>
                                    <Upload size={16} />
                                    {resumeSaving ? 'Uploading...' : (p.resumeUploaded ? 'Update Resume' : 'Upload Resume')}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {(p.preferredRole || p.preferredCompanies) ? (
                        <div className="placement-prefs-card">
                            <div className="pc-title">Career Preferences</div>
                            {p.preferredRole ? <div className="pref-item"><strong>Role:</strong> {p.preferredRole}</div> : null}
                            {p.preferredCompanies ? <div className="pref-item"><strong>Target:</strong> {p.preferredCompanies}</div> : null}
                        </div>
                    ) : null}

                    {p.resumeRemarks ? (
                        <div className="placement-prefs-card">
                            <div className="pc-title">Coordinator Feedback</div>
                            <div className="pref-item">{p.resumeRemarks}</div>
                        </div>
                    ) : null}
                </div>

                <div className="placement-skills-col">
                    <div className="skills-card">
                        <div className="skills-header">
                            <div className="pc-title">Skills Tracker ({completedSkills.length}/{SKILLS_LIST.length})</div>
                            <div className="skills-progress-text">
                                {canManagePlacement ? 'Click to toggle' : 'Placement officer updates this'}
                            </div>
                        </div>
                        <div className="skills-progress-bar">
                            <div
                                className="skills-progress-fill"
                                style={{ width: `${(completedSkills.length / SKILLS_LIST.length) * 100}%` }}
                            />
                        </div>
                        <div className="skills-grid">
                            {SKILLS_LIST.map((skill, index) => {
                                const done = completedSkills.includes(skill);
                                return (
                                    <button
                                        key={index}
                                        className={`skill-chip ${done ? 'done' : ''} ${!canManagePlacement ? 'read-only' : ''}`}
                                        onClick={() => toggleSkill(skill)}
                                        disabled={!canManagePlacement}
                                    >
                                        {done ? <CheckCircle size={12} /> : null}
                                        {skill}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="score-breakdown-card">
                        <div className="pc-title">Score Breakdown</div>
                        {[
                            { label: 'Resume', value: p.resumeUploaded ? 20 : 0, max: 20, color: '#10b981' },
                            { label: 'Skills', value: Math.round((p.skillsCompleted / (p.totalSkills || 10)) * 30), max: 30, color: '#6366f1' },
                            { label: 'Aptitude', value: Math.round((p.aptitudeScore / 100) * 25), max: 25, color: '#f59e0b' },
                            { label: 'Mock Interview', value: Math.round((p.mockInterviewScore / 100) * 25), max: 25, color: '#ec4899' },
                        ].map((item, index) => (
                            <div key={index} className="bd-row">
                                <div className="bd-label">{item.label}</div>
                                <div className="bd-track">
                                    <div
                                        className="bd-fill"
                                        style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }}
                                    />
                                </div>
                                <div className="bd-val">{item.value}/{item.max}</div>
                            </div>
                        ))}
                    </div>

                    {!canManagePlacement ? (
                        <div className="placement-drive-list-card">
                            <div className="pc-title">Eligible Drives</div>
                            {!profile.availableDrives?.length ? (
                                <div className="pref-item">No active drive is assigned to you yet.</div>
                            ) : (
                                <div className="placement-drive-stack">
                                    {profile.availableDrives.map((drive) => (
                                        <article key={drive.id} className="placement-drive-item">
                                            <div className="placement-drive-head">
                                                <div>
                                                    <strong>{drive.companyName}</strong>
                                                    <span>{drive.roleTitle}</span>
                                                </div>
                                                <span className={`placement-drive-status ${String(drive.applicationStatus || 'ELIGIBLE').toLowerCase()}`}>
                                                    {drive.applicationStatus}
                                                </span>
                                            </div>
                                            <p>{drive.description || drive.eligibilityCriteria || 'Check requirements before applying.'}</p>
                                            <small>
                                                Date: {drive.driveDate || 'To be announced'} | Location: {drive.location || 'TBA'} | Reminders: {drive.reminderCount || 0}/2
                                            </small>
                                            {drive.coordinatorRemarks ? (
                                                <div className="placement-drive-note">Coordinator: {drive.coordinatorRemarks}</div>
                                            ) : null}
                                            <div className="placement-drive-actions">
                                                <button
                                                    className="btn-save-scores"
                                                    onClick={() => handleApplyToDrive(drive.id)}
                                                    disabled={!drive.canApply || driveApplyingId === drive.id}
                                                >
                                                    {driveApplyingId === drive.id
                                                        ? 'Applying...'
                                                        : drive.canApply
                                                            ? 'Apply For Drive'
                                                            : 'Already Submitted'}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="placement-attended-card">
                        <div className="placement-attended-header">
                            <div className="pc-title" style={{ marginBottom: 0 }}>Placement Attended Details</div>
                            <button
                                type="button"
                                className="placement-table-next"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                Next
                            </button>
                        </div>

                        <div className="placement-attended-table-wrap">
                            <table className="placement-attended-table">
                                <thead>
                                    <tr>
                                        <th>Company Name</th>
                                        <th>Date</th>
                                        <th>Registered Status</th>
                                        <th>Attendance Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendedDrives.length > 0 ? (
                                        attendedDrives.map((drive) => {
                                            const registered = getRegistrationStatus(drive);
                                            const attended = getAttendanceStatus(drive);

                                            return (
                                                <tr key={drive.id}>
                                                    <td>{drive.companyName || 'Unknown'}</td>
                                                    <td>{formatDriveDate(drive.driveDate)}</td>
                                                    <td>
                                                        <span className={`placement-yesno-pill ${registered ? 'yes' : 'no'}`}>
                                                            {registered ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`placement-yesno-pill ${attended ? 'yes' : 'no'}`}>
                                                            {attended ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="placement-attended-empty">
                                                No placement applications or attended drives yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPlacement;
