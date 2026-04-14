
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User, MapPin, Calendar, BookOpen,
    ShieldCheck, ClipboardList, Briefcase, GraduationCap,
    Clock3, BadgeCheck, Shield
} from 'lucide-react';
import api from '../utils/api';
import './MyProfile.css';

const TABS = [
    { id: 'Personal', label: 'Personal' },
    { id: 'Academic', label: 'Academic' },
    { id: 'Admission', label: 'Admission' },
    { id: 'Address', label: 'Address' },
    { id: 'Hostel', label: 'Hostel' },
    { id: 'School', label: 'School' },
    { id: 'Institute', label: 'Institute' },
];

const humanizeEnum = (value) => {
    if (!value) return '-';
    return String(value)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const statusTone = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (['active', 'present', 'verified', 'eligible'].includes(normalized)) return 'success';
    if (['inactive', 'blocked', 'expired', 'suspended'].includes(normalized)) return 'danger';
    if (['pending', 'warning', 'probation'].includes(normalized)) return 'warning';
    return 'neutral';
};

const resolveAccountStatus = (profile, currentUser) => {
    const sessionExpiry = profile?.sessionExpiresAt ? new Date(profile.sessionExpiresAt).getTime() : null;
    if (sessionExpiry) {
        return sessionExpiry > Date.now() ? 'Active' : 'Expired';
    }
    if (profile?.studentStatus) {
        return profile.studentStatus;
    }
    return currentUser ? 'Active' : 'Inactive';
};

const getAvatarFallback = (name) => {
    if (!name) return 'U';
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
};

