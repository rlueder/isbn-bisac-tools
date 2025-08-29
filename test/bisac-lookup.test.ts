import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as utils from '../lib/utils.js';
import { Category } from '../src/types/index.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    exists: vi.fn(),
  },
}));

// Mock console.log
const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('BISAC Lookup Functions', () => {
  const mockData: Category[] = [
    {
      heading: 'FICTION',
      notes: ['Note about fiction'],
      subjects: [
        {
          code: 'FIC000000',
          label: 'General',
        },
        {
          code: 'FIC015000',
          label: 'Historical',
        },
        {
          code: 'FIC032000',
          label: 'War & Military',
        },
      ],
    },
    {
      heading: 'ANTIQUES & COLLECTIBLES',
      notes: [],
      subjects: [
        {
          code: 'ANT000000',
          label: 'General',
        },
        {
          code: 'ANT007000',
          label: 'Buttons & Pins',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for readFile
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadBisacData', () => {
    it('should load and parse BISAC data from a JSON file', async () => {
      const result = await utils.loadBisacData('mock-file.json');

      expect(fs.readFile).toHaveBeenCalledWith('mock-file.json', 'utf-8');
      expect(result).toEqual(mockData);
    });

    it('should throw an error when file read fails', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(utils.loadBisacData('non-existent-file.json')).rejects.toThrow(
        'Failed to load BISAC data'
      );

      expect(fs.readFile).toHaveBeenCalledWith('non-existent-file.json', 'utf-8');
      expect(consoleErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Error loading BISAC data')
      );
    });
  });

  describe('getFullLabelFromCode', () => {
    it('should return the full label for a valid code', async () => {
      const result = await utils.getFullLabelFromCode('ANT007000', 'mock-file.json');

      expect(result).toBe('ANTIQUES & COLLECTIBLES / Buttons & Pins');
      expect(fs.readFile).toHaveBeenCalledWith('mock-file.json', 'utf-8');
    });

    it('should return undefined and log a message for an invalid code', async () => {
      const result = await utils.getFullLabelFromCode('XYZ000000', 'mock-file.json');

      expect(result).toBeUndefined();
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('No label found for code: XYZ000000')
      );
    });
  });

  describe('getCodesForHeading', () => {
    it('should return all codes for a valid heading', async () => {
      const result = await utils.getCodesForHeading('FICTION', 'mock-file.json');

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        code: 'FIC000000',
        fullLabel: 'FICTION / General',
      });
      expect(result).toContainEqual({
        code: 'FIC015000',
        fullLabel: 'FICTION / Historical',
      });
      expect(result).toContainEqual({
        code: 'FIC032000',
        fullLabel: 'FICTION / War & Military',
      });
    });

    it('should handle case-insensitive heading search', async () => {
      const result = await utils.getCodesForHeading('fiction', 'mock-file.json');

      expect(result).toHaveLength(3);
      expect(result[0].fullLabel).toBe('FICTION / General');
    });

    it('should handle "AND" instead of "&" in heading search', async () => {
      // Modify the mock data to include a heading with "&"
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify([
          {
            heading: 'TEST & EXAMPLE',
            notes: [],
            subjects: [{ code: 'TST000000', label: 'Sample' }],
          },
          ...mockData,
        ])
      );

      const result = await utils.getCodesForHeading('TEST AND EXAMPLE', 'mock-file.json');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('TST000000');
    });

    it('should handle whitespace in heading search', async () => {
      const result = await utils.getCodesForHeading('  FICTION  ', 'mock-file.json');

      expect(result).toHaveLength(3);
    });

    it('should return an empty array and log a message for an invalid heading', async () => {
      const result = await utils.getCodesForHeading('INVALID', 'mock-file.json');

      expect(result).toEqual([]);
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('No category found with heading: INVALID')
      );
    });
  });

  describe('getCodeFromFullLabel', () => {
    it('should return the code for a valid full label', async () => {
      const result = await utils.getCodeFromFullLabel('FICTION / War & Military', 'mock-file.json');

      expect(result).toBe('FIC032000');
      expect(fs.readFile).toHaveBeenCalledWith('mock-file.json', 'utf-8');
    });

    it('should handle case-insensitive label search', async () => {
      const result = await utils.getCodeFromFullLabel('fiction / war & military', 'mock-file.json');

      expect(result).toBe('FIC032000');
    });

    it('should handle "AND" instead of "&" in heading part', async () => {
      // Modify the mock data to include a heading with "&"
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify([
          {
            heading: 'TEST & EXAMPLE',
            notes: [],
            subjects: [{ code: 'TST000000', label: 'Sample' }],
          },
          ...mockData,
        ])
      );

      const result = await utils.getCodeFromFullLabel(
        'TEST AND EXAMPLE / Sample',
        'mock-file.json'
      );

      expect(result).toBe('TST000000');
    });

    it('should handle whitespace in label search', async () => {
      const result = await utils.getCodeFromFullLabel(
        '  FICTION  /  War & Military  ',
        'mock-file.json'
      );

      expect(result).toBe('FIC032000');
    });

    it('should return undefined and log a message for an invalid label format', async () => {
      const result = await utils.getCodeFromFullLabel('FICTION - War & Military', 'mock-file.json');

      expect(result).toBeUndefined();
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('Invalid full label format')
      );
    });

    it('should return undefined and log a message for a valid format with invalid heading', async () => {
      const result = await utils.getCodeFromFullLabel('INVALID / Something', 'mock-file.json');

      expect(result).toBeUndefined();
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('No category found with heading: INVALID')
      );
    });

    it('should return undefined and log a message for a valid heading with invalid subject', async () => {
      const result = await utils.getCodeFromFullLabel(
        'FICTION / Nonexistent Subject',
        'mock-file.json'
      );

      expect(result).toBeUndefined();
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('No subject found with label: Nonexistent Subject')
      );
    });
  });
});
