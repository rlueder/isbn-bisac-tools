/**
 * Type definitions for scraper-related data structures
 */

/**
 * Configuration options for the scraper
 */
export interface ScraperConfig {
  /** Main listing page URL */
  startUrl: string;
  /** Path to the output directory */
  outputDir: string;
  /** Path to the JSON output file */
  jsonPath: string;
  /** Directory to store screenshots */
  screenshotsDir: string;
  /** Selectors for the main page */
  mainPage: {
    /** Selector for category links */
    categoryLinks: string;
  };
  /** Selectors for the category pages */
  categoryPage: {
    /** Selector for the heading */
    heading: string;
    /** Selector for potential note paragraphs */
    potentialNotes?: string;
    /** Selector for subjects */
    subjects?: string;
    /** Text patterns to exclude */
    excludePatterns?: string[];
  };
  /** Minimum delay between page visits (ms) */
  minDelay: number;
  /** Maximum delay between page visits (ms) */
  maxDelay: number;
  /** Maximum number of categories to process (null for all) */
  maxCategories: number | null;
  /** Whether to take screenshots during scraping */
  takeScreenshots: boolean;
  /** Browser launch options */
  browserOptions: {
    /** Headless mode */
    headless: boolean;
    /** Additional launch options */
    [key: string]: unknown;
  };
}

/**
 * Scraper progress information
 */
export interface ScraperProgress {
  /** Current item being processed */
  current: number;
  /** Total items to process */
  total: number;
  /** Current URL being processed */
  url: string;
  /** Current status message */
  status?: string;
}

/**
 * Options for scraping operation
 */
export interface ScrapeOptions {
  /** Whether to run in headless mode */
  headless?: boolean;
  /** Whether to take screenshots */
  takeScreenshots?: boolean;
  /** Custom output directory */
  outputDir?: string;
  /** Maximum number of categories to process */
  maxCategories?: number;
  /** Specific URL to scrape (bypasses main page) */
  specificUrl?: string;
  /** Whether to merge with existing data */
  mergeWithExisting?: boolean;
  /** Custom browser launch options */
  browserOptions?: Record<string, unknown>;
}

/**
 * Result of a scraping operation
 */
export interface ScrapeResult {
  /** Whether the scrape was successful */
  success: boolean;
  /** Path to the output file */
  outputPath?: string;
  /** Number of categories scraped */
  categoryCount: number;
  /** Number of subjects scraped */
  subjectCount: number;
  /** Error information if scrape failed */
  error?: {
    /** Error message */
    message: string;
    /** Error details */
    details?: unknown;
  };
}