const MyProfile = () => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Personal');

    const normalizeUserData = useCallback((data) => ({
        ...data,
        ...(data?.studentDetails || {}),
    }), []);

    const fetchProfile = useCallback(async () => {
        if (!currentUser?.uid) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/users/${currentUser.uid}`, {
                skipSessionActivity: true,
            });
            const userData = normalizeUserData(response.data);

            setProfile(userData);
            setError(null);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load profile data.");
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid, normalizeUserData]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        const refreshIfVisible = () => {
            if (document.visibilityState === 'visible') {
                fetchProfile();
            }
        };

        window.addEventListener('focus', fetchProfile);
        document.addEventListener('visibilitychange', refreshIfVisible);

        return () => {
            window.removeEventListener('focus', fetchProfile);
            document.removeEventListener('visibilitychange', refreshIfVisible);
        };
    }, [fetchProfile]);

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold text-gray-500">Loading Profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen text-red-500">
                {error}
            </div>
        );
    }

    const SectionCard = ({ title, icon: Icon, accentClass = 'profile-section-blue', children }) => (
        <div className="profile-section-card">
            <div className={`profile-section-header ${accentClass}`}>
                <div className="profile-section-icon">
                    <Icon size={18} />
                </div>
                <div>
                    <h3>{title}</h3>
                    <p>Verified information from your student record</p>
                </div>
            </div>
            <div className="profile-section-body">
                {children}
            </div>
        </div>
    );

    const InfoRow = ({ label, value }) => (
        <div className="profile-info-card">
            <span className="profile-info-label">{label}</span>
            <div className="profile-info-value">{value || '-'}</div>
        </div>
    );

    const accountStatus = resolveAccountStatus(profile, currentUser);
    const lastLogin = formatDateTime(profile?.sessionLoginAt || currentUser?.metadata?.lastSignInTime || profile?.createdAt);
    const lastActivity = formatDateTime(profile?.sessionLastActivityAt);
    const roleAccess = humanizeEnum(profile?.role);

    return (
        <div className="profile-page animate-fade-in">
            <section className="profile-hero">
                <div>
                    <span className="profile-eyebrow">Student identity</span>
                    <h1>My Profile</h1>
                    <p>Manage your personal, academic, and institutional information from one professional dashboard.</p>
                    <div className="profile-chip-row">
                        <span className="profile-chip"><Shield size={14} /> {humanizeEnum(profile.role)}</span>
                        <span className="profile-chip"><BookOpen size={14} /> Semester {profile.semester || '-'}</span>
                        <span className="profile-chip"><MapPin size={14} /> {profile.department || 'Department not assigned'}</span>
                    </div>
                </div>

            </section>

            <div className="profile-layout">
                <div className="profile-sidebar-column">
                    <div className="profile-identity-card">
                        <div className="profile-identity-banner" />
                        <div className="profile-avatar-shell">
                            {profile.profilePictureUrl ? (
                                <img src={profile.profilePictureUrl} alt="Profile" className="profile-avatar-image" />
                            ) : (
                                <div className="profile-avatar-fallback">{getAvatarFallback(profile.fullName)}</div>
                            )}
                        </div>
                        <div className="profile-identity-body">
                            <h2>{profile.fullName}</h2>
                            <p>{profile.email || 'No email available'}</p>
                            <div className="profile-badge-row">
                                <span className="profile-id-badge">
                                    <BadgeCheck size={14} />
                                    {profile.rollNumber || profile.registerNo || 'No ID'}
                                </span>
                                <span className={`profile-status-badge profile-status-${statusTone(accountStatus)}`}>
                                    {humanizeEnum(accountStatus)}
                                </span>
                            </div>
                            <div className="profile-mini-stats">
                                <div>
                                    <span>Section</span>
                                    <strong>{profile.section || '-'}</strong>
                                </div>
                                <div>
                                    <span>Admission</span>
                                    <strong>{profile.admissionYear || '-'}</strong>
                                </div>
                                <div>
                                    <span>Student ID</span>
                                    <strong>{profile.id || '-'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-account-card">
                        <div className="profile-account-header">
                            <div>
                                <span className="profile-eyebrow">Account summary</span>
                                <h3>Access & session details</h3>
                            </div>
                            <span className={`profile-status-badge profile-status-${statusTone(accountStatus)}`}>
                                {humanizeEnum(accountStatus)}
                            </span>
                        </div>

                        <div className="profile-account-list">
                            <div className="profile-account-item">
                                <div className="profile-account-meta">
                                    <Clock3 size={16} />
                                    <span>Last Login</span>
                                </div>
                                <strong>{lastLogin}</strong>
                            </div>
                            <div className="profile-account-item">
                                <div className="profile-account-meta">
                                    <ShieldCheck size={16} />
                                    <span>Role Access</span>
                                </div>
                                <strong>{roleAccess}</strong>
                            </div>
                            <div className="profile-account-item">
                                <div className="profile-account-meta">
                                    <ClipboardList size={16} />
                                    <span>Status</span>
                                </div>
                                <strong>{humanizeEnum(accountStatus)}</strong>
                            </div>
                        </div>

                        <div className="profile-account-footer">
                            <span>Last activity</span>
                            <strong>{lastActivity}</strong>
                            <span>Session expiry</span>
                            <strong>{formatDateTime(profile?.sessionExpiresAt)}</strong>
                        </div>
                    </div>
                </div>

                <div className="profile-details-column">
                    <div className="profile-tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* PERSONAL DETAILS */}
                    {activeTab === 'Personal' && (
                        <div className="animate-fade-in space-y-6">
                            <SectionCard title="PERSONAL DETAILS" icon={User} iconColor="text-blue-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="Batch" value={profile.batch} />
                                    <InfoRow label="Date of Admission" value={profile.admissionYear} />
                                    <InfoRow label="Student Name" value={profile.fullName} />
                                    <InfoRow label="Gender" value={profile.gender} />
                                    <InfoRow label="Date of Birth" value={profile.dob} />
                                    <InfoRow label="Community" value={profile.community} />
                                    <InfoRow label="Guardian Name" value={profile.guardianName} />
                                    <InfoRow label="Religion" value={profile.religion} />
                                    <InfoRow label="Nationality" value={profile.nationality} />
                                    <InfoRow label="Mother Tongue" value={profile.motherTongue} />
                                    <InfoRow label="Blood Group" value={profile.bloodGroup} />
                                    <InfoRow label="Student ID" value={profile.id} />
                                    <InfoRow label="Aadhar No" value={profile.aadharNo} />
                                    <InfoRow label="Enrollment No" value={profile.enrollmentNo} />
                                    <InfoRow label="Register No" value={profile.registerNo} />
                                    <InfoRow label="DTE UMIS Reg. No." value={profile.dteUmisRegNo} />
                                    <InfoRow label="Application No" value={profile.applicationNo} />
                                    <InfoRow label="Admission No" value={profile.admissionNo} />
                                    <InfoRow label="Father Name" value={profile.fatherName} />
                                    <InfoRow label="Mother Name" value={profile.motherName} />
                                </div>
                            </SectionCard>
                            <SectionCard title="PARENT OCCUPATION" icon={Briefcase} iconColor="text-blue-600">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="Occupation" value={profile.parentOccupation} />
                                    <InfoRow label="Place of Work" value={profile.parentPlaceOfWork} />
                                    <InfoRow label="Designation" value={profile.parentDesignation} />
                                    <InfoRow label="Parent Income" value={profile.parentIncome} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ACADEMIC DETAILS */}
                    {activeTab === 'Academic' && (
                        <div className="animate-fade-in">
                            <SectionCard title="ACADEMIC DETAILS" icon={BookOpen} iconColor="text-indigo-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="Branch Code" value={profile.branchCode} />
                                    <InfoRow label="Degree Level" value={profile.degreeLevel} />
                                    <InfoRow label="Course Code" value={profile.courseCode} />
                                    <InfoRow label="Course Name" value={profile.courseName} />
                                    <InfoRow label="Branch Name" value={profile.branchName} />
                                    <InfoRow label="Department" value={profile.department} />
                                    <InfoRow label="Branch Type" value={profile.branchType} />
                                    <InfoRow label="Regulation" value={profile.regulation} />
                                    <InfoRow label="University" value={profile.university} />
                                    <InfoRow label="Year" value={profile.currentYear} />
                                    <InfoRow label="Semester" value={profile.semester} />
                                    <InfoRow label="Year of Admission" value={profile.admissionYear} />
                                    <InfoRow label="Year of Completion" value={profile.yearOfCompletion} />
                                    <InfoRow label="Section" value={profile.section} />
                                    <InfoRow label="Student Category" value={profile.studentCategory} />
                                    <InfoRow label="Seat Category" value={profile.seatCategory} />
                                    <InfoRow label="Quota" value={profile.quota} />
                                    <InfoRow label="Student Status" value={profile.studentStatus} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ADMISSION PAYMENT DETAILS */}
                    {activeTab === 'Admission' && (
                        <div className="animate-fade-in">
                            <SectionCard title="ADMISSION PAYMENT DETAILS" icon={ClipboardList} iconColor="text-green-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="DTE Register No" value={profile.dteRegisterNo} />
                                    <InfoRow label="DTE Admission No" value={profile.dteAdmissionNo} />
                                    <InfoRow label="DTE General Rank" value={profile.dteGeneralRank} />
                                    <InfoRow label="DTE Community Rank" value={profile.dteCommunityRank} />
                                    <InfoRow label="Entrance Marks Min" value={profile.entranceMarksMin} />
                                    <InfoRow label="Entrance Marks Max" value={profile.entranceMarksMax} />
                                    <InfoRow label="Entrance Register No" value={profile.entranceRegisterNo} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ADDRESS & INSURANCE */}
                    {activeTab === 'Address' && (
                        <div className="animate-fade-in space-y-6">
                            <SectionCard title="INSURANCE DETAILS" icon={ShieldCheck} iconColor="text-purple-600">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="Nominee Name" value={profile.nomineeName} />
                                    <InfoRow label="Nominee Age" value={profile.nomineeAge} />
                                    <InfoRow label="Nominee Relationship" value={profile.nomineeRelationship} />
                                </div>
                            </SectionCard>

                            <SectionCard title="ADDRESS FOR COMMUNICATION" icon={MapPin} iconColor="text-purple-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow
                                        label="Permanent Address"
                                        value={profile.permanentAddress}
                                        name="permanentAddress"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Present Address"
                                        value={profile.address}
                                        name="address"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Parent Mobile No"
                                        value={profile.parentContact}
                                        name="parentContact"
                                        editable={true}
                                    />
                                    <InfoRow label="Student Email ID" value={profile.email} />
                                    <InfoRow
                                        label="Student Mobile No"
                                        value={profile.mobileNumber}
                                        name="mobileNumber"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Parent Email ID"
                                        value={profile.parentEmailId}
                                        name="parentEmailId"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Official Email ID"
                                        value={profile.officialEmailId}
                                        name="officialEmailId"
                                        editable={true}
                                    />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* CLASS ADVISOR/HOSTEL DETAILS */}
                    {activeTab === 'Hostel' && (
                        <div className="animate-fade-in">
                            <SectionCard title="CLASS ADVISOR/HOSTEL DETAILS" icon={Briefcase} iconColor="text-orange-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="Hosteller/Dayscholar" value={profile.hostellerDayScholar} />
                                    <InfoRow label="Hostel Name" value={profile.hostelName} />
                                    <InfoRow label="Hostel Room Type" value={profile.hostelRoomType} />
                                    <InfoRow label="Warden Name" value={profile.wardenName} />
                                    <InfoRow label="H-Discontinued Date" value={profile.hostelDiscontinuedDate} />
                                    <InfoRow label="Class Advisor" value={profile.classAdvisorName} />
                                    <InfoRow label="Hostel Room Capacity" value={profile.hostelRoomCapacity} />
                                    <InfoRow label="Hostel Floor No" value={profile.hostelFloorNo} />
                                    <InfoRow label="Hostel Room No" value={profile.hostelRoomNo} />
                                    <InfoRow label="Warden Alter (if Any)" value={profile.wardenAlter} />
                                    <InfoRow label="H-Note" value={profile.hostelNote} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* SCHOOL DETAILS (Combined) */}
                    {activeTab === 'School' && (
                        <div className="animate-fade-in space-y-6">
                            <SectionCard title="SCHOOL MARKS DETAILS" icon={GraduationCap} iconColor="text-pink-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                                    <InfoRow label="School Qualification" value={profile.schoolQualification} />
                                    <InfoRow label="School Study State" value={profile.schoolStudyState} />
                                    <InfoRow label="School Year of Pass" value={profile.schoolYearOfPass} />
                                    <InfoRow label="School No of Attempts" value={profile.schoolNoOfAttempts} />
                                    <InfoRow label="School Classification" value={profile.schoolClassification} />
                                </div>

                                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--glass-border)' }}>
                                    <table className="w-full text-sm text-left">
                                        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }} className="uppercase text-xs font-semibold">
                                            <tr>
                                                <th className="px-4 py-3" style={{ width: '40%', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>School Subject</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%', borderBottom: '1px solid var(--glass-border)' }}>Min</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%', borderBottom: '1px solid var(--glass-border)' }}>Max</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%', borderBottom: '1px solid var(--glass-border)' }}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['Physics', 'Chemistry', 'Mathematics', 'PCM', 'Computer Science', 'Biology'].map((subj) => (
                                                <tr key={subj} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                                                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{subj}</td>
                                                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{profile[`schoolMarkMin${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{profile[`schoolMarkMax${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                    <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>{profile[`schoolMarkPct${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Cut Off Marks (200): </span>
                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100 ml-2">{profile.schoolCutOff200 || '-'}</span>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="SCHOOL CERTIFICATE DETAILS" icon={BookOpen} iconColor="text-teal-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="School Reg No1" value={profile.schoolRegNo1} />
                                    <InfoRow label="School Reg No2" value={profile.schoolRegNo2} />
                                    <InfoRow label="School Reg No3" value={profile.schoolRegNo3} />
                                    <InfoRow label="School Reg No4" value={profile.schoolRegNo4} />
                                    <InfoRow label="School Certificate No1" value={profile.schoolCertNo1} />
                                    <InfoRow label="School Certificate No2" value={profile.schoolCertNo2} />
                                    <InfoRow label="School Certificate No3" value={profile.schoolCertNo3} />
                                    <InfoRow label="School Certificate No4" value={profile.schoolCertNo4} />
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="School Total Marks1" value={profile.schoolTotalMarks1} />
                                    <InfoRow label="School Total Marks3" value={profile.schoolTotalMarks3} />
                                    <InfoRow label="School Total Marks2" value={profile.schoolTotalMarks2} />
                                    <InfoRow label="School Total Marks4" value={profile.schoolTotalMarks4} />
                                </div>
                            </SectionCard>

                            <SectionCard title="SCHOOL TC DETAILS" icon={Calendar} iconColor="text-yellow-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="School Name" value={profile.schoolName} />
                                    <InfoRow label="School TC Name" value={profile.schoolTCName} />
                                    <InfoRow label="School TC No" value={profile.schoolTCNo} />
                                    <InfoRow label="School TC Date" value={profile.schoolTCDate} />
                                    <InfoRow label="School TC Class" value={profile.schoolTCClass} />
                                    <InfoRow label="Board of School" value={profile.boardOfSchool} />
                                    <InfoRow label="Cut off Marks in 300(Cut off Marks in 200+Entrance Marks)" value={profile.schoolCutOff300} />
                                    <InfoRow label="Marks Note1" value={profile.marksNote1} />
                                    <InfoRow label="Marks Note2" value={profile.marksNote2} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* BIT ACADEMIC DETAILS */}
                    {activeTab === 'Institute' && (
                        <div className="animate-fade-in">
                            <SectionCard title="BIT ACADEMIC DETAILS" icon={ClipboardList} iconColor="text-red-500">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    <InfoRow label="TC Last Class Date" value={profile.tcLastClassDate} />
                                    <InfoRow label="TC Promotion To Next Higher Class" value={profile.tcPromotion} />
                                    <InfoRow label="TC Reason For Leaving" value={profile.tcReasonLeaving} />
                                    <InfoRow label="TC Conduct And Character" value={profile.tcConduct} />
                                    <InfoRow label="TC No" value={profile.bitTCNo} />
                                    <InfoRow label="TC Date" value={profile.bitTCDate} />
                                    <InfoRow label="Duplicate TC Issued" value={profile.duplicateTCIssued} />
                                    <InfoRow label="Duplicate TC Description" value={profile.duplicateTCDescription} />
                                    <InfoRow label="Final Total Marks Min" value={profile.finalTotalMarksMin} />
                                    <InfoRow label="Final Total Marks Max" value={profile.finalTotalMarksMax} />
                                    <InfoRow label="Final Total Marks %" value={profile.finalTotalMarksPct} />
                                    <InfoRow label="Final Classification" value={profile.finalClassification} />
                                    <InfoRow label="Final Year of Pass" value={profile.finalYearOfPass} />
                                    <InfoRow label="University Rank" value={profile.universityRank} />
                                    <InfoRow label="University Rank1" value={profile.universityRank1} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MyProfile;
