import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Users, Upload, Calendar, MapPin, FileText, CheckCircle,
    AlertCircle, Download, Wand2, Grid3X3, TableProperties,
    Building2, Plus, Trash2, Clock, Edit3, Save, X, ChevronDown,
    BookOpen, Hash, ToggleLeft, ToggleRight, Info, ArrowRight,
    Pencil, RefreshCw, AlertTriangle
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './COESeatingAllocation.css';

/* ─── Toast ──────────────────────────────────────────────────────────── */
const useToast = () => {
    const [toasts, setToasts] = useState([]);
    const add = (msg, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800);
    };
    return { toasts, success: m => add(m, 'success'), error: m => add(m, 'error'), info: m => add(m, 'info') };
};

const Toasts = ({ toasts }) => (
    <div className="sa-toasts">
        {toasts.map(t => (
            <div key={t.id} className={`sa-toast sa-toast-${t.type}`}>
                {t.type === 'success' ? <CheckCircle size={15} /> : t.type === 'error' ? <AlertCircle size={15} /> : <Info size={15} />}
                {t.msg}
            </div>
        ))}
    </div>
);

/* ─── Confirm Dialog ─────────────────────────────────────────────────── */
const ConfirmDialog = ({ message, onConfirm, onCancel, danger = false }) => (
    <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="sa-modal sa-modal-sm">
            <div className="sa-modal-header">
                {danger ? <AlertTriangle size={18} color="#ef4444" /> : <Info size={18} />}
                <span>Confirm Action</span>
                <button className="sa-icon-btn" onClick={onCancel}><X size={16} /></button>
            </div>
            <div className="sa-modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{message}</p>
            </div>
            <div className="sa-modal-footer">
                <button className="sa-btn-ghost" onClick={onCancel}>Cancel</button>
                <button
                    className={danger ? 'sa-btn-danger' : 'sa-btn-primary'}
                    onClick={onConfirm}
                >{danger ? <><Trash2 size={14} /> Delete</> : <><CheckCircle size={14} /> Confirm</>}</button>
            </div>
        </div>
    </div>
);

