import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as utils from '../lib/utils.js';
import { Page } from 'puppeteer';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn(),
    readFile: vi.fn().mockResolvedValue('{"test":"data"}'),
  },
}));

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock child_process
vi.mock('child_process', async () => {
  const createMockProcess = (): { stdin: { write: vi.Mock; end: vi.Mock }; on: vi.Mock } => {
    const mockProcess = {
      stdin: {
        write: vi.fn(),
        end: vi.fn(),
      },
      on: vi.fn((event, callback) => {
        if (event === 'exit' || event === 'close') {
          setTimeout(() => callback(0), 0); // Simulate successful exit asynchronously
        }
        return mockProcess;
      }),
    };
    return mockProcess;
  };

  return {
    exec: vi.fn(),
    execFile: vi.fn(() => createMockProcess()),
    spawn: vi.fn(() => createMockProcess()),
  };
});

// Mock console.log
const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialize', () => {
    it('should create output and screenshots directories', async () => {
      const outputDir = '/test/output';
      const screenshotsDir = '/test/screenshots';

      await utils.initialize(outputDir, screenshotsDir, true);

      expect(fs.mkdir).toHaveBeenCalledTimes(2);
      expect(fs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(screenshotsDir, { recursive: true });
      expect(consoleLogMock).toHaveBeenCalledWith(
        '📁 Output and screenshots directories initialized.'
      );
    });
  });

  describe('takeScreenshot', () => {
    it('should take a screenshot and save it', async () => {
      const pageMock = {
        screenshot: vi.fn().mockResolvedValue(undefined),
      };
      const name = 'test-screenshot';
      const screenshotsDir = '/test/screenshots';

      // Use vi.useFakeTimers to mock Date
      vi.useFakeTimers();
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      await utils.takeScreenshot(pageMock as unknown as Page, name, screenshotsDir);

      const expectedFilename = `${name}-2023-01-01T12-00-00-000Z.png`;
      const expectedFilepath = path.join(screenshotsDir, expectedFilename);

      expect(pageMock.screenshot).toHaveBeenCalledTimes(1);
      expect(pageMock.screenshot).toHaveBeenCalledWith({
        path: expectedFilepath,
        fullPage: true,
      });
      expect(consoleLogMock).toHaveBeenCalledWith(`📸 Screenshot saved: ${expectedFilename}`);

      // Restore real timers
      vi.useRealTimers();
    });
  });

  describe('saveToJSON', () => {
    it('should save data to a JSON file', async () => {
      const filePath = '/test/output/data.json';
      const data = { test: 'data' };

      await utils.saveToJSON(filePath, data);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(data, null, 2));
      expect(consoleLogMock).toHaveBeenCalledWith(`💾 Data saved to: ${filePath}`);
    });
  });

  describe('randomDelay', () => {
    it('should return a promise that resolves after a delay', async () => {
      // Mock setTimeout
      vi.useFakeTimers();

      const min = 1000;
      const max = 2000;

      // Start the delay promise but don't await it yet
      const delayPromise = utils.randomDelay(min, max);

      // Fast-forward time
      vi.runAllTimers();

      // Now await the promise
      const delay = await delayPromise;

      // Check that the delay is within the range
      expect(delay).toBeGreaterThanOrEqual(min);
      expect(delay).toBeLessThanOrEqual(max);

      vi.useRealTimers();
    });
  });

  describe('browseJsonFile', () => {
    it('should find and display JSON files for browsing', async () => {
      // Mock implementation before importing modules
      const mockFiles = ['/test/output/file1.json', '/test/output/file2.json'];

      const mockStats = [{ mtime: new Date('2023-01-01') }, { mtime: new Date('2023-01-02') }];

      // Setup mock for glob
      const { glob: globMock } = await import('glob');
      (globMock as unknown as { mockResolvedValue: (files: string[]) => void }).mockResolvedValue(
        mockFiles
      );

      // Mock stat to return different dates for each file
      (
        fs.stat as unknown as {
          mockImplementation: (callback: (path: string) => Promise<any>) => void;
        }
      ).mockImplementation((path: string) => {
        if (path === mockFiles[0]) return Promise.resolve(mockStats[0]);
        if (path === mockFiles[1]) return Promise.resolve(mockStats[1]);
        return Promise.reject(new Error('File not found'));
      });

      // Import inquirer after setting up mocks
      const { default: inquirerMock } = await import('inquirer');

      // Mock inquirer to simulate user selecting the second file
      (
        inquirerMock.prompt as unknown as { mockResolvedValue: (value: any) => void }
      ).mockResolvedValue({
        selectedFile: mockFiles[1],
      });

      // Get reference to child_process mock
      const childProcess = await import('child_process');

      // Call the function
      const result = await utils.browseJsonFile('/test/output');

      // Verify the results
      expect(result).toBe(true);
      expect(globMock).toHaveBeenCalledWith(`/test/output/*.json`);
      expect(fs.stat).toHaveBeenCalledTimes(2);
      expect(inquirerMock.prompt).toHaveBeenCalledTimes(1);
      expect(childProcess.spawn).toHaveBeenCalledWith('npx', ['fx'], {
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: process.cwd(),
      });
      expect(fs.readFile).toHaveBeenCalledWith(mockFiles[1], 'utf8');
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('Opening file2.json with fx')
      );
    });

    it('should handle no JSON files found', async () => {
      // Setup mocks
      const { glob: globMock } = await import('glob');
      (globMock as unknown as { mockResolvedValue: (files: string[]) => void }).mockResolvedValue(
        []
      );

      // Setup console.error mock
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function
      const result = await utils.browseJsonFile('/test/output');

      // Verify the results
      expect(result).toBe(false);
      expect(consoleErrorMock).toHaveBeenCalledWith(expect.stringContaining('No JSON files found'));

      // Restore console.error
      consoleErrorMock.mockRestore();
    });
  });
});
