import React, { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Landmark,
    Palmtree,
    Pencil,
    Plus,
    Trash2,
    UserRoundMinus,
    X
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './CollegeCalendarWidget.css';

const EVENT_TYPES = [
    { value: 'LEAVE_DAY', label: 'Leave Day', icon: UserRoundMinus, color: '#0ea5e9' },
    { value: 'GOVERNMENT_HOLIDAY', label: 'Government Holiday', icon: Landmark, color: '#ef4444' },
    { value: 'VACATION', label: 'Vacation', icon: Palmtree, color: '#10b981' },
    { value: 'COLLEGE_EVENT', label: 'College Event', icon: CalendarDays, color: '#8b5cf6' }
];

const AUDIENCE_OPTIONS = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'STUDENTS', label: 'Students' },
    { value: 'FACULTY', label: 'Faculty' },
    { value: 'ADMIN', label: 'Admin Team' }
];

const EMPTY_FORM = {
    title: '',
    type: 'LEAVE_DAY',
    startDate: '',
    endDate: '',
    audience: 'ALL',
    description: '',
    allDay: true
};

const VIEW_OPTIONS = [
    { value: 'day', label: 'Day' }
];

const formatMonthKey = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const formatDateKey = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
};

const toDateKey = (value) => {
    const normalized = normalizeDate(value);
    return normalized ? formatDateKey(normalized) : '';
};

const datesBetween = (startDate, endDate) => {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    if (!start || !end || start > end) return [];

    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        dates.push(formatDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
};

const getWeekStart = (value) => {
    const date = normalizeDate(value);
    if (!date) return null;
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
};

const buildWeekDates = (value) => {
    const start = getWeekStart(value);
    if (!start) return [];

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
    });
};

const getVisibleMonths = (viewMode, selectedDateValue, monthValue) => {
    if (viewMode === 'month') {
        return [new Date(monthValue.getFullYear(), monthValue.getMonth(), 1)];
    }

    const dates = viewMode === 'week'
        ? buildWeekDates(selectedDateValue)
        : [normalizeDate(selectedDateValue)];

    const uniqueMonths = new Map();
    dates.filter(Boolean).forEach((date) => {
        const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
        uniqueMonths.set(formatMonthKey(monthDate), monthDate);
    });

    return Array.from(uniqueMonths.values());
};

const createSundayLeaveEvent = (dateKey) => ({
    id: `default-sunday-${dateKey}`,
    title: 'Sunday Leave',
    type: 'LEAVE_DAY',
    startDate: dateKey,
    endDate: dateKey,
    audience: 'ALL',
    description: 'Weekly leave day applied by default for Sundays.',
    allDay: true,
    isDefaultSunday: true
});

const getEventMeta = (type) => {
    return EVENT_TYPES.find((eventType) => eventType.value === type) || EVENT_TYPES[3];
};

const matchesAudience = (eventAudience, role, editable) => {
    if (editable || role === 'ADMIN') return true;

    switch (eventAudience) {
        case 'STUDENTS':
            return role === 'STUDENT';
        case 'FACULTY':
            return ['TEACHER', 'MENTOR', 'HOD', 'COE', 'PLACEMENT_COORDINATOR'].includes(role);
        case 'ADMIN':
            return role === 'ADMIN';
        default:
            return true;
    }
};

const buildCalendarCells = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];

    for (let index = 0; index < firstDay.getDay(); index += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
};

const formatEventDateRange = (calendarEvent) => {
    if (calendarEvent.startDate === calendarEvent.endDate) {
        return calendarEvent.startDate;
    }
    return `${calendarEvent.startDate} to ${calendarEvent.endDate}`;
};

