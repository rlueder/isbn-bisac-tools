/**
 * Category Processor Module for ISBN-BISAC Tools
 *
 * This module is responsible for processing individual category pages and
 * extracting structured data from them.
 */

import { Page } from 'puppeteer';
import * as ui from '../ui/index.js';
import { Category, ScraperConfig } from '../types/index.js';
import * as browser from './browser.js';
import * as utils from '../../lib/utils.js';

/**
 * Process a single category page and extract its data
 * @param page - Puppeteer page object
 * @param url - URL of the category page
 * @param currentIndex - Current processing index
 * @param totalUrls - Total number of URLs to process
 * @param config - Scraper configuration
 * @returns Extracted category data
 */
export async function processCategoryPage(
  page: Page,
  url: string,
  currentIndex: number,
  totalUrls: number,
  config: ScraperConfig
): Promise<Category> {
  // Update the progress indicator
  ui.updateProgressSpinner(currentIndex, totalUrls, url, '🔍 Navigating to page...');

  try {
    // Navigate to the page with retry mechanism
    await browser.navigateWithRetry(page, url, {
      maxAttempts: 3,
      timeout: 30000,
      waitUntil: 'networkidle2',
      retryDelay: 2000,
    });

    // Take a screenshot if enabled
    if (config.takeScreenshots) {
      const urlParts = url.split('/');
      const pageName = urlParts[urlParts.length - 1] || 'category';
      ui.updateProgressSpinner(currentIndex, totalUrls, url, '📸 Taking screenshot...');
      await utils.takeScreenshot(page, `category-${pageName}`, config.screenshotsDir);
    }

    // Extract the data from the page
    ui.updateProgressSpinner(currentIndex, totalUrls, url, '📄 Extracting data...');
    const categoryData = await extractCategoryData(page);

    return categoryData;
  } catch (error) {
    ui.stopSpinnerWithError(
      `Failed to process page: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error(
      `Error processing category page ${url}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract category data from the current page
 * @param page - Puppeteer page object
 * @returns Extracted category data
 */
async function extractCategoryData(page: Page): Promise<Category> {
  // Extract the data using page.evaluate to run code in the browser context
  return await page.evaluate(() => {
    // Extract the heading (category title)
    const headingElement = document.querySelector('h2.subtitle');
    const heading = headingElement ? headingElement.textContent?.trim() || '' : '';

    const notes: string[] = [];
    const subjects: { code: string; label: string }[] = [];

    // Get the main content container
    const contentContainer = document.querySelector('.well.box.inner-content');
    if (!contentContainer) return { heading, notes, subjects };

    // Get all paragraphs in the content
    const paragraphs = Array.from(contentContainer.querySelectorAll('p'));

    // First, collect all notes (paragraphs before the subject codes begin)
    let notesEndIndex = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i].textContent?.trim() || '';

      // Skip empty paragraphs or common exclusion patterns
      if (
        !text ||
        text.includes('If your title does not have subject content') ||
        text.includes('© 2024, Book Industry Study Group') ||
        text.includes('To download and incorporate this list') ||
        text.includes('Use the information provided here')
      ) {
        continue;
      }

      // Look for paragraphs that start describing the category
      if (
        text.startsWith('Use subjects in this section') ||
        text.startsWith('Multiple subjects may be used')
      ) {
        notes.push(text);
        notesEndIndex = i + 1;
        continue;
      }

      // The first paragraph with a code pattern indicates we're done with notes
      if (text.match(/[A-Z]{3}[0-9]{6}/)) {
        break;
      }

      // Otherwise, it's probably a note
      notes.push(text);
      notesEndIndex = i + 1;
    }

    // Now process the subjects (paragraphs with BISAC codes)
    for (let i = notesEndIndex; i < paragraphs.length; i++) {
      const text = paragraphs[i].textContent?.trim() || '';
      if (!text) continue;

      // Skip common exclusion patterns
      if (
        text.includes('If your title does not have subject content') ||
        text.includes('© 2024, Book Industry Study Group') ||
        text.includes('To download and incorporate this list') ||
        text.includes('Use the information provided here')
      ) {
        continue;
      }

      // Extract BISAC code and label
      // Format is typically: "ANT000000 ANTIQUES & COLLECTIBLES / General"
      const codeMatch = text.match(/^([A-Z]{3}[0-9]{6})\s+(.+)$/);
      if (codeMatch) {
        const code = codeMatch[1];
        const label = codeMatch[2].trim();
        subjects.push({ code, label });
      }
    }

    return { heading, notes, subjects };
  });
}

/**
 * Validate and clean up the extracted category data
 * @param category - The category data to validate
 * @returns Validated and cleaned category data
 */
export function validateCategoryData(category: Category): Category {
  // Ensure the category has a heading
  if (!category.heading) {
    throw new Error('Category is missing a heading');
  }

  // Ensure the category has at least one subject
  if (category.subjects.length === 0) {
    throw new Error(`Category "${category.heading}" has no subjects`);
  }

  // Clean up note texts
  const cleanedNotes = category.notes.map(note => note.trim()).filter(note => note.length > 0);

  // Clean up subject codes and labels
  const cleanedSubjects = category.subjects.map(subject => ({
    code: subject.code.trim(),
    label: subject.label.trim(),
  }));

  return {
    heading: category.heading.trim(),
    notes: cleanedNotes,
    subjects: cleanedSubjects,
  };
}

/**
 * Process a batch of category pages sequentially
 * @param browser - Puppeteer browser instance
 * @param urls - Array of category URLs to process
 * @param config - Scraper configuration
 * @returns Array of processed categories
 */
export async function processCategoryBatch(
  browser: import('puppeteer').Browser,
  urls: string[],
  config: ScraperConfig
): Promise<Category[]> {
  const categories: Category[] = [];
  const page = await browser.newPage();

  // Process each URL sequentially
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      // Process a random delay to avoid overwhelming the server
      const delay = Math.floor(
        Math.random() * (config.maxDelay - config.minDelay) + config.minDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));

      // Process the page
      const category = await processCategoryPage(page, url, i + 1, urls.length, config);

      // Validate and add to results
      const validatedCategory = validateCategoryData(category);
      categories.push(validatedCategory);

      // Update progress with success message
      ui.updateProgressSpinner(
        i + 1,
        urls.length,
        url,
        `✅ Processed (${validatedCategory.subjects.length} subjects)`
      );
    } catch (error) {
      // Log error but continue with other URLs
      console.error(
        `Error processing ${url}: ${error instanceof Error ? error.message : String(error)}`
      );
      ui.updateProgressSpinner(
        i + 1,
        urls.length,
        url,
        `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Close the page when done
  await page.close();

  return categories;
}

export default {
  processCategoryPage,
  validateCategoryData,
  processCategoryBatch,
};
