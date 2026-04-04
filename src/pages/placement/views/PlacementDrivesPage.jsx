import React from 'react';
import {
    CheckCircle2,
    Briefcase,
    Building2,
    CalendarDays,
    Download,
    ExternalLink,
    IndianRupee,
    Loader2,
    MapPin,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    Users,
    UserCheck
} from 'lucide-react';

const DRIVE_ASSIGNMENT_GROUPS = [
    { key: 'eligibleStudentUids', title: 'Eligible Students' },
    { key: 'appliedStudentUids', title: 'Applied Students' },
    { key: 'selectedStudentUids', title: 'Selected Students' }
];

const getStudentMeta = (student) => ({
    id: student.uid,
    title: student.name,
    subtitle: student.rollNumber || student.uid,
    detail: student.department || 'Department not set'
});

const PlacementDrivesPage = ({
    companies,
    companyForm,
    companyStatusOptions,
    driveForm,
    driveFormRef,
    driveSearchTerm,
    driveStatusFilter,
    driveStatusOptions,
    driveTypeFilter,
    editingCompanyId,
    editingDriveId,
    filteredDrives,
    formatDriveDate,
    formatDriveType,
    getDriveType,
    handleCompanyFieldChange,
    handleDeleteCompany,
    handleDeleteDrive,
    handleExportDriveApplicants,
    handleDriveFieldChange,
    handleEditCompany,
    handleMarkDriveAttendance,
    handleReviewDriveApplication,
    handleSaveCompany,
    handleSaveDrive,
    handleViewApplicants,
    onRefresh,
    openDriveEditor,
    reviewingApplication,
    refreshing,
    resetCompanyForm,
    resetDriveForm,
    savingCompany,
    savingDrive,
    selectedDrive,
    setDriveSearchTerm,
    setDriveStatusFilter,
    setDriveTypeFilter,
    students,
    toggleDriveStudent
}) => {
    const [assignmentSearch, setAssignmentSearch] = React.useState({
        eligibleStudentUids: '',
        appliedStudentUids: '',
        selectedStudentUids: ''
    });

    const selectedStudentsPreview = students.filter((student) => driveForm.selectedStudentUids.includes(student.uid));

    const getFilteredStudents = (groupKey) => {
        const normalizedSearch = String(assignmentSearch[groupKey] || '').trim().toLowerCase();
        if (!normalizedSearch) {
            return students;
        }
        return students.filter((student) => [
            student.name,
            student.rollNumber,
            student.department,
            student.uid
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
    };

    return (
    <div className="pc-drives-page">
        <div className="pc-drive-filter-bar">
            <label className="pc-search pc-search-wide">
                <Search size={16} />
                <input
                    type="text"
                    value={driveSearchTerm}
                    onChange={(event) => setDriveSearchTerm(event.target.value)}
                    placeholder="Search companies, roles, or locations"
                />
            </label>
            <label className="pc-select">
                <select value={driveStatusFilter} onChange={(event) => setDriveStatusFilter(event.target.value)}>
                    <option value="ALL">Status: All</option>
                    {driveStatusOptions.map((status) => (
                        <option key={status} value={status}>
                            Status: {status.charAt(0) + status.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
            </label>
            <label className="pc-select">
                <select value={driveTypeFilter} onChange={(event) => setDriveTypeFilter(event.target.value)}>
                    <option value="ALL">Type: All</option>
                    <option value="FULL_TIME">Type: Full Time</option>
                    <option value="INTERNSHIP">Type: Internship</option>
                    <option value="CONTRACT">Type: Contract</option>
                </select>
            </label>
            <button className="pc-button pc-button-secondary" onClick={() => onRefresh(true)} disabled={refreshing}>
                {refreshing ? <Loader2 size={16} className="pc-spin" /> : <SlidersHorizontal size={16} />}
                More Filters
            </button>
        </div>

        <div className="pc-drive-card-grid">
            {filteredDrives.length === 0 ? (
                <div className="pc-panel pc-empty-inline">No placement drives match the current filters.</div>
            ) : filteredDrives.map((drive) => {
                const eligibleCount = Number(drive.eligibleCount || 0);
                const appliedCount = Number(drive.appliedCount || 0);
                const progress = eligibleCount > 0 ? Math.min(100, Math.round((appliedCount / eligibleCount) * 100)) : 0;
                const driveType = formatDriveType(getDriveType(drive));
                const statusClass = String(drive.status || 'PLANNED').toLowerCase();

                return (
                    <article key={drive.id} className="pc-drive-overview-card">
                        <div className="pc-drive-card-top">
                            <div className="pc-drive-company">
                                <span className="pc-drive-company-mark">
                                    {String(drive.companyName || 'D').charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <h3>{drive.companyName}</h3>
                                    <p>{driveType}</p>
                                </div>
                            </div>
                            <span className={`pc-badge ${statusClass}`}>{String(drive.status || 'PLANNED').replace('_', ' ')}</span>
                        </div>

                        <div className="pc-drive-card-body">
                            <div className="pc-drive-meta-grid">
                                <div className="pc-drive-meta-item">
                                    <Briefcase size={14} />
                                    <span>Role</span>
                                    <strong>{drive.roleTitle || 'Role pending'}</strong>
                                </div>
                                <div className="pc-drive-meta-item">
                                    <IndianRupee size={14} />
                                    <span>Package</span>
                                    <strong>{drive.packageOffered ? `${drive.packageOffered} LPA` : 'Not set'}</strong>
                                </div>
                                <div className="pc-drive-meta-item">
                                    <CalendarDays size={14} />
                                    <span>Deadline</span>
                                    <strong>{formatDriveDate(drive.driveDate)}</strong>
                                </div>
                                <div className="pc-drive-meta-item">
                                    <MapPin size={14} />
                                    <span>Location</span>
                                    <strong>{drive.location || 'Location pending'}</strong>
                                </div>
                            </div>

                        <div className="pc-drive-progress">
                            <div className="pc-drive-progress-head">
                                <span>Applicants Processed</span>
                                <strong>{appliedCount} / {eligibleCount || 0}</strong>
                            </div>
                                <div className="pc-mini-bar">
                                <div style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <div className="pc-drive-progress">
                            <div className="pc-drive-progress-head">
                                <span>Students Placed</span>
                                <strong>{Number(drive.selectedCount || 0)}</strong>
                            </div>
                        </div>
                    </div>

                        <div className="pc-drive-card-actions">
                            <button className="pc-button pc-button-secondary" onClick={() => openDriveEditor(drive)}>
                                Edit Drive
                            </button>
                            <button className="pc-button pc-button-secondary" onClick={() => handleDeleteDrive(drive.id)}>
                                <Trash2 size={14} />
                                Delete
                            </button>
                            <button className="pc-button" onClick={() => handleViewApplicants(drive)}>
                                View Applicants
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>

        {selectedDrive ? (
            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>{selectedDrive.companyName} Applicant Review</h2>
                        <p>Review applied students, shortlist eligible candidates, and export the database for the company.</p>
                    </div>
                    <div className="pc-panel-actions">
                        <button className="pc-button pc-button-secondary" onClick={() => handleExportDriveApplicants(selectedDrive, 'xlsx')}>
                            <Download size={16} />
                            Export Excel
                        </button>
                    </div>
                </div>

                <div className="pc-table-wrap">
                    <table className="pc-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Department</th>
                                <th>CGPA</th>
                                <th>Readiness</th>
                                <th>Resume</th>
                                <th>Status</th>
                                <th>Attendance</th>
                                <th>Remarks</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(selectedDrive.applications || []).filter((application) =>
                                ['APPLIED', 'SHORTLISTED', 'REJECTED'].includes(application.applicationStatus)
                            ).length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="pc-empty-table">No students have applied for this drive yet.</td>
                                </tr>
                            ) : (selectedDrive.applications || [])
                                .filter((application) => ['APPLIED', 'SHORTLISTED', 'REJECTED'].includes(application.applicationStatus))
                                .map((application) => (
                                    <tr key={`${selectedDrive.id}-${application.uid}`}>
                                        <td>
                                            <div className="pc-student-cell">
                                                <span className="pc-avatar">{application.name?.charAt(0) || 'S'}</span>
                                                <div>
                                                    <strong>{application.name}</strong>
                                                    <small>{application.rollNumber || application.uid}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{application.department || 'N/A'}</td>
                                        <td>{Number(application.cgpaScore || 0).toFixed(2)}</td>
                                        <td>{Math.round(Number(application.readinessScore || 0))}%</td>
                                        <td>
                                            {application.resumeUrl ? (
                                                <a className="pc-inline-link" href={application.resumeUrl} target="_blank" rel="noreferrer">
                                                    Open
                                                    <ExternalLink size={14} />
                                                </a>
                                            ) : 'Not uploaded'}
                                        </td>
                                        <td>
                                            <span className={`pc-badge ${String(application.applicationStatus || 'APPLIED').toLowerCase()}`}>
                                                {application.applicationStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`pc-badge ${application.attended ? 'shortlisted' : 'planned'}`}>
                                                {application.attended ? 'ATTENDED' : 'NOT MARKED'}
                                            </span>
                                        </td>
                                        <td>{application.coordinatorRemarks || '-'}</td>
                                        <td>
                                            <div className="pc-panel-actions">
                                                <button
                                                    className="pc-button pc-button-secondary"
                                                    onClick={() => handleReviewDriveApplication(selectedDrive.id, application.uid, 'SHORTLISTED')}
                                                    disabled={reviewingApplication === `${selectedDrive.id}:${application.uid}:SHORTLISTED`}
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Shortlist
                                                </button>
                                                <button
                                                    className="pc-button pc-button-secondary"
                                                    onClick={() => handleReviewDriveApplication(selectedDrive.id, application.uid, 'REJECTED')}
                                                    disabled={reviewingApplication === `${selectedDrive.id}:${application.uid}:REJECTED`}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    className="pc-button pc-button-secondary"
                                                    onClick={() => handleReviewDriveApplication(selectedDrive.id, application.uid, 'APPLIED')}
                                                    disabled={reviewingApplication === `${selectedDrive.id}:${application.uid}:APPLIED`}
                                                >
                                                    Keep Applied
                                                </button>
                                                <button
                                                    className="pc-button pc-button-secondary"
                                                    onClick={() => handleMarkDriveAttendance(selectedDrive.id, application.uid, true)}
                                                    disabled={reviewingApplication === `${selectedDrive.id}:${application.uid}:attendance:true` || application.attended}
                                                >
                                                    Mark Attended
                                                </button>
                                                <button
                                                    className="pc-button pc-button-secondary"
                                                    onClick={() => handleMarkDriveAttendance(selectedDrive.id, application.uid, false)}
                                                    disabled={reviewingApplication === `${selectedDrive.id}:${application.uid}:attendance:false` || !application.attended}
                                                >
                                                    Clear Attendance
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </section>
        ) : null}

        <div ref={driveFormRef} className="pc-section-grid pc-section-grid-bottom">
            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Drive Management</h2>
                        <p>Create drives, assign eligible students, and track outcomes.</p>
                    </div>
                    <Users size={18} />
                </div>

                <form className="pc-form" onSubmit={handleSaveDrive}>
                    <div className="pc-form-grid">
                        <select name="companyId" value={driveForm.companyId} onChange={handleDriveFieldChange} required>
                            <option value="">Select company</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.companyName}</option>
                            ))}
                        </select>
                        <input name="roleTitle" value={driveForm.roleTitle} onChange={handleDriveFieldChange} placeholder="Role title" required />
                        <input name="driveDate" value={driveForm.driveDate} onChange={handleDriveFieldChange} type="date" />
                        <input name="location" value={driveForm.location} onChange={handleDriveFieldChange} placeholder="Drive location" />
                        <select name="status" value={driveForm.status} onChange={handleDriveFieldChange}>
                            {driveStatusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <input name="eligibilityCriteria" value={driveForm.eligibilityCriteria} onChange={handleDriveFieldChange} placeholder="Eligibility criteria" />
                    </div>
                    <textarea name="description" value={driveForm.description} onChange={handleDriveFieldChange} placeholder="Drive description" rows="3" />

                    <div className="pc-drive-selection-note">
                        <div className="pc-drive-selection-note-head">
                            <strong>Placed students selected: {driveForm.selectedStudentUids.length}</strong>
                            <span>{driveForm.status === 'COMPLETED' ? 'Ready for completed drive review' : 'Choose placed students before marking this drive as completed'}</span>
                        </div>
                        <div className="pc-drive-selection-summary">
                            <div className="pc-drive-selection-stat">
                                <span>Eligible</span>
                                <strong>{driveForm.eligibleStudentUids.length}</strong>
                            </div>
                            <div className="pc-drive-selection-stat">
                                <span>Applied</span>
                                <strong>{driveForm.appliedStudentUids.length}</strong>
                            </div>
                            <div className="pc-drive-selection-stat highlight">
                                <span>Placed</span>
                                <strong>{driveForm.selectedStudentUids.length}</strong>
                            </div>
                        </div>
                        <div className="pc-drive-selection-chip-row">
                            {selectedStudentsPreview.length === 0 ? (
                                <span className="pc-drive-selection-empty">No placed students selected yet.</span>
                            ) : selectedStudentsPreview.map((student) => (
                                <span key={`selected-preview-${student.uid}`} className="pc-drive-selection-chip">
                                    <UserCheck size={14} />
                                    {student.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="pc-drive-assignments">
                        {DRIVE_ASSIGNMENT_GROUPS.map((group) => (
                            <div key={group.key} className="pc-assignment-box">
                                <div className="pc-assignment-box-head">
                                    <div>
                                        <h3>{group.title}</h3>
                                        <small>{driveForm[group.key].length} selected</small>
                                    </div>
                                    <label className="pc-search pc-assignment-search">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            value={assignmentSearch[group.key]}
                                            onChange={(event) => setAssignmentSearch((prev) => ({ ...prev, [group.key]: event.target.value }))}
                                            placeholder="Search name or roll no"
                                        />
                                    </label>
                                </div>
                                <div className="pc-assignment-list">
                                    {getFilteredStudents(group.key).map((student) => {
                                        const meta = getStudentMeta(student);
                                        const isChecked = driveForm[group.key].includes(student.uid);

                                        return (
                                        <label key={`${group.key}-${student.uid}`} className={`pc-check-row card-style ${isChecked ? 'selected' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleDriveStudent(group.key, student.uid)}
                                            />
                                            <div className="pc-check-row-body">
                                                <strong>{meta.title}</strong>
                                                <span>{meta.subtitle}</span>
                                                <small>{meta.detail}</small>
                                            </div>
                                        </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pc-form-actions">
                        {editingDriveId ? (
                            <button type="button" className="pc-button pc-button-secondary" onClick={resetDriveForm}>Cancel</button>
                        ) : null}
                        <button type="submit" className="pc-button" disabled={savingDrive}>
                            {savingDrive ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                            {editingDriveId ? 'Update Drive' : 'Create Drive'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Company Management</h2>
                        <p>Add, edit, and maintain recruiter records.</p>
                    </div>
                    <Building2 size={18} />
                </div>

                <form className="pc-form" onSubmit={handleSaveCompany}>
                    <div className="pc-form-grid">
                        <input name="companyName" value={companyForm.companyName} onChange={handleCompanyFieldChange} placeholder="Company name" required />
                        <input name="industry" value={companyForm.industry} onChange={handleCompanyFieldChange} placeholder="Industry" />
                        <input name="location" value={companyForm.location} onChange={handleCompanyFieldChange} placeholder="Location" />
                        <input name="website" value={companyForm.website} onChange={handleCompanyFieldChange} placeholder="Website" />
                        <input name="packageOffered" value={companyForm.packageOffered} onChange={handleCompanyFieldChange} placeholder="Package offered (LPA)" type="number" min="0" step="0.1" />
                        <select name="status" value={companyForm.status} onChange={handleCompanyFieldChange}>
                            {companyStatusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <textarea name="notes" value={companyForm.notes} onChange={handleCompanyFieldChange} placeholder="Notes or coordinator remarks" rows="3" />
                    <div className="pc-form-actions">
                        {editingCompanyId ? (
                            <button type="button" className="pc-button pc-button-secondary" onClick={resetCompanyForm}>Cancel</button>
                        ) : null}
                        <button type="submit" className="pc-button" disabled={savingCompany}>
                            {savingCompany ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                            {editingCompanyId ? 'Update Company' : 'Add Company'}
                        </button>
                    </div>
                </form>

                <div className="pc-list">
                    {companies.length === 0 ? (
                        <div className="pc-empty-inline">No companies added yet.</div>
                    ) : companies.map((company) => (
                        <article key={company.id} className="pc-list-card">
                            <div>
                                <h3>{company.companyName}</h3>
                                <p>{company.industry || 'Industry not set'} | {company.location || 'Location not set'}</p>
                                <small>{company.website || 'No website added'}</small>
                            </div>
                            <div className="pc-list-actions">
                                <span className={`pc-badge ${String(company.status || 'ACTIVE').toLowerCase()}`}>{company.status || 'ACTIVE'}</span>
                                <button className="pc-icon-button" onClick={() => handleEditCompany(company)}>
                                    Edit
                                </button>
                                <button className="pc-icon-button danger" onClick={() => handleDeleteCompany(company.id)}>
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    </div>
    );
};

export default PlacementDrivesPage;
