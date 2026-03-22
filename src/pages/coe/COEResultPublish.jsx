import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    BookOpen,
    Calculator,
    CheckCircle,
    Download,
    FileSpreadsheet,
    GraduationCap,
    RefreshCw,
    Upload,
    Users
} from 'lucide-react';
import api from '../../utils/api';
import './COEResultPublish.css';

const departments = ['CSE', 'ECE', 'EEE', 'MECH'];
const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

const getGrade = (score, semesterMarks) => {
    if (semesterMarks === null || semesterMarks === undefined || semesterMarks === '') return 'AB';
    if (score >= 91) return 'O';
    if (score >= 81) return 'A+';
    if (score >= 71) return 'A';
    if (score >= 61) return 'B+';
    if (score >= 50) return 'B';
    return 'RA';
};

const getResultStatus = (grade) => {
    if (grade === 'AB') return 'ABSENT';
    if (grade === 'RA') return 'RA';
    return 'PASS';
};

const getGradePoints = (grade) => {
    switch (grade) {
        case 'O': return 10;
        case 'A+': return 9;
        case 'A': return 8;
        case 'B+': return 7;
        case 'B': return 6;
        default: return 0;
    }
};

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
const convertSemesterMarksToSixty = (semesterMarks) => {
    if (semesterMarks === null || semesterMarks === undefined || semesterMarks === '') return 0;
    return round2((Number(semesterMarks) / 100) * 60);
};

const recalculateStudent = (student) => {
    const subjects = (student.subjects || []).map((subject) => {
        const internalMarks = round2(subject.internalMarks);
        const semesterMarks = subject.semesterMarks === null || subject.semesterMarks === undefined || subject.semesterMarks === ''
            ? null
            : round2(subject.semesterMarks);
        const convertedSemesterMarks = convertSemesterMarksToSixty(semesterMarks);
        const totalMarks = round2(internalMarks + convertedSemesterMarks);
        const finalPercentage = totalMarks;
        const grade = getGrade(totalMarks, semesterMarks);
        const resultStatus = getResultStatus(grade);
        return {
            ...subject,
            internalMarks,
            semesterMarks,
            convertedSemesterMarks,
            totalMarks,
            finalPercentage,
            grade,
            resultStatus
        };
    });

    const totalCredits = subjects.reduce((sum, subject) => sum + (Number(subject.credits) || 0), 0);
    const weightedPoints = subjects.reduce((sum, subject) => {
        const credits = Number(subject.credits) || 0;
        return sum + (getGradePoints(subject.grade) * credits);
    }, 0);

    return {
        ...student,
        subjects,
        sgpa: totalCredits > 0 ? round2(weightedPoints / totalCredits) : 0
    };
};

const getLogTone = (log) => {
    const value = String(log || '').toLowerCase();
    if (value.includes('updated results') || value.includes('published results') || value.includes('published results with sgpa')) {
        return 'success';
    }
    if (value.includes('skipped')) {
        return 'warning';
    }
    return 'error';
};

