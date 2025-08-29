/**
 * BISAC module for ISBN-BISAC Tools
 *
 * This module provides functionality for working with BISAC subject headings,
 * including lookup, conversion, and comparison utilities.
 */

import { BisacData, Category, Subject } from '../types/index.js';
import * as storage from '../storage/index.js';
import { getDefaultBisacDataPath } from '../utils/paths.js';

/**
 * Default path to BISAC data file
 */
const DEFAULT_DATA_PATH = getDefaultBisacDataPath();

/**
 * Load BISAC data from a JSON file
 * @param filePath Path to the BISAC data file
 * @returns Loaded BISAC data
 */
export async function loadBisacData(filePath: string = DEFAULT_DATA_PATH): Promise<BisacData> {
  try {
    // Use the storage module to load BISAC data
    return await storage.loadBisacData(filePath);
  } catch (error) {
    throw new Error(
      `Failed to load BISAC data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Find a BISAC subject by its code
 * @param code BISAC code to look for
 * @param data BISAC data to search in
 * @returns The found subject or null if not found
 */
export async function findSubjectByCode(code: string, data?: BisacData): Promise<Subject | null> {
  const bisacData = data || (await loadBisacData());

  for (const category of bisacData.categories) {
    const subject = category.subjects.find(subject => subject.code === code);
    if (subject) {
      return subject;
    }
  }

  return null;
}

/**
 * Find subjects by a partial label match
 * @param partialLabel Partial label to search for
 * @param data BISAC data to search in
 * @returns Array of matching subjects
 */
export async function findSubjectsByPartialLabel(
  partialLabel: string,
  data?: BisacData
): Promise<Subject[]> {
  const bisacData = data || (await loadBisacData());
  const matches: Subject[] = [];
  const searchTerm = partialLabel.toLowerCase();

  for (const category of bisacData.categories) {
    const matchingSubjects = category.subjects.filter(subject =>
      subject.label.toLowerCase().includes(searchTerm)
    );
    matches.push(...matchingSubjects);
  }

  return matches;
}

/**
 * Find the category containing a specific subject code
 * @param code BISAC code to look for
 * @param data BISAC data to search in
 * @returns The category containing the code or null if not found
 */
export async function findCategoryByCode(code: string, data?: BisacData): Promise<Category | null> {
  const bisacData = data || (await loadBisacData());

  for (const category of bisacData.categories) {
    const hasCode = category.subjects.some(subject => subject.code === code);
    if (hasCode) {
      return category;
    }
  }

  return null;
}

/**
 * Get the full BISAC path (category and subject) for a code
 * @param code BISAC code to look up
 * @param data BISAC data to search in
 * @returns Formatted full path or null if not found
 */
export async function getFullPathForCode(code: string, data?: BisacData): Promise<string | null> {
  const category = await findCategoryByCode(code, data);
  const subject = await findSubjectByCode(code, data);

  if (!category || !subject) {
    return null;
  }

  return `${category.heading} / ${subject.label}`;
}

// Default export for direct import
export default {
  loadBisacData,
  findSubjectByCode,
  findSubjectsByPartialLabel,
  findCategoryByCode,
  getFullPathForCode,
};
