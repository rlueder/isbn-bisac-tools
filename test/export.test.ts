import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Category } from '../src/types/index.js';
import { exportBISACData, ExportFormat, ExportOptions } from '../src/export/index.js';

describe('Export Functionality', () => {
  let tempDir: string;
  const testData: Category[] = [
    {
      heading: 'FICTION',
      notes: [],
      subjects: [
        { code: 'FIC000000', label: 'FICTION / General' },
        { code: 'FIC002000', label: 'FICTION / Action & Adventure' },
      ],
    },
    {
      heading: 'SCIENCE',
      notes: [],
      subjects: [
        { code: 'SCI000000', label: 'SCIENCE / General' },
        { code: 'SCI055000', label: 'SCIENCE / Physics' },
      ],
    },
  ];

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'bisac-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should export data to CSV format', async () => {
    const options: ExportOptions = {
      format: 'csv',
      filepath: join(tempDir, 'test.csv'),
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(4);

    if (options.filepath) {
      const content = await readFile(options.filepath, 'utf-8');
      expect(content).toContain('"code","heading","label"');
      expect(content).toContain('"FIC000000","FICTION","FICTION / General"');
      expect(content).toContain('"SCI055000","SCIENCE","SCIENCE / Physics"');
    }
  });

  it('should export data to Excel format', async () => {
    const options: ExportOptions = {
      format: 'excel',
      filepath: join(tempDir, 'test.xlsx'),
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(4);

    if (options.filepath) {
      const exists = await readFile(options.filepath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it('should export data to XML format', async () => {
    const options: ExportOptions = {
      format: 'xml',
      filepath: join(tempDir, 'test.xml'),
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(4);

    if (options.filepath) {
      const content = await readFile(options.filepath, 'utf-8');
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<bisac>');
      expect(content).toContain('<category>');
      expect(content).toContain('<heading>FICTION</heading>');
      expect(content).toContain('<code>FIC000000</code>');
    }
  });

  it('should handle custom field mappings', async () => {
    const options: ExportOptions = {
      format: 'csv',
      filepath: join(tempDir, 'test-mapped.csv'),
      customMapping: {
        code: 'BISAC_CODE',
        heading: 'CATEGORY',
        label: 'DESCRIPTION',
      },
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);

    if (options.filepath) {
      const content = await readFile(options.filepath, 'utf-8');
      expect(content).toContain('"BISAC_CODE","CATEGORY","DESCRIPTION"');
    }
  });

  it('should handle format-specific options', async () => {
    const options: ExportOptions = {
      format: 'csv',
      filepath: join(tempDir, 'test-options.csv'),
      formatOptions: {
        csv: {
          delimiter: ';',
          quote: "'",
          escape: "'",
        },
      },
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);

    if (options.filepath) {
      const content = await readFile(options.filepath, 'utf-8');
      // Check that the custom delimiter and quote are used
      expect(content).toContain("'code';'heading';'label'");
      expect(content).toContain("'FIC000000';'FICTION';'FICTION / General'");
    }
  });

  it('should return error for unsupported format', async () => {
    const options = {
      format: 'pdf' as ExportFormat, // Type assertion for test
      filepath: join(tempDir, 'test.pdf'),
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Unsupported export format');
  });

  it('should handle empty data gracefully', async () => {
    const options: ExportOptions = {
      format: 'csv',
      filepath: join(tempDir, 'empty.csv'),
    };

    const result = await exportBISACData([], options);
    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(0);
  });

  it('should return file content without saving when no filepath provided', async () => {
    const options: ExportOptions = {
      format: 'csv',
    };

    const result = await exportBISACData(testData, options);
    expect(result.success).toBe(true);
    expect(result.filepath).toBeUndefined();
  });
});
