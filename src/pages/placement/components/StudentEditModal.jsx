import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const StudentEditModal = ({
    placementStatusOptions,
    resumeReviewOptions,
    savingStudent,
    selectedStudent,
    studentForm,
    onClose,
    onFieldChange,
    onSave
}) => {
    if (!selectedStudent) return null;

    return (
        <div className="pc-modal-backdrop" onClick={onClose}>
            <div className="pc-modal" onClick={(event) => event.stopPropagation()}>
                <div className="pc-panel-header">
                    <div>
                        <h2>{selectedStudent.name}</h2>
                        <p>{selectedStudent.department} | Year {selectedStudent.year} | {selectedStudent.uid}</p>
                    </div>
                    <button className="pc-icon-button" onClick={onClose}>x</button>
                </div>

                <div className="pc-form-grid">
                    <input name="aptitudeScore" type="number" min="0" max="100" value={studentForm.aptitudeScore} onChange={onFieldChange} placeholder="Aptitude score" />
                    <input name="mockInterviewScore" type="number" min="0" max="100" value={studentForm.mockInterviewScore} onChange={onFieldChange} placeholder="Mock interview score" />
                    <input name="skillsCompleted" type="number" min="0" value={studentForm.skillsCompleted} onChange={onFieldChange} placeholder="Skills completed" />
                    <input name="totalSkills" type="number" min="1" value={studentForm.totalSkills} onChange={onFieldChange} placeholder="Total skills" />
                    <select name="placementStatus" value={studentForm.placementStatus} onChange={onFieldChange}>
                        {placementStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <select name="resumeReviewStatus" value={studentForm.resumeReviewStatus} onChange={onFieldChange}>
                        {resumeReviewOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <input name="preferredRole" value={studentForm.preferredRole} onChange={onFieldChange} placeholder="Preferred role" />
                    <input name="preferredCompanies" value={studentForm.preferredCompanies} onChange={onFieldChange} placeholder="Preferred companies" />
                </div>

                <textarea
                    name="completedSkillsList"
                    rows="3"
                    value={studentForm.completedSkillsList}
                    onChange={onFieldChange}
                    placeholder="Completed skills list (comma separated)"
                />
                <textarea
                    name="resumeRemarks"
                    rows="3"
                    value={studentForm.resumeRemarks}
                    onChange={onFieldChange}
                    placeholder="Resume feedback or coordinator remarks"
                />

                <div className="pc-modal-footer">
                    {selectedStudent.resumeUrl ? (
                        <a className="pc-button pc-button-secondary" href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer">
                            View Resume
                        </a>
                    ) : (
                        <span className="pc-muted">Resume link not uploaded yet.</span>
                    )}
                    <button className="pc-button" onClick={onSave} disabled={savingStudent}>
                        {savingStudent ? <Loader2 size={16} className="pc-spin" /> : <CheckCircle2 size={16} />}
                        Save Updates
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentEditModal;
