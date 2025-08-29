/**
 * Configuration module for ISBN-BISAC Tools
 *
 * This module provides a centralized configuration system for the application,
 * allowing for customization of scraper settings, output paths, and other options.
 */

import path from 'path';
import { ScraperConfig } from '../types/index.js';

/**
 * Get the base directory for the application
 * Works in both development and production environments
 */
function getBaseDir(): string {
  // Get the directory where the module is installed
  const moduleDir = new URL('.', import.meta.url).pathname;
  // For development, use local directory, for production use installed package
  return path.resolve(moduleDir, '..', '..');
}

/**
 * Default scraper configuration
 */
export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  // URLs
  startUrl: 'https://www.bisg.org/complete-bisac-subject-headings-list',
  // Screenshot flag
  takeScreenshots: false,
  // Output paths
  outputDir: path.join(getBaseDir(), 'data'),
  // Default data file location
  get jsonPath() {
    return path.join(this.outputDir, 'bisac-data.json');
  },
  screenshotsDir: path.join(getBaseDir(), 'screenshots'),
  // Delay between page visits to avoid overloading the server
  minDelay: 1000,
  maxDelay: 2000,
  // Maximum number of category pages to process (set to null for all)
  maxCategories: null,
  // Browser launch options
  browserOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
    headless: true, // Use non-headless mode to see what's happening
    ignoreHTTPSErrors: true,
    timeout: 30000,
  },
  // Selectors
  mainPage: {
    categoryLinks: 'table a',
  },
  // Category page selectors
  categoryPage: {
    heading: 'h4',
  },
};

/**
 * Application environment settings
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERSION: process.env.npm_package_version || '0.0.0',
  DEBUG: process.env.DEBUG === 'true',
};

/**
 * Merge custom configuration with default configuration
 * @param customConfig Custom configuration to merge with defaults
 * @returns Merged configuration
 */
export function mergeConfig<T>(defaultConfig: T, customConfig: Partial<T> = {}): T {
  return {
    ...defaultConfig,
    ...customConfig,
  };
}

/**
 * Get scraper configuration with optional custom overrides
 * @param customConfig Custom configuration to merge with defaults
 * @returns Merged scraper configuration
 */
export function getScraperConfig(customConfig: Partial<ScraperConfig> = {}): ScraperConfig {
  // Create a deep merge for nested objects
  const config = { ...DEFAULT_SCRAPER_CONFIG };

  // Apply custom overrides
  Object.entries(customConfig).forEach(([key, value]) => {
    if (key === 'mainPage' && value && typeof value === 'object') {
      config.mainPage = { ...config.mainPage, ...value };
    } else if (key === 'categoryPage' && value && typeof value === 'object') {
      config.categoryPage = { ...config.categoryPage, ...value };
    } else if (key === 'browserOptions' && value && typeof value === 'object') {
      config.browserOptions = { ...config.browserOptions, ...value };
    } else {
      // @ts-expect-error - Dynamic assignment
      config[key] = value;
    }
  });

  return config;
}

/**
 * Load configuration from a file
 * @param filePath Path to the configuration file
 * @returns Loaded configuration
 */
export async function loadConfigFromFile(filePath: string): Promise<Partial<ScraperConfig>> {
  try {
    // Dynamic import to load the configuration file
    const configModule = await import(filePath);
    return configModule.default || {};
  } catch (error) {
    console.warn(
      `Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return {};
  }
}

// Default export for direct import
export default {
  DEFAULT_SCRAPER_CONFIG,
  ENV,
  mergeConfig,
  getScraperConfig,
  loadConfigFromFile,
};
