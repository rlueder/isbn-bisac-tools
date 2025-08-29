/**
 * Path utilities for ISBN-BISAC Tools
 *
 * This module provides utility functions for resolving paths to data files,
 * especially when the package is installed globally.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Get the directory where the module is installed
 * Works both for ESM and CommonJS, and handles global installs correctly
 */
export function getModuleDirectory(): string {
  try {
    // ESM approach - gets the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Navigate up to the module root (src/utils -> src -> root)
    return path.resolve(__dirname, '..', '..');
  } catch (error) {
    // Fallback if fileURLToPath fails
    return process.cwd();
  }
}

/**
 * Resolve the path to the BISAC data file
 * Checks multiple possible locations where the data file might be
 *
 * @returns Path to the BISAC data file or null if not found
 */
export function resolveBisacDataPath(): string | null {
  const possibleLocations = [
    // Check in the package's data directory (for global installs)
    path.join(getModuleDirectory(), 'data', 'bisac-data.json'),

    // Check in the project's data directory (for local development)
    path.join(process.cwd(), 'data', 'bisac-data.json'),

    // Check one level up from current directory (for various install scenarios)
    path.join(process.cwd(), '..', 'data', 'bisac-data.json'),

    // Check in user's home directory (as a fallback)
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'data', 'bisac-data.json'),
  ];

  // Return the first location that exists
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log(`📂 Found BISAC data file at: ${location}`);
      return location;
    }
  }

  // If we're running from the package directory, try to find node_modules
  try {
    // This handles the case when the package is installed as a dependency
    const nodeModulesPath = path.join(
      process.cwd(),
      'node_modules',
      'isbn-bisac-tools',
      'data',
      'bisac-data.json'
    );
    if (fs.existsSync(nodeModulesPath)) {
      console.log(`📂 Found BISAC data file in node_modules: ${nodeModulesPath}`);
      return nodeModulesPath;
    }
  } catch (error) {
    // Ignore errors when checking node_modules
  }

  console.log('⚠️ BISAC data file not found in any of the expected locations');
  return null;
}

/**
 * Get the default path for the BISAC data file
 * This will resolve to the correct location whether the package is installed
 * globally or locally, or being run from the source directory
 */
export function getDefaultBisacDataPath(): string {
  const resolvedPath = resolveBisacDataPath();
  if (resolvedPath) {
    return resolvedPath;
  }

  // Return a default path if no file is found
  // This path will be used when creating a new file
  return path.join(process.cwd(), 'data', 'bisac-data.json');
}

export default {
  getModuleDirectory,
  resolveBisacDataPath,
  getDefaultBisacDataPath,
};
