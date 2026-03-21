import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Upload, Download, CalendarDays, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './COEExamSchedule.css';

const COEExamSchedule = () => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        // We still pass this as 'hodUid' because the backend probably expects it, 
        // but we should check if backend enforces role check on this parameter.
        // For now, we pass the current user (COE) ID.
        formData.append('hodUid', currentUser.uid);

        setUploading(true);
        try {
            await api.post('/schedules/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Exam schedule uploaded successfully!');
            setFile(null);
        } catch (err) {
            console.error("Upload Error:", err);
            let errorMsg = err.response?.data?.message || err.response?.data || err.message;
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg);
            }
            setMessage('Upload failed: ' + errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "Title,Type,Date,Session(FN/AN),StartTime,EndTime,Subject Name,Description";
        const sample = "End Semester Exam,SEMESTER_EXAM,2026-05-15,FN,10:00,13:00,Advanced Architecture,Main Hall";
        const content = headers + "\n" + sample;

        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "exam_schedule_template.csv";
        a.click();
    };

    return (
        <div className="coe-exam-page">
            <section className="coe-exam-hero">
                <div className="coe-exam-copy">
                    <span className="coe-exam-kicker">Controller of Examinations</span>
                    <h1>Exam Schedule Management</h1>
                    <p>Prepare the official semester exam plan, work from a clean CSV template, and publish schedules from one focused workspace.</p>
                </div>

                <div className="coe-exam-hero-panel">
                    <div className="coe-exam-chip">
                        <CalendarDays size={18} />
                        Semester Examination Schedule Desk
                    </div>
                    <div className="coe-exam-highlights">
                        <span><ShieldCheck size={16} /> Upload only approved exam schedules</span>
                        <span><FileSpreadsheet size={16} /> Standard CSV template for faster preparation</span>
                    </div>
                </div>
            </section>

            <section className="coe-exam-shell">
                <div className="coe-exam-grid">
                    <div className="coe-exam-block">
                        <span className="coe-exam-section-label">Template Workflow</span>
                        <h3>Download the standard schedule format</h3>
                        <p>Use the official CSV structure so subject names, sessions, timings, and venues stay consistent during upload.</p>

                        <button onClick={downloadTemplate} className="coe-exam-template-btn" type="button">
                            <Download size={18} />
                            Download Exam Template
                        </button>

                        <div className="coe-exam-callout">
                            <strong>Allowed exam types</strong>
                            <p>`INTERNAL_EXAM` and `SEMESTER_EXAM` are supported. Dates and session timings should be reviewed before publishing to avoid clashes.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpload} className="coe-exam-block coe-exam-upload-card">
                        <span className="coe-exam-section-label">Upload Workflow</span>
                        <h3>Upload and publish the exam schedule</h3>
                        <p>Select the completed CSV file and publish the examination schedule for institution-wide use.</p>

                        <div className="coe-exam-upload-box">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                id="exam-file-upload"
                            />
                            <label htmlFor="exam-file-upload" className="coe-exam-upload-label">
                                <div className="coe-exam-upload-icon">
                                    <Upload size={34} />
                                </div>
                                <span>{file ? file.name : 'Choose the exam schedule CSV file'}</span>
                                <small>Only CSV files are accepted. Use the downloaded template to avoid invalid column names.</small>
                            </label>
                        </div>

                        {message && (
                            <div className={`coe-exam-message ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="coe-exam-submit-btn"
                        >
                            {uploading ? <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="white" /> : <Upload size={20} />}
                            Publish Exam Schedule
                        </button>
                    </form>
                </div>

                <div className="coe-exam-side-panel" style={{ marginTop: '18px' }}>
                    <div className="coe-exam-stat">
                        <span className="coe-exam-stat-label"><CalendarDays size={16} /> Upload ready</span>
                        <strong>{file ? '1' : '0'}</strong>
                        <p>{file ? 'A schedule file is selected and ready to publish.' : 'No file selected yet. Download the template or choose a CSV to continue.'}</p>
                    </div>

                    <div className="coe-exam-block">
                        <span className="coe-exam-section-label">Quick Checks</span>
                        <h3>Before you publish</h3>
                        <div className="coe-exam-mini-list">
                            <div className="coe-exam-mini-item">
                                <strong>Subject names</strong>
                                <p>Keep subject names aligned with the scheduled semester examination records.</p>
                            </div>
                            <div className="coe-exam-mini-item">
                                <strong>Session and timings</strong>
                                <p>Verify `FN` or `AN`, plus start and end time, before uploading.</p>
                            </div>
                            <div className="coe-exam-mini-item">
                                <strong>Venue details</strong>
                                <p>Fill descriptions clearly so halls and rooms are easy to identify in downstream workflows.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default COEExamSchedule;