/* ─── Edit Seating Modal ─────────────────────────────────────────────── */
const EditSeatingModal = ({ allocation, venues, onClose, onSave }) => {
    const [seatNumber, setSeatNumber] = useState(allocation.seatNumber || '');
    const [venueId, setVenueId] = useState(allocation.venue?.id || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!seatNumber.trim()) { alert('Seat number is required.'); return; }
        setSaving(true);
        try {
            await onSave(allocation.id, seatNumber, venueId || null);
            onClose();
        } finally { setSaving(false); }
    };

    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal">
                <div className="sa-modal-header">
                    <Pencil size={16} />
                    <span>Edit Seat Allocation</span>
                    <button className="sa-icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="sa-modal-body">
                    {/* Student info (read-only) */}
                    <div className="sa-edit-student-info">
                        <div className="sa-edit-avatar">{allocation.student?.fullName?.charAt(0) || '?'}</div>
                        <div>
                            <div className="sa-edit-name">{allocation.student?.fullName}</div>
                            <div className="sa-edit-roll">{allocation.student?.rollNumber || '—'} · {allocation.student?.department || '—'}</div>
                        </div>
                    </div>

                    <div className="sa-field">
                        <label><Hash size={13} /> Seat Number *</label>
                        <input
                            className="sa-input"
                            value={seatNumber}
                            onChange={e => setSeatNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. A1, B3, C10"
                            autoFocus
                        />
                    </div>
                    <div className="sa-field">
                        <label><MapPin size={13} /> Venue</label>
                        <select className="sa-input" value={venueId} onChange={e => setVenueId(e.target.value)}>
                            <option value="">—  Keep current venue —</option>
                            {venues.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.name} ({v.capacity} seats)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="sa-modal-footer">
                    <button className="sa-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Venue Card ─────────────────────────────────────────────────────── */
const VenueCard = ({ venue, onEdit, onDelete, onToggle }) => {
    const isAvail = venue.available ?? venue.isAvailable;
    return (
    <div className={`sa-venue-card ${!isAvail ? 'sa-venue-unavailable' : ''}`}>
        <div className="sa-venue-top">
            <div className="sa-venue-icon"><Building2 size={18} /></div>
            <div className="sa-venue-meta">
                <div className="sa-venue-name">{venue.name}</div>
                <div className="sa-venue-block">{venue.block || '—'}</div>
            </div>
            <div className="sa-venue-actions">
                <button className="sa-icon-btn" onClick={() => onEdit(venue)} title="Edit"><Edit3 size={14} /></button>
                <button className="sa-icon-btn sa-icon-btn-danger" onClick={() => onDelete(venue.id)} title="Delete"><Trash2 size={14} /></button>
                <button className="sa-icon-btn" onClick={() => onToggle(venue)} title={isAvail ? 'Disable' : 'Enable'}>
                    {isAvail ? <ToggleRight size={14} color="#10b981" /> : <ToggleLeft size={14} color="#6b7280" />}
                </button>
            </div>
        </div>
        <div className="sa-venue-bottom">
            <span className="sa-venue-cap"><Hash size={11} /> {venue.capacity} seats</span>
            <span className={`sa-venue-badge ${isAvail ? 'badge-available' : 'badge-unavail'}`}>
                {isAvail ? 'Available' : 'Unavailable'}
            </span>
            <span className="sa-venue-type">{venue.examType || 'All'}</span>
        </div>
    </div>
    );
};

/* ─── Venue Form Modal ───────────────────────────────────────────────── */
const VenueModal = ({ venue, onClose, onSave }) => {
    const [form, setForm] = useState({ name: '', block: '', capacity: '', examType: 'All', isAvailable: true, ...(venue || {}) });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const handleSave = () => {
        if (!form.name.trim() || !form.capacity) { alert('Name and Capacity are required.'); return; }
        onSave({ ...form, capacity: parseInt(form.capacity) });
    };
    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal">
                <div className="sa-modal-header">
                    <Building2 size={16} />
                    <span>{venue?.id ? 'Edit Venue' : 'Add New Venue'}</span>
                    <button className="sa-icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="sa-modal-body">
                    <div className="sa-field">
                        <label>Venue Name *</label>
                        <input className="sa-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. ME Hall 202" autoFocus />
                    </div>
                    <div className="sa-field">
                        <label>Block / Location</label>
                        <input className="sa-input" value={form.block} onChange={e => set('block', e.target.value)} placeholder="e.g. Mechanical Block" />
                    </div>
                    <div className="sa-field-row">
                        <div className="sa-field">
                            <label>Seating Capacity *</label>
                            <input className="sa-input" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 60" />
                        </div>
                        <div className="sa-field">
                            <label>Exam Type</label>
                            <select className="sa-input" value={form.examType} onChange={e => set('examType', e.target.value)}>
                                <option value="All">All</option>
                                <option value="Internal">Internal</option>
                                <option value="Semester">Semester</option>
                                <option value="Lab">Lab</option>
                            </select>
                        </div>
                    </div>
                    <div className="sa-field sa-field-toggle">
                        <label>Available for use?</label>
                        <button type="button" className={`sa-toggle-btn ${form.isAvailable ? 'on' : 'off'}`} onClick={() => set('isAvailable', !form.isAvailable)}>
                            {form.isAvailable ? <><ToggleRight size={18} /> Yes</> : <><ToggleLeft size={18} /> No</>}
                        </button>
                    </div>
                </div>
                <div className="sa-modal-footer">
                    <button className="sa-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="sa-btn-primary" onClick={handleSave}><Save size={15} /> Save Venue</button>
                </div>
            </div>
        </div>
    );
};

