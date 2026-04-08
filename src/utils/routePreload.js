const routeImporters = {
    '/student/dashboard': () => import('../pages/DashboardOverview'),
    '/teacher/dashboard': () => import('../pages/mentor/MentorDashboard'),
    '/mentor/dashboard': () => import('../pages/mentor/MentorDashboard'),
    '/hod/dashboard': () => import('../pages/hod/HODDashboard'),
    '/admin/dashboard': () => import('../pages/admin/AdminDashboard'),
    '/placement-coordinator/dashboard': () => import('../pages/placement/PlacementCoordinatorDashboard'),
    '/coe/dashboard': () => import('../pages/coe/COEDashboard'),
    '/gate/dashboard': () => import('../pages/gate/GateDashboard'),
    '/student/academic': () => import('../pages/student/StudentAcademic'),
    '/attendance': () => import('../pages/student/StudentAttendance'),
    '/student/leaves': () => import('../pages/student/StudentLeaves'),
    '/teacher/courses': () => import('../pages/teacher/TeacherCourseCatalog'),
    '/teacher/marking-attendance': () => import('../pages/teacher/TeacherAttendanceLog'),
    '/grading': () => import('../pages/teacher/TeacherGrading'),
    '/schedule': () => import('../components/ScheduleView'),
    '/mentees': () => import('../pages/mentor/Mentees'),
    '/mentor/leaves': () => import('../pages/mentor/MentorLeaves'),
    '/mentor/attendance': () => import('../pages/mentor/MentorAttendance'),
    '/faculty-leaves': () => import('../pages/mentor/FacultyLeaves'),
    '/meetings': () => import('../pages/mentor/MentorMeetings'),
    '/department-analytics': () => import('../pages/hod/HODAnalytics'),
    '/mentorship-management': () => import('../pages/hod/MentorshipManagement'),
    '/hod/faculty-leaves': () => import('../pages/hod/HODLeaveApprovals'),
    '/hod/schedule-upload': () => import('../pages/hod/HODScheduleUpload'),
    '/admin/students': () => import('../pages/admin/AdminStudentList'),
    '/admin/users': () => import('../pages/admin/AdminUserList'),
    '/admin/finance': () => import('../pages/admin/AdminFinance'),
    '/admin/faculty-leaves': () => import('../pages/admin/AdminLeaveApprovals'),
    '/admin/courses': () => import('../pages/admin/AdminCourseManagement'),
    '/admin/reports': () => import('../pages/admin/AdminDataReports'),
    '/admin/settings': () => import('../pages/admin/AdminSettings'),
    '/placement-coordinator/students': () => import('../pages/placement/PlacementCoordinatorDashboard'),
    '/placement-coordinator/assessments': () => import('../pages/placement/PlacementCoordinatorDashboard'),
    '/placement-coordinator/drives': () => import('../pages/placement/PlacementCoordinatorDashboard'),
    '/placement-coordinator/analytics': () => import('../pages/placement/PlacementCoordinatorDashboard'),
    '/coe/schedule-exams': () => import('../pages/coe/COEExamSchedule'),
    '/coe/seating-allocation': () => import('../pages/coe/COESeatingAllocation'),
    '/coe/publish-results': () => import('../pages/coe/COEResultPublish'),
    '/gate/visitor-log': () => import('../pages/gate/VisitorLog'),
    '/gate/student-entry': () => import('../pages/gate/GateStudentEntry'),
    '/my-profile': () => import('../pages/MyProfile'),
    '/academic-calendar': () => import('../pages/AcademicCalendar'),
    '/student/notifications': () => import('../pages/student/StudentNotifications'),
};

const roleRouteWarmups = {
    STUDENT: [
        '/student/dashboard',
        '/student/academic',
        '/attendance',
        '/student/leaves',
        '/student/notifications',
        '/my-profile',
    ],
    TEACHER: [
        '/teacher/dashboard',
        '/teacher/courses',
        '/teacher/marking-attendance',
        '/grading',
        '/schedule',
        '/my-profile',
    ],
    MENTOR: [
        '/mentor/dashboard',
        '/teacher/courses',
        '/mentees',
        '/mentor/leaves',
        '/faculty-leaves',
        '/meetings',
        '/schedule',
        '/my-profile',
    ],
    HOD: [
        '/hod/dashboard',
        '/department-analytics',
        '/mentorship-management',
        '/hod/faculty-leaves',
        '/hod/schedule-upload',
        '/my-profile',
    ],
    ADMIN: [
        '/admin/dashboard',
        '/admin/students',
        '/admin/users',
        '/admin/finance',
        '/admin/courses',
        '/admin/settings',
        '/my-profile',
    ],
    PLACEMENT_COORDINATOR: [
        '/placement-coordinator/dashboard',
        '/placement-coordinator/students',
        '/placement-coordinator/assessments',
        '/placement-coordinator/drives',
        '/placement-coordinator/analytics',
        '/my-profile',
    ],
    COE: [
        '/coe/dashboard',
        '/coe/schedule-exams',
        '/coe/seating-allocation',
        '/coe/publish-results',
        '/my-profile',
    ],
    GATE_SECURITY: [
        '/gate/dashboard',
        '/gate/visitor-log',
        '/gate/student-entry',
        '/my-profile',
    ],
};

const preloadedRoutes = new Set();

const dashboardPathByRole = {
    STUDENT: '/student/dashboard',
    TEACHER: '/teacher/dashboard',
    MENTOR: '/mentor/dashboard',
    HOD: '/hod/dashboard',
    ADMIN: '/admin/dashboard',
    PLACEMENT_COORDINATOR: '/placement-coordinator/dashboard',
    COE: '/coe/dashboard',
    GATE_SECURITY: '/gate/dashboard',
};

const normalizeRoute = (path, role) => {
    if (!path) {
        return null;
    }

    if (path === '/dashboard') {
        return dashboardPathByRole[role] || '/student/dashboard';
    }

    return path;
};

export const preloadRoute = (path, role) => {
    const normalizedPath = normalizeRoute(path, role);
    const importer = normalizedPath ? routeImporters[normalizedPath] : null;

    if (!importer || preloadedRoutes.has(normalizedPath)) {
        return Promise.resolve();
    }

    preloadedRoutes.add(normalizedPath);

    return importer().catch((error) => {
        preloadedRoutes.delete(normalizedPath);
        console.warn(`Route preload failed for ${normalizedPath}`, error);
    });
};

export const preloadRoleRoutes = (role) => {
    const routes = roleRouteWarmups[role];

    if (!routes?.length) {
        return () => {};
    }

    const runPreload = () => {
        routes.forEach((path) => {
            void preloadRoute(path, role);
        });
    };

    if (typeof window === 'undefined') {
        runPreload();
        return () => {};
    }

    if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(runPreload, { timeout: 1500 });
        return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(runPreload, 250);
    return () => window.clearTimeout(timeoutId);
};
