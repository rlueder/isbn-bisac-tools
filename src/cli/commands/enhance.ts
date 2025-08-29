/**
 * Enhance Command for the ISBN-BISAC Tools CLI
 *
 * This command provides functionality for enhancing book data with BISAC categories.
 * It looks up a book by ISBN and enriches the book_data.json file with BISAC categories.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as utils from '../../../lib/utils.js';
import * as ui from '../../ui/index.js';
import { formatTableHeader, formatTableRow } from '../utils/formatting.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Register the enhance command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerEnhanceCommand(program: Command): Command {
  return program
    .command('enhance')
    .description('Enhance book data with BISAC categories')
    .argument('<isbn>', 'ISBN to look up and enhance (10 or 13 digits, hyphens optional)')
    .option(
      '-o, --output <path>',
      'Output file path (defaults to book_data.json in current directory)'
    )
    .option('-p, --path <path>', 'Path to the BISAC data file (defaults to data/bisac-data.json)')
    .action(executeEnhanceCommand);
}

/**
 * Execute the enhance command with provided ISBN
 * @param isbn ISBN to look up
 * @param options Command options
 */
export async function executeEnhanceCommand(
  isbn: string,
  options: { path?: string; output?: string }
): Promise<void> {
  try {
    // Clean the ISBN by removing hyphens and spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Validate ISBN format
    if (!/^(\d{10}|\d{13})$/.test(cleanIsbn)) {
      ui.log(`Invalid ISBN format: ${chalk.red(isbn)}`, 'error');
      ui.log('ISBN must be 10 or 13 digits (hyphens optional)', 'info');
      process.exit(1);
    }

    // Determine output path
    const outputPath = options.output || path.join(process.cwd(), 'book_data.json');

    ui.log(`Looking up BISAC codes for ISBN: ${chalk.cyan(cleanIsbn)}`, 'info');

    // Create a spinner for user feedback
    const spinner = ui.createSpinner('Fetching book data from Google Books API...');
    spinner.start();

    try {
      // Call the utility function to get BISAC codes for the ISBN
      const { title, categories, bestCategory } = await utils.getCodeFromISBN(
        cleanIsbn,
        options.path,
        false // Don't auto-save results, we'll do it manually
      );

      // Fetch book data from Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
      );

      if (!response.ok) {
        spinner.fail(`Google Books API returned status ${response.status}`);
        return;
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        spinner.fail(`No book found with ISBN: ${cleanIsbn}`);
        return;
      }

      spinner.succeed(`Found book: "${title}"`);

      // Add BISAC categories to the book data
      if (categories.length > 0) {
        // Create a backup of the original data if it exists
        try {
          const exists = await fileExists(outputPath);
          if (exists) {
            const backupPath = `${outputPath}.backup`;
            await fs.copyFile(outputPath, backupPath);
            ui.log(`Created backup at ${backupPath}`, 'info');
          }
        } catch (error) {
          ui.log(
            `Warning: Could not create backup: ${error instanceof Error ? error.message : String(error)}`,
            'warning'
          );
          // Continue despite backup failure
        }

        // Add BISAC categories to the book data
        data.items[0].volumeInfo.bisacCategories = categories.map(cat => ({
          code: cat.code,
          label: cat.fullLabel,
        }));

        // Save the enhanced data
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        ui.log(`Book data with BISAC categories saved to: ${outputPath}`, 'success');

        // Display the categories
        ui.log(
          `Found ${categories.length} BISAC categories for "${chalk.yellow(title)}":`,
          'success'
        );
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
        ui.log(`No BISAC codes found for book: "${chalk.yellow(title)}"`, 'warning');
        ui.log('Book data has been saved without BISAC categories', 'info');
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      spinner.fail(
        `Error during enhance: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }
  } catch (error) {
    ui.log(
      `Error during enhance: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

/**
 * Check if a file exists
 * @param filePath Path to check
 * @returns Boolean indicating if the file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export default {
  registerEnhanceCommand,
  executeEnhanceCommand,
};
