import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { exportData } from '../../utils/exportUtils';
import { parseSpreadsheetFile, validateImportedRows } from '../../utils/importUtils';
import PlacementPageHero from './components/PlacementPageHero';
import PlacementStatsGrid from './components/PlacementStatsGrid';
import StudentEditModal from './components/StudentEditModal';
import PlacementOverviewPage from './views/PlacementOverviewPage';
import PlacementStudentsPage from './views/PlacementStudentsPage';
import PlacementDrivesPage from './views/PlacementDrivesPage';
import PlacementAnalyticsPage from './views/PlacementAnalyticsPage';
import './PlacementCoordinatorDashboard.css';

const READINESS_OPTIONS = [
    { value: 'ALL', label: 'All readiness' },
    { value: 'HIGH', label: 'High (75+)' },
    { value: 'MEDIUM', label: 'Medium (50-74)' },
    { value: 'LOW', label: 'Low (<50)' }
];

const PLACEMENT_STATUS_OPTIONS = ['NOT_READY', 'ELIGIBLE', 'PLACED'];
const RESUME_REVIEW_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const DRIVE_STATUS_OPTIONS = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const COMPANY_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6'];
const EXPORT_COLUMNS = [
    { header: 'UID', key: 'uid' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Year', key: 'year' },
    { header: 'Readiness Score', key: 'readinessScore' },
    { header: 'Skills Completed', key: 'skillsCompleted' },
    { header: 'Aptitude Score', key: 'aptitudeScore' },
    { header: 'Mock Interview Score', key: 'mockInterviewScore' },
    { header: 'Placement Status', key: 'placementStatus' },
    { header: 'Resume Review', key: 'resumeReviewStatus' }
];

const emptyStudentForm = {
    uid: '',
    aptitudeScore: 0,
    mockInterviewScore: 0,
    skillsCompleted: 0,
    totalSkills: 10,
    completedSkillsList: '',
    placementStatus: 'NOT_READY',
    resumeReviewStatus: 'PENDING',
    resumeRemarks: '',
    preferredRole: '',
    preferredCompanies: ''
};

const emptyCompanyForm = {
    companyName: '',
    industry: '',
    location: '',
    website: '',
    packageOffered: '',
    status: 'ACTIVE',
    notes: ''
};

const emptyDriveForm = {
    companyId: '',
    roleTitle: '',
    driveDate: '',
    location: '',
    eligibilityCriteria: '',
    description: '',
    status: 'PLANNED',
    eligibleStudentUids: [],
    appliedStudentUids: [],
    selectedStudentUids: []
};

const formatScore = (value) => Number.parseFloat(value || 0).toFixed(1);

const getReadinessBand = (score) => {
    const numericScore = Number(score || 0);
    if (numericScore >= 75) return 'HIGH';
    if (numericScore >= 50) return 'MEDIUM';
    return 'LOW';
};

const getSectionFromPath = (pathname) => {
    if (pathname.includes('/students')) return 'students';
    if (pathname.includes('/drives')) return 'drives';
    if (pathname.includes('/analytics')) return 'analytics';
    return 'overview';
};

const getDriveType = (drive) => {
    const roleTitle = String(drive?.roleTitle || '').toLowerCase();
    const description = String(drive?.description || '').toLowerCase();
    const source = `${roleTitle} ${description}`;
    if (source.includes('intern')) return 'INTERNSHIP';
    if (source.includes('contract')) return 'CONTRACT';
    return 'FULL_TIME';
};

const formatDriveType = (type) => {
    switch (type) {
        case 'INTERNSHIP':
            return 'Internship';
        case 'CONTRACT':
            return 'Contract';
        default:
            return 'Full Time';
    }
};

const formatDriveDate = (value) => {
    if (!value) return 'Date to be announced';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const PlacementCoordinatorDashboard = () => {
    const { userData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const importInputRef = useRef(null);
    const driveFormRef = useRef(null);
    const activeSection = getSectionFromPath(location.pathname);

    const [dashboard, setDashboard] = useState(null);
    const [students, setStudents] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingStudent, setSavingStudent] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);
    const [savingDrive, setSavingDrive] = useState(false);
    const [importing, setImporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [readinessFilter, setReadinessFilter] = useState('ALL');
    const [placementStatusFilter, setPlacementStatusFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'readinessScore', direction: 'desc' });
    const [driveSearchTerm, setDriveSearchTerm] = useState('');
    const [driveStatusFilter, setDriveStatusFilter] = useState('ALL');
    const [driveTypeFilter, setDriveTypeFilter] = useState('ALL');
    const [analyticsYear, setAnalyticsYear] = useState('2024-2025');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentForm, setStudentForm] = useState(emptyStudentForm);

    const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
    const [editingCompanyId, setEditingCompanyId] = useState(null);

    const [driveForm, setDriveForm] = useState(emptyDriveForm);
    const [editingDriveId, setEditingDriveId] = useState(null);
    const [selectedDriveId, setSelectedDriveId] = useState(null);
    const [reviewingApplication, setReviewingApplication] = useState(null);

    const canManagePlacement = userData?.role === 'PLACEMENT_COORDINATOR' || userData?.role === 'ADMIN';

    const departmentOptions = useMemo(() => [
        'ALL',
        ...Array.from(new Set(students.map((student) => student.department).filter(Boolean))).sort()
    ], [students]);

    const filteredStudents = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const data = students.filter((student) => {
            const matchesSearch = !normalizedSearch || [
                student.name,
                student.department,
                student.email,
                student.uid,
                student.rollNumber,
                student.completedSkillsList
            ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
            const matchesDepartment = departmentFilter === 'ALL' || student.department === departmentFilter;
            const matchesReadiness = readinessFilter === 'ALL' || getReadinessBand(student.readinessScore) === readinessFilter;
            const matchesPlacementStatus = placementStatusFilter === 'ALL' || student.placementStatus === placementStatusFilter;
            return matchesSearch && matchesDepartment && matchesReadiness && matchesPlacementStatus;
        });

        return [...data].sort((left, right) => {
            const leftValue = left[sortConfig.key];
            const rightValue = right[sortConfig.key];
            if (typeof leftValue === 'number' || typeof rightValue === 'number') {
                const numericLeft = Number(leftValue || 0);
                const numericRight = Number(rightValue || 0);
                return sortConfig.direction === 'asc' ? numericLeft - numericRight : numericRight - numericLeft;
            }
            return sortConfig.direction === 'asc'
                ? String(leftValue || '').localeCompare(String(rightValue || ''))
                : String(rightValue || '').localeCompare(String(leftValue || ''));
        });
    }, [departmentFilter, placementStatusFilter, readinessFilter, searchTerm, sortConfig, students]);

    const skillsDistributionData = useMemo(() => {
        const source = dashboard?.skillsDistribution || {};
        return Object.entries(source).map(([name, value], index) => ({
            name,
            value,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [dashboard]);

    const placementStatsData = useMemo(() => {
        const source = dashboard?.placementStats || {};
        return Object.entries(source).map(([key, value]) => ({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
            value
        }));
    }, [dashboard]);

    const companySelectionsData = useMemo(() => {
        const source = analytics?.companyWiseSelections || {};
        return Object.entries(source).map(([name, value]) => ({ name, value }));
    }, [analytics]);

    const departmentPerformanceData = useMemo(() => {
        const source = analytics?.departmentWisePerformance || {};
        return Object.entries(source).map(([name, value]) => ({ name, value }));
    }, [analytics]);

    const filteredDrives = useMemo(() => {
        const normalizedSearch = driveSearchTerm.trim().toLowerCase();

        return drives.filter((drive) => {
            const driveType = getDriveType(drive);
            const matchesSearch = !normalizedSearch || [
                drive.companyName,
                drive.roleTitle,
                drive.location,
                drive.description
            ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
            const matchesStatus = driveStatusFilter === 'ALL' || String(drive.status || '').toUpperCase() === driveStatusFilter;
            const matchesType = driveTypeFilter === 'ALL' || driveType === driveTypeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [driveSearchTerm, driveStatusFilter, driveTypeFilter, drives]);

    const studentManagementMetrics = useMemo(() => {
        const visibleStudents = filteredStudents;
        const placementReadyCount = visibleStudents.filter((student) => {
            const readiness = Number(student.readinessScore || 0);
            return readiness >= 80 || ['ELIGIBLE', 'PLACED'].includes(student.placementStatus);
        }).length;
        const mockInterviewAttentionCount = visibleStudents.filter(
            (student) => Number(student.mockInterviewScore || 0) < 70
        ).length;
        const averageAptitude = visibleStudents.length
            ? visibleStudents.reduce((sum, student) => sum + Number(student.aptitudeScore || 0), 0) / visibleStudents.length
            : 0;

        return {
            visibleCount: visibleStudents.length,
            placementReadyCount,
            mockInterviewAttentionCount,
            averageAptitude
        };
    }, [filteredStudents]);

    const analyticsSummary = useMemo(() => {
        const packages = drives
            .map((drive) => Number(drive.packageOffered || 0))
            .filter((value) => value > 0);
        const averagePackage = packages.length
            ? packages.reduce((sum, value) => sum + value, 0) / packages.length
            : 0;
        const highestPackage = packages.length ? Math.max(...packages) : 0;
        const highestPackageDrive = drives.find((drive) => Number(drive.packageOffered || 0) === highestPackage);

        return {
            overallPlacement: Number(analytics?.placementPercentage || 0),
            averagePackage,
            highestPackage,
            highestPackageCompany: highestPackageDrive?.companyName || 'No recruiter data'
        };
    }, [analytics, drives]);

    const selectedDrive = useMemo(
        () => drives.find((drive) => drive.id === selectedDriveId) || null,
        [drives, selectedDriveId]
    );

    const monthlyHiringTrendData = useMemo(() => {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentYear = new Date().getFullYear();
        const totals = new Map(monthLabels.map((label) => [label, 0]));

        drives.forEach((drive) => {
            const dateValue = drive.driveDate ? new Date(drive.driveDate) : null;
            if (!dateValue || Number.isNaN(dateValue.getTime())) return;
            if (dateValue.getFullYear() !== currentYear && dateValue.getFullYear() !== currentYear - 1) return;
            const label = dateValue.toLocaleDateString('en-US', { month: 'short' });
            if (!totals.has(label)) return;
            totals.set(label, totals.get(label) + Number(drive.selectedCount || drive.appliedCount || 0));
        });

        return monthLabels.map((month, index) => ({
            month,
            offers: totals.get(month) || 0,
            fill: index === 2 ? '#3b82f6' : '#e8eef9'
        }));
    }, [drives]);

    const recruiterBreakdown = useMemo(() => {
        const total = companySelectionsData.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return companySelectionsData.map((item, index) => ({
            ...item,
            percentage: total ? Math.round((Number(item.value || 0) / total) * 100) : 0,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [companySelectionsData]);

    const departmentPlacementRows = useMemo(() => {
        return departmentPerformanceData.map((item, index) => {
            const eligible = students.filter((student) => student.department === item.name).length || 0;
            const placed = Math.round((Number(item.value || 0) / 100) * eligible);
            const colors = ['#10b981', '#22c55e', '#14b8a6', '#f97316', '#ef4444'];
            return {
                ...item,
                eligible,
                placed,
                fill: colors[index % colors.length]
            };
        });
    }, [departmentPerformanceData, students]);

    const packageDistributionData = useMemo(() => {
        const buckets = [
            { name: '< 5 LPA', min: 0, max: 5 },
            { name: '5-10 LPA', min: 5, max: 10 },
            { name: '10-15 LPA', min: 10, max: 15 },
            { name: '15-20 LPA', min: 15, max: 20 },
            { name: '> 20 LPA', min: 20, max: Number.POSITIVE_INFINITY }
        ];

        return buckets.map((bucket, index) => {
            const count = drives.reduce((sum, drive) => {
                const pkg = Number(drive.packageOffered || 0);
                const inBucket = pkg >= bucket.min && pkg < bucket.max;
                return sum + (inBucket ? Number(drive.selectedCount || drive.appliedCount || 0) : 0);
            }, 0);

            return {
                range: bucket.name,
                students: count,
                fill: index === 1 ? '#3b82f6' : '#e8eef9'
            };
        });
    }, [drives]);

    const fetchPlacementData = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [dashboardRes, studentsRes, analyticsRes, companiesRes, drivesRes] = await Promise.all([
                api.get('/placement/coordinator/dashboard'),
                api.get('/placement/coordinator/students'),
                api.get('/placement/coordinator/analytics'),
                api.get('/placement/coordinator/companies'),
                api.get('/placement/coordinator/drives')
            ]);

            setDashboard(dashboardRes.data);
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
            setAnalytics(analyticsRes.data);
            setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
            setDrives(Array.isArray(drivesRes.data) ? drivesRes.data : []);
        } catch (error) {
            console.error('Failed to fetch placement coordinator data', error);
            setStatusMessage({ type: 'error', text: 'Failed to load placement coordinator data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (canManagePlacement) {
            fetchPlacementData();
        }
    }, [canManagePlacement]);

    useEffect(() => {
        if (!selectedStudent) {
            setStudentForm(emptyStudentForm);
            return;
        }

        setStudentForm({
            uid: selectedStudent.uid,
            aptitudeScore: selectedStudent.aptitudeScore || 0,
            mockInterviewScore: selectedStudent.mockInterviewScore || 0,
            skillsCompleted: selectedStudent.skillsCompleted || 0,
            totalSkills: selectedStudent.totalSkills || 10,
            completedSkillsList: selectedStudent.completedSkillsList || '',
            placementStatus: selectedStudent.placementStatus || 'NOT_READY',
            resumeReviewStatus: selectedStudent.resumeReviewStatus || 'PENDING',
            resumeRemarks: selectedStudent.resumeRemarks || '',
            preferredRole: selectedStudent.preferredRole || '',
            preferredCompanies: selectedStudent.preferredCompanies || ''
        });
    }, [selectedStudent]);

    const setMessage = (type, text) => {
        setStatusMessage({ type, text });
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleStudentFieldChange = (event) => {
        const { name, value } = event.target;
        setStudentForm((prev) => ({
            ...prev,
            [name]: ['aptitudeScore', 'mockInterviewScore', 'skillsCompleted', 'totalSkills'].includes(name)
                ? Number(value)
                : value
        }));
    };

    const handleSaveStudent = async () => {
        if (!selectedStudent) return;
        setSavingStudent(true);

        try {
            const payload = {
                aptitudeScore: Number(studentForm.aptitudeScore || 0),
                mockInterviewScore: Number(studentForm.mockInterviewScore || 0),
                skillsCompleted: Number(studentForm.skillsCompleted || 0),
                totalSkills: Number(studentForm.totalSkills || 0),
                completedSkillsList: studentForm.completedSkillsList,
                placementStatus: studentForm.placementStatus,
                resumeReviewStatus: studentForm.resumeReviewStatus,
                resumeRemarks: studentForm.resumeRemarks,
                preferredRole: studentForm.preferredRole,
                preferredCompanies: studentForm.preferredCompanies
            };

            const response = await api.put(`/placement/coordinator/students/${selectedStudent.uid}`, payload);
            const updatedStudent = response.data;

            setStudents((prev) => prev.map((student) => student.uid === updatedStudent.uid ? updatedStudent : student));
            setSelectedStudent(updatedStudent);
            setMessage('success', `Updated placement data for ${updatedStudent.name}.`);
            await fetchPlacementData(true);
        } catch (error) {
            console.error('Failed to update placement student', error);
            setMessage('error', 'Failed to update student placement data.');
        } finally {
            setSavingStudent(false);
        }
    };

    const handleExportStudents = (format) => {
        if (filteredStudents.length === 0) {
            setMessage('error', 'There is no visible student data to export.');
            return;
        }

        exportData({
            format,
            fileName: 'placement_students_data',
            title: 'Placement Student Readiness Report',
            rows: filteredStudents,
            columns: EXPORT_COLUMNS,
            sheetName: 'PlacementStudents'
        });
        setMessage('success', `Exported ${filteredStudents.length} student record(s) as ${format.toUpperCase()}.`);
    };

    const handleExportDrives = (format) => {
        if (drives.length === 0) {
            setMessage('error', 'There are no placement drives to export.');
            return;
        }

        exportData({
            format,
            fileName: 'placement_drive_report',
            title: 'Placement Drives Report',
            rows: drives,
            columns: [
                { header: 'Company', key: 'companyName' },
                { header: 'Role', key: 'roleTitle' },
                { header: 'Date', accessor: (row) => row.driveDate || '' },
                { header: 'Status', key: 'status' },
                { header: 'Eligible', key: 'eligibleCount' },
                { header: 'Applied', key: 'appliedCount' },
                { header: 'Selected', key: 'selectedCount' }
            ],
            sheetName: 'PlacementDrives'
        });
        setMessage('success', `Exported ${drives.length} drive record(s) as ${format.toUpperCase()}.`);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const buildImportPayload = (row) => {
        const payload = {};
        const assignIfPresent = (sourceKey, targetKey = sourceKey) => {
            if (row[sourceKey] !== undefined && String(row[sourceKey]).trim() !== '') {
                payload[targetKey] = row[sourceKey];
            }
        };

        assignIfPresent('aptitude_score', 'aptitudeScore');
        assignIfPresent('mock_interview_score', 'mockInterviewScore');
        assignIfPresent('skills_completed', 'skillsCompleted');
        assignIfPresent('total_skills', 'totalSkills');
        assignIfPresent('placement_status', 'placementStatus');
        assignIfPresent('resume_review_status', 'resumeReviewStatus');
        assignIfPresent('resume_remarks', 'resumeRemarks');
        assignIfPresent('preferred_role', 'preferredRole');
        assignIfPresent('preferred_companies', 'preferredCompanies');

        if (row.completed_skills_list !== undefined) {
            payload.completedSkillsList = row.completed_skills_list;
            if (payload.skillsCompleted === undefined) {
                payload.skillsCompleted = String(row.completed_skills_list)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .length;
            }
        }

        return payload;
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImporting(true);
        try {
            const rows = validateImportedRows(await parseSpreadsheetFile(file), ['uid']);
            let successCount = 0;

            for (const row of rows) {
                const payload = buildImportPayload(row);
                if (Object.keys(payload).length === 0) {
                    continue;
                }
                await api.put(`/placement/coordinator/students/${row.uid}`, payload);
                successCount += 1;
            }

            await fetchPlacementData(true);
            setMessage('success', `Imported placement updates for ${successCount} student record(s).`);
        } catch (error) {
            console.error('Failed to import placement data', error);
            setMessage('error', error.message || 'Failed to import placement data.');
        } finally {
            setImporting(false);
        }
    };

    const handleCompanyFieldChange = (event) => {
        const { name, value } = event.target;
        setCompanyForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetCompanyForm = () => {
        setCompanyForm(emptyCompanyForm);
        setEditingCompanyId(null);
    };

    const handleSaveCompany = async (event) => {
        event.preventDefault();
        setSavingCompany(true);

        try {
            const payload = {
                ...companyForm,
                packageOffered: companyForm.packageOffered === '' ? null : Number(companyForm.packageOffered)
            };
            if (editingCompanyId) {
                await api.put(`/placement/coordinator/companies/${editingCompanyId}`, payload);
            } else {
                await api.post('/placement/coordinator/companies', payload);
            }
            resetCompanyForm();
            await fetchPlacementData(true);
            setMessage('success', 'Company details saved successfully.');
        } catch (error) {
            console.error('Failed to save company', error);
            setMessage('error', 'Failed to save company details.');
        } finally {
            setSavingCompany(false);
        }
    };

    const handleEditCompany = (company) => {
        setEditingCompanyId(company.id);
        setCompanyForm({
            companyName: company.companyName || '',
            industry: company.industry || '',
            location: company.location || '',
            website: company.website || '',
            packageOffered: company.packageOffered ?? '',
            status: company.status || 'ACTIVE',
            notes: company.notes || ''
        });
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm('Delete this company?')) return;
        try {
            await api.delete(`/placement/coordinator/companies/${companyId}`);
            await fetchPlacementData(true);
            setMessage('success', 'Company deleted successfully.');
        } catch (error) {
            console.error('Failed to delete company', error);
            setMessage('error', 'Failed to delete company.');
        }
    };

    const handleDriveFieldChange = (event) => {
        const { name, value } = event.target;
        setDriveForm((prev) => ({ ...prev, [name]: value }));
    };

    const toggleDriveStudent = (field, uid) => {
        setDriveForm((prev) => {
            const current = new Set(prev[field]);
            if (current.has(uid)) {
                current.delete(uid);
            } else {
                current.add(uid);
            }
            return { ...prev, [field]: Array.from(current) };
        });
    };

    const resetDriveForm = () => {
        setDriveForm(emptyDriveForm);
        setEditingDriveId(null);
    };

    const handleSaveDrive = async (event) => {
        event.preventDefault();
        setSavingDrive(true);

        try {
            const payload = {
                ...driveForm,
                companyId: Number(driveForm.companyId)
            };

            if (editingDriveId) {
                await api.put(`/placement/coordinator/drives/${editingDriveId}`, payload);
            } else {
                await api.post('/placement/coordinator/drives', payload);
            }

            setSelectedDriveId(null);
            resetDriveForm();
            await fetchPlacementData(true);
            setMessage('success', 'Placement drive saved successfully.');
        } catch (error) {
            console.error('Failed to save drive', error);
            setMessage('error', 'Failed to save placement drive.');
        } finally {
            setSavingDrive(false);
        }
    };

    const handleEditDrive = (drive) => {
        setEditingDriveId(drive.id);
        setDriveForm({
            companyId: drive.companyId || '',
            roleTitle: drive.roleTitle || '',
            driveDate: drive.driveDate || '',
            location: drive.location || '',
            eligibilityCriteria: drive.eligibilityCriteria || '',
            description: drive.description || '',
            status: drive.status || 'PLANNED',
            eligibleStudentUids: (drive.eligibleStudents || []).map((student) => student.uid),
            appliedStudentUids: (drive.appliedStudents || []).map((student) => student.uid),
            selectedStudentUids: (drive.selectedStudents || []).map((student) => student.uid)
        });
    };

    const handleDeleteDrive = async (driveId) => {
        if (!window.confirm('Delete this placement drive?')) return;
        try {
            await api.delete(`/placement/coordinator/drives/${driveId}`);
            setSelectedDriveId((current) => (current === driveId ? null : current));
            await fetchPlacementData(true);
            setMessage('success', 'Placement drive deleted successfully.');
        } catch (error) {
            console.error('Failed to delete drive', error);
            setMessage('error', 'Failed to delete placement drive.');
        }
    };

    const openDriveEditor = (drive = null) => {
        if (drive) {
            handleEditDrive(drive);
        } else {
            resetDriveForm();
        }
        driveFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleViewApplicants = (drive) => {
        setSelectedDriveId(drive.id);
    };

    const handleReviewDriveApplication = async (driveId, uid, status) => {
        const coordinatorRemarks = window.prompt('Add review remarks (optional):', '') ?? '';
        setReviewingApplication(`${driveId}:${uid}:${status}`);
        try {
            await api.put(`/placement/coordinator/drives/${driveId}/applications/${uid}`, {
                status,
                coordinatorRemarks
            });
            await fetchPlacementData(true);
            setSelectedDriveId(driveId);
            setMessage('success', `Application marked as ${status}.`);
        } catch (error) {
            console.error('Failed to review application', error);
            setMessage('error', 'Failed to update application review status.');
        } finally {
            setReviewingApplication(null);
        }
    };

    const handleExportDriveApplicants = (drive, format = 'xlsx') => {
        const rows = (drive?.applications || [])
            .filter((application) => ['APPLIED', 'SHORTLISTED', 'REJECTED'].includes(application.applicationStatus));
        if (!rows.length) {
            setMessage('error', 'No applied student data available to export.');
            return;
        }

        exportData({
            format,
            fileName: `${drive.companyName}_${drive.roleTitle}_applicants`,
            title: `${drive.companyName} ${drive.roleTitle} Applicant Database`,
            rows,
            columns: [
                { header: 'Name', key: 'name' },
                { header: 'UID', key: 'uid' },
                { header: 'Roll Number', key: 'rollNumber' },
                { header: 'Department', key: 'department' },
                { header: 'Email', key: 'email' },
                { header: 'CGPA', key: 'cgpaScore' },
                { header: 'Readiness', key: 'readinessScore' },
                { header: 'Resume Review', key: 'resumeReviewStatus' },
                { header: 'Application Status', key: 'applicationStatus' },
                { header: 'Coordinator Remarks', key: 'coordinatorRemarks' },
                { header: 'Resume URL', key: 'resumeUrl' }
            ],
            sheetName: 'Applicants'
        });
        setMessage('success', 'Applicant database exported successfully.');
    };

    if (!canManagePlacement) {
        return (
            <div className="placement-coordinator-page">
                <div className="placement-coordinator-empty">
                    <ShieldCheck size={40} />
                    <h1>Placement Coordinator Access Required</h1>
                    <p>This module is available only to placement coordinators and admins.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="placement-coordinator-page">
                <div className="placement-coordinator-empty">
                    <Loader2 size={36} className="pc-spin" />
                    <p>Loading placement coordinator dashboard...</p>
                </div>
            </div>
        );
    }


    const renderActivePage = () => {
        if (activeSection === 'students') {
            return (
                <PlacementStudentsPage
                    departmentFilter={departmentFilter}
                    departmentOptions={departmentOptions}
                    filteredStudents={filteredStudents}
                    getReadinessBand={getReadinessBand}
                    handleSort={handleSort}
                    onRefresh={fetchPlacementData}
                    placementStatusFilter={placementStatusFilter}
                    placementStatusOptions={PLACEMENT_STATUS_OPTIONS}
                    readinessFilter={readinessFilter}
                    readinessOptions={READINESS_OPTIONS}
                    refreshing={refreshing}
                    searchTerm={searchTerm}
                    setDepartmentFilter={setDepartmentFilter}
                    setPlacementStatusFilter={setPlacementStatusFilter}
                    setReadinessFilter={setReadinessFilter}
                    setSearchTerm={setSearchTerm}
                    setSelectedStudent={setSelectedStudent}
                    studentManagementMetrics={studentManagementMetrics}
                />
            );
        }

        if (activeSection === 'drives') {
            return (
                <PlacementDrivesPage
                    companies={companies}
                    companyForm={companyForm}
                    companyStatusOptions={COMPANY_STATUS_OPTIONS}
                    driveForm={driveForm}
                    driveFormRef={driveFormRef}
                    driveSearchTerm={driveSearchTerm}
                    driveStatusFilter={driveStatusFilter}
                    driveStatusOptions={DRIVE_STATUS_OPTIONS}
                    driveTypeFilter={driveTypeFilter}
                    editingCompanyId={editingCompanyId}
                    editingDriveId={editingDriveId}
                    filteredDrives={filteredDrives}
                    formatDriveDate={formatDriveDate}
                    formatDriveType={formatDriveType}
                    getDriveType={getDriveType}
                    handleCompanyFieldChange={handleCompanyFieldChange}
                    handleDeleteCompany={handleDeleteCompany}
                    handleDeleteDrive={handleDeleteDrive}
                    handleDriveFieldChange={handleDriveFieldChange}
                    handleEditCompany={handleEditCompany}
                    handleSaveCompany={handleSaveCompany}
                    handleSaveDrive={handleSaveDrive}
                    handleExportDriveApplicants={handleExportDriveApplicants}
                    handleReviewDriveApplication={handleReviewDriveApplication}
                    handleViewApplicants={handleViewApplicants}
                    onRefresh={fetchPlacementData}
                    openDriveEditor={openDriveEditor}
                    reviewingApplication={reviewingApplication}
                    refreshing={refreshing}
                    resetCompanyForm={resetCompanyForm}
                    resetDriveForm={resetDriveForm}
                    savingCompany={savingCompany}
                    savingDrive={savingDrive}
                    selectedDrive={selectedDrive}
                    setDriveSearchTerm={setDriveSearchTerm}
                    setDriveStatusFilter={setDriveStatusFilter}
                    setDriveTypeFilter={setDriveTypeFilter}
                    students={students}
                    toggleDriveStudent={toggleDriveStudent}
                />
            );
        }

        if (activeSection === 'analytics') {
            return (
                <PlacementAnalyticsPage
                    analyticsSummary={analyticsSummary}
                    departmentPlacementRows={departmentPlacementRows}
                    monthlyHiringTrendData={monthlyHiringTrendData}
                    packageDistributionData={packageDistributionData}
                    recruiterBreakdown={recruiterBreakdown}
                />
            );
        }

        return (
            <PlacementOverviewPage
                analyticsSummary={analyticsSummary}
                departmentOptions={departmentOptions}
                drives={drives}
                navigate={navigate}
                placementStatsData={placementStatsData}
                skillsDistributionData={skillsDistributionData}
                studentManagementMetrics={studentManagementMetrics}
            />
        );
    };

    return (
        <div className="placement-coordinator-page">
            <input
                ref={importInputRef}
                type="file"
                accept=".csv,.xlsx"
                hidden
                onChange={handleImportFile}
            />

            <PlacementPageHero
                activeSection={activeSection}
                analyticsYear={analyticsYear}
                importing={importing}
                refreshing={refreshing}
                onAnalyticsYearChange={setAnalyticsYear}
                onExportDrives={handleExportDrives}
                onExportStudents={handleExportStudents}
                onImportClick={handleImportClick}
                onOpenDriveEditor={openDriveEditor}
                onRefresh={fetchPlacementData}
            />

            {statusMessage && (
                <div className={`pc-status-banner ${statusMessage.type}`}>
                    {statusMessage.text}
                </div>
            )}

            <PlacementStatsGrid
                activeSection={activeSection}
                dashboard={dashboard}
                formatScore={formatScore}
                onOpenStudents={() => navigate('/placement-coordinator/students')}
            />

            {renderActivePage()}

            <StudentEditModal
                placementStatusOptions={PLACEMENT_STATUS_OPTIONS}
                resumeReviewOptions={RESUME_REVIEW_OPTIONS}
                savingStudent={savingStudent}
                selectedStudent={selectedStudent}
                studentForm={studentForm}
                onClose={() => setSelectedStudent(null)}
                onFieldChange={handleStudentFieldChange}
                onSave={handleSaveStudent}
            />
        </div>
    );
};

export default PlacementCoordinatorDashboard;
