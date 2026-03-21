import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, Fingerprint, CalendarDays } from 'lucide-react';
import './StudentAttendance.css';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';

const isCoursePresent = (status) => ['P', 'PRESENT', 'L', 'LATE'].includes((status || '').toUpperCase());
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

const paginateRows = (rows, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
};

const StudentAttendance = () => {
    const { currentUser } = useAuth();
    const [courseHistory, setCourseHistory] = useState([]);
    const [biometricHistory, setBiometricHistory] = useState([]);
    const [alreadyMarked, setAlreadyMarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [markingBiometric, setMarkingBiometric] = useState(false);
    const [attendanceType, setAttendanceType] = useState('BOTH');
    const [filterCourse, setFilterCourse] = useState('ALL');
    const [loadErrors, setLoadErrors] = useState([]);
    const [biometricPage, setBiometricPage] = useState(1);
    const [coursePage, setCoursePage] = useState(1);
    const [biometricRowsPerPage, setBiometricRowsPerPage] = useState(10);
    const [courseRowsPerPage, setCourseRowsPerPage] = useState(10);

    useEffect(() => {
        refreshAttendance();
    }, [currentUser]);

    useEffect(() => {
        setCoursePage(1);
    }, [filterCourse]);

    const refreshAttendance = async () => {
        if (!currentUser?.uid) return;
        setLoading(true);
        setLoadErrors([]);
        try {
            const results = await Promise.allSettled([
                api.get(`/course-attendance/student/${currentUser.uid}/timeline`),
                api.get(`/attendance/student/${currentUser.uid}`),
                api.get(`/attendance/check-today/${currentUser.uid}`)
            ]);
            const nextErrors = [];

            if (results[0].status === 'fulfilled') {
                setCourseHistory(results[0].value.data || []);
            } else {
                console.error('Failed to fetch course attendance', results[0].reason);
                setCourseHistory([]);
                nextErrors.push('Course attendance could not be loaded.');
            }

            if (results[1].status === 'fulfilled') {
                setBiometricHistory(results[1].value.data || []);
            } else {
                console.error('Failed to fetch biometric attendance', results[1].reason);
                setBiometricHistory([]);
                nextErrors.push('Biometric attendance could not be loaded.');
            }

            if (results[2].status === 'fulfilled') {
                setAlreadyMarked(Boolean(results[2].value.data));
            } else {
                console.error('Failed to check biometric attendance status', results[2].reason);
                setAlreadyMarked(false);
                nextErrors.push('Today biometric status could not be confirmed.');
            }

            setLoadErrors(nextErrors);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkBiometric = async () => {
        if (!currentUser?.uid || alreadyMarked) return;
        setMarkingBiometric(true);
        try {
            const res = await api.post(`/attendance/mark?studentUid=${currentUser.uid}`);
            setBiometricHistory((prev) => [res.data, ...prev]);
            setAlreadyMarked(true);
        } catch (err) {
            await refreshAttendance();
            alert('Failed to mark biometric attendance: ' + (err.response?.data?.error || err.message));
        } finally {
            setMarkingBiometric(false);
        }
    };

    const courses = useMemo(
        () => ['ALL', ...new Set(courseHistory.map((item) => item.courseName).filter(Boolean))],
        [courseHistory]
    );

    const filteredCourseHistory = useMemo(
        () => courseHistory.filter((item) => filterCourse === 'ALL' || item.courseName === filterCourse),
        [courseHistory, filterCourse]
    );

    const biometricTotalPages = Math.max(1, Math.ceil(biometricHistory.length / biometricRowsPerPage));
    const courseTotalPages = Math.max(1, Math.ceil(filteredCourseHistory.length / courseRowsPerPage));

    useEffect(() => {
        setBiometricPage((currentPage) => Math.min(currentPage, biometricTotalPages));
    }, [biometricTotalPages]);

    useEffect(() => {
        setCoursePage((currentPage) => Math.min(currentPage, courseTotalPages));
    }, [courseTotalPages]);

    const paginatedBiometricHistory = useMemo(
        () => paginateRows(biometricHistory, biometricPage, biometricRowsPerPage),
        [biometricHistory, biometricPage, biometricRowsPerPage]
    );

    const paginatedCourseHistory = useMemo(
        () => paginateRows(filteredCourseHistory, coursePage, courseRowsPerPage),
        [filteredCourseHistory, coursePage, courseRowsPerPage]
    );

    const courseAttendedCount = filteredCourseHistory.filter((item) => isCoursePresent(item.status)).length;
    const courseAbsentCount = filteredCourseHistory.length - courseAttendedCount;
    const coursePercentage = filteredCourseHistory.length ? Math.round((courseAttendedCount * 100) / filteredCourseHistory.length) : 0;

    const biometricPresentDays = biometricHistory.filter((item) => ['PRESENT', 'LATE'].includes((item.status || '').toUpperCase())).length;
    const biometricLateDays = biometricHistory.filter((item) => (item.status || '').toUpperCase() === 'LATE').length;
    const biometricPercentage = biometricHistory.length ? Math.round((biometricPresentDays * 100) / biometricHistory.length) : 0;

    if (loading) {
        return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;
    }

    return (
        <div className="attendance-page">
            <div className="attendance-header">
                <div>
                    <h1>Attendance</h1>
                    <p className="att-subtext">Biometric daily presence and course session attendance in one page.</p>
                </div>
                <div className="attendance-header-actions">
                    <select
                        className="form-input"
                        style={{ minWidth: 220 }}
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value)}
                    >
                        <option value="BOTH">Both Attendances</option>
                        <option value="BIOMETRIC">Biometric Attendance</option>
                        <option value="COURSE">Course Attendance</option>
                    </select>
                    {(attendanceType === 'COURSE' || attendanceType === 'BOTH') && (
                        <select
                            className="form-input"
                            style={{ minWidth: 220 }}
                        value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                        >
                            {courses.map((course) => (
                                <option key={course} value={course}>
                                    {course === 'ALL' ? 'All Courses' : course}
                                </option>
                            ))}
                        </select>
                    )}
                    {(attendanceType === 'BIOMETRIC' || attendanceType === 'BOTH') && (
                        <button
                            className="btn-mark"
                            onClick={handleMarkBiometric}
                            disabled={alreadyMarked || markingBiometric}
                        >
                            <Fingerprint size={16} />
                            {markingBiometric ? 'Marking...' : alreadyMarked ? 'Biometric Marked' : 'Mark Biometric'}
                        </button>
                    )}
                </div>
            </div>

            {loadErrors.length > 0 && (
                <div className="attendance-error-banner">
                    {loadErrors.join(' ')}
                </div>
            )}

            {(attendanceType === 'BIOMETRIC' || attendanceType === 'BOTH') && (
                <section className="attendance-block">
                    <div className="history-header">
                        <h2><Fingerprint size={18} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Biometric Attendance</h2>
                        <span className="history-subtext">Daily college entry attendance fetched from the biometric attendance records.</span>
                    </div>

                    <div className="attendance-stats">
                        <div className="stat-card-left-align">
                            <h3>BIOMETRIC RATE</h3>
                            <p className="stat-value-text">{biometricPercentage}%</p>
                            <span className="att-status-pill" style={{
                                background: biometricPercentage >= 75 ? '#dcfce7' : '#fee2e2',
                                color: biometricPercentage >= 75 ? '#166534' : '#991b1b'
                            }}>
                                {biometricPercentage >= 75 ? 'Regular' : 'Needs Attention'}
                            </span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>PRESENT DAYS</h3>
                            <p className="stat-value">{biometricPresentDays}</p>
                            <span className="stat-sub">including late check-ins</span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>LATE DAYS</h3>
                            <p className="stat-value">{biometricLateDays}</p>
                            <span className="stat-sub">late biometric entries</span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>TOTAL RECORDS</h3>
                            <p className="stat-value">{biometricHistory.length}</p>
                            <span className="stat-sub">daily biometric logs</span>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check-In</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {biometricHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="empty-text">No biometric attendance records found in the database.</td>
                                    </tr>
                                ) : (
                                    paginatedBiometricHistory.map((record) => (
                                        <tr key={record.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CalendarDays size={14} />
                                                    {record.date}
                                                </div>
                                            </td>
                                            <td>{record.checkInTime || '—'}</td>
                                            <td>
                                                <span className={`status-badge ${record.status === 'LATE' ? 'status-late' : 'status-present'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {biometricHistory.length > 0 && (
                            <div className="pagination-controls">
                                <div className="pagination-rows">
                                    <span>Rows per page</span>
                                    <select
                                        className="pagination-select"
                                        value={biometricRowsPerPage}
                                        onChange={(e) => {
                                            setBiometricRowsPerPage(Number(e.target.value));
                                            setBiometricPage(1);
                                        }}
                                    >
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pagination-numbers">
                                    <button
                                        type="button"
                                        onClick={() => setBiometricPage((page) => Math.max(1, page - 1))}
                                        disabled={biometricPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page <strong>{biometricPage}</strong> of <strong>{biometricTotalPages}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setBiometricPage((page) => Math.min(biometricTotalPages, page + 1))}
                                        disabled={biometricPage === biometricTotalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {(attendanceType === 'COURSE' || attendanceType === 'BOTH') && (
                <section className="attendance-block">
                    <div className="history-header">
                        <h2><BookOpen size={18} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Course Attendance</h2>
                        <span className="history-subtext">Mapped from academic schedule by day and session slot, fetched from course attendance records.</span>
                    </div>

                    <div className="attendance-stats">
                        <div className="stat-card-left-align">
                            <h3>COURSE RATE</h3>
                            <p className="stat-value-text">{coursePercentage}%</p>
                            <span className="att-status-pill" style={{
                                background: coursePercentage >= 75 ? '#dcfce7' : '#fee2e2',
                                color: coursePercentage >= 75 ? '#166534' : '#991b1b'
                            }}>
                                {coursePercentage >= 75 ? 'On Track' : 'Below Threshold'}
                            </span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>SESSIONS ATTENDED</h3>
                            <p className="stat-value">{courseAttendedCount}</p>
                            <span className="stat-sub">present or late</span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>ABSENT SESSIONS</h3>
                            <p className="stat-value">{courseAbsentCount}</p>
                            <span className="stat-sub">session-wise misses</span>
                        </div>
                        <div className="stat-card-left-align">
                            <h3>TOTAL SLOTS</h3>
                            <p className="stat-value">{filteredCourseHistory.length}</p>
                            <span className="stat-sub">allocated timetable slots</span>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Day</th>
                                    <th>Session</th>
                                    <th>Timing</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourseHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-text">No course attendance records found in the database for the selected course.</td>
                                    </tr>
                                ) : (
                                    paginatedCourseHistory.map((record) => {
                                        const status = (record.status || '').toUpperCase();
                                        const isPresent = ['P', 'PRESENT'].includes(status);
                                        const isLate = ['L', 'LATE'].includes(status);
                                        return (
                                            <tr key={record.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <BookOpen size={14} />
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{record.courseName}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{record.courseCode || 'Course'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{record.date || '—'}</td>
                                                <td>{record.session || '—'}</td>
                                                <td>{record.startTime && record.endTime ? `${record.startTime} - ${record.endTime}` : '—'}</td>
                                                <td>{record.venue || '—'}</td>
                                                <td>
                                                    <span className={`status-badge ${isPresent ? 'status-present' : 'status-late'}`}>
                                                        {isPresent && <CheckCircle size={13} />}
                                                        {isLate && <AlertTriangle size={13} />}
                                                        {!isPresent && !isLate && <XCircle size={13} />}
                                                        {isPresent ? 'PRESENT' : isLate ? 'LATE' : 'ABSENT'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {filteredCourseHistory.length > 0 && (
                            <div className="pagination-controls">
                                <div className="pagination-rows">
                                    <span>Rows per page</span>
                                    <select
                                        className="pagination-select"
                                        value={courseRowsPerPage}
                                        onChange={(e) => {
                                            setCourseRowsPerPage(Number(e.target.value));
                                            setCoursePage(1);
                                        }}
                                    >
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pagination-numbers">
                                    <button
                                        type="button"
                                        onClick={() => setCoursePage((page) => Math.max(1, page - 1))}
                                        disabled={coursePage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page <strong>{coursePage}</strong> of <strong>{courseTotalPages}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCoursePage((page) => Math.min(courseTotalPages, page + 1))}
                                        disabled={coursePage === courseTotalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default StudentAttendance;
