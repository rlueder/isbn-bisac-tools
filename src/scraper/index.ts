/**
 * Scraper module for ISBN-BISAC Tools
 *
 * This module provides functionality for scraping BISAC subject headings
 * from the BISG website.
 */

import { ScraperConfig, Category, BisacData } from '../types/index.js';
import { getScraperConfig } from '../config/index.js';
import * as browser from './browser.js';
import * as categoryProcessor from './category-processor.js';
import * as storage from '../storage/index.js';
import * as ui from '../ui/index.js';
import { Page } from 'puppeteer';

/**
 * Import the configuration from the config module
 * The default config is now managed in a central location
 */

/**
 * Initialize the scraper with the given configuration
 * @param config Scraper configuration options
 * @returns Configured scraper instance
 */
export function initializeScraper(config: Partial<ScraperConfig> = {}): {
  config: ScraperConfig;
  scrape: () => Promise<BisacData>;
  scrapeCategory: (url: string) => Promise<Category>;
} {
  // Use the config module to merge configurations
  const mergedConfig = getScraperConfig(config);

  return {
    config: mergedConfig,

    // Scrape all categories
    scrape: async () => {
      return scrapeAllCategories(mergedConfig);
    },

    // Scrape a single category
    scrapeCategory: async (url: string) => {
      return scrapeSingleCategory(url, mergedConfig);
    },
  };
}

/**
 * Main scraper function to extract BISAC data
 * This will eventually be refactored into smaller, focused functions
 * @param config Scraper configuration
 */
/**
 * Scrape a single category page
 * @param url URL of the category page
 * @param config Scraper configuration
 * @returns The scraped category data
 */
export async function scrapeSingleCategory(url: string, config: ScraperConfig): Promise<Category> {
  ui.updateProgressSpinner(0, 1, url, '🚀 Initializing browser...');

  return await browser.withBrowser(config, async browserInstance => {
    // Create a new page
    const page = await browser.createPage(browserInstance);

    try {
      // Process the category page
      return await categoryProcessor.processCategoryPage(page, url, 1, 1, config);
    } finally {
      // Close the page
      await page.close();
    }
  });
}

/**
 * Scrape all categories
 * @param config Scraper configuration
 * @returns The complete BISAC data
 */
export async function scrapeAllCategories(config: ScraperConfig): Promise<BisacData> {
  ui.updateProgressSpinner(0, 1, config.startUrl, '🚀 Initializing scraper...');

  // Create result object
  const result: BisacData = {
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
    categories: [],
  };

  await browser.withBrowser(config, async browserInstance => {
    // Get all category URLs
    const page = await browser.createPage(browserInstance);

    try {
      // Navigate to the main page
      await browser.navigateWithRetry(page, config.startUrl);

      // Extract all category URLs
      const categoryUrls = await extractCategoryUrls(page, config);

      // Limit the number of categories if specified
      const urlsToProcess =
        config.maxCategories !== null ? categoryUrls.slice(0, config.maxCategories) : categoryUrls;

      ui.updateProgressSpinner(
        0,
        urlsToProcess.length,
        config.startUrl,
        `Found ${urlsToProcess.length} categories to process`
      );

      // Process categories in batches
      const categories = await categoryProcessor.processCategoryBatch(
        browserInstance,
        urlsToProcess,
        config
      );

      // Add to result
      result.categories = categories;

      // Save to JSON
      await storage.saveToJSON(result, config.jsonPath, { pretty: true });

      ui.stopSpinnerWithSuccess(
        `Completed! Processed ${categories.length} categories with ` +
          `${categories.reduce((count, cat) => count + cat.subjects.length, 0)} subjects.`
      );
    } finally {
      await page.close();
    }
  });

  return result;
}

/**
 * Extract category URLs from the main page
 * @param page Puppeteer page object
 * @param config Scraper configuration
 * @returns Array of category URLs
 */
async function extractCategoryUrls(page: Page, config: ScraperConfig): Promise<string[]> {
  return await page.evaluate(selector => {
    const links = Array.from(document.querySelectorAll(selector));
    return links
      .map(link => (link as HTMLAnchorElement).href)
      .filter(href => href && href.includes('bisg.org'));
  }, config.mainPage.categoryLinks);
}

/**
 * Main scrape function - entry point for the scraping process
 * @param config Scraper configuration
 * @returns The scraped BISAC data
 */
export async function scrape(config: Partial<ScraperConfig> = {}): Promise<BisacData> {
  const scraper = initializeScraper(config);
  return await scraper.scrape();
}

// Default export for direct import
export default {
  initializeScraper,
  scrape,
  scrapeSingleCategory,
  scrapeAllCategories,
};
