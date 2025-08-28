/**
 * BISAC Lookup Module for ISBN-BISAC Tools
 *
 * This module provides functionality for looking up BISAC codes, labels,
 * and categories, as well as converting between different formats.
 */

import { BisacData, Subject } from '../types/index.js';
import { loadBisacData } from './index.js';
import * as ui from '../ui/index.js';

/**
 * Default path to BISAC data file (used in utility functions)
 * Not explicitly used here but documents the default path
 */
// const DEFAULT_DATA_PATH = process.cwd() + '/data/bisac-data.json';

/**
 * Find the full label (including heading) for a BISAC code
 * @param code BISAC code to look up
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Full label in the format "HEADING / SUBJECT" or undefined if not found
 */
export async function getFullLabelFromCode(
  code: string,
  data?: BisacData
): Promise<string | undefined> {
  const bisacData = data || (await loadBisacData());

  // Normalize the code by removing any whitespace and converting to uppercase
  const normalizedCode = code.trim().toUpperCase();

  for (const category of bisacData.categories) {
    const subject = category.subjects.find(subject => subject.code === normalizedCode);
    if (subject) {
      return `${category.heading} / ${subject.label}`;
    }
  }

  // Log a message if the code wasn't found
  ui.log(`🔍 No label found for code: ${normalizedCode}`, 'info');
  ui.log(
    'ℹ️ Note: This code may exist in the complete BISAC dataset but is not available in the current data.',
    'info'
  );
  ui.log(
    'ℹ️ If you used --url to fetch a specific category, try using a different category URL or fetch the full dataset.',
    'info'
  );

  return undefined;
}

/**
 * Get all BISAC codes for a specific heading
 * @param heading Heading to look up
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Array of subjects in the heading
 */
export async function getCodesForHeading(heading: string, data?: BisacData): Promise<Subject[]> {
  const bisacData = data || (await loadBisacData());

  // Normalize the heading by trimming whitespace and converting to uppercase for case-insensitive comparison
  const normalizedHeading = heading.trim().toUpperCase();

  // Find the category with a matching heading
  const category = bisacData.categories.find(
    cat => cat.heading.toUpperCase() === normalizedHeading
  );

  if (!category) {
    ui.log(`🔍 No category found with heading: ${heading}`, 'info');
    return [];
  }

  return category.subjects;
}

/**
 * Get a BISAC code from a full label
 * @param fullLabel Full label in the format "HEADING / SUBJECT"
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns BISAC code or undefined if not found
 */
export async function getCodeFromFullLabel(
  fullLabel: string,
  data?: BisacData
): Promise<string | undefined> {
  // Validate the label format
  if (!fullLabel.includes('/')) {
    ui.log(`❌ Invalid full label format: ${fullLabel}`, 'error');
    ui.log('Full label must be in format "HEADING / SUBJECT"', 'info');
    return undefined;
  }

  const bisacData = data || (await loadBisacData());

  // Split the full label into heading and subject
  const [headingPart, subjectPart] = fullLabel.split('/').map(part => part.trim());

  // Find the category with a matching heading (case-insensitive)
  const category = bisacData.categories.find(
    cat => cat.heading.toUpperCase() === headingPart.toUpperCase()
  );

  if (!category) {
    ui.log(`🔍 No category found with heading: ${headingPart}`, 'info');
    return undefined;
  }

  // Find the subject with a matching label (case-insensitive)
  const subject = category.subjects.find(
    sub => sub.label.toUpperCase() === subjectPart.toUpperCase()
  );

  if (!subject) {
    ui.log(
      `🔍 No subject found with label: ${subjectPart} in category: ${category.heading}`,
      'info'
    );
    return undefined;
  }

  return subject.code;
}

/**
 * Find subjects by a partial label match
 * @param partialLabel Partial label to search for
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Array of matching subjects with their categories
 */
export async function findSubjectsByPartialLabel(
  partialLabel: string,
  data?: BisacData
): Promise<Array<{ category: string; subject: Subject }>> {
  const bisacData = data || (await loadBisacData());
  const matches: Array<{ category: string; subject: Subject }> = [];

  // Normalize the search term by trimming whitespace and converting to lowercase
  const searchTerm = partialLabel.trim().toLowerCase();

  for (const category of bisacData.categories) {
    const matchingSubjects = category.subjects.filter(subject =>
      subject.label.toLowerCase().includes(searchTerm)
    );

    matchingSubjects.forEach(subject => {
      matches.push({
        category: category.heading,
        subject,
      });
    });
  }

  return matches;
}

/**
 * Get the heading for a specific BISAC code
 * @param code BISAC code to look up
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Heading or undefined if not found
 */
export async function getHeadingForCode(
  code: string,
  data?: BisacData
): Promise<string | undefined> {
  const bisacData = data || (await loadBisacData());

  // Normalize the code
  const normalizedCode = code.trim().toUpperCase();

  for (const category of bisacData.categories) {
    const hasCode = category.subjects.some(subject => subject.code === normalizedCode);
    if (hasCode) {
      return category.heading;
    }
  }

  return undefined;
}

/**
 * Get the subject for a specific BISAC code
 * @param code BISAC code to look up
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Subject or undefined if not found
 */
export async function getSubjectForCode(
  code: string,
  data?: BisacData
): Promise<Subject | undefined> {
  const bisacData = data || (await loadBisacData());

  // Normalize the code
  const normalizedCode = code.trim().toUpperCase();

  for (const category of bisacData.categories) {
    const subject = category.subjects.find(subject => subject.code === normalizedCode);
    if (subject) {
      return subject;
    }
  }

  return undefined;
}

/**
 * Search for BISAC codes and subjects across all categories
 * @param query Search query (can be partial code or label)
 * @param data Optional BISAC data to use (loads from file if not provided)
 * @returns Array of matching subjects with their categories
 */
export async function searchBisac(
  query: string,
  data?: BisacData
): Promise<Array<{ category: string; subject: Subject }>> {
  const bisacData = data || (await loadBisacData());
  const matches: Array<{ category: string; subject: Subject }> = [];

  // Normalize the search term
  const searchTerm = query.trim().toLowerCase();

  for (const category of bisacData.categories) {
    const matchingSubjects = category.subjects.filter(
      subject =>
        subject.code.toLowerCase().includes(searchTerm) ||
        subject.label.toLowerCase().includes(searchTerm)
    );

    matchingSubjects.forEach(subject => {
      matches.push({
        category: category.heading,
        subject,
      });
    });
  }

  return matches;
}

export default {
  getFullLabelFromCode,
  getCodesForHeading,
  getCodeFromFullLabel,
  findSubjectsByPartialLabel,
  getHeadingForCode,
  getSubjectForCode,
  searchBisac,
};
