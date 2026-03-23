import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Award, MoreHorizontal, ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../utils/api';
import CollegeCalendarWidget from '../../components/college-calendar/CollegeCalendarWidget';
import './Admin.css';

const normalizeChartNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/dashboard-stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // --- Data Constants ---
    // Fallback/Default values or construction from stats state
    const totalStudents = stats?.totalStudents || 0;
    const totalTeachers = stats?.totalTeachers || 0;
    const totalStaff = stats?.totalStaff || 0;
    const totalAwards = stats?.totalAwards || 0;

    const statsData = [
        { title: 'Students', value: totalStudents.toLocaleString(), change: '+16%', badgeColor: 'bg-light-purple', badgeText: 'text-purple', iconColor: 'bg-purple', icon: <Users size={24} className="text-white" /> },
        { title: 'Teachers', value: totalTeachers.toLocaleString(), change: '+3%', badgeColor: 'bg-light-orange', badgeText: 'text-orange', iconColor: 'bg-orange', icon: <UserCheck size={24} className="text-white" /> },
        { title: 'Staffs', value: totalStaff.toLocaleString(), change: '+3%', badgeColor: 'bg-light-yellow', badgeText: 'text-yellow', iconColor: 'bg-yellow', icon: <Users size={24} className="text-white" /> },
        { title: 'Awards', value: totalAwards.toLocaleString(), change: '+5%', badgeColor: 'bg-light-blue', badgeText: 'text-blue', iconColor: 'bg-blue', icon: <Award size={24} className="text-white" /> },
    ];

    const studentGenderData = stats?.studentGenderData || [
        { name: 'Boys', value: 0, color: '#4D44B5' },
        { name: 'Girls', value: 0, color: '#FCC43E' },
    ];
    const normalizedStudentGenderData = studentGenderData.map((entry) => ({
        ...entry,
        value: normalizeChartNumber(entry?.value),
        color: entry?.color || '#94a3b8',
    }));
    const hasStudentGenderData = normalizedStudentGenderData.some((entry) => entry.value > 0);

    const attendanceData = stats?.attendanceData || [];

    const earningsData = stats?.earningsData || [];

    const [agendaItems, setAgendaItems] = useState([]);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    const [newAgenda, setNewAgenda] = useState({
        title: '',
        time: '',
        type: 'All Grade',
        colorClass: 'purple'
    });

    // --- Calendar Logic (Dynamic) ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchAgenda = async () => {
            if (!selectedDate) return;
            try {
                // ISO date string YYYY-MM-DD
                const dateStr = selectedDate.toLocaleDateString("en-CA");
                const res = await api.get(`/agenda?date=${dateStr}`);
                setAgendaItems(res.data);
            } catch (err) {
                console.error("Failed to fetch agenda", err);
            }
        };
        fetchAgenda();
    }, [selectedDate]);

    const handleAddAgenda = async (e) => {
        e.preventDefault();
        try {
            const dateStr = selectedDate.toLocaleDateString("en-CA");
            // Standardize time format for display if possible, or just store as is.
            // Backend expects LocalTime "HH:mm".
            const payload = {
                ...newAgenda,
                date: dateStr // Backend will parse string to LocalDate
            };
            await api.post('/agenda', payload);
            setIsAgendaModalOpen(false);
            setNewAgenda({ title: '', time: '', type: 'All Grade', colorClass: 'purple' });

            // Refresh
            const res = await api.get(`/agenda?date=${dateStr}`);
            setAgendaItems(res.data);
        } catch (err) {
            console.error("Failed to add agenda", err);
        }
    };

    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth(); // 0-11

    // Format month name manually or using locale
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[currentMonthIndex];

    const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Sunday

    // Check if showing current actual month -> to highlight today IF needed, but focus is on selectedDate
    // const now = new Date();
    // const realToday = now.getDate();

    // Create array for grid: empty slots for days before 1st, then 1..daysInMonth
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push('');
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
        calendarDays.push(i);
    }
    // Fill remaining slots
    while (calendarDays.length % 7 !== 0) {
        calendarDays.push('');
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonthIndex - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
    };

    const handleDayClick = (day) => {
        if (day !== '') {
            const newDate = new Date(currentYear, currentMonthIndex, day);
            setSelectedDate(newDate);
        }
    };

    if (loading) {
        return <div className="admin-dashboard flex items-center justify-center text-white">Loading Dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            {/* ... Header and Stats Grid ... */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Admin Dashboard</h1>
                    <p className="admin-subtitle">Welcome back, Admin</p>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="stats-grid">
                {statsData.map((stat, index) => (
                    <div key={index} className="admin-card">
                        <div className="stat-card-header">
                            <span className={`stat-badge ${stat.badgeColor} ${stat.badgeText}`}>
                                {stat.change}
                            </span>
                            <div className={`stat-icon-wrapper ${stat.iconColor}`}>
                                {stat.icon}
                            </div>
                        </div>

                        <div>
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-title">{stat.title}</p>
                        </div>

                        {/* Decorative Background Circle */}
                        <div className={`stat-decor-circle ${stat.iconColor}`}></div>
                    </div>
                ))}
            </div>

            <div className="main-content-grid">
                {/* Left Column (Charts) - keeping as is, focusing on calendar below */}
                <div className="charts-column">
                    {/* ... Charts ... */}
                    <div className="charts-row">
                        {/* Students Pie Chart */}
                        <div className="admin-card">
                            <div className="card-header">
                                <h3 className="card-title">Students</h3>
                                <MoreHorizontal size={20} className="more-icon" />
                            </div>
                            <div style={{ height: '250px', position: 'relative' }}>
                                {hasStudentGenderData ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={normalizedStudentGenderData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="42%"
                                                    innerRadius={58}
                                                    outerRadius={84}
                                                    paddingAngle={3}
                                                    minAngle={8}
                                                    stroke="none"
                                                    isAnimationActive={false}
                                                >
                                                    {normalizedStudentGenderData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => [normalizeChartNumber(value), 'Students']}
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-card)',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--glass-border)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: '32px' }}>
                                            <Users size={32} color="#94a3b8" />
                                            <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {totalStudents}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                        <Users size={32} color="#94a3b8" />
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalStudents} Students</div>
                                        <div style={{ fontSize: '0.85rem' }}>Gender data is not available yet</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance Bar Chart */}
                        <div className="admin-card">
                            <div className="card-header">
                                <h3 className="card-title">Attendance</h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: '99px' }}>Weekly</div>
                            </div>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attendanceData} barSize={12}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--glass-border)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A098AE' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A098AE' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="present" name="Present" fill="#FCC43E" radius={[10, 10, 10, 10]} />
                                        <Bar dataKey="absent" name="Absent" fill="#4D44B5" radius={[10, 10, 10, 10]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Earnings Chart */}
                    <div className="admin-card">
                        <div className="card-header">
                            <h3 className="card-title">Earnings</h3>
                            <MoreHorizontal size={20} className="more-icon" />
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={earningsData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A098AE' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A098AE' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="income" stroke="#4D44B5" strokeWidth={3} dot={{ r: 4, fill: '#4D44B5', strokeWidth: 2, stroke: '#fff' }} />
                                    <Line type="monotone" dataKey="expense" stroke="#FB7D5B" strokeWidth={3} dot={{ r: 4, fill: '#FB7D5B', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="widgets-column">
                    <CollegeCalendarWidget
                        title="College Day Planner"
                        subtitle="Admin can publish leave days, government holidays, and vacations for the whole campus"
                        editable
                        allowedViews={['day']}
                    />
                </div>
            </div>

            {/* Add Agenda Modal */}
            {isAgendaModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Agenda - {selectedDate.toLocaleDateString()}</h3>
                        <form onSubmit={handleAddAgenda}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newAgenda.title}
                                    onChange={e => setNewAgenda({ ...newAgenda, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={newAgenda.time}
                                    onChange={e => setNewAgenda({ ...newAgenda, time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g. All Grade"
                                    value={newAgenda.type}
                                    onChange={e => setNewAgenda({ ...newAgenda, type: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Color Code</label>
                                <select
                                    value={newAgenda.colorClass}
                                    onChange={e => setNewAgenda({ ...newAgenda, colorClass: e.target.value })}
                                >
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                    <option value="blue">Blue</option>
                                    <option value="yellow">Yellow</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsAgendaModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Add Agenda</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
