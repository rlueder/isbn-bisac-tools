/**
 * Storage module for ISBN-BISAC Tools
 *
 * This module provides functionality for data storage and retrieval,
 * including reading and writing JSON files, creating backups, and
 * managing file operations.
 */

import path from 'path';
import fs from 'fs/promises';
import { BisacData } from '../types/index.js';

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save data to a JSON file
 * @param data Data to save
 * @param filePath Path to the output file
 * @param options Additional save options
 */
export async function saveToJSON<T>(
  data: T,
  filePath: string,
  options: { pretty?: boolean; createBackup?: boolean } = {}
): Promise<void> {
  // Ensure the directory exists
  const dirPath = path.dirname(filePath);
  await ensureDirectoryExists(dirPath);

  // Create a backup if requested
  if (options.createBackup) {
    try {
      await createBackup(filePath);
    } catch (error) {
      console.warn(`Warning: Could not create backup for ${filePath}: ${error.message}`);
    }
  }

  // Format the JSON data
  const jsonString = options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  // Write to the file
  await fs.writeFile(filePath, jsonString, 'utf8');
}

/**
 * Load data from a JSON file
 * @param filePath Path to the JSON file
 * @returns Parsed data from the file
 */
export async function loadFromJSON<T>(filePath: string): Promise<T> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Error reading JSON file: ${error.message}`);
  }
}

/**
 * Create a backup of a file
 * @param filePath Path to the file to backup
 * @returns Path to the created backup file
 */
export async function createBackup(filePath: string): Promise<string> {
  try {
    // Check if the original file exists
    await fs.access(filePath);

    // Generate a timestamp for the backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extname = path.extname(filePath);
    const basename = path.basename(filePath, extname);
    const backupPath = path.join(
      path.dirname(filePath),
      `${basename}.backup-${timestamp}${extname}`
    );

    // Copy the file to create a backup
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Cannot create backup: File not found: ${filePath}`);
    }
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Find the latest file matching a pattern in a directory
 * @param directory Directory to search in
 * @param pattern File pattern to match
 * @returns Path to the latest file or null if none found
 */
export async function findLatestFile(directory: string, pattern: string): Promise<string | null> {
  try {
    // Read all files in the directory
    const files = await fs.readdir(directory);

    // Filter files matching the pattern
    const matchingFiles = files.filter(file => file.match(pattern));

    if (matchingFiles.length === 0) {
      return null;
    }

    // Get file stats to sort by modification time
    const fileStats = await Promise.all(
      matchingFiles.map(async file => {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        return { path: filePath, mtime: stats.mtime };
      })
    );

    // Sort files by modification time (newest first)
    fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Return the latest file
    return fileStats[0].path;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Directory doesn't exist
    }
    throw new Error(`Error finding latest file: ${error.message}`);
  }
}

/**
 * Load BISAC data from a JSON file
 * @param filePath Path to the BISAC data file
 * @returns Loaded BISAC data
 */
export async function loadBisacData(filePath: string): Promise<BisacData> {
  return loadFromJSON<BisacData>(filePath);
}

/**
 * Save BISAC data to a JSON file
 * @param data BISAC data to save
 * @param filePath Path to the output file
 * @param options Additional save options
 */
export async function saveBisacData(
  data: BisacData,
  filePath: string,
  options: { pretty?: boolean; createBackup?: boolean } = { pretty: true, createBackup: true }
): Promise<void> {
  return saveToJSON<BisacData>(data, filePath, options);
}

// Default export for direct import
export default {
  ensureDirectoryExists,
  saveToJSON,
  loadFromJSON,
  createBackup,
  findLatestFile,
  loadBisacData,
  saveBisacData,
};
