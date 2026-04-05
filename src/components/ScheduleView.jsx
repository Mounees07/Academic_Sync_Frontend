import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import './ScheduleView.css';
import { Calendar, Clock, MapPin, Info, BookOpen, Search, Filter } from 'lucide-react';

const TYPE_FILTERS = [
    { value: 'ALL', label: 'All' },
    { value: 'ACADEMIC', label: 'Academic Class' },
    { value: 'LAB_SLOT', label: 'Lab' },
    { value: 'SKILL_TRAINING', label: 'Skill Training' },
    { value: 'INTERNAL_EXAM', label: 'Internal' },
    { value: 'SEMESTER_EXAM', label: 'Semester Exam' },
    { value: 'LAB_PRACTICAL', label: 'Lab Practical' },
    { value: 'FACULTY_MEETING', label: 'Faculty Meeting' },
];

const ScheduleView = ({ compact = false }) => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeType, setActiveType] = useState('ALL');
    const [sessionFilter, setSessionFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules');
            setSchedules(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch schedules", err);
            setError("Could not load schedules. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const normalize = (value) => String(value || '').trim().toLowerCase();

    const filteredSchedules = useMemo(() => {
        return schedules.filter((schedule) => {
            const matchesType = activeType === 'ALL' || schedule.type === activeType;
            const matchesSession = sessionFilter === 'ALL' || normalize(schedule.session) === normalize(sessionFilter);

            const haystack = [
                schedule.title,
                schedule.subjectName,
                schedule.description,
                schedule.location,
                schedule.department,
                schedule.type?.replaceAll('_', ' '),
                schedule.session,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());

            return matchesType && matchesSession && matchesSearch;
        });
    }, [activeType, schedules, searchTerm, sessionFilter]);

    const availableSessions = useMemo(() => {
        const sessionSet = new Set(
            schedules
                .map((schedule) => normalize(schedule.session).toUpperCase())
                .filter(Boolean)
        );
        return ['ALL', ...Array.from(sessionSet)];
    }, [schedules]);

    // Group schedules by date
    const groupedSchedules = filteredSchedules.reduce((groups, schedule) => {
        const date = schedule.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(schedule);
        return groups;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedSchedules).sort((a, b) => new Date(a) - new Date(b));

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // If already formatted or just HH:mm
        return timeString.substring(0, 5);
    };

    const getCardTypeClass = (type) => {
        return `card-type-${type?.toLowerCase() || 'academic'}`;
    };

    if (loading) return <div className="p-4 text-center text-gray-400">Loading schedules...</div>;
    if (error) return <div className="p-4 text-center text-red-400">{error}</div>;

    if (schedules.length === 0) {
        return (
            <div className="empty-state">
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>No Upcoming Schedules</h3>
                <p>There are no academic schedules posted at the moment.</p>
            </div>
        );
    }

    return (
        <div className="schedule-view-container">
            {!compact && (
                <div className="schedule-header">
                    <div>
                        <h2>Academic Schedule</h2>
                        <p className="schedule-subtitle">Filter timetable items by class type, session, or semester keywords.</p>
                    </div>
                </div>
            )}

            <div className="schedule-filter-panel">
                <div className="schedule-filter-topline">
                    <div className="schedule-filter-title">
                        <Filter size={16} />
                        <span>Filters</span>
                    </div>
                    <span className="schedule-filter-count">
                        {filteredSchedules.length} of {schedules.length} items
                    </span>
                </div>

                <div className="schedule-filter-controls">
                    <label className="schedule-search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search semester, subject, venue, or title"
                        />
                    </label>

                    <label className="schedule-select-wrap">
                        <span>Session</span>
                        <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                            {availableSessions.map((session) => (
                                <option key={session} value={session}>
                                    {session === 'ALL' ? 'All Sessions' : session}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="schedule-filter-chips">
                    {TYPE_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            className={`schedule-filter-chip ${activeType === filter.value ? 'active' : ''}`}
                            onClick={() => setActiveType(filter.value)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {filteredSchedules.length === 0 && (
                <div className="empty-state">
                    <Calendar size={42} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>No Matching Schedule Items</h3>
                    <p>Try a different type, session, or search term.</p>
                </div>
            )}

            {filteredSchedules.length > 0 && (
            <div className="schedule-list">
                {sortedDates.map(date => (
                    <div key={date} className="date-group">
                        <div className="date-header">
                            <Calendar size={18} />
                            {formatDate(date)}
                        </div>
                        <div className="schedule-cards">
                            {groupedSchedules[date].map(item => (
                                <div key={item.id} className={`schedule-card ${getCardTypeClass(item.type)}`}>
                                    <div className="card-header-row">
                                        <h4 className="card-title">{item.title}</h4>
                                        <span className="card-type-badge">{item.type?.replace('_', ' ')}</span>
                                    </div>

                                    <div className="card-time">
                                        <Clock size={14} />
                                        <span>{formatTime(item.startTime)} - {formatTime(item.endTime)} ({item.session})</span>
                                    </div>

                                    <div className="card-details">
                                        {item.subjectName && (
                                            <div className="card-detail-item">
                                                <BookOpen size={14} style={{ minWidth: '14px' }} />
                                                <span>{item.subjectName}</span>
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="card-detail-item">
                                                <MapPin size={14} style={{ minWidth: '14px' }} />
                                                <span>{item.location}</span>
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="card-detail-item">
                                                <Info size={14} style={{ minWidth: '14px' }} />
                                                <span style={{ opacity: 0.8 }}>{item.description}</span>
                                            </div>
                                        )}
                                        {item.rollNoRange && (
                                            <div className="card-detail-item">
                                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Rolls: {item.rollNoRange}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default ScheduleView;
