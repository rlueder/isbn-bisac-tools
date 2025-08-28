/**
 * Type definitions for configuration-related data structures
 */

/**
 * Application configuration options
 */
export interface AppConfig {
  /** Data directory path */
  dataDir: string;
  /** Default output path for JSON files */
  outputPath: string;
  /** Whether to enable debug mode */
  debug: boolean;
  /** Path to screenshots directory */
  screenshotsDir: string;
}

/**
 * Command-line options for the application
 */
export interface CommandLineOptions {
  /** Whether to run in headless mode */
  headless?: boolean;
  /** Whether to take screenshots */
  screenshots?: boolean;
  /** Custom output directory */
  outputDir?: string;
  /** Maximum number of categories to process */
  limit?: number;
  /** Specific URL to scrape */
  url?: string;
  /** Whether to merge with existing data */
  merge?: boolean;
  /** Path to input file for operations that require it */
  input?: string;
  /** Path to output file for operations that generate one */
  output?: string;
  /** Whether to enable verbose output */
  verbose?: boolean;
  /** Whether to enable debug mode */
  debug?: boolean;
  /** Format for output (json, table, etc.) */
  format?: 'json' | 'table' | 'csv';
  /** Whether to pretty-print JSON output */
  pretty?: boolean;
}

/**
 * Environment variables configuration
 */
export interface EnvConfig {
  /** Node environment (development, production, test) */
  NODE_ENV: string;
  /** Application version from package.json */
  VERSION: string;
  /** Custom data directory path */
  DATA_DIR?: string;
  /** Custom screenshots directory path */
  SCREENSHOTS_DIR?: string;
  /** Whether to enable debug mode */
  DEBUG?: boolean;
}

/**
 * Utility configuration options
 */
export interface UtilsConfig {
  /** Retry options for network operations */
  retry: {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Initial delay before retrying (ms) */
    initialDelay: number;
    /** Factor to increase delay on each retry */
    backoffFactor: number;
  };
  /** Timeout options */
  timeout: {
    /** Default timeout for network operations (ms) */
    default: number;
    /** Navigation timeout (ms) */
    navigation: number;
    /** Wait timeout (ms) */
    wait: number;
  };
}

/**
 * Browser configuration options
 */
export interface BrowserConfig {
  /** Whether to run in headless mode */
  headless: boolean;
  /** Browser launch options */
  launchOptions: {
    /** Default viewport width */
    defaultViewport?: {
      /** Viewport width */
      width: number;
      /** Viewport height */
      height: number;
    };
    /** Whether to ignore HTTPS errors */
    ignoreHTTPSErrors?: boolean;
    /** Browser args */
    args?: string[];
    /** Browser executable path */
    executablePath?: string;
    /** Slow motion delay (ms) */
    slowMo?: number;
  };
  /** User agent to use */
  userAgent?: string;
}
