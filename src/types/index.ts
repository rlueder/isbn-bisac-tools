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
 * Subject data structure
 */
export interface Subject {
  /** The subject code (e.g., ANT000000) */
  code: string;
  /** The subject label */
  label: string;
}

/**
 * Category data structure
 */
export interface Category {
  /** The category heading */
  heading: string;
  /** Notes about the category */
  notes: string[];
  /** Subjects within the category */
  subjects: Subject[];
}

/**
 * BISAC data structure with metadata
 */
export interface BisacData {
  /** Timestamp when the data was generated (milliseconds since epoch) */
  timestamp: number;
  /** Human readable date when the data was generated (YYYY-MM-DD) */
  date: string;
  /** List of categories with subjects */
  categories: Category[];
}
