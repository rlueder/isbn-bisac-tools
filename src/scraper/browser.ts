/**
 * Browser Module for ISBN-BISAC Tools Scraper
 *
 * This module provides utilities for initializing and managing Puppeteer browser
 * instances for web scraping operations.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { ScraperConfig } from '../types/index.js';
import * as ui from '../ui/index.js';

/**
 * Initialize a browser instance with configured options
 * @param config Scraper configuration
 * @returns Puppeteer Browser instance
 */
export async function initializeBrowser(config: ScraperConfig): Promise<Browser> {
  try {
    ui.updateProgressSpinner(0, 1, '', '🚀 Launching browser...');

    // Extract browser options from config
    const options = {
      ...config.browserOptions,
    };

    // Launch the browser
    return await puppeteer.launch(options);
  } catch (error) {
    ui.stopSpinnerWithError(
      `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error(
      `Browser initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new page in the browser
 * @param browser Browser instance
 * @param url Optional URL to navigate to
 * @param config Scraper configuration
 * @returns Puppeteer Page instance
 */
export async function createPage(
  browser: Browser,
  url?: string,
  config?: ScraperConfig
): Promise<Page> {
  try {
    // Create a new page
    const page = await browser.newPage();

    // Set viewport if defined in config
    if (config?.browserOptions?.defaultViewport) {
      await page.setViewport(
        config.browserOptions.defaultViewport as { width: number; height: number }
      );
    }

    // Set a custom user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Navigate to URL if provided
    if (url) {
      ui.updateProgressSpinner(0, 1, url, '🔍 Navigating to page...');
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000, // 30 seconds timeout
      });
    }

    return page;
  } catch (error) {
    ui.stopSpinnerWithError(
      `Failed to create page: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error(
      `Page creation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Navigate to a URL with retry mechanism
 * @param page Puppeteer Page instance
 * @param url URL to navigate to
 * @param options Navigation options
 * @returns Whether navigation was successful
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  options: {
    maxAttempts?: number;
    timeout?: number;
    waitUntil?: puppeteer.WaitForOptions['waitUntil'];
    retryDelay?: number;
  } = {}
): Promise<boolean> {
  const maxAttempts = options.maxAttempts || 3;
  const timeout = options.timeout || 30000;
  const waitUntil = options.waitUntil || 'networkidle2';
  const retryDelay = options.retryDelay || 2000;

  let attempts = 0;
  let success = false;

  while (!success && attempts < maxAttempts) {
    try {
      attempts++;
      ui.updateProgressSpinner(
        attempts,
        maxAttempts,
        url,
        `🔍 Navigation attempt ${attempts}/${maxAttempts}...`
      );

      await page.goto(url, {
        waitUntil,
        timeout,
      });

      success = true;
    } catch (error) {
      if (attempts >= maxAttempts) {
        ui.stopSpinnerWithError(
          `Navigation failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }

      ui.updateProgressSpinner(
        attempts,
        maxAttempts,
        url,
        `🚫 Navigation attempt ${attempts} failed. Retrying in ${retryDelay / 1000}s...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return success;
}

/**
 * Close browser and all pages
 * @param browser Browser instance to close
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  try {
    ui.updateProgressSpinner(1, 1, '', '🏁 Closing browser...');
    await browser.close();
  } catch (error) {
    console.warn(
      `Warning: Error closing browser: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Safely execute a function with the browser, ensuring it gets closed afterward
 * @param config Scraper configuration
 * @param callback Function to execute with the browser
 * @returns Result of the callback function
 */
export async function withBrowser<T>(
  config: ScraperConfig,
  callback: (browser: Browser) => Promise<T>
): Promise<T> {
  let browser: Browser | null = null;

  try {
    browser = await initializeBrowser(config);
    return await callback(browser);
  } finally {
    if (browser) {
      await closeBrowser(browser);
    }
  }
}

export default {
  initializeBrowser,
  createPage,
  navigateWithRetry,
  closeBrowser,
  withBrowser,
};