/* ─── Exam Venue Template ────────────────────────────────────────────── */
const ExamVenueTemplate = ({ exams, venues, currentUser, toast }) => {
    const [rows, setRows] = useState([{ examId: '', venueId: '', date: '', startTime: '', endTime: '', status: null }]);
    const [saving, setSaving] = useState(false);

    const addRow = () => setRows(p => [...p, { examId: '', venueId: '', date: '', startTime: '', endTime: '', status: null }]);
    const removeRow = i => setRows(p => p.filter((_, idx) => idx !== i));
    const setRow = (i, k, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [k]: v, status: null } : r));

    const handleDownload = () => {
        const headers = 'ExamName,SubjectCode,Department,VenueName,SeatingCapacity,ExamDate,StartTime,EndTime';
        const sample = [
            'Database Management System,CS1C2,Computer Science & Engineering,ME Hall 201,60,2026-04-10,09:30,12:30',
            'Operating System,CS1C4,Computer Science & Engineering,ME Hall 202,60,2026-04-11,09:30,12:30',
        ].join('\n');
        const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'venue_timing_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleSave = async () => {
        const filled = rows.filter(r => r.examId);
        if (filled.length === 0) { toast.error('Please select at least one exam in a row.'); return; }

        if (!currentUser?.uid) { toast.error('Not authenticated. Please log in again.'); return; }

        setSaving(true);
        let successCount = 0;
        const updatedRows = [...rows];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r.examId) continue; // skip empty rows

            const venue = venues.find(v => String(v.id) === r.venueId);
            const payload = {};
            if (r.date)      payload.date      = r.date;          // yyyy-MM-dd  (native date input)
            if (r.startTime) payload.startTime = r.startTime;     // HH:mm
            if (r.endTime)   payload.endTime   = r.endTime;
            if (venue)       payload.location  = venue.name;      // stored in schedule.location

            try {
                await api.put(`/schedules/${r.examId}?uid=${currentUser.uid}`, payload);
                updatedRows[i] = { ...updatedRows[i], status: 'ok' };
                successCount++;
            } catch (e) {
                updatedRows[i] = { ...updatedRows[i], status: 'err', errMsg: e.response?.data?.message || e.message };
            }
        }

        setRows(updatedRows);
        setSaving(false);

        if (successCount === filled.length) {
            toast.success(`✅ Saved timing for ${successCount} exam${successCount > 1 ? 's' : ''}!`);
        } else {
            toast.error(`Saved ${successCount}/${filled.length}. Check rows marked with ✕.`);
        }
    };

    return (
        <div className="sa-template-wrap">
            <div className="sa-info-banner">
                <Info size={15} />
                <span>Set <strong>venue and timing</strong> for each exam. Venue capacity drives seat auto-allocation with section-alternating logic.</span>
                <button className="sa-dl-btn" onClick={handleDownload}><Download size={13} /> Download Template</button>
            </div>
            <div className="sa-template-table-wrap">
                <div className="sa-template-table-header">
                    <span><BookOpen size={14} /> Exam–Venue Assignment</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="sa-add-row-btn" onClick={addRow}><Plus size={14} /> Add Row</button>
                        <button
                            className="sa-btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={14} /> {saving ? 'Saving…' : 'Save Timing'}
                        </button>
                    </div>
                </div>
                <div className="sa-template-table">
                    <div className="sa-trow sa-thead">
                        <span>Exam / Subject</span><span>Venue</span><span>Capacity</span>
                        <span>Date</span><span>Start</span><span>End</span><span></span>
                    </div>
                    {rows.map((r, i) => (
                        <div className={`sa-trow ${r.status === 'ok' ? 'sa-trow-ok' : r.status === 'err' ? 'sa-trow-err' : ''}`} key={i}>
                            <select className="sa-select-sm" value={r.examId} onChange={e => setRow(i, 'examId', e.target.value)}>
                                <option value="">-- Exam --</option>
                                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.subjectName}</option>)}
                            </select>
                            <select className="sa-select-sm" value={r.venueId} onChange={e => setRow(i, 'venueId', e.target.value)}>
                                <option value="">-- Venue --</option>
                                {venues.filter(v => v.available ?? v.isAvailable).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <span className="sa-cap-badge">{r.venueId ? (venues.find(v => String(v.id) === r.venueId)?.capacity || '—') : '—'}</span>
                            <input type="date" className="sa-input-sm" value={r.date} onChange={e => setRow(i, 'date', e.target.value)} />
                            <input type="time" className="sa-input-sm" value={r.startTime} onChange={e => setRow(i, 'startTime', e.target.value)} />
                            <input type="time" className="sa-input-sm" value={r.endTime} onChange={e => setRow(i, 'endTime', e.target.value)} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                {r.status === 'ok'  && <CheckCircle size={14} color="#10b981" title="Saved!" />}
                                {r.status === 'err' && <AlertCircle size={14} color="#ef4444" title={r.errMsg || 'Error'} />}
                                <button className="sa-icon-btn sa-icon-btn-danger" onClick={() => removeRow(i)}><X size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
const COESeatingAllocation = () => {
    const toast = useToast();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState('allocate');
    const [exams, setExams] = useState([]);
    const [venues, setVenues] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [autoAllocating, setAutoAllocating] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    /* ── CRUD UI state ── */
    const [venueModal, setVenueModal] = useState(null);
    const [editSeating, setEditSeating] = useState(null);     // allocation being edited
    const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm, danger }

    /* ── search / filter ── */
    const [searchQ, setSearchQ] = useState('');
    const [filterVenue, setFilterVenue] = useState('');
    const [filterDept, setFilterDept] = useState('');

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { if (selectedExam) fetchAllocations(selectedExam); else setAllocations([]); }, [selectedExam]);

    const fetchInitialData = async () => {
        try {
            const [exRes, vRes] = await Promise.all([api.get('/schedules'), api.get('/exam-venues')]);
            setExams((exRes.data || []).filter(s => s.type === 'INTERNAL_EXAM' || s.type === 'SEMESTER_EXAM'));
            setVenues(vRes.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchVenues = async () => {
        try { setVenues((await api.get('/exam-venues')).data || []); } catch (e) { }
    };

    const fetchAllocations = async (examId) => {
        setLoading(true);
        try {
            const res = examId === 'ALL'
                ? await api.get('/exam-seating/all')
                : await api.get(`/exam-seating/exam/${examId}`);
            setAllocations(res.data || []);
        } catch (e) { setAllocations([]); } finally { setLoading(false); }
    };

    /* ── Venue CRUD ── */
    const handleSaveVenue = async (data) => {
        try {
            if (data.id) await api.put(`/exam-venues/${data.id}`, data);
            else await api.post('/exam-venues', data);
            toast.success(data.id ? 'Venue updated!' : 'Venue added!');
            setVenueModal(null); fetchVenues();
        } catch (e) { toast.error('Failed to save venue.'); }
    };

    const handleDeleteVenue = (id) => {
        setConfirmDialog({
            message: 'Delete this venue? This cannot be undone.',
            danger: true,
            onConfirm: async () => {
                try { await api.delete(`/exam-venues/${id}`); toast.success('Venue deleted.'); fetchVenues(); }
                catch (e) { toast.error('Delete failed.'); }
                setConfirmDialog(null);
            }
        });
    };

    const handleToggleVenue = async (venue) => {
        try {
            const currentAvail = venue.available ?? venue.isAvailable;
            await api.put(`/exam-venues/${venue.id}`, { ...venue, isAvailable: !currentAvail });
            toast.success('Venue status updated.'); fetchVenues();
        } catch (e) { toast.error('Update failed.'); }
    };

    /* ── Seating CRUD: Update ── */
    const handleUpdateSeating = async (id, seatNumber, venueId) => {
        try {
            const res = await api.put(`/exam-seating/${id}`, { seatNumber, venueId: venueId || null });
            setAllocations(prev => prev.map(a => a.id === id ? res.data : a));
            toast.success(`Seat updated → ${seatNumber}`);
        } catch (e) {
            toast.error('Update failed: ' + (e.response?.data?.message || e.message));
            throw e;
        }
    };

    /* ── Seating CRUD: Delete single ── */
    const handleDeleteSeating = (allocation) => {
        setConfirmDialog({
            message: `Remove ${allocation.student?.fullName}'s allocation (Seat ${allocation.seatNumber})?`,
            danger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/exam-seating/${allocation.id}`);
                    setAllocations(prev => prev.filter(a => a.id !== allocation.id));
                    toast.success('Allocation removed.');
                } catch (e) {
                    toast.error('Delete failed: ' + (e.response?.data?.message || e.message));
                }
                setConfirmDialog(null);
            }
        });
    };

    /* ── Seating CRUD: Clear all ── */
    const handleClearAll = () => {
        if (!selectedExam || selectedExam === 'ALL') { toast.error('Select a specific exam first.'); return; }
        const examName = exams.find(e => e.id?.toString() === selectedExam)?.subjectName || 'this exam';
        setConfirmDialog({
            message: `Clear ALL ${allocations.length} allocations for "${examName}"? This cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/exam-seating/exam/${selectedExam}`);
                    setAllocations([]);
                    toast.success('All allocations cleared.');
                } catch (e) {
                    toast.error('Clear failed: ' + (e.response?.data?.message || e.message));
                }
                setConfirmDialog(null);
            }
        });
    };

    /* ── CSV ── */
    const downloadAllocationTemplate = () => {
        const blob = new Blob(['Roll Number,Venue Name,Seat Number (Optional)\n22CSE001,ME Hall 201,A1\n22IT001,ME Hall 201,A2\n'], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'seating_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleDrag = e => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== 'dragleave'); };
    const handleDrop = e => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f?.name.endsWith('.csv')) setCsvFile(f); else toast.error('Upload a .csv file');
    };

    const handleAllocate = async e => {
        e.preventDefault();
        if (!selectedExam || selectedExam === 'ALL' || !csvFile) { toast.error('Select an exam and upload a CSV.'); return; }
        setUploading(true);
        try {
            const fd = new FormData(); fd.append('examId', selectedExam); fd.append('file', csvFile);
            await api.post('/exam-seating/allocate', fd);
            toast.success('CSV allocation successful!'); setCsvFile(null); fetchAllocations(selectedExam);
        } catch (e) { toast.error('Failed: ' + (e.response?.data?.message || e.message)); }
        finally { setUploading(false); }
    };

    const handleAutoAllocate = async () => {
        if (!selectedExam || selectedExam === 'ALL') { toast.error('Select a specific exam first.'); return; }
        setConfirmDialog({
            message: 'Auto-Allocate will use section-interleaving to seat students. This REPLACES existing allocations. Proceed?',
            danger: false,
            onConfirm: async () => {
                setConfirmDialog(null);
                setAutoAllocating(true);
                try {
                    await api.post(`/exam-seating/auto-allocate?examId=${selectedExam}`);
                    toast.success('✅ Seats assigned — same-section students are alternated.'); fetchAllocations(selectedExam);
                } catch (e) { toast.error('Auto-allocation failed: ' + (e.response?.data?.message || e.message)); }
                finally { setAutoAllocating(false); }
            }
        });
    };

    /* ── Export CSV ── */
    const handleExport = () => {
        if (!allocations.length) return;
        const rows = [['Student Name', 'Roll No', 'Dept', 'Section', 'Venue', 'Seat']];
        allocations.forEach(a => rows.push([
            a.student?.fullName || '', a.student?.rollNumber || '',
            a.student?.department || '', a.student?.section || '',
            a.venue?.name || '', a.seatNumber || ''
        ]));
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `seating_${selectedExam}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    /* ── Derived ── */
    const deptColors = useMemo(() => {
        const palette = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef', '#f97316'];
        const depts = [...new Set(allocations.map(a => a.student?.department || 'UNKNOWN'))];
        const map = {}; depts.forEach((d, i) => { map[d] = palette[i % palette.length]; }); return map;
    }, [allocations]);

    const uniqueVenueNames = useMemo(() => [...new Set(allocations.map(a => a.venue?.name).filter(Boolean))], [allocations]);
    const uniqueDepts     = useMemo(() => [...new Set(allocations.map(a => a.student?.department).filter(Boolean))], [allocations]);

    const filtered = useMemo(() => allocations.filter(a => {
        const q = searchQ.toLowerCase();
        const name = (a.student?.fullName || '').toLowerCase();
        const roll = (a.student?.rollNumber || '').toLowerCase();
        const seat = (a.seatNumber || '').toLowerCase();
        const matchQ = !q || name.includes(q) || roll.includes(q) || seat.includes(q);
        const matchV = !filterVenue || a.venue?.name === filterVenue;
        const matchD = !filterDept || a.student?.department === filterDept;
        return matchQ && matchV && matchD;
    }), [allocations, searchQ, filterVenue, filterDept]);

    const byVenue = useMemo(() => {
        const map = {};
        filtered.forEach(a => { const v = a.venue?.name || 'Unknown'; if (!map[v]) map[v] = []; map[v].push(a); });
        return map;
    }, [filtered]);

    /* ═══ RENDER ════════════════════════════════════════════════════════ */
    return (
        <div className="sa-page">
            <Toasts toasts={toast.toasts} />

            {/* Dialogs */}
            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    danger={confirmDialog.danger}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
            {editSeating && (
                <EditSeatingModal
                    allocation={editSeating}
                    venues={venues}
                    onClose={() => setEditSeating(null)}
                    onSave={handleUpdateSeating}
                />
            )}
            {venueModal !== null && (
                <VenueModal
                    venue={venueModal?.id ? venueModal : null}
                    onClose={() => setVenueModal(null)}
                    onSave={handleSaveVenue}
                />
            )}

            {/* Header */}
            <div className="sa-header">
                <div>
                    <h1 className="sa-title">🎓 Seating Allocation</h1>
                    <p className="sa-subtitle">Manage venues, set exam timings, and auto-generate conflict-free seating plans</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="sa-tabs">
                {[
                    { key: 'venues',   label: 'Venues',               icon: <Building2 size={15} /> },
                    { key: 'template', label: 'Exam Timing & Venue',   icon: <Clock size={15} /> },
                    { key: 'allocate', label: 'Allocate Seats',        icon: <Users size={15} /> },
                ].map(t => (
                    <button key={t.key} className={`sa-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: VENUES ─────────────────────────────────────────── */}
            {activeTab === 'venues' && (
                <div className="sa-tab-content">
                    <div className="sa-venues-toolbar">
                        <div className="sa-venues-summary">
                            <span><strong>{venues.length}</strong> venues</span>
                            <span className="sa-dot-sep">·</span>
                            <span><strong>{venues.filter(v => v.available ?? v.isAvailable).length}</strong> available</span>
                            <span className="sa-dot-sep">·</span>
                            <span><strong>{venues.reduce((s, v) => s + (v.capacity || 0), 0)}</strong> total seats</span>
                        </div>
                        <button className="sa-btn-primary" onClick={() => setVenueModal({})}><Plus size={15} /> Add Venue</button>
                    </div>
                    {venues.length === 0
                        ? <div className="sa-empty"><Building2 size={48} /><p>No venues yet.</p><button className="sa-btn-primary" onClick={() => setVenueModal({})}><Plus size={15} /> Add Venue</button></div>
                        : <div className="sa-venues-grid">{venues.map(v => <VenueCard key={v.id} venue={v} onEdit={setVenueModal} onDelete={handleDeleteVenue} onToggle={handleToggleVenue} />)}</div>
                    }
                </div>
            )}

            {/* ── TAB: TEMPLATE ───────────────────────────────────────── */}
            {activeTab === 'template' && (
                <div className="sa-tab-content">
                    <ExamVenueTemplate exams={exams} venues={venues} currentUser={currentUser} toast={toast} />
                </div>
            )}

            {/* ── TAB: ALLOCATE ───────────────────────────────────────── */}
            {activeTab === 'allocate' && (
                <div className="sa-alloc-grid">

                    {/* LEFT: Form */}
                    <div className="sa-card">
                        <h3 className="sa-card-title"><Users size={18} /> Seat Allocation</h3>
                        <form onSubmit={handleAllocate}>

                            {/* Exam selector */}
                            <div className="sa-field">
                                <label><Calendar size={13} /> Select Examination</label>
                                <div className="sa-select-wrap">
                                    <select className="sa-select" value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setSearchQ(''); setFilterVenue(''); setFilterDept(''); }} required>
                                        <option value="">— Choose Exam —</option>
                                        <option value="ALL">All Allocations (View)</option>
                                        {exams.map(ex => (
                                            <option key={ex.id} value={ex.id}>
                                                {ex.subjectName} ({ex.date ? new Date(ex.date).toLocaleDateString() : 'TBD'})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="sa-select-chevron" />
                                </div>
                            </div>

                            {selectedExam && selectedExam !== 'ALL' && (
                                <div className="sa-venue-info-strip">
                                    <MapPin size={13} />
                                    <span>{venues.filter(v => v.available ?? v.isAvailable).length} venues available · {venues.filter(v => v.available ?? v.isAvailable).reduce((s, v) => s + (v.capacity || 0), 0)} total seats</span>
                                </div>
                            )}

                            {/* Auto-allocate */}
                            <div className="sa-auto-section">
                                <div className="sa-auto-header">
                                    <Wand2 size={16} color="#7c3aed" />
                                    <div>
                                        <div className="sa-auto-title">Smart Auto-Allocation</div>
                                        <div className="sa-auto-sub">Students from the same <strong>section</strong> are seated <strong>alternately</strong> — no adjacent seats share the same dept-section group.</div>
                                    </div>
                                </div>
                                <div className="sa-algo-visual">
                                    <div className="sa-algo-box algo-a">CSE-A</div>
                                    <div className="sa-algo-box algo-it">IT-A</div>
                                    <div className="sa-algo-box algo-a">CSE-B</div>
                                    <div className="sa-algo-box algo-ece">ECE-A</div>
                                    <div className="sa-algo-box algo-it">IT-B</div>
                                    <div className="sa-algo-box algo-a">CSE-A</div>
                                </div>
                                <button type="button" className="sa-btn-auto" onClick={handleAutoAllocate} disabled={autoAllocating || !selectedExam || selectedExam === 'ALL'}>
                                    <Wand2 size={16} /> {autoAllocating ? 'Calculating…' : 'Auto-Allocate Seats'}
                                </button>
                            </div>

                            <div className="sa-divider"><span>OR UPLOAD CSV MANUALLY</span></div>

                            {/* CSV Upload */}
                            <div className="sa-field">
                                <div className="sa-upload-label-row">
                                    <label style={{ marginBottom: 0 }}>Upload Allocation CSV</label>
                                    <button type="button" className="sa-text-btn" onClick={downloadAllocationTemplate}><Download size={13} /> Template</button>
                                </div>
                                <label className={`sa-drop-area ${dragActive ? 'drag-active' : ''} ${csvFile ? 'has-file' : ''}`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                                    <input type="file" hidden accept=".csv" onChange={e => e.target.files[0] && setCsvFile(e.target.files[0])} />
                                    {csvFile
                                        ? <div className="sa-file-selected"><FileText size={20} /><span>{csvFile.name}</span><button type="button" className="sa-clear-file" onClick={e => { e.preventDefault(); setCsvFile(null); }}><X size={14} /></button></div>
                                        : <div className="sa-drop-inner"><Upload size={28} /><span>Click or drag CSV here</span><code>Roll Number, Venue Name, [Seat No]</code></div>
                                    }
                                </label>
                            </div>

                            <button type="submit" className="sa-btn-upload" disabled={uploading || !csvFile}>
                                {uploading ? 'Uploading…' : <><CheckCircle size={17} /> Upload & Allocate</>}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: Allocation view with CRUD */}
                    <div className="sa-card sa-view-card">
                        {/* Header row */}
                        <div className="sa-view-header">
                            <h3 className="sa-card-title" style={{ margin: 0 }}>
                                <FileText size={18} />
                                {selectedExam === 'ALL' ? 'All Students'
                                    : (exams.find(e => e.id?.toString() === selectedExam)?.subjectName || 'Allocations')}
                                {allocations.length > 0 && <span className="sa-alloc-count">({allocations.length} students)</span>}
                            </h3>
                            <div className="sa-view-actions">
                                {allocations.length > 0 && (
                                    <>
                                        {/* Export */}
                                        <button className="sa-icon-btn" onClick={handleExport} title="Export CSV"><Download size={14} /></button>
                                        {/* Refresh */}
                                        <button className="sa-icon-btn" onClick={() => fetchAllocations(selectedExam)} title="Refresh"><RefreshCw size={14} /></button>
                                        {/* Clear All */}
                                        {selectedExam !== 'ALL' && (
                                            <button className="sa-btn-clear-all" onClick={handleClearAll} title="Clear all allocations">
                                                <Trash2 size={13} /> Clear All
                                            </button>
                                        )}
                                        {/* View toggle */}
                                        <div className="sa-view-toggle">
                                            <button className={`sa-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table"><TableProperties size={14} /></button>
                                            <button className={`sa-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Seat Map"><Grid3X3 size={14} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Filters bar */}
                        {allocations.length > 0 && (
                            <div className="sa-filters-bar">
                                <div className="sa-search-wrap">
                                    <input className="sa-search-input" placeholder="Search name, roll, seat…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                                </div>
                                <select className="sa-filter-select" value={filterVenue} onChange={e => setFilterVenue(e.target.value)}>
                                    <option value="">All Venues</option>
                                    {uniqueVenueNames.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <select className="sa-filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                                    <option value="">All Depts</option>
                                    {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {(searchQ || filterVenue || filterDept) && (
                                    <button className="sa-text-btn" onClick={() => { setSearchQ(''); setFilterVenue(''); setFilterDept(''); }}>
                                        <X size={13} /> Clear
                                    </button>
                                )}
                                <span className="sa-filter-count">{filtered.length} / {allocations.length}</span>
                            </div>
                        )}

                        {/* Content */}
                        {!selectedExam ? (
                            <div className="sa-empty"><AlertCircle size={40} /><p>Select an exam to view allocations</p></div>
                        ) : loading ? (
                            <div className="sa-loading"><div className="sa-spinner" /><p>Loading…</p></div>
                        ) : allocations.length === 0 ? (
                            <div className="sa-empty"><Users size={40} /><p>No allocations yet. Auto-Allocate or upload CSV.</p></div>
                        ) : viewMode === 'table' ? (

                            /* ── TABLE VIEW with CRUD ─────────────────── */
                            <div className="sa-table-wrap">
                                <table className="sa-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>Roll No</th>
                                            <th>Dept</th>
                                            <th>Sec</th>
                                            <th>Venue</th>
                                            <th>Seat</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((a, idx) => {
                                            const dept = a.student?.department || '—';
                                            const sec  = a.student?.section    || '—';
                                            const roll = a.student?.rollNumber || '—';
                                            const color = deptColors[dept] || '#888';
                                            return (
                                                <tr key={a.id || idx}>
                                                    <td className="sa-td-num">{idx + 1}</td>
                                                    <td><span className="sa-student-name">{a.student?.fullName || '—'}</span></td>
                                                    <td><span className="sa-roll">{roll}</span></td>
                                                    <td><span className="sa-dept-badge" style={{ background: color + '22', color }}>{dept}</span></td>
                                                    <td className="sa-sec">{sec}</td>
                                                    <td className="sa-venue-cell"><MapPin size={11} /> {a.venue?.name || '—'}</td>
                                                    <td>
                                                        <span className={`sa-seat ${a.seatNumber?.startsWith('OVF') ? 'sa-seat-overflow' : ''}`}>
                                                            {a.seatNumber || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="sa-row-actions">
                                                            <button
                                                                className="sa-icon-btn sa-icon-btn-edit"
                                                                onClick={() => setEditSeating(a)}
                                                                title="Edit seat / venue"
                                                            >
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button
                                                                className="sa-icon-btn sa-icon-btn-danger"
                                                                onClick={() => handleDeleteSeating(a)}
                                                                title="Remove allocation"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filtered.length === 0 && <div className="sa-empty" style={{ padding: '2rem 0' }}><AlertCircle size={28} /><p>No results match your filter.</p></div>}
                            </div>

                        ) : (

                            /* ── SEAT GRID VIEW ───────────────────────── */
                            <div className="sa-grid-view">
                                <div className="sa-legend">
                                    {Object.entries(deptColors).map(([dept, color]) => (
                                        <div key={dept} className="sa-legend-item">
                                            <div className="sa-legend-dot" style={{ background: color }} />
                                            <span>{dept}</span>
                                        </div>
                                    ))}
                                </div>
                                {Object.entries(byVenue).map(([venueName, seats]) => {
                                    const cap = venues.find(v => v.name === venueName)?.capacity;
                                    return (
                                        <div key={venueName} className="sa-venue-section">
                                            <div className="sa-venue-section-title">
                                                <MapPin size={14} color="#4f46e5" /> {venueName}
                                                <span className="sa-venue-section-sub">{seats.length}{cap ? ` / ${cap}` : ''} students</span>
                                            </div>
                                            <div className="sa-seat-map">
                                                {seats.sort((a, b) => (a.seatNumber || '').localeCompare(b.seatNumber || '', undefined, { numeric: true }))
                                                    .map((alloc, i) => {
                                                        const dept = alloc.student?.department || 'UNKNOWN';
                                                        const color = deptColors[dept] || '#888';
                                                        return (
                                                            <div key={i} className="sa-seat-cell"
                                                                title={`${alloc.student?.fullName}\n${alloc.student?.rollNumber} | ${dept}-${alloc.student?.section || '?'}`}
                                                                style={{ borderColor: color, background: color + '18' }}
                                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                onClick={() => setEditSeating(alloc)}
                                                            >
                                                                <span className="sa-seat-no" style={{ color }}>{alloc.seatNumber}</span>
                                                                <span className="sa-seat-roll">{(alloc.student?.rollNumber || '').slice(-6)}</span>
                                                                <span className="sa-seat-dept" style={{ color }}>{dept.split(' ').map(w => w[0]).join('').substring(0, 4)}-{alloc.student?.section || '?'}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default COESeatingAllocation;
