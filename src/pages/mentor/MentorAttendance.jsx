import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { UserCheck, BookOpen, Clock3, MapPin } from 'lucide-react';
import '../student/StudentAttendance.css';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';

const MentorAttendance = () => {
    const { currentUser } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!currentUser?.uid) return;
            setLoading(true);
            try {
                const res = await api.get(`/course-attendance/mentor/${currentUser.uid}?date=${date}`);
                setAttendanceList(res.data || []);
            } catch (err) {
                console.error('Failed to fetch mentee course attendance', err);
                setAttendanceList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [currentUser, date]);

    return (
        <div className="attendance-page">
            <div className="attendance-header">
                <h1>Mentee Course Attendance</h1>
                <div className="date-picker">
                    <input
                        type="date"
                        className="form-input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="history-section">
                <div className="history-header">
                    <h2>Scheduled Sessions for {date}</h2>
                    <span className="history-subtext">Day-wise and session-wise course attendance for your mentees.</span>
                </div>

                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" />
                    </div>
                ) : attendanceList.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <UserCheck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No mapped course attendance records found for this date.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Course</th>
                                    <th>Session</th>
                                    <th>Timing</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceList.map((record) => (
                                    <tr key={record.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{record.studentName}</div>
                                            <div style={{ fontSize: '0.78rem', opacity: 0.72 }}>{record.rollNumber || record.studentEmail}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <BookOpen size={14} />
                                                {record.courseName}
                                            </div>
                                        </td>
                                        <td>{record.session || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Clock3 size={14} />
                                                {record.slot || '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <MapPin size={14} />
                                                {record.venue || '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${['P', 'PRESENT', 'L', 'LATE'].includes((record.status || '').toUpperCase()) ? 'status-present' : 'status-late'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorAttendance;
