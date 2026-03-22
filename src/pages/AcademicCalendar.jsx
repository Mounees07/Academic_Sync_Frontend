import React from 'react';
import CollegeCalendarWidget from '../components/college-calendar/CollegeCalendarWidget';

const AcademicCalendar = () => {
    return (
        <div style={{ padding: '24px', maxWidth: '1180px', margin: '0 auto' }}>
            <CollegeCalendarWidget
                title="Academic Calendar"
                subtitle="One shared college calendar for leave days, government holidays, vacations, and important campus-wide dates"
                editable={false}
            />
        </div>
    );
};

export default AcademicCalendar;
