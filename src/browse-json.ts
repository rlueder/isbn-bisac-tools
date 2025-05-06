#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { glob } from 'glob';
import chalk from 'chalk';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'output');

interface FileInfo {
  path: string;
  mtime: Date;
}

/**
 * Browse JSON files in the output directory
 * @param customOutputDir Optional custom output directory path
 * @returns Promise resolving to true if successful, false otherwise
 */
async function browseJsonFiles(customOutputDir?: string): Promise<boolean> {
  const targetDir = customOutputDir || outputDir;

  try {
    // Ensure the output directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Find all JSON files, prioritizing bisac-data.json if it exists
    const bisacDataPath = path.join(targetDir, 'bisac-data.json');
    let bisacDataExists = false;

    try {
      await fs.access(bisacDataPath);
      bisacDataExists = true;
    } catch {
      // File doesn't exist, will search for other JSON files
    }

    // If bisac-data.json exists, use only that, otherwise find all JSON files
    const files = bisacDataExists ? [bisacDataPath] : await glob(`${targetDir}/*.json`);

    if (files.length === 0) {
      console.error(chalk.red('❌ No JSON files found in the output directory'));
      return false;
    }

    // Get file stats for modification time sorting
    const fileStats: FileInfo[] = await Promise.all(
      files.map(async (filePath): Promise<FileInfo> => {
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
        // Try to read the file to check if it's the new format with timestamp
        try {
          const content = await fs.readFile(file.path, 'utf8');
          const data = JSON.parse(content);

          // If it's the new format with metadata
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

    console.log(chalk.green(`📂 Opening ${path.basename(selectedFile)} with fx...`));

    // Read the file content
    const fileContent = await fs.readFile(selectedFile, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // For new format with categories, use the categories array for display
    // Otherwise use the original content
    const displayContent = jsonData.categories
      ? JSON.stringify(
          {
            ...jsonData,
            // Display first 3 categories in preview, with count of total
            categories:
              jsonData.categories.length > 3
                ? [
                    ...jsonData.categories.slice(0, 3),
                    `... ${jsonData.categories.length - 3} more categories`,
                  ]
                : jsonData.categories,
          },
          null,
          2
        )
      : fileContent;

    // Use spawn to open fx with the selected file
    const fx = spawn('npx', ['fx'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: process.cwd(),
    });

    // Write the processed content to fx's stdin
    fx.stdin?.write(displayContent);
    fx.stdin?.end();

    // Handle process completion
    return new Promise<boolean>(resolve => {
      fx.on('close', code => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error(chalk.red(`❌ fx exited with code ${code}`));
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error(chalk.red(`❌ Error browsing JSON files: ${(error as Error).message}`));
    return false;
  }
}

// Execute the function when this module is run directly
// This handles ESM modules where require.main is not available
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/^file:\/\//, ''));
if (isMainModule) {
  browseJsonFiles()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch((error: unknown) => {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    });
}

export { browseJsonFiles };
