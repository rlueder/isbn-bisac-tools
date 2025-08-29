/**
 * Utility functions for the BISAC scraper
 */

import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';
import { Page } from 'puppeteer';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { Category, BisacData } from '../src/types/index.js';
import { glob } from 'glob';

const execPromise = promisify(exec);

/**
 * Initialize the necessary directories
 * @param outputDir - The directory to store output files
 * @param screenshotsDir - The directory to store screenshots
 * @param takeScreenshots - Whether to initialize the screenshots directory
 */
export async function initialize(
  outputDir: string,
  screenshotsDir: string,
  takeScreenshots: boolean = false
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  if (takeScreenshots) {
    await fs.mkdir(screenshotsDir, { recursive: true });
    console.log('📁 Output and screenshots directories initialized.');
  } else {
    console.log('📁 Output directory initialized.');
  }
}

/**
 * Take a screenshot
 * @param page - Puppeteer page object
 * @param name - Base name for the screenshot
 * @param screenshotsDir - Directory to save screenshots
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  screenshotsDir: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotsDir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Save data to JSON file
 * @param filePath - Path to save the JSON file
 * @param data - Data to save
 */
export async function saveToJSON<T>(filePath: string, data: T): Promise<void> {
  // If this is BISAC category data, format it with metadata and use fixed filename
  if (Array.isArray(data) && data.length > 0 && 'subjects' in data[0]) {
    // Get the current date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Create the fixed output path
    const outputDir = path.dirname(filePath);
    const fixedFilePath = path.join(outputDir, 'bisac-data.json');

    // Create the data structure with metadata
    const bisacData: BisacData = {
      timestamp: Date.now(),
      date: dateStr,
      categories: data as Category[],
    };

    await fs.writeFile(fixedFilePath, JSON.stringify(bisacData, null, 2));
    console.log(`💾 BISAC data saved to: ${fixedFilePath}`);
    return;
  }

  // For other types of data, maintain the original behavior
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 Data saved to: ${filePath}`);
}

/**
 * Generate a random delay between min and max with visual countdown
 * @param min - Minimum delay in ms
 * @param max - Maximum delay in ms
 * @returns A Promise that resolves after the delay
 */
export function randomDelay(min: number, max: number): Promise<number> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  return new Promise(resolve => {
    // Show a visual countdown
    const intervalTime = 250; // Update every 250ms
    let remainingTime = delay;
    const timerEmojis = ['⏰', '⌛', '⏱️', '⏳'];
    let emojiIndex = 0;

    console.log(`\n${timerEmojis[emojiIndex]} Starting countdown for ${delay}ms delay...`);

    const interval = setInterval(() => {
      remainingTime -= intervalTime;
      emojiIndex = (emojiIndex + 1) % timerEmojis.length;

      // Only log every second to avoid flooding the console
      if (remainingTime % 1000 === 0 || remainingTime <= 0) {
        const secondsLeft = Math.ceil(remainingTime / 1000);
        process.stdout.write(
          `\r${timerEmojis[emojiIndex]} ${secondsLeft} seconds remaining...${' '.repeat(20)}`
        );
      }

      if (remainingTime <= 0) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve(delay);
      }
    }, intervalTime);
  });
}

/**
 * Get the path to the latest JSON file in the output directory
 * @param outputDir - The directory containing BISAC JSON files (default: ./data)
 * @returns The full path to the latest JSON file, or undefined if none found
 */
/**
 * Runs the BISAC scraper to generate a new JSON file
 * @returns A promise that resolves when the scraper completes
 */
export async function runBisacScraper(): Promise<boolean> {
  console.log('🔄 No existing BISAC data files found. Running the scraper...');

  // Log directory information for debugging
  const currentDir = process.cwd();
  console.log(`📂 Current working directory: ${currentDir}`);
  const dataDir = path.join(currentDir, 'data');
  console.log(`📂 Data directory path: ${dataDir}`);

  // Check if data directory exists
  if (!fsSync.existsSync(dataDir)) {
    console.log(`📂 Creating data directory: ${dataDir}`);
    fsSync.mkdirSync(dataDir, { recursive: true });
  }

  return new Promise(resolve => {
    console.log('🚀 Attempting to run the BISAC scraper...');

    // Use npm to run the scraper script
    const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    try {
      // Use spawn to allow stdio inheritance
      const scraperProcess = spawn(npmExecutable, ['run', 'scrape'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true, // Use shell to properly handle npm commands
      });

      scraperProcess.on('close', async code => {
        if (code === 0) {
          console.log('✅ Scraper completed successfully');

          // Verify the data file was created
          try {
            const dataFilePath = await getLatestJsonFilePath();
            console.log(`✅ Found generated BISAC data file: ${dataFilePath}`);
            resolve(true);
          } catch (error) {
            console.error(`❌ Failed to find BISAC data file after running the scraper`);
            resolve(false);
          }
        } else {
          console.error(`❌ Scraper failed with code ${code}`);
          resolve(false);
        }
      });

      scraperProcess.on('error', error => {
        console.error(`❌ Scraper process error: ${error.message}`);
        resolve(false);
      });
    } catch (error) {
      console.error(`❌ Failed to run the scraper: ${(error as Error).message}`);
      resolve(false);
    }
  });
}

/**
 * Check if a JSON file with today's date already exists
 * @param outputDir - The directory containing BISAC JSON files (default: ./data)
 * @returns The full path to today's JSON file if it exists, or undefined if not found
 */
export async function checkExistingJsonFileForToday(
  outputDir: string = path.join(process.cwd(), 'data')
): Promise<string | undefined> {
  try {
    // Use fixed filename instead of date-based naming
    const filename = 'bisac-data.json';
    const filePath = path.join(outputDir, filename);

    // Check if the file exists
    try {
      await fs.access(filePath);
      return filePath; // File exists
    } catch {
      return undefined; // File doesn't exist
    }
  } catch (error) {
    console.error(`❌ Error checking for today's JSON file: ${(error as Error).message}`);
    return undefined;
  }
}

