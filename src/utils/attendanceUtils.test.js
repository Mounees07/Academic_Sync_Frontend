/**
 * Unit tests for attendanceUtils.js — Vitest version.
 *
 * Ported from the original node:test version to use Vitest
 * describe/it/expect so they run together with the rest of the test suite.
 */

import { describe, it, expect } from 'vitest';
import {
    calculateAttendance,
    countWorkingDays,
    resolveSemesterStartDate,
} from './attendanceUtils.js';

// ─── helper: freeze "today" for deterministic tests ──────────────────────────
const withMockedToday = (isoDate, run) => {
    const RealDate = Date;
    const fixedNow = new RealDate(isoDate);

    class MockDate extends RealDate {
        constructor(value) {
            if (value !== undefined) { super(value); return; }
            super(fixedNow);
        }
        static now() { return fixedNow.getTime(); }
    }

    globalThis.Date = MockDate;
    try { run(); } finally { globalThis.Date = RealDate; }
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveSemesterStartDate
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveSemesterStartDate', () => {
    it('returns a normalised midnight Date for a valid config value', () => {
        const result = resolveSemesterStartDate({
            'policy.attendance.semesterStartDate': '2026-03-10T13:45:00',
        });

        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(2);   // 0-indexed: March = 2
        expect(result.getDate()).toBe(10);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
    });

    it('returns null when the setting key is absent', () => {
        expect(resolveSemesterStartDate({})).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(
            resolveSemesterStartDate({ 'policy.attendance.semesterStartDate': 'not-a-date' })
        ).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// countWorkingDays
// ─────────────────────────────────────────────────────────────────────────────
describe('countWorkingDays', () => {
    it('counts only weekdays within the date range', () => {
        // Mon 16 Mar – Sun 22 Mar 2026 → 5 working days (Mon–Fri)
        const result = countWorkingDays(new Date('2026-03-16'), new Date('2026-03-22'));
        expect(result).toBe(5);
    });

    it('returns 0 for a null start date', () => {
        expect(countWorkingDays(null, new Date('2026-03-22'))).toBe(0);
    });

    it('returns 0 for an invalid start date', () => {
        expect(countWorkingDays(new Date('invalid'), new Date('2026-03-22'))).toBe(0);
    });

    it('returns 0 when start is after end (reversed range)', () => {
        expect(countWorkingDays(new Date('2026-03-23'), new Date('2026-03-22'))).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateAttendance
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateAttendance', () => {
    it('deduplicates present days and ignores weekends / absences', () => {
        withMockedToday('2026-03-23T10:00:00', () => {
            const result = calculateAttendance(
                [
                    { date: '2026-03-17', status: 'PRESENT' },
                    { date: '2026-03-17', status: 'LATE' },    // dupe — same day
                    { date: '2026-03-18', status: 'late' },    // case-insensitive
                    { date: '2026-03-21', status: 'PRESENT' },
                    { date: '2026-03-19', status: 'ABSENT' },  // absent — not counted
                    { date: '2026-03-25', status: 'PRESENT' }, // future — excluded
                ],
                new Date('2026-03-17')
            );

            expect(result).toEqual({
                percentage:       40,
                presentDays:      2,
                absentDays:       3,
                totalWorkingDays: 5,
            });
        });
    });

    it('returns zero stats when semester start date is null', () => {
        withMockedToday('2026-03-23T10:00:00', () => {
            expect(calculateAttendance([], null)).toEqual({
                percentage: 0, presentDays: 0, absentDays: 0, totalWorkingDays: 0,
            });
        });
    });

    it('returns zero stats when semester start is in the future', () => {
        withMockedToday('2026-03-23T10:00:00', () => {
            expect(calculateAttendance([], new Date('2026-03-30'))).toEqual({
                percentage: 0, presentDays: 0, absentDays: 0, totalWorkingDays: 0,
            });
        });
    });
});
