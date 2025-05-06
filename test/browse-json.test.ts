import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { browseJsonFiles } from '../src/browse-json.js';
import { spawn } from 'child_process';

// Mock all dependencies
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      mkdir: vi.fn(),
      stat: vi.fn(),
      readFile: vi.fn(),
    },
  };
});

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('Browse JSON Files functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create output directory if it does not exist', async () => {
    // Mock files array to be empty
    vi.mocked(glob).mockResolvedValueOnce([]);

    await browseJsonFiles();

    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should return false when no JSON files are found', async () => {
    // Mock the dependencies for the "no files" scenario
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    vi.mocked(glob).mockResolvedValueOnce([]);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await browseJsonFiles();

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No JSON files found'));

    consoleErrorSpy.mockRestore();
  });

  it('should sort files by modification time (newest first)', async () => {
    // Mock file paths
    const mockFiles = ['/path/to/file1.json', '/path/to/file2.json', '/path/to/file3.json'];

    // Mock file stats with different modification times
    const mockStats = [
      { mtime: new Date('2023-01-01') },
      { mtime: new Date('2023-01-03') },
      { mtime: new Date('2023-01-02') },
    ];

    vi.mocked(glob).mockResolvedValueOnce(mockFiles);
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);

    // Set up stat mock to return different times for different files
    vi.mocked(fs.stat)
      .mockResolvedValueOnce(mockStats[0] as { mtime: Date })
      .mockResolvedValueOnce(mockStats[1] as { mtime: Date })
      .mockResolvedValueOnce(mockStats[2] as { mtime: Date });

    // Mock inquirer to return the first file
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ selectedFile: mockFiles[0] });

    // Mock file content
    vi.mocked(fs.readFile).mockResolvedValueOnce('{"test": "data"}');

    // Mock child process
    const mockStdin = {
      write: vi.fn(),
      end: vi.fn(),
    };

    const mockChildProcess = {
      stdin: mockStdin,
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0); // Successfully closed
        }
        return mockChildProcess;
      }),
    };

    vi.mocked(spawn).mockReturnValueOnce(mockChildProcess as unknown);

    await browseJsonFiles();

    // Check that the inquirer was called with choices sorted by date (newest first)
    // This means file2.json (2023-01-03) should be first in the choices array
    const promptCall = vi.mocked(inquirer.prompt).mock.calls[0][0];
    expect(promptCall[0].choices[0].value).toContain(mockFiles[1]); // file2.json should be first
  });

  it('should open selected file with fx', async () => {
    const mockFile = '/path/to/file.json';
    const mockContent = '{"test": "data"}';

    // Mock dependencies
    vi.mocked(glob).mockResolvedValueOnce([mockFile]);
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    vi.mocked(fs.stat).mockResolvedValueOnce({ mtime: new Date() } as { mtime: Date });
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ selectedFile: mockFile });
    vi.mocked(fs.readFile).mockResolvedValueOnce(mockContent);

    // Mock child process
    const mockStdin = {
      write: vi.fn(),
      end: vi.fn(),
    };

    const mockChildProcess = {
      stdin: mockStdin,
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0); // Successfully closed
        }
        return mockChildProcess;
      }),
    };

    vi.mocked(spawn).mockReturnValueOnce(mockChildProcess as unknown);

    const result = await browseJsonFiles();

    expect(result).toBe(true);
    expect(fs.readFile).toHaveBeenCalledWith(mockFile, 'utf8');
    expect(spawn).toHaveBeenCalledWith('npx', ['fx'], expect.any(Object));
    expect(mockStdin.write).toHaveBeenCalledWith(mockContent);
    expect(mockStdin.end).toHaveBeenCalled();
  });

  it('should handle fx process error', async () => {
    const mockFile = '/path/to/file.json';

    // Mock dependencies
    vi.mocked(glob).mockResolvedValueOnce([mockFile]);
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    vi.mocked(fs.stat).mockResolvedValueOnce({ mtime: new Date() } as { mtime: Date });
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ selectedFile: mockFile });
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');

    // Mock child process with error
    const mockChildProcess = {
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1); // Error code
        }
        return mockChildProcess;
      }),
    };

    vi.mocked(spawn).mockReturnValueOnce(mockChildProcess as unknown);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await browseJsonFiles();

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('fx exited with code 1'));

    consoleErrorSpy.mockRestore();
  });

  it('should handle file system errors', async () => {
    // Mock an error when trying to create the directory
    const mockError = new Error('Directory creation failed');
    vi.mocked(fs.mkdir).mockRejectedValueOnce(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await browseJsonFiles();

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error browsing JSON files')
    );

    consoleErrorSpy.mockRestore();
  });
});
