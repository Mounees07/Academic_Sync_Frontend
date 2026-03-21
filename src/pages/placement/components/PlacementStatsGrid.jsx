import React from 'react';

const PlacementStatsGrid = ({ activeSection, dashboard, formatScore, onOpenStudents }) => (
    <div className="pc-stats-grid">
        <div
            className={`pc-stat-card ${activeSection !== 'students' ? 'pc-stat-card-clickable' : ''}`}
            onClick={activeSection !== 'students' ? onOpenStudents : undefined}
            role={activeSection !== 'students' ? 'button' : undefined}
            tabIndex={activeSection !== 'students' ? 0 : undefined}
            onKeyDown={activeSection !== 'students' ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenStudents();
                }
            } : undefined}
        >
            <span>Total Students</span>
            <strong>{dashboard?.totalStudents || 0}</strong>
            <small>Tracked across placement readiness</small>
        </div>
        <div className="pc-stat-card">
            <span>Eligible Students</span>
            <strong>{dashboard?.eligibleStudents || 0}</strong>
            <small>Students ready for active drives</small>
        </div>
        <div className="pc-stat-card">
            <span>Placed Students</span>
            <strong>{dashboard?.placedStudents || 0}</strong>
            <small>Confirmed placement outcomes</small>
        </div>
        <div className="pc-stat-card">
            <span>Average Readiness</span>
            <strong>{formatScore(dashboard?.averageReadinessScore || 0)}</strong>
            <small>Average readiness score across students</small>
        </div>
    </div>
);

export default PlacementStatsGrid;
