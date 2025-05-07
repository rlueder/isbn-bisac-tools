import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as utils from '../lib/utils.js';
import { Category } from '../src/types/index.js';

// Mock fs
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    access: vi.fn(),
    stat: vi.fn().mockResolvedValue({
      mtime: new Date('2023-01-01T00:00:00Z'),
    }),
    copyFile: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock glob
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
  promisify: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ stdout: '{}' })),
}));

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock console.log and console.error
const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('BISAC JSON Comparison Features', () => {
  // Test data for comparison tests
  const oldData: Category[] = [
    {
      heading: 'FICTION',
      notes: ['Note for FICTION'],
      subjects: [
        { code: 'FIC000000', label: 'FICTION / General' },
        { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
        { code: 'FIC002000', label: 'FICTION / Classics' },
      ],
    },
    {
      heading: 'NON-FICTION',
      notes: ['Note for NON-FICTION'],
      subjects: [
        { code: 'NON000000', label: 'NON-FICTION / General' },
        { code: 'NON001000', label: 'NON-FICTION / Biography' },
      ],
    },
  ];

  const newData: Category[] = [
    {
      heading: 'FICTION',
      notes: ['Updated note for FICTION'],
      subjects: [
        { code: 'FIC000000', label: 'FICTION / General' }, // Same
        { code: 'FIC001000', label: 'FICTION / Adventure' }, // Modified label
        { code: 'FIC003000', label: 'FICTION / Fantasy' }, // New subject
      ],
    },
    {
      heading: 'NON-FICTION',
      notes: ['Note for NON-FICTION'],
      subjects: [
        { code: 'NON000000', label: 'NON-FICTION / General' },
        { code: 'NON001000', label: 'NON-FICTION / Biography' },
      ],
    },
    {
      heading: 'POETRY',
      notes: ['Note for POETRY'],
      subjects: [{ code: 'POE000000', label: 'POETRY / General' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('checkExistingJsonFileForToday', () => {
    it('should return undefined if file for today does not exist', async () => {
      // Mock fs.access to throw error (file doesn't exist)
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('File not found'));

      const result = await utils.checkExistingJsonFileForToday('/test/data');

      expect(result).toBeUndefined();
      expect(fs.access).toHaveBeenCalledTimes(1);
    });

    it('should return file path if file exists', async () => {
      // Mock fs.access to resolve (file exists)
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const expectedPath = path.join('/test/data', 'bisac-data.json');
      const result = await utils.checkExistingJsonFileForToday('/test/data');

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledTimes(1);
      expect(fs.access).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('compareBisacJsonFiles', () => {
    it('should correctly compare two JSON files', async () => {
      // Mock readFile to return our test data
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(oldData))
        .mockResolvedValueOnce(JSON.stringify(newData));

      const result = await utils.compareBisacJsonFiles(
        '/test/data/bisac-data-backup-2023-01-01.json',
        '/test/data/bisac-data.json'
      );

      // Check that readFile was called to load the files
      expect(fs.readFile).toHaveBeenCalledTimes(2);

      // Verify the comparison results
      expect(result.summary.totalCategoriesOld).toBe(2);
      expect(result.summary.totalCategoriesNew).toBe(3);
      expect(result.summary.newCategories).toBe(1);
      expect(result.summary.removedCategories).toBe(0);
      expect(result.summary.modifiedCategories).toBe(1);
      expect(result.summary.newSubjects).toBe(2); // 1 new in FICTION + 1 new category POETRY
      expect(result.summary.removedSubjects).toBe(1); // FIC002000 was removed
      expect(result.summary.modifiedSubjects).toBe(1); // FIC001000 label changed

      // Verify new categories
      expect(result.newCategories).toHaveLength(1);
      expect(result.newCategories[0].heading).toBe('POETRY');

      // Verify modified categories
      expect(result.modifiedCategories).toHaveLength(1);
      expect(result.modifiedCategories[0].heading).toBe('FICTION');
      expect(result.modifiedCategories[0].newSubjects).toHaveLength(1);
      expect(result.modifiedCategories[0].newSubjects[0].code).toBe('FIC003000');
      expect(result.modifiedCategories[0].removedSubjects).toHaveLength(1);
      expect(result.modifiedCategories[0].removedSubjects[0].code).toBe('FIC002000');
      expect(result.modifiedCategories[0].modifiedSubjects).toHaveLength(1);
      expect(result.modifiedCategories[0].modifiedSubjects[0].code).toBe('FIC001000');
      expect(result.modifiedCategories[0].modifiedSubjects[0].oldLabel).toBe(
        'FICTION / Action & Adventure'
      );
      expect(result.modifiedCategories[0].modifiedSubjects[0].newLabel).toBe('FICTION / Adventure');
    });

    it('should handle empty or invalid JSON files', async () => {
      // Mock readFile to return empty arrays
      vi.mocked(fs.readFile).mockResolvedValueOnce('[]').mockResolvedValueOnce('[]');

      await expect(
        utils.compareBisacJsonFiles('/test/data/empty1.json', '/test/data/empty2.json')
      ).rejects.toThrow('One or both of the JSON files could not be loaded or are empty');
    });

    it('should handle identical JSON files', async () => {
      // Mock readFile to return identical data for both files
      const serializedData = JSON.stringify(oldData);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(serializedData)
        .mockResolvedValueOnce(serializedData);

      const result = await utils.compareBisacJsonFiles(
        '/test/data/identical1.json',
        '/test/data/identical2.json'
      );

      // Verify no differences found
      expect(result.summary.newCategories).toBe(0);
      expect(result.summary.removedCategories).toBe(0);
      expect(result.summary.modifiedCategories).toBe(0);
      expect(result.summary.newSubjects).toBe(0);
      expect(result.summary.removedSubjects).toBe(0);
      expect(result.summary.modifiedSubjects).toBe(0);
      expect(result.newCategories).toHaveLength(0);
      expect(result.removedCategories).toHaveLength(0);
      expect(result.modifiedCategories).toHaveLength(0);
    });
  });

  describe('printComparisonReport', () => {
    it('should print a formatted comparison report', async () => {
      // Create a mock comparison result
      const mockComparison = {
        oldFilePath: '/test/data/bisac-data-backup-2023-01-01.json',
        newFilePath: '/test/data/bisac-data.json',
        oldDate: '2023-01-01',
        newDate: '2023-02-01',
        summary: {
          totalCategoriesOld: 2,
          totalCategoriesNew: 3,
          totalSubjectsOld: 5,
          totalSubjectsNew: 6,
          newCategories: 1,
          removedCategories: 0,
          modifiedCategories: 1,
          newSubjects: 2,
          removedSubjects: 1,
          modifiedSubjects: 1,
        },
        newCategories: [{ heading: 'POETRY', subjectCount: 1 }],
        removedCategories: [],
        modifiedCategories: [
          {
            heading: 'FICTION',
            newSubjects: [{ code: 'FIC003000', label: 'FICTION / Fantasy' }],
            removedSubjects: [{ code: 'FIC002000', label: 'FICTION / Classics' }],
            modifiedSubjects: [
              {
                code: 'FIC001000',
                oldLabel: 'FICTION / Action & Adventure',
                newLabel: 'FICTION / Adventure',
              },
            ],
          },
        ],
      };

      await utils.printComparisonReport(mockComparison);

      // Verify that console.log was called multiple times to print the report
      expect(consoleLogMock).toHaveBeenCalled();

      // Check for key report sections - we'll check for some important headings
      const allCalls = consoleLogMock.mock.calls.flat().join('\n');
      expect(allCalls).toContain('BISAC Subject Headings Comparison Report');
      expect(allCalls).toContain('Comparing data from 2023-01-01 to 2023-02-01');
      expect(allCalls).toContain('Summary:');

      // Reset the mock
      consoleLogMock.mockClear();
    });
  });

  describe('selectFilesForComparison', () => {
    it('should handle the case of having fewer than 2 files', async () => {
      // Mock glob to return fewer than 2 files
      const { glob } = await import('glob');
      vi.mocked(glob).mockResolvedValueOnce(['/test/data/bisac-data-backup-2023-01-01.json']);

      const result = await utils.selectFilesForComparison('/test/data');

      expect(result).toBeUndefined();
      expect(consoleErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Need at least two BISAC JSON files for comparison')
      );
    });

    it('should prompt user to select files when multiple files exist', async () => {
      // Mock glob to return multiple files
      const { glob } = await import('glob');
      vi.mocked(glob).mockResolvedValueOnce([
        '/test/data/bisac-data-backup-2023-01-01.json',
        '/test/data/bisac-data-backup-2023-02-01.json',
        '/test/data/bisac-data.json',
      ]);

      // Mock inquirer.prompt to return selected files
      const { default: inquirer } = await import('inquirer');
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ newerFile: '/test/data/bisac-data.json' })
        .mockResolvedValueOnce({ olderFile: '/test/data/bisac-data-backup-2023-01-01.json' });

      const result = await utils.selectFilesForComparison('/test/data');

      expect(result).toEqual({
        newerFile: '/test/data/bisac-data.json',
        olderFile: '/test/data/bisac-data-backup-2023-01-01.json',
      });
      expect(inquirer.prompt).toHaveBeenCalledTimes(2);
    });
  });
});
