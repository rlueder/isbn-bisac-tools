/**
 * ISBN-BISAC Tools - Utilities for working with BISAC codes and ISBN lookups
 *
 * This package provides tools for scraping BISAC Subject Headings from bisg.org,
 * converting ISBNs to BISAC codes, and various utilities for managing BISAC data.
 *
 * @module isbn-bisac-tools
 */

import { ScraperConfig } from './types/index.js';

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
  startUrl: 'https://bisg.org/page/complete-bisac-subject-headings-list',
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
export { scrape } from './scraper/index.js';

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

// Export browse functionality
export { browseJsonFiles } from './browse/index.js';

// Export from export module
export { exportBISACData } from './export/index.js';
