/**
 * Category Extractor Module for ISBN-BISAC Tools
 *
 * This module provides specific functions for extracting data from
 * BISAC category pages on the BISG website.
 */

import { Page } from 'puppeteer';
import { Category, Subject } from '../../types/index.js';

/**
 * Extract category data from a BISG category page
 * @param page - Puppeteer page object containing a loaded category page
 * @returns Extracted category data
 */
export async function extractCategoryFromPage(page: Page): Promise<Category> {
  // Run the extraction in the browser context
  return await page.evaluate(() => {
    // Initialize the result structure
    const result: Category = {
      heading: '',
      notes: [],
      subjects: [],
    };

    // Extract the heading (category title)
    const headingElement = document.querySelector('h2.subtitle');
    if (headingElement) {
      result.heading = headingElement.textContent?.trim() || '';
    }

    // Get the main content container
    const contentContainer = document.querySelector('.well.box.inner-content');
    if (!contentContainer) return result;

    // Get all paragraphs in the content
    const paragraphs = Array.from(contentContainer.querySelectorAll('p'));

    // Process the paragraphs to extract notes and subjects
    const { notes, subjects } = processContentParagraphs(paragraphs);

    result.notes = notes;
    result.subjects = subjects;

    return result;
  });
}

/**
 * Extract all subjects from a category page
 * @param page - Puppeteer page object
 * @returns Array of extracted subjects
 */
export async function extractSubjectsFromPage(page: Page): Promise<Subject[]> {
  return await page.evaluate(() => {
    const subjects: Subject[] = [];

    // Get the main content container
    const contentContainer = document.querySelector('.well.box.inner-content');
    if (!contentContainer) return subjects;

    // Get all paragraphs in the content
    const paragraphs = Array.from(contentContainer.querySelectorAll('p'));

    // Process each paragraph
    for (const paragraph of paragraphs) {
      const text = paragraph.textContent?.trim() || '';

      // Skip empty or irrelevant paragraphs
      if (!text || isExcludedText(text)) continue;

      // Extract BISAC code and label
      const codeMatch = text.match(/^([A-Z]{3}[0-9]{6})\s+(.+)$/);
      if (codeMatch) {
        const code = codeMatch[1];
        const label = codeMatch[2].trim();
        subjects.push({ code, label });
      }
    }

    return subjects;
  });
}

/**
 * Extract the category title from the page
 * @param page - Puppeteer page object
 * @returns Extracted category title
 */
export async function extractCategoryTitle(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const headingElement = document.querySelector('h2.subtitle');
    return headingElement ? headingElement.textContent?.trim() || '' : '';
  });
}

/**
 * Extract the category notes from the page
 * @param page - Puppeteer page object
 * @returns Array of category notes
 */
export async function extractCategoryNotes(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const notes: string[] = [];

    // Get the main content container
    const contentContainer = document.querySelector('.well.box.inner-content');
    if (!contentContainer) return notes;

    // Get all paragraphs in the content
    const paragraphs = Array.from(contentContainer.querySelectorAll('p'));

    // Process paragraphs to extract notes
    for (const paragraph of paragraphs) {
      const text = paragraph.textContent?.trim() || '';

      // Skip empty or irrelevant paragraphs
      if (!text || isExcludedText(text)) continue;

      // Add this paragraph as a note
      notes.push(text);
    }

    return notes;
  });
}

/**
 * Check if text should be excluded from processing
 * @param text - Text to check
 * @returns Whether the text should be excluded
 */
function isExcludedText(text: string): boolean {
  const exclusionPatterns = [
    'If your title does not have subject content',
    '© 2024, Book Industry Study Group',
    'To download and incorporate this list',
    'Use the information provided here',
  ];

  return exclusionPatterns.some(pattern => text.includes(pattern));
}

/**
 * Process content paragraphs to extract notes and subjects
 * @param paragraphs - Array of paragraph elements
 * @returns Extracted notes and subjects
 */
function processContentParagraphs(paragraphs: Element[]): { notes: string[]; subjects: Subject[] } {
  const notes: string[] = [];
  const subjects: Subject[] = [];

  let notesEndIndex = 0;

  // First, identify notes (paragraphs before the subject codes begin)
  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i].textContent?.trim() || '';

    // Skip empty or excluded paragraphs
    if (!text || isExcludedText(text)) {
      continue;
    }

    // Look for paragraphs that describe the category
    if (
      text.startsWith('Use subjects in this section') ||
      text.startsWith('Multiple subjects may be used')
    ) {
      notes.push(text);
      notesEndIndex = i + 1;
      continue;
    }

    // The first paragraph with a code pattern indicates we're done with notes
    if (text.match(/^[A-Z]{3}[0-9]{6}/)) {
      break;
    }

    // Otherwise, it's probably a note
    notes.push(text);
    notesEndIndex = i + 1;
  }

  // Now process the subjects (paragraphs with BISAC codes)
  for (let i = notesEndIndex; i < paragraphs.length; i++) {
    const text = paragraphs[i].textContent?.trim() || '';

    // Skip empty or excluded paragraphs
    if (!text || isExcludedText(text)) {
      continue;
    }

    // Extract BISAC code and label
    const codeMatch = text.match(/^([A-Z]{3}[0-9]{6})\s+(.+)$/);
    if (codeMatch) {
      const code = codeMatch[1];
      const label = codeMatch[2].trim();
      subjects.push({ code, label });
    }
  }

  return { notes, subjects };
}

export default {
  extractCategoryFromPage,
  extractSubjectsFromPage,
  extractCategoryTitle,
  extractCategoryNotes,
};
