/**
 * Scraper module for ISBN-BISAC Tools
 *
 * This module provides functionality for scraping BISAC subject headings
 * from the BISG website.
 */

import path from 'path';
import { ScraperConfig } from '../types/index.js';

/**
 * Default scraper configuration
 * This will eventually be moved to a dedicated config file
 */
const DEFAULT_CONFIG: ScraperConfig = {
  startUrl: 'https://www.bisg.org/complete-bisac-subject-headings-2021-edition',
  outputDir: path.join(process.cwd(), 'data'),
  get jsonPath() {
    return path.join(this.outputDir, 'bisac-data.json');
  },
  screenshotsDir: path.join(process.cwd(), 'screenshots'),
  mainPage: {
    categoryLinks: 'a.link-bisac',
  },
  categoryPage: {
    heading: 'h4',
  },
  minDelay: 500,
  maxDelay: 2000,
  maxCategories: null,
  takeScreenshots: false,
  browserOptions: {
    headless: true,
  },
};

/**
 * Initialize the scraper with the given configuration
 * @param config Scraper configuration options
 * @returns Configured scraper instance
 */
export function initializeScraper(config: Partial<ScraperConfig> = {}): {
  config: ScraperConfig;
  scrape: () => Promise<never>;
} {
  // Merge default config with provided options
  const mergedConfig: ScraperConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    // Merge nested objects
    mainPage: {
      ...DEFAULT_CONFIG.mainPage,
      ...(config.mainPage || {}),
    },
    categoryPage: {
      ...DEFAULT_CONFIG.categoryPage,
      ...(config.categoryPage || {}),
    },
    browserOptions: {
      ...DEFAULT_CONFIG.browserOptions,
      ...(config.browserOptions || {}),
    },
  };

  return {
    config: mergedConfig,
    // This will be expanded with scraper methods as they're extracted
    scrape: async () => {
      // Placeholder for the scrape method
      throw new Error('Scrape method not yet implemented');
    },
  };
}

/**
 * Main scraper function to extract BISAC data
 * This will eventually be refactored into smaller, focused functions
 * @param config Scraper configuration
 */
export async function scrape(config: Partial<ScraperConfig> = {}): Promise<void> {
  const scraper = initializeScraper(config);
  await scraper.scrape();
}

// Default export for direct import
export default {
  initializeScraper,
  scrape,
  DEFAULT_CONFIG,
};
