/**
 * Unit tests for exportUtils.js — Vitest version.
 *
 * jsPDF, jspdf-autotable, and xlsx are mocked so tests run
 * fully offline and without a browser.
 *
 * KEY: `jsPDF` is used with `new` so the mock MUST return a proper
 * constructor (a function declared with `function`, not an arrow).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── jsPDF mock ───────────────────────────────────────────────────────────────
vi.mock('jspdf', () => {
    // stubs captured in closure so test can inspect them
    const mockSave        = vi.fn();
    const mockText        = vi.fn();
    const mockSetFontSize = vi.fn();

    // `new jsPDF(...)` requires a real constructor function
    function MockJsPDF() {
        this.setFontSize = mockSetFontSize;
        this.text        = mockText;
        this.save        = mockSave;
    }

    return {
        jsPDF:             MockJsPDF,
        __mockSave:        mockSave,
        __mockText:        mockText,
        __mockSetFontSize: mockSetFontSize,
    };
});

// ─── jspdf-autotable mock ─────────────────────────────────────────────────────
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

// ─── xlsx mock ────────────────────────────────────────────────────────────────
vi.mock('xlsx', () => {
    const mockWriteFile       = vi.fn();
    const mockAoaToSheet      = vi.fn(() => ({}));
    const mockBookNew         = vi.fn(() => ({}));
    const mockBookAppendSheet = vi.fn();

    return {
        utils: {
            aoa_to_sheet:     mockAoaToSheet,
            book_new:         mockBookNew,
            book_append_sheet: mockBookAppendSheet,
        },
        writeFile:             mockWriteFile,
        __mockWriteFile:       mockWriteFile,
        __mockAoaToSheet:      mockAoaToSheet,
        __mockBookAppendSheet: mockBookAppendSheet,
    };
});

// ─── Stub browser globals ─────────────────────────────────────────────────────
global.URL.createObjectURL = vi.fn(() => 'blob:mock');
global.URL.revokeObjectURL = vi.fn();

// Import module under test (after mocks)
import {
    exportToCsv,
    exportToXlsx,
    exportToPdf,
    exportData,
} from './exportUtils.js';

import * as jspdfMod from 'jspdf';
import * as xlsxMod  from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function withBlobCapture(fn) {
    const blobs    = [];
    const OrigBlob = global.Blob;

    class CaptureBob {
        constructor(parts, opts) { this._parts = parts; this._opts = opts; blobs.push(this); }
        async text() { return this._parts.join(''); }
    }

    global.Blob = CaptureBob;
    fn();
    global.Blob = OrigBlob;
    return blobs;
}

function withAnchorCapture(fn) {
    const anchors    = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
            const el = { href: '', download: '', click: vi.fn() };
            anchors.push(el);
            return el;
        }
        return origCreate(tag);
    });
    fn();
    vi.restoreAllMocks();
    return anchors;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────
describe('exportToCsv', () => {
    it('builds correct CSV from string column names', async () => {
        const blobs = withBlobCapture(() =>
            exportToCsv({
                fileName: 'students',
                rows:     [{ name: 'Alice', grade: 'A' }, { name: 'Bob', grade: 'B' }],
                columns:  ['name', 'grade'],
            })
        );
        const lines = (await blobs[0].text()).split('\n');
        expect(lines[0]).toBe('"name","grade"');
        expect(lines[1]).toBe('"Alice","A"');
        expect(lines[2]).toBe('"Bob","B"');
    });

    it('uses a custom accessor function', async () => {
        const blobs = withBlobCapture(() =>
            exportToCsv({
                fileName: 'report',
                rows:     [{ first: 'John', last: 'Doe' }],
                columns:  [{ header: 'Full Name', key: 'full', accessor: (r) => `${r.first} ${r.last}` }],
            })
        );
        expect(await blobs[0].text()).toContain('"John Doe"');
    });

    it('escapes double-quotes in cell values', async () => {
        const blobs = withBlobCapture(() =>
            exportToCsv({ fileName: 'test', rows: [{ note: 'He said "Hi"' }], columns: ['note'] })
        );
        expect(await blobs[0].text()).toContain('"He said ""Hi"""');
    });

    it('sanitizes file name', () => {
        const anchors = withAnchorCapture(() =>
            exportToCsv({ fileName: 'My Students 2026!', rows: [], columns: [] })
        );
        expect(anchors[0].download).toBe('my_students_2026.csv');
    });

    it('falls back to export.csv when fileName is empty', () => {
        const anchors = withAnchorCapture(() =>
            exportToCsv({ fileName: '', rows: [], columns: [] })
        );
        expect(anchors[0].download).toBe('export.csv');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// XLSX
// ─────────────────────────────────────────────────────────────────────────────
describe('exportToXlsx', () => {
    beforeEach(() => {
        xlsxMod.__mockWriteFile.mockClear();
        xlsxMod.__mockAoaToSheet.mockClear();
        xlsxMod.__mockBookAppendSheet.mockClear();
    });

    it('passes correct matrix to XLSX utils', () => {
        exportToXlsx({ fileName: 'grades', rows: [{ subject: 'Math', score: 95 }], columns: ['subject', 'score'] });
        const matrix = xlsxMod.__mockAoaToSheet.mock.calls[0][0];
        expect(matrix[0]).toEqual(['subject', 'score']);
        expect(matrix[1]).toEqual(['Math', 95]);
    });

    it('truncates sheet name to 31 chars', () => {
        exportToXlsx({ fileName: 'test', rows: [], columns: [], sheetName: 'ThisIsAVeryLongSheetNameThatExceedsExcelLimit' });
        const sheetName = xlsxMod.__mockBookAppendSheet.mock.calls[0][2];
        expect(sheetName.length).toBeLessThanOrEqual(31);
    });

    it('writes sanitized filename', () => {
        exportToXlsx({ fileName: 'My Report!!', rows: [], columns: [] });
        expect(xlsxMod.__mockWriteFile.mock.calls[0][1]).toBe('my_report.xlsx');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────
describe('exportToPdf', () => {
    beforeEach(() => {
        jspdfMod.__mockSave.mockClear();
        jspdfMod.__mockText.mockClear();
    });

    it('calls doc.save with sanitized filename', () => {
        exportToPdf({ fileName: 'Annual Report 2026', rows: [], columns: [] });
        expect(jspdfMod.__mockSave).toHaveBeenCalledWith('annual_report_2026.pdf');
    });

    it('writes title text to document', () => {
        exportToPdf({ fileName: 'test', title: 'My Title', rows: [], columns: [] });
        expect(jspdfMod.__mockText.mock.calls[0][0]).toBe('My Title');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// exportData dispatcher
// ─────────────────────────────────────────────────────────────────────────────
describe('exportData', () => {
    beforeEach(() => {
        xlsxMod.__mockWriteFile.mockClear();
        jspdfMod.__mockSave.mockClear();
    });

    it('dispatches xlsx format', () => {
        exportData({ format: 'xlsx', fileName: 'data', rows: [], columns: [] });
        expect(xlsxMod.__mockWriteFile).toHaveBeenCalledOnce();
    });

    it('dispatches pdf format', () => {
        exportData({ format: 'pdf', fileName: 'data', rows: [], columns: [] });
        expect(jspdfMod.__mockSave).toHaveBeenCalledOnce();
    });

    it('defaults to CSV (no throw) for unknown format', () => {
        expect(() => exportData({ format: 'txt', fileName: 'data', rows: [], columns: [] })).not.toThrow();
    });
});
