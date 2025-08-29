/**
 * Scraper Functions for BISAC tools
 *
 * This file exports functions that are needed by tests but were not
 * previously exposed in the main API.
 */

import { Page } from 'puppeteer';
import { Category } from '../types/index.js';
import { CONFIG } from '../index.js';
import * as utils from '../../lib/utils.js';

/**
 * Extract category URLs from the main page
 * @param page Puppeteer page object
 * @returns Array of category URLs
 */
export async function extractCategoryUrls(page: Page): Promise<string[]> {
  return await page.evaluate(selector => {
    const links = Array.from(document.querySelectorAll(selector));
    return links
      .map(link => (link as HTMLAnchorElement).href)
      .filter(href => href && href.includes('bisg.org'));
  }, CONFIG.mainPage.categoryLinks);
}

/**
 * Process a single category page and extract its data
 * @param page - Puppeteer page object
 * @param url - URL of the category page
 * @param currentIndex - Current processing index
 * @param totalUrls - Total number of URLs to process
 * @returns Extracted category data
 */
export async function processCategoryPage(
  page: Page,
  url: string,
  _currentIndex: number,
  _totalUrls: number
): Promise<Category> {
  // Navigate to the category page
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Take a screenshot if enabled
  if (CONFIG.takeScreenshots) {
    const urlParts = url.split('/');
    const pageName = urlParts[urlParts.length - 1] || 'category';
    await utils.takeScreenshot(page, `category-${pageName}`, CONFIG.screenshotsDir);
  }

  // Extract the data from the page
  const categoryData = await page.evaluate(() => {
    // Extract the heading (category title)
    const headingElement = document.querySelector('h4');
    const heading = headingElement ? headingElement.textContent?.trim() || '' : '';

    const notes: string[] = [];
    const subjects: { code: string; label: string }[] = [];

    // Get all paragraphs that might contain notes
    const paragraphs = Array.from(document.querySelectorAll('p'));

    // Process paragraphs to extract notes and subjects
    for (const p of paragraphs) {
      const text = p.textContent?.trim() || '';
      if (!text) continue;

      // Check if this is a subject (has a BISAC code pattern)
      const codeMatch = text.match(/^([A-Z]{3}[0-9]{6})\s+(.+)$/);
      if (codeMatch) {
        const code = codeMatch[1];
        const label = codeMatch[2].trim();
        subjects.push({ code, label });
      } else {
        // If not a subject, it's probably a note
        notes.push(text);
      }
    }

    return { heading, notes, subjects };
  });

  return categoryData;
}