export async function getLatestJsonFilePath(
  outputDir: string = path.join(process.cwd(), 'data')
): Promise<string> {
  try {
    // Create the output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Check for the fixed filename in the specified output directory
    const filePath = path.join(outputDir, 'bisac-data.json');

    try {
      await fs.access(filePath);
      console.log(`📂 Found BISAC data file: ${filePath}`);
      return filePath;
    } catch (err) {
      // Handle the case where no BISAC data file exists in output directory
      console.warn(`⚠️ No BISAC data file found in the output directory: ${outputDir}`);
    }

    // Check in the module directory
    try {
      const moduleDir = new URL('.', import.meta.url).pathname;
      const moduleDataPath = path.resolve(moduleDir, '..', '..', 'data', 'bisac-data.json');

      if (fsSync.existsSync(moduleDataPath)) {
        console.log(`📂 Found BISAC data file in module directory: ${moduleDataPath}`);
        return moduleDataPath;
      }
    } catch (modulePathError) {
      console.warn(`⚠️ Could not check module path: ${(modulePathError as Error).message}`);
    }

    // Check in the root directory of the project
    const projectRootPath = path.resolve(process.cwd(), '..', 'data', 'bisac-data.json');
    if (fsSync.existsSync(projectRootPath)) {
      console.log(`📂 Found BISAC data file in project root: ${projectRootPath}`);
      return projectRootPath;
    }

    // If no files found, throw an error
    throw new Error('No BISAC data file found in any directory');
  } catch (error) {
    console.error(`❌ Error finding latest JSON file: ${(error as Error).message}`);
    throw new Error(`Failed to find BISAC data file: ${(error as Error).message}`);
  }
}

/**
 * Load BISAC data from JSON file
 * @param filePath - Path to the JSON file (if undefined, uses latest file)
 * @returns Array of Category objects
 */
export async function loadBisacData(filePath?: string): Promise<Category[]> {
  try {
    // If no file path provided, get the latest one
    let resolvedPath = filePath;

    if (!resolvedPath) {
      try {
        resolvedPath = await getLatestJsonFilePath();
      } catch (pathError) {
        // Try to find the data file in the module directory
        try {
          const moduleDir = new URL('.', import.meta.url).pathname;
          const dataPath = path.resolve(moduleDir, '..', '..', 'data', 'bisac-data.json');

          if (fsSync.existsSync(dataPath)) {
            resolvedPath = dataPath;
            console.log(`📂 Using bundled BISAC data file: ${dataPath}`);
          }
        } catch (modulePathError) {
          console.error(`⚠️ Could not locate module path: ${(modulePathError as Error).message}`);
        }

        // If still not found, check current working directory
        if (!resolvedPath) {
          const cwdDataPath = path.join(process.cwd(), 'data', 'bisac-data.json');
          if (fsSync.existsSync(cwdDataPath)) {
            resolvedPath = cwdDataPath;
            console.log(`📂 Using BISAC data file from current directory: ${cwdDataPath}`);
          }
        }
      }
    }

    if (!resolvedPath) {
      throw new Error(
        'No BISAC data file found. Try running with --scrape to generate the data first.'
      );
    }

    const data = await fs.readFile(resolvedPath, 'utf-8');
    const jsonData = JSON.parse(data);

    // Check if this is the new format (with timestamp and categories)
    if (jsonData.categories && Array.isArray(jsonData.categories)) {
      console.log(`📅 Loaded BISAC data from ${jsonData.date} (timestamp: ${jsonData.timestamp})`);
      return jsonData.categories as Category[];
    }

    // Legacy format (array of categories directly)
    return jsonData as Category[];
  } catch (error) {
    console.error(`❌ Error loading BISAC data: ${(error as Error).message}`);
    throw new Error(`Failed to load BISAC data: ${(error as Error).message}`);
  }
}

