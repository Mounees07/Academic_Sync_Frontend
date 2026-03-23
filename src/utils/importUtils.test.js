/**
 * Unit tests for importUtils.js
 *
 * Tests validate:
 *  - parseSpreadsheetFile: file type gating, XLSX parsing via mock, header normalisation
 *  - validateImportedRows: empty-array guard, missing-column guard, missing-value guard
 *
 * XLSX.read is mocked so tests run without actual binary files.
 */

import { describe, it, expect, vi } from 'vitest';

// ─── Mock xlsx ───────────────────────────────────────────────────────────────
const mockRead = vi.fn();
const mockSheetToJson = vi.fn();

vi.mock('xlsx', () => ({
    read: (...args) => mockRead(...args),
    utils: {
        sheet_to_json: (...args) => mockSheetToJson(...args),
    },
}));

import { parseSpreadsheetFile, validateImportedRows } from './importUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeFile(name, content = '') {
    const blob = new Blob([content]);
    return new File([blob], name);
}

// ─────────────────────────────────────────────────────────────────────────────
// parseSpreadsheetFile
// ─────────────────────────────────────────────────────────────────────────────
describe('parseSpreadsheetFile', () => {
    it('throws when no file is provided', async () => {
        await expect(parseSpreadsheetFile(null)).rejects.toThrow('Please choose a file');
    });

    it('throws for unsupported file extensions', async () => {
        const file = makeFile('data.pdf');
        await expect(parseSpreadsheetFile(file)).rejects.toThrow('Only CSV and XLSX files');
    });

    it('throws when the workbook has no sheet', async () => {
        mockRead.mockReturnValue({ SheetNames: [], Sheets: {} });

        const file = makeFile('data.xlsx');
        await expect(parseSpreadsheetFile(file)).rejects.toThrow('does not contain any readable sheet');
    });

    it('normalises column headers to snake_case', async () => {
        const rawRows = [{ 'Full Name': 'Alice', 'Roll No': '001' }];
        mockRead.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} },
        });
        mockSheetToJson.mockReturnValue(rawRows);

        const file = makeFile('students.csv');
        const result = await parseSpreadsheetFile(file);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('full_name', 'Alice');
        expect(result[0]).toHaveProperty('roll_no', '001');
    });

    it('accepts .xlsx extension', async () => {
        mockRead.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });
        mockSheetToJson.mockReturnValue([]);

        const file = makeFile('data.xlsx');
        await expect(parseSpreadsheetFile(file)).resolves.toEqual([]);
    });

    it('accepts .csv extension', async () => {
        mockRead.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });
        mockSheetToJson.mockReturnValue([]);

        const file = makeFile('data.csv');
        await expect(parseSpreadsheetFile(file)).resolves.toEqual([]);
    });

    it('strips leading/trailing underscores from normalised header', async () => {
        mockRead.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });
        mockSheetToJson.mockReturnValue([{ '  Roll Number  ': '7' }]);

        const file = makeFile('data.csv');
        const result = await parseSpreadsheetFile(file);

        // '  Roll Number  ' → trim → 'Roll Number' → lower → 'roll number' → replace spaces → 'roll_number'
        expect(Object.keys(result[0])[0]).toBe('roll_number');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateImportedRows
// ─────────────────────────────────────────────────────────────────────────────
describe('validateImportedRows', () => {
    it('throws when rows array is empty', () => {
        expect(() => validateImportedRows([], ['name'])).toThrow('empty');
    });

    it('throws when rows is not an array', () => {
        expect(() => validateImportedRows(null, ['name'])).toThrow('empty');
    });

    it('throws when a required column is missing from the first row', () => {
        const rows = [{ roll_number: '001' }];
        expect(() => validateImportedRows(rows, ['roll_number', 'full_name'])).toThrow(
            'Missing required columns'
        );
    });

    it('throws when a required field value is blank in any row', () => {
        const rows = [
            { roll_number: '001', full_name: 'Alice' },
            { roll_number: '',    full_name: 'Bob' },
        ];
        expect(() => validateImportedRows(rows, ['roll_number', 'full_name'])).toThrow(
            'Row 3 is missing'
        );
    });

    it('returns rows unchanged when all required fields are present', () => {
        const rows = [
            { roll_number: '001', full_name: 'Alice' },
            { roll_number: '002', full_name: 'Bob' },
        ];
        const result = validateImportedRows(rows, ['roll_number', 'full_name']);
        expect(result).toStrictEqual(rows);
    });

    it('normalises requiredFields before checking (matches header normalisation)', () => {
        // Rows have normalised keys; caller may pass un-normalised field names
        const rows = [{ roll_number: '001', full_name: 'Alice' }];
        // Passing 'Full Name' should still match 'full_name' in the row
        expect(() => validateImportedRows(rows, ['Full Name', 'Roll Number'])).not.toThrow();
    });

    it('passes validation with no required fields specified', () => {
        const rows = [{ any: 'value' }];
        expect(() => validateImportedRows(rows, [])).not.toThrow();
    });
});
