import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ChevronRight,
    Calendar,
    Printer,
    Download,
    GraduationCap,
    CheckCircle,
    AlertTriangle,
    Award,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import './HODAcademicPerformance.css';

const HODAcademicPerformance = () => {
    const navigate = useNavigate();
    const { userData } = useAuth();
    
    // Replacing system generated data with default empty/0 states
    const [stats, setStats] = useState({
        avgGpa: 0,
        avgGpaDelta: 0,
        passRate: 0,
        passRateDelta: 0,
        probationCount: 0,
        probationDelta: 0,
        deansListCount: 0,
        deansListDelta: 0,
        totalEnrolled: 0,
        medianGpa: 0,
        probationRate: 0
    });

    const [gpaDistribution, setGpaDistribution] = useState([]);
    const [passRates, setPassRates] = useState([]);
    const [probationStudents, setProbationStudents] = useState([]);
    const [deansListStudents, setDeansListStudents] = useState([]);

    // Optional: hook for future API integration
    useEffect(() => {
        // Data would be fetched here
        // API endpoint placeholder: `/department/academic-performance/${userData.department}`
    }, [userData]);

    return (
        <div className="academic-performance-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate('/department-analytics')}>Reports</span>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-current">Academic Performance</span>
            </div>

            {/* Header */}
            <header className="performance-header">
                <div className="header-titles">
                    <h1>Academic Performance Overview</h1>
                    <p>Department-wide snapshot of GPA, pass rates, probation risk, and high performers.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Calendar size={16} /> Fall Semester 2024
                    </button>
                    <button className="btn-secondary">
                        <Printer size={16} /> Print
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </header>

            {/* Top Stat Cards */}
            <div className="kpi-cards-grid">
                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Average Dept GPA</span>
                        <GraduationCap size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgGpa.toFixed(2)}</span>
                        <div className={`kpi-badge ${stats.avgGpaDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.avgGpaDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.avgGpaDelta >= 0 ? '+' : ''}{stats.avgGpaDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">vs last semester</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Overall Pass Rate</span>
                        <CheckCircle size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.passRate}%</span>
                        <div className={`kpi-badge ${stats.passRateDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.passRateDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.passRateDelta >= 0 ? '+' : ''}{stats.passRateDelta}%
                        </div>
                    </div>
                    <div className="kpi-subtitle">vs last semester</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Academic Probation</span>
                        <AlertTriangle size={18} className="kpi-icon danger" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value text-danger">{stats.probationCount}</span>
                        <div className={`kpi-badge ${stats.probationDelta > 0 ? 'danger-bg' : 'positive'}`}>
                            {stats.probationDelta > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.probationDelta > 0 ? '+' : ''}{stats.probationDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">Out of {stats.totalEnrolled} enrolled students</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Dean's List Eligible</span>
                        <Award size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.deansListCount}</span>
                        <div className={`kpi-badge ${stats.deansListDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.deansListDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.deansListDelta >= 0 ? '+' : ''}{stats.deansListDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">Students achieving &gt; 3.8 GPA</div>
                </div>
            </div>

            {/* Middle Section */}
            <div className="performance-sections-grid">
                {/* GPA Distribution */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>GPA Distribution & Cohort Insight</h2>
                            <p>How the 3.24 average GPA breaks down across the department.</p>
                        </div>
                        <span className="gray-badge">Median GPA 3.18</span>
                    </div>
                    
                    <div className="gpa-bars">
                        {gpaDistribution.length === 0 ? (
                            <div className="text-muted" style={{ padding: '20px 0', fontSize: '13px' }}>No GPA distribution data available</div>
                        ) : (
                            gpaDistribution.map((group, idx) => (
                                <div className="gpa-bar-row" key={idx}>
                                    <span className="gpa-label">{group.label}</span>
                                    <div className="bar-bg">
                                        <div className={`bar-fill ${group.colorClass}`} style={{ width: `${group.percent}%` }}></div>
                                    </div>
                                    <span className="gpa-percent">{group.percent}%</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cohort-badges">
                        <span className="cohort-badge">Highest cohort GPA <strong>Year 4 - 3.46</strong></span>
                        <span className="cohort-badge">Lowest cohort GPA <strong>Year 1 - 3.02</strong></span>
                    </div>

                    <div className="insights-list border-info">
                        <p><span className="dot blue"></span> Upper GPA bands (above 3.3) account for 73% of students, showing strong overall performance.</p>
                        <p><span className="dot orange"></span> Only 8% of students fall below 2.7 GPA and should be monitored closely.</p>
                    </div>
                </div>

                {/* Pass Rate by Semester */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Pass Rate by Semester</h2>
                            <p>Trend of the 88.5% pass rate across recent semesters.</p>
                        </div>
                        <span className="gray-badge">Target &ge; 90%</span>
                    </div>

                    <div className="pass-rate-stats">
                        {passRates.length === 0 ? (
                            <div className="text-muted" style={{ fontSize: '13px' }}>No historical pass rate data available</div>
                        ) : (
                            passRates.map((pr, idx) => (
                                <div className="pr-col" key={idx}>
                                    <span className="pr-label">{pr.semester}</span>
                                    <span className="pr-val">{pr.rate}%</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="insights-list border-warning mt-auto">
                        <p><span className="dot orange"></span> Pass rate has declined 2.5 percentage points from Fall 2023 and is slightly below the 90% departmental goal.</p>
                        <p><span className="dot blue"></span> Consider reviewing gateway courses with high enrollment to recover overall pass rate.</p>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="performance-sections-grid">
                {/* Academic Probation Table */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Students on Academic Probation</h2>
                            <p>Breakdown of the 42 students currently flagged.</p>
                        </div>
                        <span className="red-badge">Probation Rate 3.4%</span>
                    </div>
                    
                    <div className="table-container">
                        <table className="perf-table">
                            <thead>
                                <tr>
                                    <th>Cohort</th>
                                    <th>Students</th>
                                    <th>Primary Reason</th>
                                    <th>Top Courses Impacting</th>
                                </tr>
                            </thead>
                            <tbody>
                                {probationStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted" style={{ padding: '24px' }}>
                                            No probation student data available
                                        </td>
                                    </tr>
                                ) : (
                                    probationStudents.map((st, idx) => (
                                        <tr key={idx}>
                                            <td>{st.cohort}<br/><span className="sub-text">({st.level})</span></td>
                                            <td>{st.count}</td>
                                            <td>{st.reason}</td>
                                            <td>{st.courses}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dean's List Table */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Dean's List & High Performers</h2>
                            <p>Who contributes to the 215 Dean's List eligible students.</p>
                        </div>
                        <span className="green-badge">Top 10% GPA &gt; 3.8</span>
                    </div>

                    <div className="table-container">
                        <table className="perf-table">
                            <thead>
                                <tr>
                                    <th>Cohort / Program</th>
                                    <th>Students</th>
                                    <th>Avg GPA</th>
                                    <th>Notable Courses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deansListStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted" style={{ padding: '24px' }}>
                                            No Dean's List data available
                                        </td>
                                    </tr>
                                ) : (
                                    deansListStudents.map((dl, idx) => (
                                        <tr key={idx}>
                                            <td>{dl.program}</td>
                                            <td>{dl.count}</td>
                                            <td>{dl.avgGpa}</td>
                                            <td>{dl.courses}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="insights-list mt-auto">
                        <p><span className="dot emerald"></span> High performers are concentrated in the Year 4 honors and Year 3 AI/Data tracks.</p>
                        <p><span className="dot blue"></span> Courses like CS 420 and CS 320 correlate strongly with Dean's List eligibility.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODAcademicPerformance;