/**
 * Get full label for a subject code
 * @param code - BISAC subject code (e.g., ANT007000)
 * @param dataFilePath - Path to the BISAC data JSON file (if undefined, uses latest file)
 * @returns The full label or undefined if not found
 */
export async function getFullLabelFromCode(
  code: string,
  dataFilePath?: string
): Promise<string | undefined> {
  const categories = await loadBisacData(dataFilePath);

  for (const category of categories) {
    const subject = category.subjects.find(s => s.code === code);
    if (subject) {
      // If the subject label already includes the category heading, return it directly
      if (subject.label.startsWith(category.heading + ' / ')) {
        return subject.label;
      }
      return `${category.heading} / ${subject.label}`;
    }
  }

  console.log(`🔍 No label found for code: ${code}`);
  console.log(
    `ℹ️ Note: This code may exist in the complete BISAC dataset but is not available in the current data.`
  );
  console.log(
    `ℹ️ If you used --url to fetch a specific category, try using a different category URL or fetch the full dataset.`
  );
  return undefined;
}

/**
 * Get all codes and full labels for a category heading
 * @param heading - BISAC category heading (e.g., "ANTIQUES & COLLECTIBLES")
 * @param dataFilePath - Path to the BISAC data JSON file (if undefined, uses latest file)
 * @returns Array of code and full label pairs
 */
export async function getCodesForHeading(
  heading: string,
  dataFilePath?: string
): Promise<Array<{ code: string; fullLabel: string }>> {
  const categories = await loadBisacData(dataFilePath);

  // Normalize the input heading for comparison
  const normalizedHeading = heading.toUpperCase().trim();

  const category = categories.find(c => {
    const categoryHeading = c.heading.toUpperCase().trim();
    return (
      categoryHeading === normalizedHeading ||
      categoryHeading.replace('&', 'AND') === normalizedHeading.replace('&', 'AND')
    );
  });

  if (!category) {
    console.log(`🔍 No category found with heading: ${heading}`);
    return [];
  }

  return category.subjects.map(subject => ({
    code: subject.code,
    fullLabel: subject.label.startsWith(category.heading + ' / ')
      ? subject.label
      : `${category.heading} / ${subject.label}`,
  }));
}

/**
 * Get code from a full label
 * @param fullLabel - Full BISAC label (e.g., "ANTIQUES & COLLECTIBLES / Buttons & Pins")
 * @param dataFilePath - Path to the BISAC data JSON file (if undefined, uses latest file)
 * @returns The code or undefined if not found
 */
export async function getCodeFromFullLabel(
  fullLabel: string,
  dataFilePath?: string
): Promise<string | undefined> {
  const categories = await loadBisacData(dataFilePath);
  // Extract the heading - it's the first part before " / "
  const firstSeparatorIndex = fullLabel.indexOf(' / ');
  if (firstSeparatorIndex === -1) {
    console.log(`❌ Invalid full label format: ${fullLabel}`);
    console.log('Full label must be in format "HEADING / SUBJECT"');
    return undefined;
  }

  const heading = fullLabel.substring(0, firstSeparatorIndex);
  // The subject label is everything after the heading and the first separator
  const subjectLabel = fullLabel.substring(firstSeparatorIndex + 3);

  if (!heading || !subjectLabel) {
    console.log(`❌ Invalid full label format: ${fullLabel}`);
    console.log('Full label must be in format "HEADING / SUBJECT"');
    return undefined;
  }

  // Normalize the input heading for comparison
  const normalizedHeading = heading.toUpperCase().trim();

  const category = categories.find(c => {
    const categoryHeading = c.heading.toUpperCase().trim();
    return (
      categoryHeading === normalizedHeading ||
      categoryHeading.replace('&', 'AND') === normalizedHeading.replace('&', 'AND')
    );
  });

  if (!category) {
    console.log(`🔍 No category found with heading: ${heading}`);
    return undefined;
  }

  const subject = category.subjects.find(s => {
    // For exact match with the full label
    if (s.label.toUpperCase().trim() === fullLabel.toUpperCase().trim()) {
      return true;
    }

    // The stored label might be in format "CATEGORY / SUBJECT"
    const labelParts = s.label.split(' / ');
    const subjectPart = labelParts.length > 1 ? labelParts[1].trim() : s.label.trim();

    // Check if the subject portion matches
    return subjectPart.toUpperCase() === subjectLabel.toUpperCase().trim();
  });

  if (!subject) {
    console.log(`🔍 No subject found with label: ${subjectLabel} in category: ${heading}`);
    return undefined;
  }

  return subject.code;
}

