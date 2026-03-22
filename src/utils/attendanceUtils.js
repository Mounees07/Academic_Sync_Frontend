export const resolveSemesterStartDate = (settings) => {
    const configuredDate = settings?.['policy.attendance.semesterStartDate'];
    if (!configuredDate) {
        return null;
    }

    const parsedDate = new Date(configuredDate);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
};

export const countWorkingDays = (from, to = new Date()) => {
    if (!from) {
        return 0;
    }

    let count = 0;
    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) {
        return 0;
    }

    while (cur <= end) {
        if (cur.getDay() !== 0 && cur.getDay() !== 6) {
            count++;
        }
        cur.setDate(cur.getDate() + 1);
    }

    return count;
};

const normalizeRecordDate = (value) => {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
};

const isPresentStatus = (status) => ['PRESENT', 'LATE'].includes((status || '').toUpperCase());

export const calculateAttendance = (attendanceRecords = [], semesterStartDate = null) => {
    if (!semesterStartDate) {
        return { percentage: 0, presentDays: 0, absentDays: 0, totalWorkingDays: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(semesterStartDate);
    startDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(startDate.getTime()) || startDate > today) {
        return { percentage: 0, presentDays: 0, absentDays: 0, totalWorkingDays: 0 };
    }

    const totalWorkingDays = countWorkingDays(startDate, today);
    const presentDays = new Set(
        attendanceRecords
            .filter((record) => isPresentStatus(record?.status))
            .map((record) => normalizeRecordDate(record?.date))
            .filter((recordDate) => {
                return recordDate && recordDate >= startDate && recordDate <= today;
            })
            .map((recordDate) => recordDate.toISOString().slice(0, 10))
    ).size;
    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const rawPercentage = totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 100)
        : 0;
    const percentage = Math.min(100, Math.max(0, rawPercentage));

    return { percentage, presentDays, absentDays, totalWorkingDays };
};