const CollegeCalendarWidget = ({
    title = 'College Calendar',
    subtitle = 'Shared leave, holiday, and vacation plan',
    editable = false,
    className = '',
    compact = false,
    allowedViews = ['day'],
    variant = 'default'
}) => {
    const { userData } = useAuth();
    const userRole = userData?.role || '';
    const availableViews = useMemo(() => {
        const validViews = VIEW_OPTIONS.filter((option) => allowedViews.includes(option.value));
        return validViews.length > 0 ? validViews : [VIEW_OPTIONS[0]];
    }, [allowedViews]);
    const [viewMode, setViewMode] = useState(() => availableViews[0].value);
    const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [monthEvents, setMonthEvents] = useState({});
    const [loadingMonths, setLoadingMonths] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!availableViews.some((option) => option.value === viewMode)) {
            setViewMode(availableViews[0].value);
        }
    }, [availableViews, viewMode]);

    const fetchMonthEvents = async (monthValue, force = false) => {
        const monthKey = formatMonthKey(monthValue);
        if (!force && monthEvents[monthKey]) {
            return;
        }

        setLoadingMonths((prev) => (prev.includes(monthKey) ? prev : [...prev, monthKey]));
        try {
            const eventsRes = await api.get('/college-calendar/events', {
                params: { month: monthKey }
            });
            setMonthEvents((prev) => ({
                ...prev,
                [monthKey]: Array.isArray(eventsRes.data) ? eventsRes.data : []
            }));
        } catch (error) {
            console.error('Failed to load college calendar', error);
            setMonthEvents((prev) => ({
                ...prev,
                [monthKey]: []
            }));
        } finally {
            setLoadingMonths((prev) => prev.filter((value) => value !== monthKey));
        }
    };

    const visibleMonths = useMemo(
        () => getVisibleMonths(viewMode, selectedDate, currentMonth),
        [viewMode, selectedDate, currentMonth]
    );

    useEffect(() => {
        visibleMonths.forEach((monthValue) => {
            fetchMonthEvents(monthValue);
        });
    }, [visibleMonths]);

    const visibleEvents = useMemo(() => {
        return Object.values(monthEvents)
            .flat()
            .filter((event) => matchesAudience(event.audience, userRole, editable));
    }, [editable, monthEvents, userRole]);

    const eventDates = useMemo(() => {
        const map = new Map();
        visibleEvents.forEach((event) => {
            datesBetween(event.startDate, event.endDate).forEach((dateKey) => {
                const dateEvents = map.get(dateKey) || [];
                dateEvents.push(event);
                map.set(dateKey, dateEvents);
            });
        });

        visibleMonths.forEach((monthValue) => {
            const year = monthValue.getFullYear();
            const month = monthValue.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= lastDay; day += 1) {
                const date = new Date(year, month, day);
                if (date.getDay() !== 0) continue;

                const dateKey = toDateKey(date);
                const dateEvents = map.get(dateKey) || [];
                const hasLeaveDay = dateEvents.some((event) => event.type === 'LEAVE_DAY');
                if (!hasLeaveDay) {
                    map.set(dateKey, [...dateEvents, createSundayLeaveEvent(dateKey)]);
                }
            }
        });

        return map;
    }, [visibleEvents, visibleMonths]);

    const selectedEvents = useMemo(() => {
        return (eventDates.get(selectedDate) || []).sort((left, right) => {
            return String(left.type).localeCompare(String(right.type));
        });
    }, [eventDates, selectedDate]);

    const monthSummary = useMemo(() => {
        const uniqueDays = new Set();
        const typeCounts = new Map();

        const monthDates = buildCalendarCells(currentMonth)
            .filter(Boolean)
            .map((date) => toDateKey(date));

        monthDates.forEach((dateKey) => {
            const dayEvents = eventDates.get(dateKey) || [];
            if (dayEvents.length > 0) {
                uniqueDays.add(dateKey);
            }
            dayEvents.forEach((calendarEvent) => {
                if (calendarEvent.isDefaultSunday) return;
                typeCounts.set(calendarEvent.type, (typeCounts.get(calendarEvent.type) || 0) + 1);
            });
        });

        visibleEvents.forEach((event) => {
            datesBetween(event.startDate, event.endDate).forEach((dateKey) => {
                if (dateKey.startsWith(formatMonthKey(currentMonth))) {
                    uniqueDays.add(dateKey);
                }
            });
        });

        const sundayCount = monthDates.filter((dateKey) => {
            const date = normalizeDate(dateKey);
            return date?.getDay() === 0;
        }).length;
        if (sundayCount > 0) {
            typeCounts.set('LEAVE_DAY', (typeCounts.get('LEAVE_DAY') || 0) + sundayCount);
        }

        return {
            totalEvents: visibleEvents.filter((event) => String(event.startDate || '').startsWith(formatMonthKey(currentMonth))).length + sundayCount,
            activeDays: uniqueDays.size,
            dominantTypes: EVENT_TYPES
                .map((item) => ({
                    ...item,
                    count: typeCounts.get(item.value) || 0
                }))
                .filter((item) => item.count > 0)
                .slice(0, 3)
        };
    }, [visibleEvents, currentMonth, eventDates]);

    const monthLabel = currentMonth.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
    });
    const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);
    const todayKey = formatDateKey(new Date());
    const selectedDateLabel = normalizeDate(selectedDate)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || selectedDate;
    const weekDates = useMemo(() => buildWeekDates(selectedDate), [selectedDate]);
    const isLoading = visibleMonths.some((monthValue) => loadingMonths.includes(formatMonthKey(monthValue)));

    const selectedDateSummary = useMemo(() => {
        const selected = normalizeDate(selectedDate);
        if (!selected) return '';

        if (viewMode === 'day') {
            return selected.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        if (viewMode === 'week' && weekDates.length > 0) {
            const weekStart = weekDates[0];
            const weekEnd = weekDates[6];
            return `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }

        return monthLabel;
    }, [selectedDate, viewMode, weekDates, monthLabel]);

    const shiftView = (direction) => {
        const current = normalizeDate(selectedDate);
        if (!current) return;

        const next = new Date(current);
        if (viewMode === 'day') {
            next.setDate(current.getDate() + direction);
        } else if (viewMode === 'week') {
            next.setDate(current.getDate() + (direction * 7));
        } else {
            next.setMonth(current.getMonth() + direction, 1);
        }

        const nextKey = toDateKey(next);
        setSelectedDate(nextKey);
        setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    };

    const openCreateModal = (dateValue = selectedDate) => {
        setEditingEventId(null);
        setForm({
            ...EMPTY_FORM,
            startDate: dateValue,
            endDate: dateValue
        });
        setShowEditor(true);
    };

    const openEditModal = (event) => {
        setEditingEventId(event.id);
        setForm({
            title: event.title || '',
            type: event.type || 'LEAVE_DAY',
            startDate: event.startDate || '',
            endDate: event.endDate || '',
            audience: event.audience || 'ALL',
            description: event.description || '',
            allDay: Boolean(event.allDay)
        });
        setShowEditor(true);
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Delete this calendar event?')) return;
        try {
            await api.delete(`/college-calendar/events/${eventId}`);
            await Promise.all(visibleMonths.map((monthValue) => fetchMonthEvents(monthValue, true)));
        } catch (error) {
            console.error('Failed to delete calendar event', error);
            alert(error.response?.data?.error || 'Failed to delete calendar event.');
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingEventId) {
                await api.put(`/college-calendar/events/${editingEventId}`, payload);
            } else {
                await api.post('/college-calendar/events', payload);
            }
            setShowEditor(false);
            setEditingEventId(null);
            setForm(EMPTY_FORM);
            await Promise.all(visibleMonths.map((monthValue) => fetchMonthEvents(monthValue, true)));
        } catch (error) {
            console.error('Failed to save calendar event', error);
            alert(error.response?.data?.error || 'Failed to save calendar event.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={`college-calendar-widget ${compact ? 'compact' : ''} college-calendar-widget--${variant} ${className}`.trim()}>
            <div className="college-calendar-header">
                <div className="college-calendar-heading">
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                    <div className="college-calendar-header-metrics">
                        <div className="college-calendar-metric-pill">
                            <strong>{monthSummary.totalEvents}</strong>
                            <span>events this month</span>
                        </div>
                        <div className="college-calendar-metric-pill">
                            <strong>{monthSummary.activeDays}</strong>
                            <span>active calendar days</span>
                        </div>
                    </div>
                </div>
                {editable && (
                    <button type="button" className="college-calendar-action" onClick={() => openCreateModal()}>
                        <Plus size={16} />
                        Add day
                    </button>
                )}
            </div>

            <div className={`college-calendar-shell college-calendar-shell--${viewMode}`}>
                <div className="college-calendar-month-panel">
                    <div className="college-calendar-nav">
                        <button type="button" onClick={() => shiftView(-1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <div className="college-calendar-nav-copy">
                            <strong>{viewMode === 'month' ? monthLabel : selectedDateLabel}</strong>
                            <span>{selectedDateSummary}</span>
                        </div>
                        <button type="button" onClick={() => shiftView(1)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {availableViews.length > 1 && (
                    <div className="college-calendar-view-switch" role="tablist" aria-label="Calendar view switch">
                        {availableViews.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={viewMode === option.value ? 'active' : ''}
                                onClick={() => setViewMode(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    )}

                    <div className="college-calendar-legend">
                        {monthSummary.dominantTypes.length > 0 ? (
                            monthSummary.dominantTypes.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.value} className="college-calendar-legend-item">
                                        <span className="college-calendar-legend-icon" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                                            <Icon size={13} />
                                        </span>
                                        <span>{item.label}</span>
                                        <strong>{item.count}</strong>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="college-calendar-legend-empty">No published dates for this month yet</div>
                        )}
                    </div>

                    {viewMode === 'month' && (
                        <>
                            <div className="college-calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>

                            <div className="college-calendar-grid">
                                {calendarCells.map((cell, index) => {
                                    if (!cell) {
                                        return <div key={`empty-${index}`} className="college-calendar-cell empty" />;
                                    }

                                    const dateKey = formatDateKey(cell);
                                    const dayEvents = eventDates.get(dateKey) || [];
                                    const dominantEvent = dayEvents[0];
                                    const isSelected = dateKey === selectedDate;
                                    const isToday = dateKey === todayKey;

                                    return (
                                        <button
                                            type="button"
                                            key={dateKey}
                                            className={`college-calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                                            style={dominantEvent ? { '--event-accent': getEventMeta(dominantEvent.type).color } : undefined}
                                            onClick={() => {
                                                setSelectedDate(dateKey);
                                                setCurrentMonth(new Date(cell.getFullYear(), cell.getMonth(), 1));
                                            }}
                                        >
                                            <div className="college-calendar-cell-top">
                                                <span className="college-calendar-date-number">{cell.getDate()}</span>
                                                {dayEvents.length > 0 && <span className="college-calendar-event-count">{dayEvents.length}</span>}
                                            </div>
                                            <div className="college-calendar-cell-body">
                                                {dayEvents.length > 0 ? (
                                                    dayEvents.slice(0, 2).map((calendarEvent) => {
                                                        const meta = getEventMeta(calendarEvent.type);
                                                        return (
                                                            <span
                                                                key={`${calendarEvent.id}-${dateKey}`}
                                                                className="college-calendar-event-chip"
                                                                style={{ '--event-accent': meta.color }}
                                                            >
                                                                {calendarEvent.title}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="college-calendar-cell-placeholder">No events</span>
                                                )}
                                                {dayEvents.length > 2 && (
                                                    <span className="college-calendar-more-chip">+{dayEvents.length - 2} more</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {viewMode === 'week' && (
                        <div className="college-calendar-week-strip">
                            {weekDates.map((date) => {
                                const dateKey = toDateKey(date);
                                const dayEvents = eventDates.get(dateKey) || [];
                                const dominantEvent = dayEvents[0];
                                const isSelected = dateKey === selectedDate;
                                const isToday = dateKey === todayKey;

                                return (
                                    <button
                                        type="button"
                                        key={dateKey}
                                        className={`college-calendar-strip-card ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                                        style={dominantEvent ? { '--event-accent': getEventMeta(dominantEvent.type).color } : undefined}
                                        onClick={() => {
                                            setSelectedDate(dateKey);
                                            setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                                        }}
                                    >
                                        <div className="college-calendar-strip-head">
                                            <span className="college-calendar-strip-label">{date.toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                                            <strong>{date.getDate()}</strong>
                                        </div>
                                        <div className="college-calendar-strip-body">
                                            {dayEvents.length > 0 ? (
                                                dayEvents.slice(0, 2).map((calendarEvent) => {
                                                    const meta = getEventMeta(calendarEvent.type);
                                                    return (
                                                        <div key={`${calendarEvent.id}-${dateKey}`} className="college-calendar-strip-event">
                                                            <span className="college-calendar-strip-dot" style={{ backgroundColor: meta.color }} />
                                                            <span>{calendarEvent.title}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <small>No events planned</small>
                                            )}
                                            {dayEvents.length > 2 && <small>+{dayEvents.length - 2} more items</small>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>

                <div className="college-calendar-details">
                    <div className="college-calendar-detail-card">
                        <div className="college-calendar-detail-heading">
                            <div>
                                <h4>Selected day</h4>
                                <span>{selectedDateLabel}</span>
                            </div>
                            <div className="college-calendar-detail-actions">
                                <span className="college-calendar-day-total">{selectedEvents.length} item{selectedEvents.length === 1 ? '' : 's'}</span>
                                {editable && (
                                    <button type="button" className="college-calendar-inline-btn" onClick={() => openCreateModal(selectedDate)}>
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="college-calendar-empty">Loading calendar days...</div>
                        ) : selectedEvents.length === 0 ? (
                            <div className="college-calendar-empty">No college-wide events planned for this day.</div>
                        ) : (
                            <div className="college-calendar-list">
                                {selectedEvents.map((calendarEvent) => {
                                    const meta = getEventMeta(calendarEvent.type);
                                    const Icon = meta.icon;
                                    return (
                                        <article key={calendarEvent.id} className="college-calendar-event-card">
                                            <div className="college-calendar-event-top">
                                                <div className="college-calendar-event-badge" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                                                    <Icon size={14} />
                                                    {meta.label}
                                                </div>
                                                {editable && !calendarEvent.isDefaultSunday && (
                                                    <div className="college-calendar-tools">
                                                        <button type="button" onClick={() => openEditModal(calendarEvent)}>
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(calendarEvent.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <h5>{calendarEvent.title}</h5>
                                            <p>{calendarEvent.description || 'No additional notes.'}</p>
                                            <div className="college-calendar-meta">
                                                <span>{calendarEvent.audience === 'ALL' ? 'Visible to all roles' : calendarEvent.audience.replace('_', ' ')}</span>
                                                <span>
                                                    {formatEventDateRange(calendarEvent)}
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {showEditor && (
                <div className="college-calendar-modal-overlay">
                    <div className="college-calendar-modal">
                        <div className="college-calendar-modal-header">
                            <div>
                                <h4>{editingEventId ? 'Edit calendar day' : 'Add calendar day'}</h4>
                                <span>Manage leave days, government holidays, and vacations</span>
                            </div>
                                <button type="button" className="college-calendar-inline-btn" onClick={() => setShowEditor(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                        <form className="college-calendar-form" onSubmit={handleSave}>
                            <label>
                                Title
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                Event type
                                <select
                                    value={form.type}
                                    onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                                >
                                    {EVENT_TYPES.map((eventType) => (
                                        <option key={eventType.value} value={eventType.value}>{eventType.label}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="college-calendar-form-row">
                                <label>
                                    Start date
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(event) => setForm((prev) => ({
                                            ...prev,
                                            startDate: event.target.value,
                                            endDate: prev.endDate || event.target.value
                                        }))}
                                        required
                                    />
                                </label>
                                <label>
                                    End date
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <label>
                                Visible for
                                <select
                                    value={form.audience}
                                    onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))}
                                >
                                    {AUDIENCE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Description
                                <textarea
                                    rows="4"
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Optional note for students, faculty, and staff"
                                />
                            </label>
                            <div className="college-calendar-form-actions">
                                <button type="button" className="college-calendar-secondary" onClick={() => setShowEditor(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="college-calendar-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingEventId ? 'Update day' : 'Create day'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CollegeCalendarWidget;