/**
 * Get BISAC code(s) from an ISBN
 * @param isbn - ISBN-10 or ISBN-13 (hyphens optional)
 * @param dataFilePath - Path to the BISAC data JSON file (if undefined, uses latest file)
 * @returns Promise resolving to an array of BISAC codes or empty array if none found
 */
/**
 * Ranks and returns the best BISAC category for a book
 * @param categories - List of potential BISAC categories
 * @param book - Google Books API book data
 * @returns The best matching category based on relevance, or null if no categories
 */
// Simple interface for the parts of Google Books API response we use
interface GoogleBookInfo {
  volumeInfo?: {
    description?: string;
    categories?: string[];
  };
}

function getBestBisacCategory(
  categories: Array<{ code: string; fullLabel: string }>,
  book: GoogleBookInfo
): { code: string; fullLabel: string } | undefined {
  if (categories.length === 0) return undefined;
  if (categories.length === 1) return categories[0];

  // Initialize category scores
  const categoryScores = categories.map(category => ({
    category,
    score: 0,
  }));

  // Get book description and Google's category
  const description = book.volumeInfo?.description || '';
  const googleCategories = book.volumeInfo?.categories || [];

  // Weight 1: Check if category appears in Google's categories
  for (const { category, score: _score } of categoryScores) {
    const fullLabelLower = category.fullLabel.toLowerCase();

    for (const googleCategory of googleCategories) {
      if (googleCategory.toLowerCase().includes(fullLabelLower)) {
        const scoreItem = categoryScores.find(c => c.category === category);
        if (scoreItem) scoreItem.score += 5;
      }
    }
  }

  // Weight 2: Check for category mentions in book description
  for (const { category, score: _score } of categoryScores) {
    const fullLabelParts = category.fullLabel.toLowerCase().split(' / ');
    const mainCategory = fullLabelParts[0];
    const subCategory = fullLabelParts[1] || '';

    // Main category is in description
    if (description.toLowerCase().includes(mainCategory.toLowerCase())) {
      const scoreItem = categoryScores.find(c => c.category === category);
      if (scoreItem) scoreItem.score += 2;
    }

    // Subcategory is in description
    if (subCategory && description.toLowerCase().includes(subCategory.toLowerCase())) {
      const scoreItem = categoryScores.find(c => c.category === category);
      if (scoreItem) scoreItem.score += 3;
    }
  }

  // Weight 3: Special category recognition for comics, graphic novels, etc.
  if (
    description.toLowerCase().includes('comic') ||
    description.toLowerCase().includes('marvel') ||
    description.toLowerCase().includes('superhero') ||
    description.toLowerCase().includes('graphic novel')
  ) {
    for (const { category } of categoryScores) {
      if (
        category.fullLabel.toLowerCase().includes('comics') ||
        category.fullLabel.toLowerCase().includes('graphic novel')
      ) {
        const scoreItem = categoryScores.find(c => c.category === category);
        if (scoreItem) scoreItem.score += 8;
      }
    }
  }

  // Find category with highest score
  categoryScores.sort((a, b) => b.score - a.score);

  // Return the highest scoring category
  return categoryScores[0].category;
}

