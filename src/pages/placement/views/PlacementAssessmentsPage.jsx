import React, { useMemo, useState } from 'react';
import { Clock3, Plus, Save, Search, Trash2 } from 'lucide-react';

const ASSESSMENT_CATEGORIES = [
    { value: 'MOCK_INTERVIEW', label: 'Mock Interview' },
    { value: 'TRAINING_ASSESSMENT', label: 'Training Assessment' },
    { value: 'PLACEMENT_ACTIVITY', label: 'Placement Activity' }
];

const CONDUCTOR_TYPES = [
    { value: 'INTERNAL', label: 'Internal Faculty' },
    { value: 'EXTERNAL', label: 'External Vendor' }
];

const ROUND_OWNERS = [
    { value: 'PLACEMENT_TEAM', label: 'Placement Team' },
    { value: 'INTERNAL_PANEL', label: 'Internal Panel' },
    { value: 'EXTERNAL_VENDOR', label: 'External Vendor' }
];

const formatLabel = (value) => String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const StudentPicker = ({ title, description, students, selectedUid, onStudentChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return students.filter((student) => !normalizedSearch || [
            student.name,
            student.rollNumber,
            student.uid
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
    }, [searchTerm, students]);

    return (
        <div className="pc-assessment-student-select">
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            <label className="pc-search pc-search-wide">
                <Search size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by student name or roll number"
                />
            </label>
            <label className="pc-select">
                <select value={selectedUid} onChange={(event) => onStudentChange(event.target.value)}>
                    {filteredStudents.map((student) => (
                        <option key={student.uid} value={student.uid}>
                            {student.name} - {student.rollNumber || student.uid}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
};

const HistoryList = ({ entries, renderMeta, emptyText }) => (
    <div className="pc-assessment-history">
        {entries.length === 0 ? (
            <div className="pc-empty-inline">{emptyText}</div>
        ) : entries.map((entry) => (
            <article key={`history-${entry.id}`} className="pc-history-card">
                <strong>{entry.name || 'Untitled entry'}</strong>
                {renderMeta(entry)}
                <small>{entry.remarks || 'No remarks'}</small>
            </article>
        ))}
    </div>
);

const PlacementAssessmentsPage = ({
    attendanceEntries,
    attendanceStudentUid,
    assessmentRounds,
    assessmentStudentUid,
    assessmentScores,
    assessmentSummary,
    handleAddAssessmentScore,
    handleAddAttendanceEntry,
    handleAddPlacementRound,
    handleAssessmentScoreFieldChange,
    handleAssessmentRoundFieldChange,
    handleAttendanceFieldChange,
    handleAttendanceStudentChange,
    handleAssessmentStudentChange,
    handleRemoveAssessmentScore,
    handleRemoveAttendanceEntry,
    handleRemovePlacementRound,
    handleRoundStudentChange,
    handleSaveAssessmentScores,
    handleSaveAttendanceEntries,
    handleSavePlacementRounds,
    roundStudentUid,
    savingAssessmentScores,
    savingAttendanceEntries,
    savingRounds,
    selectedAttendanceStudent,
    selectedAssessmentStudent,
    selectedRoundStudent,
    students
}) => {
    const [showAttendanceEditor, setShowAttendanceEditor] = useState(false);
    const [showAssessmentEditor, setShowAssessmentEditor] = useState(false);
    const [showRoundEditor, setShowRoundEditor] = useState(false);
    const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
    const [showAssessmentHistory, setShowAssessmentHistory] = useState(false);
    const [showRoundHistory, setShowRoundHistory] = useState(false);

    const saveAttendanceAndClose = async () => {
        const success = await handleSaveAttendanceEntries();
        if (success) {
            setShowAttendanceEditor(false);
            setShowAttendanceHistory(true);
        }
    };

    const saveAssessmentAndClose = async () => {
        const success = await handleSaveAssessmentScores();
        if (success) {
            setShowAssessmentEditor(false);
            setShowAssessmentHistory(true);
        }
    };

    const saveRoundsAndClose = async () => {
        const success = await handleSavePlacementRounds();
        if (success) {
            setShowRoundEditor(false);
            setShowRoundHistory(true);
        }
    };

    return (
        <div className="pc-assessment-page">
            <div className="pc-student-summary-grid">
                <article className="pc-student-summary-card">
                    <span>Students with records</span>
                    <strong>{assessmentSummary.studentsWithAssessments}</strong>
                    <small>Students covered in at least one section</small>
                </article>
                <article className="pc-student-summary-card">
                    <span>Attendance entries</span>
                    <strong>{assessmentSummary.totalAttendanceEntries}</strong>
                    <small>Separate attendance marking records</small>
                </article>
                <article className="pc-student-summary-card">
                    <span>Assessment scores</span>
                    <strong>{assessmentSummary.totalActivities}</strong>
                    <small>Mock interview and training score records</small>
                </article>
                <article className="pc-student-summary-card">
                    <span>Placement rounds</span>
                    <strong>{assessmentSummary.totalRounds}</strong>
                    <small>Round 1 to final HR entries</small>
                </article>
            </div>

            <div className="pc-assessment-stack">
                <section className="pc-panel pc-assessment-section">
                    <div className="pc-panel-header">
                        <div>
                            <h2>Attendance Marking</h2>
                            <p>Maintain training attendance separately for each student.</p>
                        </div>
                        <div className="pc-inline-actions">
                            <button className="pc-button pc-button-secondary" type="button" onClick={() => setShowAttendanceHistory((current) => !current)}>
                                <Clock3 size={16} />
                                {showAttendanceHistory ? 'Hide History' : 'View History'}
                            </button>
                            <button className="pc-button" type="button" onClick={showAttendanceEditor ? saveAttendanceAndClose : () => setShowAttendanceEditor(true)} disabled={savingAttendanceEntries || !selectedAttendanceStudent}>
                                <Save size={16} />
                                {showAttendanceEditor ? (savingAttendanceEntries ? 'Saving...' : 'Update Attendance') : 'Open Update'}
                            </button>
                        </div>
                    </div>

                    <StudentPicker
                        title="Select Student For Attendance"
                        description="Search using student name or roll number before entering attendance."
                        students={students}
                        selectedUid={attendanceStudentUid}
                        onStudentChange={handleAttendanceStudentChange}
                    />

                    {selectedAttendanceStudent && (
                        <div className="pc-assessment-context">
                            <strong>{selectedAttendanceStudent.name}</strong>
                            <span>{selectedAttendanceStudent.department || 'No department'} • {selectedAttendanceStudent.rollNumber || selectedAttendanceStudent.uid}</span>
                        </div>
                    )}

                    {showAttendanceEditor && (
                        <>
                            <div className="pc-panel-header">
                                <div>
                                    <h3>Attendance Entries</h3>
                                    <p>Separate list only for attendance records.</p>
                                </div>
                                <button className="pc-button pc-button-secondary" type="button" onClick={() => handleAddAttendanceEntry(selectedAttendanceStudent?.year ? Math.max(1, (selectedAttendanceStudent.year * 2) - 1) : 1)}>
                                    <Plus size={16} />
                                    Add Attendance
                                </button>
                            </div>

                            <div className="pc-assessment-card-list">
                                {attendanceEntries.length === 0 ? (
                                    <div className="pc-empty-inline">No attendance entries added yet.</div>
                                ) : attendanceEntries.map((entry) => (
                                    <article key={entry.id} className="pc-assessment-card">
                                        <div className="pc-assessment-card-head">
                                            <strong>{entry.name || 'New attendance record'}</strong>
                                            <button type="button" className="pc-icon-button" onClick={() => handleRemoveAttendanceEntry(entry.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="pc-assessment-grid two-columns">
                                            <label>
                                                <span>Attendance title</span>
                                                <input type="text" value={entry.name || ''} onChange={(event) => handleAttendanceFieldChange(entry.id, 'name', event.target.value)} placeholder="BYTS Training Attendance" />
                                            </label>
                                            <label>
                                                <span>Semester</span>
                                                <input type="number" min="1" max="8" value={entry.semester ?? 1} onChange={(event) => handleAttendanceFieldChange(entry.id, 'semester', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Conducted by</span>
                                                <select value={entry.conductorType || 'INTERNAL'} onChange={(event) => handleAttendanceFieldChange(entry.id, 'conductorType', event.target.value)}>
                                                    {CONDUCTOR_TYPES.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Faculty / Vendor</span>
                                                <input type="text" value={entry.conductorName || ''} onChange={(event) => handleAttendanceFieldChange(entry.id, 'conductorName', event.target.value)} placeholder="Internal Faculty / Talent Sprint" />
                                            </label>
                                            <label>
                                                <span>Attendance %</span>
                                                <input type="number" min="0" max="100" value={entry.attendancePercent ?? 0} onChange={(event) => handleAttendanceFieldChange(entry.id, 'attendancePercent', event.target.value)} />
                                            </label>
                                            <label className="pc-assessment-wide">
                                                <span>Remarks</span>
                                                <textarea value={entry.remarks || ''} onChange={(event) => handleAttendanceFieldChange(entry.id, 'remarks', event.target.value)} rows="3" placeholder="Optional attendance note" />
                                            </label>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {showAttendanceHistory && (
                        <HistoryList
                            entries={attendanceEntries}
                            emptyText="No attendance history available."
                            renderMeta={(entry) => (
                                <>
                                    <span>Semester {entry.semester} • {formatLabel(entry.conductorType)} • {entry.conductorName || 'No conductor'}</span>
                                    <span>Attendance: {Math.round(Number(entry.attendancePercent || 0))}%</span>
                                </>
                            )}
                        />
                    )}
                </section>

                <section className="pc-panel pc-assessment-section">
                    <div className="pc-panel-header">
                        <div>
                            <h2>Assessment Scores</h2>
                            <p>Store assessment marks separately from attendance and rounds.</p>
                        </div>
                        <div className="pc-inline-actions">
                            <button className="pc-button pc-button-secondary" type="button" onClick={() => setShowAssessmentHistory((current) => !current)}>
                                <Clock3 size={16} />
                                {showAssessmentHistory ? 'Hide History' : 'View History'}
                            </button>
                            <button className="pc-button" type="button" onClick={showAssessmentEditor ? saveAssessmentAndClose : () => setShowAssessmentEditor(true)} disabled={savingAssessmentScores || !selectedAssessmentStudent}>
                                <Save size={16} />
                                {showAssessmentEditor ? (savingAssessmentScores ? 'Saving...' : 'Update Scores') : 'Open Update'}
                            </button>
                        </div>
                    </div>

                    <StudentPicker
                        title="Select Student For Scores"
                        description="Search by name or roll number to enter mock interview and training scores."
                        students={students}
                        selectedUid={assessmentStudentUid}
                        onStudentChange={handleAssessmentStudentChange}
                    />

                    {selectedAssessmentStudent && (
                        <div className="pc-assessment-context">
                            <strong>{selectedAssessmentStudent.name}</strong>
                            <span>{selectedAssessmentStudent.department || 'No department'} • {selectedAssessmentStudent.rollNumber || selectedAssessmentStudent.uid}</span>
                        </div>
                    )}

                    {showAssessmentEditor && (
                        <>
                            <div className="pc-panel-header">
                                <div>
                                    <h3>Assessment Score Entries</h3>
                                    <p>Use this only for marks, not attendance or placement rounds.</p>
                                </div>
                                <button className="pc-button pc-button-secondary" type="button" onClick={() => handleAddAssessmentScore(selectedAssessmentStudent?.year ? Math.max(1, (selectedAssessmentStudent.year * 2) - 1) : 1)}>
                                    <Plus size={16} />
                                    Add Score
                                </button>
                            </div>

                            <div className="pc-assessment-card-list">
                                {assessmentScores.length === 0 ? (
                                    <div className="pc-empty-inline">No assessment score entries added yet.</div>
                                ) : assessmentScores.map((entry) => (
                                    <article key={entry.id} className="pc-assessment-card">
                                        <div className="pc-assessment-card-head">
                                            <strong>{entry.name || 'New score record'}</strong>
                                            <button type="button" className="pc-icon-button" onClick={() => handleRemoveAssessmentScore(entry.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="pc-assessment-grid">
                                            <label>
                                                <span>Assessment name</span>
                                                <input type="text" value={entry.name || ''} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'name', event.target.value)} placeholder="Mock Interview 1 / BYTS Assessment" />
                                            </label>
                                            <label>
                                                <span>Category</span>
                                                <select value={entry.category || 'TRAINING_ASSESSMENT'} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'category', event.target.value)}>
                                                    {ASSESSMENT_CATEGORIES.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Semester</span>
                                                <input type="number" min="1" max="8" value={entry.semester ?? 1} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'semester', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Conducted by</span>
                                                <select value={entry.conductorType || 'INTERNAL'} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'conductorType', event.target.value)}>
                                                    {CONDUCTOR_TYPES.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Faculty / Vendor</span>
                                                <input type="text" value={entry.conductorName || ''} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'conductorName', event.target.value)} placeholder="Internal Faculty / External Vendor" />
                                            </label>
                                            <label>
                                                <span>Score</span>
                                                <input type="number" min="0" value={entry.score ?? 0} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'score', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Max score</span>
                                                <input type="number" min="1" value={entry.maxScore ?? 100} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'maxScore', event.target.value)} />
                                            </label>
                                            <label className="pc-assessment-wide">
                                                <span>Remarks</span>
                                                <textarea value={entry.remarks || ''} onChange={(event) => handleAssessmentScoreFieldChange(entry.id, 'remarks', event.target.value)} rows="3" placeholder="Optional score note" />
                                            </label>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {showAssessmentHistory && (
                        <HistoryList
                            entries={assessmentScores}
                            emptyText="No score history available."
                            renderMeta={(entry) => (
                                <>
                                    <span>{formatLabel(entry.category)} • Semester {entry.semester}</span>
                                    <span>{entry.conductorName || 'No conductor'} • {Math.round(Number(entry.score || 0))}/{Math.round(Number(entry.maxScore || 0))}</span>
                                </>
                            )}
                        />
                    )}
                </section>

                <section className="pc-panel pc-assessment-section">
                    <div className="pc-panel-header">
                        <div>
                            <h2>Placement Rounds</h2>
                            <p>Keep internal placement round tracking in its own section.</p>
                        </div>
                        <div className="pc-inline-actions">
                            <button className="pc-button pc-button-secondary" type="button" onClick={() => setShowRoundHistory((current) => !current)}>
                                <Clock3 size={16} />
                                {showRoundHistory ? 'Hide History' : 'View History'}
                            </button>
                            <button className="pc-button" type="button" onClick={showRoundEditor ? saveRoundsAndClose : () => setShowRoundEditor(true)} disabled={savingRounds || !selectedRoundStudent}>
                                <Save size={16} />
                                {showRoundEditor ? (savingRounds ? 'Saving...' : 'Update Rounds') : 'Open Update'}
                            </button>
                        </div>
                    </div>

                    <StudentPicker
                        title="Select Student For Rounds"
                        description="Search by student name or roll number before entering round marks."
                        students={students}
                        selectedUid={roundStudentUid}
                        onStudentChange={handleRoundStudentChange}
                    />

                    {selectedRoundStudent && (
                        <div className="pc-assessment-context">
                            <strong>{selectedRoundStudent.name}</strong>
                            <span>{selectedRoundStudent.department || 'No department'} • {selectedRoundStudent.rollNumber || selectedRoundStudent.uid}</span>
                        </div>
                    )}

                    {showRoundEditor && (
                        <>
                            <div className="pc-panel-header">
                                <div>
                                    <h3>Placement Round Entries</h3>
                                    <p>Round names are editable from Round 1 through final HR.</p>
                                </div>
                                <button className="pc-button pc-button-secondary" type="button" onClick={() => handleAddPlacementRound(selectedRoundStudent?.year ? Math.max(1, (selectedRoundStudent.year * 2) - 1) : 1)}>
                                    <Plus size={16} />
                                    Add Round
                                </button>
                            </div>

                            <div className="pc-assessment-card-list">
                                {assessmentRounds.length === 0 ? (
                                    <div className="pc-empty-inline">No placement round entries added yet.</div>
                                ) : assessmentRounds.map((entry) => (
                                    <article key={entry.id} className="pc-assessment-card">
                                        <div className="pc-assessment-card-head">
                                            <strong>{entry.name || 'New round record'}</strong>
                                            <button type="button" className="pc-icon-button" onClick={() => handleRemovePlacementRound(entry.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="pc-assessment-grid">
                                            <label>
                                                <span>Round name</span>
                                                <input type="text" value={entry.name || ''} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'name', event.target.value)} placeholder="Round 1 / Technical / HR" />
                                            </label>
                                            <label>
                                                <span>Semester</span>
                                                <input type="number" min="1" max="8" value={entry.semester ?? 1} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'semester', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Conducted by</span>
                                                <select value={entry.conductedBy || 'PLACEMENT_TEAM'} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'conductedBy', event.target.value)}>
                                                    {ROUND_OWNERS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Score</span>
                                                <input type="number" min="0" value={entry.score ?? 0} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'score', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Max score</span>
                                                <input type="number" min="1" value={entry.maxScore ?? 100} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'maxScore', event.target.value)} />
                                            </label>
                                            <label className="pc-assessment-wide">
                                                <span>Remarks</span>
                                                <textarea value={entry.remarks || ''} onChange={(event) => handleAssessmentRoundFieldChange(entry.id, 'remarks', event.target.value)} rows="3" placeholder="Optional round note" />
                                            </label>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {showRoundHistory && (
                        <HistoryList
                            entries={assessmentRounds}
                            emptyText="No round history available."
                            renderMeta={(entry) => (
                                <>
                                    <span>Semester {entry.semester} • {formatLabel(entry.conductedBy)}</span>
                                    <span>Score: {Math.round(Number(entry.score || 0))}/{Math.round(Number(entry.maxScore || 0))}</span>
                                </>
                            )}
                        />
                    )}
                </section>
            </div>

            <div className="pc-assessment-footer-note">
                <span>Average attendance: {Math.round(assessmentSummary.averageAttendancePercent)}%</span>
                <span>Average assessment score: {Math.round(assessmentSummary.averageAssessmentScore)}%</span>
                <span>Average round score: {Math.round(assessmentSummary.averagePlacementRoundScore)}%</span>
            </div>

            {selectedRoundStudent && (
                <div className="pc-assessment-footer-note">
                    <span>Current placement status: {formatLabel(selectedRoundStudent.placementStatus)}</span>
                    <span>Readiness: {Math.round(Number(selectedRoundStudent.readinessScore || 0))}%</span>
                </div>
            )}
        </div>
    );
};

export default PlacementAssessmentsPage;
