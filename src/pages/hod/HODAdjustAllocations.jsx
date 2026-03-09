import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    BookOpen,
    Microscope,
    Briefcase,
    Minus,
    Plus,
    Save
} from 'lucide-react';
import './HODAdjustAllocations.css';

const HODAdjustAllocations = () => {
    const navigate = useNavigate();

    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    return (
        <div className="adjust-allocations-container">
            {/* Header / Back Link */}
            <div className="allocations-back-link" onClick={() => navigate('/department-analytics/faculty-workload')}>
                <ArrowLeft size={16} />
                <span>Back to Faculty Workload</span>
            </div>
            
            <header className="allocations-header">
                <div className="header-titles">
                    <h1>Adjust Allocations</h1>
                    <p>Modify teaching, research, and administrative hours for faculty members.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        Cancel
                    </button>
                    <button className="btn-primary">
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </header>

            <div className="allocations-layout">
                {/* Left Sidebar - Faculty List */}
                <div className="allocations-sidebar">
                    <div className="sidebar-search">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search faculty..." />
                    </div>
                    
                    <div className="faculty-list">
                        {facultyList.length === 0 ? (
                            <div className="empty-state-message" style={{ padding: '32px 16px', fontSize: '13px' }}>
                                No faculty members found
                            </div>
                        ) : (
                            facultyList.map(faculty => (
                                <div className={`faculty-list-item ${faculty.active ? 'active' : ''}`} key={faculty.id}>
                                    <div className="faculty-item-info">
                                        <div className="faculty-item-avatar">
                                            {faculty.name.charAt(0)}
                                        </div>
                                        <div className="faculty-item-text">
                                            <span className="faculty-item-name">{faculty.name}</span>
                                            <span className="faculty-item-hrs">{faculty.hrs} hrs total</span>
                                        </div>
                                    </div>
                                    <span className={`status-pill ${faculty.status.toLowerCase()}`}>
                                        {faculty.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Main Panel */}
                <div className="allocations-main-panel">
                    {/* Main Content Area */}
                    {!selectedFaculty ? (
                        <div className="panel-profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                            <p className="empty-state-message text-center">Select a faculty member from the list to view and edit their workload allocations.</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Info Profile Card */}
                            <div className="panel-profile-card">
                                <div className="profile-top-row">
                                    <div className="profile-info-block">
                                        <div className="profile-avatar large">
                                            {selectedFaculty.name.substring(0, 2)}
                                        </div>
                                        <div className="profile-details">
                                            <h2>{selectedFaculty.name}</h2>
                                            <p className="profile-role">{selectedFaculty.role || "Faculty Member"}</p>
                                            <p className="profile-email">{selectedFaculty.email || "faculty@unimanage.edu"}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="profile-limit-block">
                                        <div className="limit-hrs">
                                            <span className="current-hrs text-orange">{selectedFaculty.hrs}</span>
                                            <span className="max-hrs">/ 40 hrs limit</span>
                                        </div>
                                        <div className="limit-progress-bar">
                                            <div className="progress-fill bg-orange" style={{ width: '100%' }}></div>
                                            <div className="progress-overflow bg-error" style={{ width: '5%' }}></div>
                                        </div>
                                        <div className="limit-warning text-orange">
                                            +2 hrs Overallocated
                                        </div>
                                    </div>
                                </div>

                                {/* Distribution Stack Bar */}
                                <div className="distribution-stack-section">
                                    <div className="stack-labels">
                                        <span>Current Distribution</span>
                                        <span>Total: {selectedFaculty.hrs} hrs</span>
                                    </div>
                                    <div className="stack-bar">
                                        <div className="stack-segment bg-blue" style={{ width: '42.8%' }}>18h Teach</div>
                                        <div className="stack-segment bg-purple" style={{ width: '23.8%' }}>10h Rsch</div>
                                        <div className="stack-segment bg-orange" style={{ width: '33.3%' }}>14h Admin</div>
                                    </div>
                                </div>
                            </div>

                            {/* Accordion List */}
                            <div className="allocation-sections">
                                
                                {/* Teaching Load */}
                                <div className="alloc-section-card border-blue">
                                    <div className="alloc-section-header bg-soft-blue">
                                        <div className="section-title text-blue">
                                            <BookOpen size={18} />
                                            <h3>Teaching Load</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn"><Minus size={14} /></button>
                                            <span className="stepper-val">0</span>
                                            <button className="stepper-btn"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="alloc-section-body">
                                        <div className="empty-state-message text-center p-4">No teaching load details mapped.</div>
                                        <div className="alloc-section-footer">
                                            <button className="add-new-btn text-blue">
                                                <Plus size={14} /> Assign New Course
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Research Activities */}
                                <div className="alloc-section-card border-purple">
                                    <div className="alloc-section-header bg-soft-purple">
                                        <div className="section-title text-purple">
                                            <Microscope size={18} />
                                            <h3>Research Activities</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn"><Minus size={14} /></button>
                                            <span className="stepper-val">0</span>
                                            <button className="stepper-btn"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="alloc-section-body">
                                        <div className="empty-state-message text-center p-4">No research activities mapped.</div>
                                    </div>
                                </div>

                                {/* Administrative Duties */}
                                <div className="alloc-section-card border-orange">
                                    <div className="alloc-section-header bg-soft-orange">
                                        <div className="section-title text-orange">
                                            <Briefcase size={18} />
                                            <h3>Administrative Duties</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn"><Minus size={14} /></button>
                                            <span className="stepper-val text-orange">0</span>
                                            <button className="stepper-btn"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="alloc-section-body">
                                        <div className="empty-state-message text-center p-4">No administrative duties mapped.</div>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HODAdjustAllocations;
