import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import puppeteer from 'puppeteer';
import * as utils from '../lib/utils.js';
import { Page, Browser } from 'puppeteer';

import { extractCategoryUrls, processCategoryPage, CONFIG } from '../src/index.js';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

// Mock utils
vi.mock('../lib/utils.js', () => ({
  initialize: vi.fn(),
  takeScreenshot: vi.fn(),
  saveToJSON: vi.fn(),
  randomDelay: vi.fn(),
}));

describe('Scraper', () => {
  let browserMock: Partial<Browser>;
  let pageMock: Partial<Page>;

  beforeEach(() => {
    // Setup mocks
    pageMock = {
      goto: vi.fn().mockResolvedValue(undefined),
      setUserAgent: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
      waitForFunction: vi.fn().mockResolvedValue(undefined), // Changed waitForTimeout to waitForFunction
      screenshot: vi.fn().mockResolvedValue(undefined),
    };

    browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Mock puppeteer launch to return our browser mock
    (puppeteer.launch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(browserMock);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('extractCategoryUrls', () => {
    it('should extract category URLs from the page', async () => {
      const mockUrls = [
        'https://www.bisg.org/antiques-and-collectibles',
        'https://www.bisg.org/architecture',
      ];

      // Mock the page.evaluate call
      (pageMock.evaluate as ReturnType<typeof vi.fn>).mockResolvedValue(mockUrls);

      const result = await extractCategoryUrls(pageMock as Page);

      expect(pageMock.evaluate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUrls);
      expect(result.length).toBe(2);
    });
  });

  describe('processCategoryPage', () => {
    it('should process a category page and extract data', async () => {
      const mockUrl = 'https://www.bisg.org/antiques-and-collectibles';
      const mockCategoryData = {
        heading: 'ANTIQUES & COLLECTIBLES',
        notes: ['Note 1', 'Note 2'],
        subjects: [{ code: 'ANT000000', label: 'ANTIQUES & COLLECTIBLES / General' }],
      };

      // Save original config and mock takeScreenshots as true
      const originalTakeScreenshots = CONFIG.takeScreenshots;
      CONFIG.takeScreenshots = true;

      // Mock the page.evaluate call
      (pageMock.evaluate as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategoryData);

      const result = await processCategoryPage(pageMock as Page, mockUrl, 1, 10);

      expect(pageMock.goto).toHaveBeenCalledWith(mockUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      expect(utils.takeScreenshot).toHaveBeenCalled();
      expect(pageMock.evaluate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategoryData);
      expect(result.heading).toBe('ANTIQUES & COLLECTIBLES');
      expect(result.notes.length).toBe(2);
      expect(result.subjects.length).toBe(1);

      // Restore original config
      CONFIG.takeScreenshots = originalTakeScreenshots;
    });
  });

  describe('CONFIG', () => {
    it('should have the correct configuration properties', () => {
      expect(CONFIG).toHaveProperty('startUrl');
      expect(CONFIG).toHaveProperty('outputDir');
      expect(CONFIG).toHaveProperty('jsonPath');
      expect(CONFIG).toHaveProperty('screenshotsDir');
      expect(CONFIG).toHaveProperty('mainPage');
      expect(CONFIG).toHaveProperty('categoryPage');
      expect(CONFIG).toHaveProperty('minDelay');
      expect(CONFIG).toHaveProperty('maxDelay');
      expect(CONFIG).toHaveProperty('maxCategories');

      expect(CONFIG.startUrl).toBe('https://www.bisg.org/complete-bisac-subject-headings-list');
      expect(CONFIG.mainPage.categoryLinks).toBe('.field-items li a');
      expect(CONFIG.categoryPage.heading).toBe('h4');
    });
  });
});
