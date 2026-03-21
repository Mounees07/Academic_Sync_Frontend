import React from 'react';
import { Filter, Loader2, Search } from 'lucide-react';

const PlacementStudentsPage = ({
    departmentFilter,
    departmentOptions,
    filteredStudents,
    getReadinessBand,
    handleSort,
    onRefresh,
    placementStatusFilter,
    placementStatusOptions,
    readinessFilter,
    readinessOptions,
    refreshing,
    searchTerm,
    setDepartmentFilter,
    setPlacementStatusFilter,
    setReadinessFilter,
    setSearchTerm,
    setSelectedStudent,
    studentManagementMetrics
}) => (
    <div className="pc-student-management-page">
        <div className="pc-student-management-filters">
            <label className="pc-search pc-search-wide">
                <Search size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by student name, registration number, or skill"
                />
            </label>
            <label className="pc-select">
                <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {departmentOptions.map((department) => (
                        <option key={department} value={department}>
                            {department === 'ALL' ? 'Dept: All Departments' : `Dept: ${department}`}
                        </option>
                    ))}
                </select>
            </label>
            <label className="pc-select">
                <select value={placementStatusFilter} onChange={(event) => setPlacementStatusFilter(event.target.value)}>
                    <option value="ALL">Status: All</option>
                    {placementStatusOptions.map((status) => (
                        <option key={status} value={status}>Status: {status.replace('_', ' ')}</option>
                    ))}
                </select>
            </label>
            <label className="pc-select">
                <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)}>
                    {readinessOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.value === 'ALL' ? 'Score: 60-100' : option.label}
                        </option>
                    ))}
                </select>
            </label>
            <button className="pc-button pc-button-secondary" onClick={() => onRefresh(true)} disabled={refreshing}>
                {refreshing ? <Loader2 size={16} className="pc-spin" /> : <Filter size={16} />}
                More Filters
            </button>
        </div>

        <div className="pc-student-summary-grid">
            <article className="pc-student-summary-card">
                <span>Students in view</span>
                <strong>{studentManagementMetrics.visibleCount}</strong>
                <small>Filtered final-year records</small>
            </article>
            <article className="pc-student-summary-card">
                <span>Placement ready</span>
                <strong>{studentManagementMetrics.placementReadyCount}</strong>
                <small>Readiness 80+ or already eligible</small>
            </article>
            <article className="pc-student-summary-card">
                <span>Need mock interview</span>
                <strong>{studentManagementMetrics.mockInterviewAttentionCount}</strong>
                <small>Priority outreach this week</small>
            </article>
            <article className="pc-student-summary-card">
                <span>Average aptitude</span>
                <strong>{Math.round(studentManagementMetrics.averageAptitude)}%</strong>
                <small>Visible student average</small>
            </article>
        </div>

        <section className="pc-panel pc-student-records-panel">
            <div className="pc-panel-header">
                <div>
                    <h2>Student Records</h2>
                    <p>Name, department, year, readiness score, skills, aptitude, and mock interview progress</p>
                </div>
                <span className="pc-records-chip">{studentManagementMetrics.visibleCount} active records</span>
            </div>

            <div className="pc-table-wrap">
                <table className="pc-table pc-student-records-table">
                    <thead>
                        <tr>
                            <th><button type="button" onClick={() => handleSort('name')}>Name</button></th>
                            <th><button type="button" onClick={() => handleSort('department')}>Dept</button></th>
                            <th><button type="button" onClick={() => handleSort('year')}>Year</button></th>
                            <th><button type="button" onClick={() => handleSort('readinessScore')}>Readiness Score</button></th>
                            <th>Skills</th>
                            <th>Aptitude</th>
                            <th>Mock Interview</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="pc-empty-table">No students match the current filters.</td>
                            </tr>
                        ) : filteredStudents.map((student) => {
                            const skillList = String(student.completedSkillsList || '')
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                                .slice(0, 3);

                            return (
                                <tr key={student.uid}>
                                    <td>
                                        <div className="pc-student-cell">
                                            <span className="pc-avatar">{student.name?.charAt(0) || 'S'}</span>
                                            <div>
                                                <strong>{student.name}</strong>
                                                <small>{student.rollNumber || student.uid}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{student.department || 'N/A'}</td>
                                    <td>{student.year}</td>
                                    <td>
                                        <span className={`pc-readiness-pill ${getReadinessBand(student.readinessScore).toLowerCase()}`}>
                                            {Math.round(Number(student.readinessScore || 0))}%
                                        </span>
                                    </td>
                                    <td>
                                        <div className="pc-skills-stack">
                                            {(skillList.length ? skillList : ['No skills']).map((skill) => (
                                                <span key={`${student.uid}-${skill}`} className="pc-skill-pill">{skill}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="pc-metric-cell">
                                            <strong>{Math.round(Number(student.aptitudeScore || 0))}%</strong>
                                            <div className="pc-mini-bar">
                                                <div style={{ width: `${Math.max(0, Math.min(100, Number(student.aptitudeScore || 0)))}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="pc-metric-cell">
                                            <strong>{Math.round(Number(student.mockInterviewScore || 0))}%</strong>
                                            <div className="pc-mini-bar mock">
                                                <div style={{ width: `${Math.max(0, Math.min(100, Number(student.mockInterviewScore || 0)))}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="pc-record-action" onClick={() => setSelectedStudent(student)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    </div>
);

export default PlacementStudentsPage;