export async function getCodeFromISBN(
  isbn: string,
  dataFilePath?: string
): Promise<{
  title: string;
  categories: Array<{ code: string; fullLabel: string }>;
  bestCategory?: { code: string; fullLabel: string };
}> {
  // Clean the ISBN (remove hyphens and spaces)
  const cleanIsbn = isbn.replace(/[-\s]/g, '');

  if (!/^(\d{10}|\d{13})$/.test(cleanIsbn)) {
    console.log(`❌ Invalid ISBN format: ${isbn}`);
    console.log('ISBN must be 10 or 13 digits (hyphens optional)');
    return { title: 'Invalid ISBN', categories: [] };
  }

  try {
    // Use Google Books API to get book information from ISBN
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);

    if (!response.ok) {
      throw new Error(`Google Books API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`📚 No book found with ISBN: ${cleanIsbn}`);
      return { title: 'Book Not Found', categories: [] };
    }

    const book = data.items[0];

    // Get book title
    const title = book.volumeInfo?.title || 'Unknown Title';

    // Extract BISAC categories from industry identifiers
    const categories: Array<{ code: string; fullLabel: string }> = [];

    // Check if the book has BISAC categories in the industryIdentifiers
    if (book.volumeInfo && book.volumeInfo.industryIdentifiers) {
      const bisacIdentifiers = book.volumeInfo.industryIdentifiers.filter(
        (id: { type: string; identifier: string }) => id.type === 'BISAC'
      );

      for (const id of bisacIdentifiers) {
        const code = id.identifier;
        const fullLabel =
          (await getFullLabelFromCode(code, dataFilePath)) || 'Unknown BISAC category';
        categories.push({ code, fullLabel });
      }
    }

    // If no BISAC identifiers found, try to match categories from book categories
    if (categories.length === 0 && book.volumeInfo && book.volumeInfo.categories) {
      const bisacData = await loadBisacData(dataFilePath);

      for (const category of book.volumeInfo.categories) {
        // Try to match the category to BISAC categories
        for (const bisacCategory of bisacData) {
          // Check if the category matches a BISAC heading
          if (category.toUpperCase().includes(bisacCategory.heading.toUpperCase())) {
            // Return all subjects under this category
            for (const subject of bisacCategory.subjects) {
              categories.push({
                code: subject.code,
                fullLabel: `${bisacCategory.heading} / ${subject.label}`,
              });
            }
            break;
          }

          // Check if it matches any subject
          for (const subject of bisacCategory.subjects) {
            if (category.toUpperCase().includes(subject.label.toUpperCase())) {
              categories.push({
                code: subject.code,
                fullLabel: `${bisacCategory.heading} / ${subject.label}`,
              });
              break;
            }
          }
        }
      }
    }

    // Find the best category if multiple were found
    const bestCategory = getBestBisacCategory(categories, book);

    // We don't need to log here as the caller will handle it
    return { title, categories, bestCategory };
  } catch (error) {
    console.error(
      `❌ Error looking up ISBN: ${error instanceof Error ? error.message : String(error)}`
    );
    return { title: 'Error', categories: [] };
  }
}

/**
 * Print formatted JSON to console
 * Uses jq if available, falls back to JSON.stringify
 * @param data - The data to print
 * @param title - Optional title to print before the data
 */
export async function printFormattedJSON<T>(data: T, title?: string): Promise<void> {
  if (title) {
    console.log(`\n${title}`);
  }
  console.log('✨ Formatted output:');

  try {
    // Check if jq is available
    await execPromise('which jq');

    // Use jq for pretty formatting (with colors)
    const jsonString = JSON.stringify(data);
    const { stdout } = await execPromise(`echo '${jsonString.replace(/'/g, "'\\''")}' | jq .`);
    console.log(stdout);
  } catch (error) {
    // jq not available, fall back to built-in formatting
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Interface for a comparison result between two BISAC JSON files
 */
interface BisacComparisonResult {
  oldFilePath: string;
  newFilePath: string;
  oldDate: string;
  newDate: string;
  summary: {
    totalCategoriesOld: number;
    totalCategoriesNew: number;
    totalSubjectsOld: number;
    totalSubjectsNew: number;
    newCategories: number;
    removedCategories: number;
    modifiedCategories: number;
    newSubjects: number;
    removedSubjects: number;
    modifiedSubjects: number;
  };
  newCategories: {
    heading: string;
    subjectCount: number;
  }[];
  removedCategories: {
    heading: string;
    subjectCount: number;
  }[];
  modifiedCategories: {
    heading: string;
    newSubjects: {
      code: string;
      label: string;
    }[];
    removedSubjects: {
      code: string;
      label: string;
    }[];
    modifiedSubjects: {
      code: string;
      oldLabel: string;
      newLabel: string;
    }[];
  }[];
}

/**
 * Compare two BISAC JSON files and identify differences
 * @param olderFilePath - Path to the older BISAC JSON file
 * @param newerFilePath - Path to the newer BISAC JSON file
 * @returns Comparison results showing differences between the files
 */
export async function compareBisacJsonFiles(
  olderFilePath: string,
  newerFilePath: string
): Promise<BisacComparisonResult> {
  try {
    // Load both JSON files
    const oldData = await loadBisacData(olderFilePath);
    const newData = await loadBisacData(newerFilePath);

    if (!oldData.length || !newData.length) {
      throw new Error('One or both of the JSON files could not be loaded or are empty');
    }

    // Get file metadata instead of extracting dates from filenames
    const getFileDate = async (filePath: string): Promise<string> => {
      try {
        const stats = await fs.stat(filePath);
        return stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD format
      } catch (err) {
        return 'unknown date';
      }
    };

    const oldDate = await getFileDate(olderFilePath);
    const newDate = await getFileDate(newerFilePath);

    // Initialize comparison result
    const result: BisacComparisonResult = {
      oldFilePath: olderFilePath,
      newFilePath: newerFilePath,
      oldDate,
      newDate,
      summary: {
        totalCategoriesOld: oldData.length,
        totalCategoriesNew: newData.length,
        totalSubjectsOld: oldData.reduce((sum, category) => sum + category.subjects.length, 0),
        totalSubjectsNew: newData.reduce((sum, category) => sum + category.subjects.length, 0),
        newCategories: 0,
        removedCategories: 0,
        modifiedCategories: 0,
        newSubjects: 0,
        removedSubjects: 0,
        modifiedSubjects: 0,
      },
      newCategories: [],
      removedCategories: [],
      modifiedCategories: [],
    };

    // Create maps for easier comparisons
    const oldCategoriesMap = new Map(oldData.map(category => [category.heading, category]));
    const newCategoriesMap = new Map(newData.map(category => [category.heading, category]));

    // Find new categories
    for (const [heading, category] of newCategoriesMap) {
      if (!oldCategoriesMap.has(heading)) {
        result.newCategories.push({
          heading,
          subjectCount: category.subjects.length,
        });
        result.summary.newCategories++;
        result.summary.newSubjects += category.subjects.length;
      }
    }

    // Find removed categories
    for (const [heading, category] of oldCategoriesMap) {
      if (!newCategoriesMap.has(heading)) {
        result.removedCategories.push({
          heading,
          subjectCount: category.subjects.length,
        });
        result.summary.removedCategories++;
        result.summary.removedSubjects += category.subjects.length;
      }
    }

    // Analyze categories that exist in both files
    for (const [heading, oldCategory] of oldCategoriesMap) {
      if (newCategoriesMap.has(heading)) {
        const newCategory = newCategoriesMap.get(heading)!;

        // Create maps of subjects by code for comparison
        const oldSubjectsMap = new Map(
          oldCategory.subjects.map(subject => [subject.code, subject])
        );
        const newSubjectsMap = new Map(
          newCategory.subjects.map(subject => [subject.code, subject])
        );

        const categoryChanges = {
          heading,
          newSubjects: [] as { code: string; label: string }[],
          removedSubjects: [] as { code: string; label: string }[],
          modifiedSubjects: [] as { code: string; oldLabel: string; newLabel: string }[],
        };

        let hasChanges = false;

        // Find new subjects
        for (const [code, subject] of newSubjectsMap) {
          if (!oldSubjectsMap.has(code)) {
            categoryChanges.newSubjects.push({
              code,
              label: subject.label,
            });
            result.summary.newSubjects++;
            hasChanges = true;
          }
        }

        // Find removed subjects
        for (const [code, subject] of oldSubjectsMap) {
          if (!newSubjectsMap.has(code)) {
            categoryChanges.removedSubjects.push({
              code,
              label: subject.label,
            });
            result.summary.removedSubjects++;
            hasChanges = true;
          }
        }

        // Find modified subjects (same code but different label)
        for (const [code, oldSubject] of oldSubjectsMap) {
          if (newSubjectsMap.has(code)) {
            const newSubject = newSubjectsMap.get(code)!;
            if (oldSubject.label !== newSubject.label) {
              categoryChanges.modifiedSubjects.push({
                code,
                oldLabel: oldSubject.label,
                newLabel: newSubject.label,
              });
              result.summary.modifiedSubjects++;
              hasChanges = true;
            }
          }
        }

        // Add category to modified list if it has any changes
        if (hasChanges) {
          result.modifiedCategories.push(categoryChanges);
          result.summary.modifiedCategories++;
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`❌ Error comparing BISAC JSON files: ${(error as Error).message}`);
    throw new Error(`Failed to compare BISAC data files: ${(error as Error).message}`);
  }
}

/**
 * Print a comparison report between two BISAC JSON files
 * @param comparison - Comparison result object
 */
export async function printComparisonReport(comparison: BisacComparisonResult): Promise<void> {
  console.log('\n📊 BISAC Subject Headings Comparison Report 📊');
  console.log('==============================================');

  console.log(`\n📆 Comparing data from ${comparison.oldDate} to ${comparison.newDate}`);
  console.log(`Old file: ${path.basename(comparison.oldFilePath)}`);
  console.log(`New file: ${path.basename(comparison.newFilePath)}`);

  console.log('\n📈 Summary:');
  console.log(
    `- Categories: ${comparison.summary.totalCategoriesOld} → ${comparison.summary.totalCategoriesNew} (${comparison.summary.totalCategoriesNew > comparison.summary.totalCategoriesOld ? '+' : ''}${comparison.summary.totalCategoriesNew - comparison.summary.totalCategoriesOld})`
  );
  console.log(
    `- Subjects: ${comparison.summary.totalSubjectsOld} → ${comparison.summary.totalSubjectsNew} (${comparison.summary.totalSubjectsNew > comparison.summary.totalSubjectsOld ? '+' : ''}${comparison.summary.totalSubjectsNew - comparison.summary.totalSubjectsOld})`
  );
  console.log(`- New categories: ${comparison.summary.newCategories}`);
  console.log(`- Removed categories: ${comparison.summary.removedCategories}`);
  console.log(`- Modified categories: ${comparison.summary.modifiedCategories}`);
  console.log(`- New subjects: ${comparison.summary.newSubjects}`);
  console.log(`- Removed subjects: ${comparison.summary.removedSubjects}`);
  console.log(`- Modified subjects: ${comparison.summary.modifiedSubjects}`);

  // Display new categories
  if (comparison.newCategories.length > 0) {
    console.log('\n🆕 New Categories:');
    comparison.newCategories.forEach(category => {
      console.log(`- ${category.heading} (${category.subjectCount} subjects)`);
    });
  }

  // Display removed categories
  if (comparison.removedCategories.length > 0) {
    console.log('\n🗑️ Removed Categories:');
    comparison.removedCategories.forEach(category => {
      console.log(`- ${category.heading} (${category.subjectCount} subjects)`);
    });
  }

  // Display modified categories
  if (comparison.modifiedCategories.length > 0) {
    console.log('\n📝 Modified Categories:');
    comparison.modifiedCategories.forEach(category => {
      console.log(`\n📂 ${category.heading}:`);

      if (category.newSubjects.length > 0) {
        console.log('  ➕ New subjects:');
        category.newSubjects.forEach(subject => {
          console.log(`    - ${subject.code}: ${subject.label}`);
        });
      }

      if (category.removedSubjects.length > 0) {
        console.log('  ➖ Removed subjects:');
        category.removedSubjects.forEach(subject => {
          console.log(`    - ${subject.code}: ${subject.label}`);
        });
      }

      if (category.modifiedSubjects.length > 0) {
        console.log('  🔄 Modified subjects:');
        category.modifiedSubjects.forEach(subject => {
          console.log(`    - ${subject.code}:`);
          console.log(`      FROM: ${subject.oldLabel}`);
          console.log(`      TO:   ${subject.newLabel}`);
        });
      }
    });
  }

  console.log('\n✅ End of comparison report');
}

/**
 * Select two BISAC JSON files for comparison using an interactive prompt
 * @param outputDir - The directory containing BISAC JSON files (default: ./data)
 * @returns Object containing paths to the selected files, or undefined if canceled
 */
/**
 * Creates a backup of the bisac-data.json file with a timestamp-based filename
 * @param outputDir Directory where the bisac-data.json file is located
 * @returns Path to the created backup file, or undefined if backup failed
 */
export async function createBackupOfBisacData(
  outputDir: string = path.join(process.cwd(), 'data')
): Promise<string | undefined> {
  try {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Path to the main data file
    const dataFilePath = path.join(outputDir, 'bisac-data.json');

    // Check if the file exists
    try {
      await fs.access(dataFilePath);
    } catch (err) {
      console.warn('⚠️ No bisac-data.json file found to back up');
      return undefined;
    }

    // Get current date for the backup filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create backup filename
    const backupFileName = `bisac-data-backup-${dateStr}.json`;
    const backupFilePath = path.join(outputDir, backupFileName);

    // Check if a backup with this name already exists
    try {
      await fs.access(backupFilePath);
      // If we get here, the file exists, so let's add a timestamp to make it unique
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const uniqueBackupFileName = `bisac-data-backup-${dateStr}-${timestamp}.json`;
      const uniqueBackupFilePath = path.join(outputDir, uniqueBackupFileName);

      // Copy the file to the unique backup path
      await fs.copyFile(dataFilePath, uniqueBackupFilePath);
      console.log(`📂 Created unique backup at: ${uniqueBackupFilePath}`);
      return uniqueBackupFilePath;
    } catch (err) {
      // File doesn't exist, proceed with normal backup
      await fs.copyFile(dataFilePath, backupFilePath);
      console.log(`📂 Created backup at: ${backupFilePath}`);
      return backupFilePath;
    }
  } catch (error) {
    console.error(`❌ Error creating backup: ${(error as Error).message}`);
    return undefined;
  }
}

export async function selectFilesForComparison(
  outputDir: string = path.join(process.cwd(), 'data')
): Promise<{ olderFile: string; newerFile: string } | undefined> {
  try {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Find JSON backup files in the output directory
    const files = await glob(`${outputDir}/*.json`);

    // Filter out non-BISAC data files if needed
    const validFiles = files.filter(file => {
      const basename = path.basename(file);
      return basename === 'bisac-data.json' || basename.includes('bisac-data-backup');
    });

    if (validFiles.length < 2) {
      console.error(
        '❌ Need at least two BISAC JSON files for comparison. Please create backups of your bisac-data.json file before updating.'
      );
      return undefined;
    }

    // Sort files by modification time (newest first) with error handling for tests
    let sortedFiles: string[] = [];
    try {
      const fileStats = await Promise.all(
        validFiles.map(async file => {
          try {
            const stats = await fs.stat(file);
            return {
              path: file,
              mtime: stats.mtime,
            };
          } catch (err) {
            // Fallback for tests where fs.stat might be mocked incompletely
            return {
              path: file,
              mtime: new Date(), // Use current date as fallback
            };
          }
        })
      );

      sortedFiles = fileStats
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        .map(item => item.path);
    } catch (err) {
      // Fallback if Promise.all fails - just use the file list unsorted
      console.warn('⚠️ Could not sort files by modification time:', err);
      sortedFiles = validFiles;
    }

    // Format choices for display with modification dates
    const fileChoices = await Promise.all(
      sortedFiles.map(async file => {
        try {
          const stats = await fs.stat(file);
          const dateStr = stats.mtime.toISOString().split('T')[0];
          return {
            name: `${path.basename(file)} (${dateStr})`,
            value: file,
          };
        } catch (err) {
          // Fallback for tests
          return {
            name: path.basename(file),
            value: file,
          };
        }
      })
    );

    // Attempt to import inquirer dynamically
    const { default: inquirer } = await import('inquirer');

    // Prompt for newer file
    const { newerFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'newerFile',
        message: 'Select the NEWER file:',
        choices: fileChoices,
      },
    ]);

    // Filter out the selected file for the second prompt
    const olderFileChoices = fileChoices.filter(choice => choice.value !== newerFile);

    // Prompt for older file
    const { olderFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'olderFile',
        message: 'Select the OLDER file to compare against:',
        choices: olderFileChoices,
      },
    ]);

    return { olderFile, newerFile };
  } catch (error) {
    console.error(`❌ Error selecting files for comparison: ${(error as Error).message}`);
    return undefined;
  }
}

