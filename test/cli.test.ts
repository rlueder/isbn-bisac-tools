import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCommandLineArgs, showHelp } from '../src/index.js';

// Store original argv and exit
const originalArgv = process.argv;
const originalExit = process.exit;

describe('CLI functionality', () => {
  beforeEach(() => {
    // Mock process.argv
    process.argv = ['node', 'index.js'];

    // Mock process.exit
    process.exit = vi.fn() as unknown as (code?: number) => never;

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;

    // Reset all mocks
    vi.restoreAllMocks();
  });

  describe('parseCommandLineArgs', () => {
    it('should return default options when no arguments are provided', () => {
      const options = parseCommandLineArgs();

      expect(options).toEqual({
        shouldShowHelp: false,
        lookupMode: false,
        enableScreenshots: false,
        compare: false,
        scrape: false,
        maxErrors: 5,
      });
    });

    it('should parse -u, --url flag with a URL value', () => {
      process.argv = ['node', 'index.js', '--url', 'https://example.com'];
      const options = parseCommandLineArgs();

      expect(options.categoryUrl).toBe('https://example.com');
    });

    it('should parse --help flag', () => {
      process.argv = ['node', 'index.js', '--help'];
      const options = parseCommandLineArgs();

      expect(options.shouldShowHelp).toBe(true);
    });

    it('should parse -c, --code flag with a code value', () => {
      process.argv = ['node', 'index.js', '--code', 'FIC000000'];
      const options = parseCommandLineArgs();

      expect(options.code).toBe('FIC000000');
      expect(options.lookupMode).toBe(true);
    });

    it('should parse -H, --heading flag with a heading value', () => {
      process.argv = ['node', 'index.js', '--heading', 'FICTION'];
      const options = parseCommandLineArgs();

      expect(options.heading).toBe('FICTION');
      expect(options.lookupMode).toBe(true);
    });

    it('should parse -l, --label flag with a label value', () => {
      process.argv = ['node', 'index.js', '--label', 'FICTION / General'];
      const options = parseCommandLineArgs();

      expect(options.label).toBe('FICTION / General');
      expect(options.lookupMode).toBe(true);
    });

    it('should parse -i, --isbn flag with an ISBN value', () => {
      process.argv = ['node', 'index.js', '--isbn', '9781234567890'];
      const options = parseCommandLineArgs();

      expect(options.isbn).toBe('9781234567890');
      expect(options.lookupMode).toBe(true);
    });

    it('should parse -s, --screenshots flag', () => {
      process.argv = ['node', 'index.js', '--screenshots'];
      const options = parseCommandLineArgs();

      expect(options.enableScreenshots).toBe(true);
    });

    it('should parse --compare flag', () => {
      process.argv = ['node', 'index.js', '--compare'];
      const options = parseCommandLineArgs();

      expect(options.compare).toBe(true);
    });

    it('should validate URL format', () => {
      process.argv = ['node', 'index.js', '--url', 'invalid-url'];
      const options = parseCommandLineArgs();

      expect(options.categoryUrl).toBeUndefined();
      expect(options.shouldShowHelp).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('URL must start with http://')
      );
    });

    it('should parse multiple flags together', () => {
      process.argv = ['node', 'index.js', '--url', 'https://example.com', '--screenshots'];
      const options = parseCommandLineArgs();

      expect(options.categoryUrl).toBe('https://example.com');
      expect(options.enableScreenshots).toBe(true);
    });

    it('should handle conflicting lookup modes', () => {
      process.argv = ['node', 'index.js', '--code', 'FIC000000', '--heading', 'FICTION'];
      const options = parseCommandLineArgs();

      expect(options.code).toBe('FIC000000');
      expect(options.heading).toBe('FICTION');
      expect(options.lookupMode).toBe(true);
    });
  });

  describe('showHelp', () => {
    it('should display help information', () => {
      showHelp();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('BISAC Subject Headings Scraper')
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--url'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--help'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--code'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--heading'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--label'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--isbn'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--screenshots'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--compare'));
    });
  });
});