const COEResultPublish = () => {
    const [mode, setMode] = useState('manual');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [publishingManual, setPublishingManual] = useState(false);
    const [logs, setLogs] = useState([]);
    const [sheetLoading, setSheetLoading] = useState(false);
    const [entrySheet, setEntrySheet] = useState([]);
    const [manualApiReady, setManualApiReady] = useState(true);

    const [dept, setDept] = useState('CSE');
    const [sem, setSem] = useState('8');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setLogs([]);
    };

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/results/template', {
                params: { dept, sem },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `result_template_${dept}_Sem${sem}.csv`;
            a.click();
        } catch (err) {
            let errorMsg = 'Unknown error';
            if (err.response?.data instanceof Blob) {
                try {
                    errorMsg = await err.response.data.text();
                    const json = JSON.parse(errorMsg);
                    if (json.message) errorMsg = json.message;
                } catch (e) {
                    // Use raw text when response is not JSON.
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            alert('Failed to download template: ' + errorMsg);
        }
    };

    const fetchEntrySheet = async () => {
        setSheetLoading(true);
        try {
            const res = await api.get('/results/entry-sheet', {
                params: { dept, sem: Number(sem) }
            });
            setManualApiReady(true);
            setEntrySheet((res.data || []).map(recalculateStudent));
        } catch (err) {
            setEntrySheet([]);
            if (err.response?.status === 404) {
                setManualApiReady(false);
                setLogs(['Manual result entry needs the updated backend. Restart the backend server to load /api/results/entry-sheet and /api/results/publish-manual.']);
            } else {
                setManualApiReady(true);
                setLogs([`Manual sheet load failed: ${err.response?.data?.message || err.message}`]);
            }
        } finally {
            setSheetLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'manual') {
            fetchEntrySheet();
        }
    }, [dept, sem, mode]);

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a CSV file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/results/publish-bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogs(res.data || []);
            if (mode === 'manual') {
                fetchEntrySheet();
            }
        } catch (err) {
            setLogs([`Critical Error: ${err.response?.data?.message || err.message}`]);
        } finally {
            setUploading(false);
        }
    };

    const updateSemesterMark = (studentIndex, subjectIndex, value) => {
        setEntrySheet((prev) => prev.map((student, sIdx) => {
            if (sIdx !== studentIndex) return student;
            const updatedStudent = {
                ...student,
                subjects: student.subjects.map((subject, subIdx) => (
                    subIdx === subjectIndex
                        ? { ...subject, semesterMarks: value === '' ? null : Number(value) }
                        : subject
                ))
            };
            return recalculateStudent(updatedStudent);
        }));
    };

    const publishManual = async () => {
        if (entrySheet.length === 0) {
            alert('No mapped students or subjects found for the selected department and semester.');
            return;
        }

        setPublishingManual(true);
        try {
            const payload = {
                dept,
                sem: Number(sem),
                students: entrySheet.map((student) => ({
                    studentUid: student.studentUid,
                    subjects: student.subjects.map((subject) => ({
                        subjectCode: subject.subjectCode,
                        internalMarks: round2(subject.internalMarks),
                        semesterMarks: subject.semesterMarks === null ? null : round2(subject.semesterMarks)
                    }))
                }))
            };

            const res = await api.post('/results/publish-manual', payload);
            setManualApiReady(true);
            setLogs(res.data || []);
            fetchEntrySheet();
        } catch (err) {
            if (err.response?.status === 404) {
                setManualApiReady(false);
                setLogs(['Manual publish endpoint is not available on the running backend yet. Restart the backend server and try again.']);
            } else {
                setManualApiReady(true);
                setLogs([`Manual publish failed: ${err.response?.data?.message || err.message}`]);
            }
        } finally {
            setPublishingManual(false);
        }
    };

    const overallSummary = useMemo(() => {
        const studentCount = entrySheet.length;
        const subjectCount = entrySheet.reduce((sum, student) => sum + (student.subjects?.length || 0), 0);
        const avgSgpa = studentCount > 0
            ? round2(entrySheet.reduce((sum, student) => sum + (Number(student.sgpa) || 0), 0) / studentCount)
            : 0;
        return { studentCount, subjectCount, avgSgpa };
    }, [entrySheet]);

    return (
        <div className="coe-result-page">
            <section className="coe-result-hero">
                <div className="coe-result-hero-copy">
                    <span className="coe-result-kicker">Controller of Examinations</span>
                    <h1>Publish Semester Results</h1>
                    <p>
                        Review eligible students, verify internal and semester marks, and publish polished semester results from one controlled workspace.
                    </p>
                </div>
                <div className="coe-result-hero-panel">
                    <div className="coe-hero-chip">
                        <GraduationCap size={18} />
                        Semester Exam Result Console
                    </div>
                    <div className="coe-hero-meta">
                        <span>Department: {dept}</span>
                        <span>Semester: {sem}</span>
                    </div>
                </div>
            </section>

            <section className="coe-result-shell">
                <div className="coe-mode-toggle" role="tablist" aria-label="Result publish mode">
                    <button
                        className={`coe-mode-btn ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                        type="button"
                    >
                        <Calculator size={16} />
                        Manual Entry
                    </button>
                    <button
                        className={`coe-mode-btn ${mode === 'csv' ? 'active' : ''}`}
                        onClick={() => setMode('csv')}
                        type="button"
                    >
                        <FileSpreadsheet size={16} />
                        CSV Upload
                    </button>
                </div>

                <div className="coe-filter-row">
                    <label className="coe-filter-card">
                        <span className="coe-filter-label">Department</span>
                        <select value={dept} onChange={(e) => setDept(e.target.value)} className="coe-filter-input">
                            {departments.map((department) => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </select>
                    </label>

                    <label className="coe-filter-card">
                        <span className="coe-filter-label">Semester</span>
                        <select value={sem} onChange={(e) => setSem(e.target.value)} className="coe-filter-input">
                            {semesters.map((semester) => (
                                <option key={semester} value={semester}>{semester}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="coe-summary-grid">
                    <div className="coe-summary-banner">
                        <span className="coe-section-label">{mode === 'manual' ? 'Manual Result Entry' : 'CSV Result Upload'}</span>
                        <h2>{mode === 'manual' ? 'Validate marks before publication' : 'Upload result sheets with confidence'}</h2>
                        <p>
                            {mode === 'manual'
                                ? 'Internal marks are preloaded. Enter semester marks, check totals and SGPA, and publish only after the sheet looks right.'
                                : 'Download a prefilled sheet, update semester marks in bulk, then upload the CSV for automated total, grade, and SGPA generation.'}
                        </p>
                    </div>

                    <div className="coe-stat-grid">
                        <div className="coe-stat-card">
                            <span className="coe-stat-label"><Users size={15} /> Students</span>
                            <strong>{overallSummary.studentCount}</strong>
                        </div>
                        <div className="coe-stat-card">
                            <span className="coe-stat-label"><BookOpen size={15} /> Subjects</span>
                            <strong>{overallSummary.subjectCount}</strong>
                        </div>
                        <div className="coe-stat-card">
                            <span className="coe-stat-label"><GraduationCap size={15} /> Average SGPA</span>
                            <strong>{overallSummary.avgSgpa}</strong>
                        </div>
                    </div>
                </div>

                {mode === 'csv' && (
                    <div className="coe-panel">
                        <div className="coe-panel-header">
                            <div>
                                <span className="coe-section-label">CSV Workflow</span>
                                <h3>Download, update, and publish in bulk</h3>
                            </div>
                            <button onClick={downloadTemplate} className="coe-btn coe-btn-secondary" type="button">
                                <Download size={16} />
                                Download Template
                            </button>
                        </div>

                        <div className="coe-callout">
                            <strong>Template format</strong>
                            <p>Each scheduled subject includes an `_Internal` and `_Semester` column. Semester marks are entered out of 100 and converted to 60 during calculation. Use `AB` in semester columns for absent students.</p>
                        </div>

                        <div className="coe-upload-box">
                            <input type="file" accept=".csv" onChange={handleFileChange} id="fileInput" />
                            <label htmlFor="fileInput" className="coe-upload-label">
                                <Upload size={26} />
                                <span>{file ? file.name : 'Choose the semester result CSV file'}</span>
                                <small>Only scheduled semester-exam subjects will be processed.</small>
                            </label>
                        </div>

                        <button
                            className="coe-btn coe-btn-primary coe-btn-wide"
                            onClick={handleUpload}
                            disabled={uploading || !file}
                            type="button"
                        >
                            <Upload size={16} />
                            {uploading ? 'Publishing...' : 'Publish Results From CSV'}
                        </button>
                    </div>
                )}

                {mode === 'manual' && (
                    <div className="coe-panel">
                        <div className="coe-panel-header">
                            <div>
                                <span className="coe-section-label">Manual Workflow</span>
                                <h3>Review student cards and publish with control</h3>
                            </div>
                            <div className="coe-header-actions">
                                <button className="coe-btn coe-btn-secondary" onClick={fetchEntrySheet} type="button">
                                    <RefreshCw size={16} />
                                    Refresh Sheet
                                </button>
                                <button
                                    className="coe-btn coe-btn-primary"
                                    onClick={publishManual}
                                    type="button"
                                    disabled={publishingManual || sheetLoading || entrySheet.length === 0}
                                >
                                    <CheckCircle size={16} />
                                    {publishingManual ? 'Publishing...' : 'Publish Manual Results'}
                                </button>
                            </div>
                        </div>

                        {!manualApiReady ? (
                            <div className="coe-message coe-message-warning">
                                <AlertTriangle size={16} />
                                Manual entry is ready in the codebase, but the running backend has not loaded the required routes yet. Restart the backend and refresh this page.
                            </div>
                        ) : sheetLoading ? (
                            <div className="coe-message coe-message-info">Loading mapped students and internal marks...</div>
                        ) : entrySheet.length === 0 ? (
                            <div className="coe-message coe-message-info">
                                No students or scheduled semester-exam subjects were found for {dept} semester {sem}.
                            </div>
                        ) : (
                            <div className="coe-student-stack">
                                {entrySheet.map((student, studentIndex) => (
                                    <article key={student.studentUid} className="coe-student-card">
                                        <div className="coe-student-top">
                                            <div className="coe-student-identity">
                                                <div className="coe-student-avatar">
                                                    {(student.studentName || 'S').trim().charAt(0)}
                                                </div>
                                                <div>
                                                    <h3>{student.studentName}</h3>
                                                    <p>{student.registerNumber} • {student.studentEmail}</p>
                                                </div>
                                            </div>

                                            <div className="coe-student-meta">
                                                <span><strong>Dept</strong> {student.department || '—'}</span>
                                                <span><strong>Sem</strong> {student.semester || '—'}</span>
                                                <span><strong>SGPA</strong> {student.sgpa}</span>
                                            </div>
                                        </div>

                                        {student.subjects.length === 0 ? (
                                            <div className="coe-message coe-message-inline">
                                                This student is available, but no semester subjects or internal-mark mappings were found yet.
                                            </div>
                                        ) : (
                                            <div className="coe-table-wrap">
                                                <table className="coe-results-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th>Code</th>
                                                            <th>Credits</th>
                                                            <th>Internal</th>
                                                            <th>Semester /100</th>
                                                            <th>Semester /60</th>
                                                            <th>Total</th>
                                                            <th>Grade</th>
                                                            <th>Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {student.subjects.map((subject, subjectIndex) => (
                                                            <tr key={`${student.studentUid}-${subject.subjectCode}`}>
                                                                <td>
                                                                    <div className="coe-subject-name">{subject.subjectName}</div>
                                                                </td>
                                                                <td className="coe-code">{subject.subjectCode}</td>
                                                                <td>{subject.credits}</td>
                                                                <td>{subject.internalMarks}</td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={subject.semesterMarks ?? ''}
                                                                        onChange={(e) => updateSemesterMark(studentIndex, subjectIndex, e.target.value)}
                                                                        className="coe-score-input"
                                                                    />
                                                                </td>
                                                                <td>{subject.convertedSemesterMarks}</td>
                                                                <td>{subject.totalMarks}</td>
                                                                <td>
                                                                    <span className={`coe-grade-pill grade-${String(subject.grade).toLowerCase().replace('+', 'plus')}`}>
                                                                        {subject.grade}
                                                                    </span>
                                                                </td>
                                                                <td>{subject.resultStatus}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {logs.length > 0 && (
                <section className="coe-log-panel">
                    <div className="coe-log-header">
                        <span className="coe-section-label">Publish Logs</span>
                        <h3>Recent processing feedback</h3>
                    </div>
                    <div className="coe-log-list">
                        {logs.map((log, i) => {
                            const tone = getLogTone(log);
                            return (
                                <div key={i} className={`coe-log-item ${tone}`}>
                                    {tone === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                    <span>{log}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default COEResultPublish;
