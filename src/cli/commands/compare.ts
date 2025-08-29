/**
 * Compare Command for the ISBN-BISAC Tools CLI
 *
 * This command provides functionality for comparing different versions of BISAC data files,
 * identifying additions, removals, and modifications between versions.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as ui from '../../ui/index.js';
import * as comparison from '../../bisac/comparison.js';

/**
 * Register the compare command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerCompareCommand(program: Command): Command {
  return program
    .command('compare')
    .description('Compare two BISAC JSON files to identify changes')
    .option(
      '-d, --directory <directory>',
      'Directory containing BISAC JSON files (defaults to data/)'
    )
    .option('-o, --old <file>', 'Path to the older BISAC JSON file')
    .option('-n, --new <file>', 'Path to the newer BISAC JSON file')
    .option('-b, --backup', 'Create a backup of the current BISAC data before comparing')
    .action(executeCompareCommand);
}

/**
 * Execute the compare command with provided options
 * @param options Command options
 */
export async function executeCompareCommand(options: {
  directory?: string;
  old?: string;
  new?: string;
  backup?: boolean;
}): Promise<void> {
  try {
    // Create a backup if requested
    if (options.backup) {
      ui.log('Creating backup of current BISAC data...', 'info');
      try {
        await comparison.createBackupOfBisacData();
      } catch (error) {
        ui.log(
          `Warning: Could not create backup: ${error instanceof Error ? error.message : String(error)}`,
          'warning'
        );
      }
    }

    // If specific files are provided, compare them directly
    if (options.old && options.new) {
      await compareSpecificFiles(options.old, options.new);
      return;
    }

    // Otherwise, let the user select files to compare
    await compareInteractively(options.directory || 'data');
  } catch (error) {
    ui.log(
      `Error comparing BISAC files: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

/**
 * Compare two specific BISAC JSON files
 * @param oldFile Path to the older file
 * @param newFile Path to the newer file
 */
async function compareSpecificFiles(oldFile: string, newFile: string): Promise<void> {
  try {
    ui.log(`Comparing ${chalk.cyan(oldFile)} with ${chalk.cyan(newFile)}...`, 'info');

    // Perform the comparison
    const result = await comparison.compareBisacJsonFiles(oldFile, newFile);

    // Print the comparison report
    await comparison.printComparisonReport(result);
  } catch (error) {
    ui.log(
      `Error comparing files: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

/**
 * Compare BISAC JSON files interactively
 * @param directory Directory containing BISAC JSON files
 */
async function compareInteractively(directory: string): Promise<void> {
  try {
    ui.log(`Looking for BISAC JSON files in ${chalk.cyan(directory)}...`, 'info');

    // Let the user select files for comparison
    const [oldFile, newFile] = await comparison.selectFilesForComparison(directory);

    // Perform the comparison
    ui.log(`Comparing ${chalk.cyan(oldFile)} with ${chalk.cyan(newFile)}...`, 'info');
    const result = await comparison.compareBisacJsonFiles(oldFile, newFile);

    // Print the comparison report
    await comparison.printComparisonReport(result);
  } catch (error) {
    ui.log(
      `Error comparing files: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

export default {
  registerCompareCommand,
  executeCompareCommand,
};
