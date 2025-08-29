/**
 * ISBN-BISAC Tools - Utilities for working with BISAC codes and ISBN lookups
 *
 * This package provides tools for scraping BISAC Subject Headings from bisg.org,
 * converting ISBNs to BISAC codes, and various utilities for managing BISAC data.
 *
 * @module isbn-bisac-tools
 */

import { ScraperConfig, Category } from './types/index.js';

// Re-export types for consumers of the library
export * from './types/index.js';

// Export constants
export const CATEGORY_URLS = [
  'https://bisg.org/page/Fiction',
  'https://bisg.org/page/Nonfiction',
  'https://bisg.org/page/YoungAdult',
  'https://bisg.org/page/Juvenile',
];

export const CONFIG: ScraperConfig = {
  startUrl: 'https://www.bisg.org/complete-bisac-subject-headings-list',
  outputDir: 'data',
  jsonPath: 'data/bisac-data.json',
  screenshotsDir: 'screenshots',
  mainPage: {
    categoryLinks: '.field-items li a',
  },
  categoryPage: {
    heading: 'h4',
  },
  minDelay: 500,
  maxDelay: 1500,
  takeScreenshots: false,
  browserOptions: {
    headless: true,
  },
  maxCategories: null, // no limit by default
  maxConsecutiveErrors: 3,
};

// Export functions from the scraper module
export { scrape as originalScrape } from './scraper/index.js';

/**
 * Compatibility wrapper for the scrape function to match the test interface
 * @param categoryUrl Optional specific category URL to scrape
 * @param config Optional scraper configuration
 * @param browseMode Whether to run in browse mode
 * @param testMode Whether to run in test mode (bypasses actual scraping)
 * @returns The scraped BISAC data
 */
export async function scrape(
  categoryUrl?: string,
  config?: Partial<ScraperConfig>,
  browseMode?: boolean,
  testMode?: boolean
): Promise<{ timestamp: number; date: string; categories: Category[]; error?: string }> {
  try {
    // Import needed modules
    const utils = await import('../lib/utils.js');

    // Initialize directories for scraping
    await utils.initialize(CONFIG.outputDir, CONFIG.screenshotsDir);

    // If in browse mode, just browse the JSON files
    if (browseMode) {
      const { browseJsonFiles } = await import('./browse/index.js');
      await browseJsonFiles([]);
      return {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        categories: [],
      };
    }

    // Mock data for tests to avoid actual browser launch
    if (testMode) {
      const mockData = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        categories: [
          {
            heading: 'FICTION',
            notes: ['Test note'],
            subjects: [
              { code: 'FIC000000', label: 'FICTION / General' },
              { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
            ],
          },
        ],
      };

      // Save mock data to JSON
      await utils.saveToJSON(CONFIG.jsonPath, mockData);
      return mockData;
    }

    // If a specific category URL is provided, only scrape that
    if (categoryUrl) {
      const mergedConfig = { ...CONFIG, ...(config || {}) };
      const { scrapeSingleCategory } = await import('./scraper/index.js');
      const category = await scrapeSingleCategory(categoryUrl, mergedConfig);

      // Save the single category result
      const result = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        categories: [category],
      };

      await utils.saveToJSON(mergedConfig.jsonPath, result);
      return result;
    }

    // Otherwise, scrape all categories
    const { scrape } = await import('./scraper/index.js');
    return await scrape(config);
  } catch (error) {
    console.error('Error during scraping:', error instanceof Error ? error.message : String(error));
    // Return empty result on error
    return {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      categories: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
export { extractCategoryUrls, processCategoryPage } from './scraper/functions.js';

// Export utility functions from the bisac module
export {
  findSubjectsByPartialLabel,
  getFullLabelFromCode,
  getCodesForHeading,
  getCodeFromFullLabel,
  searchBisac,
} from './bisac/lookup.js';

// Export comparison functions
export {
  compareBisacJsonFiles,
  printComparisonReport,
  createBackupOfBisacData,
  selectFilesForComparison,
} from './bisac/comparison.js';

// Export utility functions
export { loadBisacData, getCodeFromISBN } from '../lib/utils.js';

// Export CLI functions
export { parseCommandLineArgs, showHelp } from './cli/functions.js';

// Export browse functionality
export { browseJsonFiles } from './browse/index.js';

// Export from export module
export { exportBISACData } from './export/index.js';
