import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
// ora is used in mocks
import * as utils from '../lib/utils.js';
import * as browseJson from '../src/browse-json.js';
import { scrape, CONFIG, CATEGORY_URLS } from '../src/index.js';
import { ScraperConfig } from '../src/types/index.js';

// Mock dependencies
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

vi.mock('../lib/utils.js', () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  takeScreenshot: vi.fn().mockResolvedValue('screenshot.png'),
  saveToJSON: vi.fn().mockResolvedValue(undefined),
  randomDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/browse-json.js', () => ({
  browseJsonFiles: vi.fn().mockResolvedValue(true),
}));

describe('Main Scraper Functionality', () => {
  let browserMock: Partial<Browser>;
  let pageMock: Partial<Page>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Setup page and browser mocks
    pageMock = {
      goto: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      setUserAgent: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('test')),
      $: vi.fn(),
      $$: vi.fn(),
      $eval: vi.fn(),
      $$eval: vi.fn(),
      setDefaultNavigationTimeout: vi.fn(),
      setDefaultTimeout: vi.fn(),
      on: vi.fn(),
    };

    browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Mock puppeteer launch
    vi.mocked(puppeteer.launch).mockResolvedValue(browserMock as Browser);

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Configuration', () => {
    it('should have valid config properties', () => {
      expect(CONFIG).toHaveProperty('startUrl');
      expect(CONFIG).toHaveProperty('outputDir');
      expect(CONFIG).toHaveProperty('jsonPath');
      expect(CONFIG).toHaveProperty('screenshotsDir');
      expect(CONFIG).toHaveProperty('mainPage');
      expect(CONFIG).toHaveProperty('categoryPage');
      expect(CONFIG).toHaveProperty('minDelay');
      expect(CONFIG).toHaveProperty('maxDelay');
    });

    it('should have a list of predefined category URLs', () => {
      expect(CATEGORY_URLS).toBeDefined();
      expect(Array.isArray(CATEGORY_URLS)).toBe(true);
      expect(CATEGORY_URLS.length).toBeGreaterThan(0);
      expect(CATEGORY_URLS[0]).toMatch(/^https?:\/\//);
    });
  });

  describe('scrape function', () => {
    it('should initialize directories', async () => {
      // Setup more specific mocks for the evaluate method to handle extractCategoryUrls
      pageMock.evaluate = vi
        .fn()
        .mockImplementationOnce(() => {
          // This mocks the extractCategoryUrls function call
          return ['https://www.bisg.org/fiction', 'https://www.bisg.org/nonfiction'];
        })
        .mockImplementation(() => {
          // This mocks any subsequent evaluate calls, like in processCategoryPage
          return {
            heading: 'FICTION',
            notes: ['Note about fiction'],
            subjects: [
              { code: 'FIC000000', label: 'FICTION / General' },
              { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
            ],
          };
        });

      await scrape(undefined, undefined, undefined, true);

      expect(utils.initialize).toHaveBeenCalled();
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(pageMock.goto).toHaveBeenCalledWith(
        CONFIG.startUrl,
        expect.objectContaining({ waitUntil: 'networkidle2' })
      );
    });

    it('should handle single category URL mode', async () => {
      // Create a custom config with only one category URL
      const customConfig: Partial<ScraperConfig> = {
        ...CONFIG,
        maxCategories: 1,
      };

      // Setup specific mock for single category mode
      pageMock.goto = vi.fn().mockResolvedValue(undefined);
      pageMock.evaluate = vi.fn().mockImplementation(() => {
        return {
          heading: 'FICTION',
          notes: ['Note about fiction'],
          subjects: [{ code: 'FIC000000', label: 'FICTION / General' }],
        };
      });

      // Execute scrape with a specific category URL
      await scrape('https://www.bisg.org/fiction', customConfig as ScraperConfig, undefined, true);

      // We're not testing the specific URL here, just that functions were called
      expect(utils.initialize).toHaveBeenCalled();
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(utils.saveToJSON).toHaveBeenCalled();
    });

    it('should save scraped data to JSON', async () => {
      // Setup more specific mocks for the evaluate method
      pageMock.evaluate = vi
        .fn()
        .mockImplementationOnce(() => {
          // This mocks the extractCategoryUrls function call
          return ['https://www.bisg.org/fiction'];
        })
        .mockImplementation(() => {
          // This mocks the processCategoryPage function call
          return {
            heading: 'FICTION',
            notes: ['Note about fiction'],
            subjects: [{ code: 'FIC000000', label: 'FICTION / General' }],
          };
        });

      await scrape(undefined, undefined, undefined, true);

      // Simply verify that saveToJSON was called
      expect(utils.saveToJSON).toHaveBeenCalled();

      // Check that the first argument is a string and the second is an array
      const calls = vi.mocked(utils.saveToJSON).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(typeof calls[0][0]).toBe('string');
      expect(Array.isArray(calls[0][1])).toBe(true);
    });

    it('should limit the number of categories processed when maxCategories is set', async () => {
      // Setup more specific mocks for the evaluate method
      pageMock.evaluate = vi
        .fn()
        .mockImplementationOnce(() => {
          // This mocks the extractCategoryUrls function call
          return [
            'https://www.bisg.org/fiction',
            'https://www.bisg.org/nonfiction',
            'https://www.bisg.org/poetry',
            'https://www.bisg.org/comics',
          ];
        })
        .mockImplementation(() => {
          // This mocks the processCategoryPage function calls
          return {
            heading: 'TEST',
            notes: [],
            subjects: [{ code: 'TEST00000', label: 'TEST / General' }],
          };
        });

      // Create a custom config with limited max categories
      const customConfig: Partial<ScraperConfig> = {
        ...CONFIG,
        maxCategories: 2,
      };

      await scrape(undefined, customConfig as ScraperConfig, undefined, true);

      // Should only process the first two categories
      expect(pageMock.goto).toHaveBeenCalledTimes(3); // main page + 2 categories
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in puppeteer.launch
      vi.mocked(puppeteer.launch).mockRejectedValueOnce(new Error('Browser launch failed'));

      await scrape(undefined, undefined, undefined, true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });

    it('should browse JSON files when in browse mode', async () => {
      await scrape(undefined, undefined, true, true);

      expect(browseJson.browseJsonFiles).toHaveBeenCalled();
    });

    it('should close browser when done', async () => {
      // Setup more specific mocks for the evaluate method
      pageMock.evaluate = vi
        .fn()
        .mockImplementationOnce(() => {
          // This mocks the extractCategoryUrls function call
          return ['https://www.bisg.org/fiction'];
        })
        .mockImplementation(() => {
          // This mocks the processCategoryPage function call
          return {
            heading: 'FICTION',
            notes: [],
            subjects: [],
          };
        });

      await scrape(undefined, undefined, undefined, true);

      expect(browserMock.close).toHaveBeenCalled();
    });
  });
});