/**
 * Browse a JSON file using the fx tool
 * Allows interactive selection of JSON files from the output directory
 */
export async function browseJsonFile(
  outputDir: string = path.join(process.cwd(), 'data')
): Promise<boolean> {
  try {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Find all JSON files
    const files = await glob(`${outputDir}/*.json`);

    if (files.length === 0) {
      console.error('❌ No JSON files found in the data directory');
      return false;
    }

    // Get file stats for modification time sorting
    const fileStats = await Promise.all(
      files.map(async filePath => {
        const stats = await fs.stat(filePath);
        return {
          path: filePath,
          mtime: stats.mtime,
        };
      })
    );

    // Sort files by modification time (newest first)
    const sortedFiles = fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Format choices for display
    const fileChoices = sortedFiles.map(file => {
      return {
        name: `${path.basename(file.path)} (${file.mtime.toLocaleDateString()} ${file.mtime.toLocaleTimeString()})`,
        value: file.path,
      };
    });

    // Attempt to import inquirer dynamically
    const { default: inquirer } = await import('inquirer');

    // Prompt for file selection
    const { selectedFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: 'Select a JSON file to browse:',
        choices: fileChoices,
        pageSize: 15,
      },
    ]);

    console.log(`📂 Opening ${path.basename(selectedFile)} with fx...`);

    // Use child_process to open fx with the selected file
    const { spawn } = await import('child_process');
    const fxProcess = spawn('npx', ['fx'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: process.cwd(),
    });

    // Read the file and pipe to fx
    const fileContent = await fs.readFile(selectedFile, 'utf8');
    fxProcess.stdin?.write(fileContent);
    fxProcess.stdin?.end();

    return new Promise(resolve => {
      fxProcess.on('exit', code => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error(`❌ fx exited with code ${code}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error browsing JSON file: ${(error as Error).message}`);
    return false;
  }
}
