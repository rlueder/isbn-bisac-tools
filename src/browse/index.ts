/**
 * Browse Module for ISBN-BISAC Tools
 *
 * This module provides functionality for interactively browsing JSON files,
 * especially BISAC data files.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import inquirer from 'inquirer';
import * as ui from '../ui/index.js';

/**
 * Browse JSON files
 * @param filePaths Array of file paths to choose from, or a single file path to open directly
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function browseJsonFiles(filePaths: string[] | string): Promise<boolean> {
  try {
    // If a single file path is provided, open it directly
    if (typeof filePaths === 'string') {
      return await openJsonFile(filePaths);
    }

    // If no files provided, find JSON files in the data directory
    if (filePaths.length === 0) {
      ui.log('No JSON files specified, searching in data directory...', 'info');
      const dataDir = path.join(process.cwd(), 'data');

      try {
        await fs.access(dataDir);
        const files = await fs.readdir(dataDir);
        filePaths = files
          .filter(file => file.endsWith('.json'))
          .map(file => path.join(dataDir, file));
      } catch (error) {
        ui.log(
          `Error accessing data directory: ${error instanceof Error ? error.message : String(error)}`,
          'error'
        );
        return false;
      }
    }

    if (filePaths.length === 0) {
      ui.log('No JSON files found', 'error');
      return false;
    }

    // If there's only one file, open it directly
    if (filePaths.length === 1) {
      return await openJsonFile(filePaths[0]);
    }

    // Prioritize bisac-data.json if it exists
    const bisacDataPath = filePaths.find(file => path.basename(file) === 'bisac-data.json');
    if (bisacDataPath) {
      ui.log(`📂 Opening bisac-data.json with fx...`, 'info');
      return await openJsonFile(bisacDataPath);
    }

    // Get file stats for sorting by modification time
    const fileStats = await Promise.all(
      filePaths.map(async filePath => {
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
    const fileChoices = await Promise.all(
      sortedFiles.map(async file => {
        // Try to read the file to check if it's a BISAC data file with timestamp
        try {
          const content = await fs.readFile(file.path, 'utf8');
          const data = JSON.parse(content);

          // If it's the BISAC format with metadata
          if (data.timestamp && data.date) {
            const date = new Date(data.timestamp);
            return {
              name: `${path.basename(file.path)} (From: ${data.date}, Generated: ${date.toLocaleTimeString()})`,
              value: file.path,
            };
          }
        } catch {
          // If parsing fails, fall back to using file stats
        }

        // Default to using file stats for display
        return {
          name: `${path.basename(file.path)} (${file.mtime.toLocaleDateString()} ${file.mtime.toLocaleTimeString()})`,
          value: file.path,
        };
      })
    );

    // Prompt for file selection
    const { selectedFile } = await inquirer.prompt<{ selectedFile: string }>([
      {
        type: 'list',
        name: 'selectedFile',
        message: 'Select a JSON file to browse:',
        choices: fileChoices,
        pageSize: 15,
      },
    ]);

    return await openJsonFile(selectedFile);
  } catch (error) {
    ui.log(
      `Error browsing JSON files: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return false;
  }
}

/**
 * Open a JSON file with fx
 * @param filePath Path to the JSON file
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function openJsonFile(filePath: string): Promise<boolean> {
  try {
    ui.log(`📂 Opening ${path.basename(filePath)} with fx...`, 'info');

    // Read the file content
    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      ui.log(
        `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
      return false;
    }

    // Parse the JSON content
    let jsonData: Record<string, unknown>;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      ui.log(
        `Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );

      // If parsing fails, try to open the file as plain text
      return await openWithFx(fileContent);
    }

    // For BISAC format with categories, process for display
    const displayContent = jsonData.categories
      ? JSON.stringify(
          {
            ...jsonData,
            // Display first 3 categories in preview, with count of total
            categories:
              jsonData.categories &&
              Array.isArray(jsonData.categories) &&
              jsonData.categories.length > 3
                ? [
                    ...(jsonData.categories && Array.isArray(jsonData.categories)
                      ? jsonData.categories.slice(0, 3)
                      : []),
                    `... ${jsonData.categories && Array.isArray(jsonData.categories) ? jsonData.categories.length - 3 : 0} more categories`,
                  ]
                : jsonData.categories,
          },
          null,
          2
        )
      : fileContent;

    return await openWithFx(displayContent);
  } catch (error) {
    ui.log(
      `Error opening JSON file: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return false;
  }
}

/**
 * Open content with fx
 * @param content Content to display in fx
 * @returns Promise resolving to true if successful, false otherwise
 */
async function openWithFx(content: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      // Use spawn to open fx with the content
      const fx = spawn('npx', ['fx'], {
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: process.cwd(),
      });

      // Write the content to fx's stdin
      fx.stdin?.write(content);
      fx.stdin?.end();

      // Handle process completion
      fx.on('close', code => {
        if (code === 0) {
          resolve(true);
        } else {
          ui.log(`fx exited with code ${code}`, 'error');
          resolve(false);
        }
      });

      // Handle errors
      fx.on('error', error => {
        ui.log(`Error launching fx: ${error.message}`, 'error');
        resolve(false);
      });
    } catch (error) {
      ui.log(
        `Error opening with fx: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
      resolve(false);
    }
  });
}

export default {
  browseJsonFiles,
  openJsonFile,
};
