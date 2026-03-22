import React from 'react';
import CollegeCalendarWidget from '../components/college-calendar/CollegeCalendarWidget';

const Calendar = () => {
    return (
        <div style={{ padding: '24px', width: '100%', maxWidth: '100%', margin: 0 }}>
            <CollegeCalendarWidget
                title="Calendar Control Center"
                subtitle="Manage and review college-wide leave days, holidays, vacations, and key institutional dates"
                editable
                className="admin-calendar-fullwidth"
            />
        </div>
    );
};

export default Calendar;
