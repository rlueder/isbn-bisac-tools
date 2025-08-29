/**
 * Browse Command for the ISBN-BISAC Tools CLI
 *
 * This command provides functionality for interactively browsing BISAC JSON files,
 * allowing users to explore and inspect the data visually.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs/promises';
import * as ui from '../../ui/index.js';

import { browseJsonFiles } from '../../browse/index.js';

/**
 * Register the browse command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerBrowseCommand(program: Command): Command {
  return program
    .command('browse')
    .description('Interactively browse BISAC JSON files')
    .option('-d, --directory <directory>', 'Directory to browse for JSON files (defaults to data/)')
    .option('-f, --file <file>', 'Specific JSON file to browse')
    .action(executeBrowseCommand);
}

/**
 * Execute the browse command with provided options
 * @param options Command options
 */
export async function executeBrowseCommand(options: {
  directory?: string;
  file?: string;
}): Promise<void> {
  try {
    // If a specific file is provided, browse it directly
    if (options.file) {
      await browseSingleFile(options.file);
      return;
    }

    // Otherwise, browse all JSON files in the directory
    await browseDirectory(options.directory || 'data');
  } catch (error) {
    ui.log(
      `Error browsing JSON files: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

/**
 * Browse a single JSON file
 * @param filePath Path to the JSON file
 */
async function browseSingleFile(filePath: string): Promise<void> {
  try {
    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      ui.log(`File not found: ${filePath}`, 'error');
      return;
    }

    // Check if the file is a JSON file
    if (!filePath.endsWith('.json')) {
      ui.log(`File is not a JSON file: ${filePath}`, 'error');
      return;
    }

    ui.log(`Browsing file: ${chalk.cyan(filePath)}`, 'info');

    // Open the file with an interactive viewer
    await browseJsonFiles([filePath]);
  } catch (error) {
    ui.log(
      `Error browsing file: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

/**
 * Browse JSON files in a directory
 * @param directoryPath Path to the directory
 */
async function browseDirectory(directoryPath: string): Promise<void> {
  try {
    // Ensure the directory exists
    try {
      await fs.access(directoryPath);
    } catch (error) {
      ui.log(`Directory not found: ${directoryPath}`, 'error');
      return;
    }

    ui.log(`Scanning ${chalk.cyan(directoryPath)} for JSON files...`, 'info');

    // Find all JSON files in the directory
    const files = await fs.readdir(directoryPath);
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directoryPath, file));

    if (jsonFiles.length === 0) {
      ui.log(`No JSON files found in ${directoryPath}`, 'error');
      return;
    }

    ui.log(`Found ${jsonFiles.length} JSON files`, 'success');

    // If there's only one JSON file, browse it directly
    if (jsonFiles.length === 1) {
      await browseSingleFile(jsonFiles[0]);
      return;
    }

    // Let the user select which file to browse
    const result = await inquirer.prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Select a JSON file to browse:',
        choices: jsonFiles.map(file => ({
          name: path.basename(file),
          value: file,
        })),
      },
    ]);

    await browseSingleFile(result.file);
  } catch (error) {
    ui.log(
      `Error browsing directory: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

export default {
  registerBrowseCommand,
  executeBrowseCommand,
};
