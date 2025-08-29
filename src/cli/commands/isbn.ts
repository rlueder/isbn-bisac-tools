/**
 * ISBN Command for the ISBN-BISAC Tools CLI
 *
 * This command provides functionality for looking up BISAC codes
 * associated with ISBNs using the Google Books API and local BISAC data.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as utils from '../../../lib/utils.js';
import * as ui from '../../ui/index.js';
import { formatTableHeader, formatTableRow } from '../utils/formatting.js';

/**
 * Register the ISBN lookup command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerIsbnCommand(program: Command): Command {
  return program
    .command('isbn')
    .description('Look up BISAC subjects for a book by ISBN')
    .argument('<isbn>', 'ISBN to look up (10 or 13 digits, hyphens optional)')
    .option('-p, --path <path>', 'Path to the BISAC data file (defaults to data/bisac-data.json)')
    .action(executeIsbnCommand);
}

/**
 * Execute the ISBN lookup command with provided ISBN
 * @param isbn ISBN to look up
 * @param options Command options
 */
export async function executeIsbnCommand(isbn: string, options: { path?: string }): Promise<void> {
  try {
    // Clean the ISBN by removing hyphens and spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Validate ISBN format
    if (!/^(\d{10}|\d{13})$/.test(cleanIsbn)) {
      ui.log(`Invalid ISBN format: ${chalk.red(isbn)}`, 'error');
      ui.log('ISBN must be 10 or 13 digits (hyphens optional)', 'info');
      process.exit(1);
    }

    ui.log(`Looking up BISAC codes for ISBN: ${chalk.cyan(cleanIsbn)}`, 'info');

    // Call the utility function to get BISAC codes for the ISBN
    const { title, categories, bestCategory } = await utils.getCodeFromISBN(
      cleanIsbn,
      options.path
    );

    if (categories.length > 0) {
      ui.log(`Found BISAC information for "${chalk.yellow(title)}":`, 'success');
      console.log('');

      // Define column widths
      const columnWidths = [10, 70];

      // Print header
      console.log(formatTableHeader(['Code', 'Category'], columnWidths));

      // Print each category
      categories.forEach(category => {
        console.log(formatTableRow([category.code, category.fullLabel], columnWidths));
      });

      // If we have a best category, highlight it
      if (bestCategory) {
        console.log('');
        ui.log('Recommended BISAC category:', 'info');
        console.log(chalk.bold('Code:  ') + chalk.cyan(bestCategory.code));
        console.log(chalk.bold('Label: ') + bestCategory.fullLabel);
      }

      console.log('');
    } else {
      ui.log(`No BISAC codes found for ISBN: ${chalk.red(isbn)}`, 'error');
      if (title !== 'Book Not Found' && title !== 'Error' && title !== 'Invalid ISBN') {
        ui.log(`Book title: "${chalk.yellow(title)}"`, 'info');
        ui.log('This book does not have BISAC categories in Google Books data.', 'info');
      }
    }
  } catch (error) {
    ui.log(
      `Error during ISBN lookup: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

export default {
  registerIsbnCommand,
  executeIsbnCommand,
};
