import React from 'react';
import {
    BarChart3,
    CalendarDays,
    Download,
    Loader2,
    Plus,
    Upload
} from 'lucide-react';

const HERO_CONTENT = {
    overview: {
        eyebrow: 'Placement Operations',
        title: 'Placement Coordinator Dashboard',
        description: 'Monitor readiness, review recruiter activity, and move into focused student, drive, or analytics workflows.'
    },
    students: {
        eyebrow: 'Student Operations',
        title: 'Student Management',
        description: 'Track readiness, review skill progress, and take quick actions across the graduating batch.'
    },
    drives: {
        eyebrow: 'Drive Operations',
        title: 'Placement Drives',
        description: 'Manage active hiring drives, view applicants, and publish new company opportunities.'
    },
    analytics: {
        eyebrow: 'Analytics Hub',
        title: 'Analytics & Insights',
        description: 'Detailed overview of placement statistics, department performance, and hiring trends.'
    },
    assessments: {
        eyebrow: 'Assessment Studio',
        title: 'Placement Assessment Records',
        description: 'Capture activity-wise marks, vendor training results, attendance, and semester-wise placement rounds for each student.'
    }
};

const PlacementPageHero = ({
    activeSection,
    analyticsYear,
    importing,
    refreshing,
    onAnalyticsYearChange,
    onExportDrives,
    onExportStudents,
    onImportClick,
    onOpenDriveEditor,
    onRefresh
}) => {
    const content = HERO_CONTENT[activeSection] || HERO_CONTENT.overview;

    return (
        <div className="placement-coordinator-hero">
            <div>
                <div className="placement-coordinator-eyebrow">{content.eyebrow}</div>
                <h1>{content.title}</h1>
                <p>{content.description}</p>
            </div>
            <div className="placement-coordinator-actions">
                {activeSection === 'students' ? (
                    <>
                        <button className="pc-button pc-button-secondary" onClick={() => onExportStudents('xlsx')}>
                            <Download size={16} />
                            Export List
                        </button>
                        <button className="pc-button" onClick={onImportClick} disabled={importing}>
                            {importing ? <Loader2 size={16} className="pc-spin" /> : <Upload size={16} />}
                            Import Scores
                        </button>
                    </>
                ) : activeSection === 'drives' ? (
                    <>
                        <button className="pc-button pc-button-secondary" onClick={() => onExportDrives('pdf')}>
                            <Download size={16} />
                            Export Report
                        </button>
                        <button className="pc-button" onClick={() => onOpenDriveEditor()}>
                            <Plus size={16} />
                            Add Drive
                        </button>
                    </>
                ) : activeSection === 'analytics' ? (
                    <>
                        <label className="pc-select pc-analytics-year-select">
                            <CalendarDays size={16} />
                            <select value={analyticsYear} onChange={(event) => onAnalyticsYearChange(event.target.value)}>
                                <option value="2024-2025">2024-2025</option>
                                <option value="2023-2024">2023-2024</option>
                                <option value="2022-2023">2022-2023</option>
                            </select>
                        </label>
                        <button className="pc-button" onClick={() => onExportDrives('pdf')}>
                            <Download size={16} />
                            Export PDF
                        </button>
                    </>
                ) : activeSection === 'assessments' ? (
                    <>
                        <button className="pc-button pc-button-secondary" onClick={() => onRefresh(true)} disabled={refreshing}>
                            {refreshing ? <Loader2 size={16} className="pc-spin" /> : <BarChart3 size={16} />}
                            Refresh
                        </button>
                        <button className="pc-button" onClick={() => onExportStudents('xlsx')}>
                            <Download size={16} />
                            Export Students
                        </button>
                    </>
                ) : (
                    <>
                        <button className="pc-button pc-button-secondary" onClick={() => onRefresh(true)} disabled={refreshing}>
                            {refreshing ? <Loader2 size={16} className="pc-spin" /> : <BarChart3 size={16} />}
                            Refresh
                        </button>
                        <button className="pc-button pc-button-secondary" onClick={onImportClick} disabled={importing}>
                            {importing ? <Loader2 size={16} className="pc-spin" /> : <Upload size={16} />}
                            Import Scores
                        </button>
                        <button className="pc-button" onClick={() => onExportStudents('xlsx')}>
                            <Download size={16} />
                            Export Students
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlacementPageHero;
