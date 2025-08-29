/**
 * Lookup Command for the ISBN-BISAC Tools CLI
 *
 * This command provides functionality for looking up BISAC codes, labels,
 * headings, and performing searches within the BISAC data.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as lookup from '../../bisac/lookup.js';
import * as ui from '../../ui/index.js';
import { formatTableHeader, formatTableRow } from '../utils/formatting.js';

/**
 * Register the lookup command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerLookupCommand(program: Command): Command {
  return program
    .command('lookup')
    .description('Look up BISAC subjects, codes, and headings')
    .option('-c, --code <code>', 'Look up a specific BISAC code')
    .option('-l, --label <label>', 'Look up subjects by label (partial matching)')
    .option('-H, --heading <heading>', 'Look up all codes for a specific heading')
    .option('-f, --full-label <fullLabel>', 'Look up a code by full label (HEADING / SUBJECT)')
    .option('-s, --search <query>', 'Search across all BISAC data')
    .option('-p, --path <path>', 'Path to the BISAC data file (defaults to data/bisac-data.json)')
    .action(executeLookupCommand);
}

/**
 * Execute the lookup command with provided options
 * @param options Command options
 */
export async function executeLookupCommand(options: {
  code?: string;
  label?: string;
  heading?: string;
  fullLabel?: string;
  search?: string;
  path?: string;
}): Promise<void> {
  try {
    // Determine which type of lookup to perform based on provided options
    if (options.code) {
      await lookupByCode(options.code, options.path);
    } else if (options.label) {
      await lookupByLabel(options.label, options.path);
    } else if (options.heading) {
      await lookupByHeading(options.heading, options.path);
    } else if (options.fullLabel) {
      await lookupByFullLabel(options.fullLabel, options.path);
    } else if (options.search) {
      await searchBisac(options.search, options.path);
    } else {
      // No specific lookup option provided
      ui.log(
        'Please specify a lookup option (--code, --label, --heading, --full-label, or --search)',
        'error'
      );
      ui.log('Run "isbn-bisac-tools help lookup" for more information', 'info');
    }
  } catch (error) {
    ui.log(
      `Error during lookup: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

/**
 * Look up a specific BISAC code
 * @param code BISAC code to look up
 * @param dataPath Optional path to the BISAC data file
 */
async function lookupByCode(code: string, _dataPath?: string): Promise<void> {
  ui.log(`Looking up BISAC code: ${chalk.cyan(code)}`, 'info');

  const fullLabel = await lookup.getFullLabelFromCode(code);

  if (fullLabel) {
    ui.log('Found BISAC subject:', 'success');
    console.log('');
    console.log(chalk.bold('Code:  ') + chalk.cyan(code));
    console.log(chalk.bold('Label: ') + fullLabel);
    console.log('');
  } else {
    ui.log(`No BISAC subject found for code: ${chalk.cyan(code)}`, 'error');
  }
}

/**
 * Look up subjects by partial label match
 * @param label Label to search for
 * @param dataPath Optional path to the BISAC data file
 */
async function lookupByLabel(label: string, _dataPath?: string): Promise<void> {
  ui.log(`Looking up BISAC subjects with label containing: ${chalk.cyan(label)}`, 'info');

  const matches = await lookup.findSubjectsByPartialLabel(label);

  if (matches.length > 0) {
    ui.log(`Found ${matches.length} matching subjects:`, 'success');
    console.log('');

    // Define column widths
    const columnWidths = [10, 30, 60];

    // Print header
    console.log(formatTableHeader(['Code', 'Category', 'Subject'], columnWidths));

    // Print each match
    matches.forEach(match => {
      console.log(
        formatTableRow([match.subject.code, match.category, match.subject.label], columnWidths)
      );
    });

    console.log('');
  } else {
    ui.log(`No BISAC subjects found with label containing: ${chalk.cyan(label)}`, 'error');
  }
}

/**
 * Look up all codes for a specific heading
 * @param heading Heading to look up
 * @param dataPath Optional path to the BISAC data file
 */
async function lookupByHeading(heading: string, _dataPath?: string): Promise<void> {
  ui.log(`Looking up BISAC subjects under heading: ${chalk.cyan(heading)}`, 'info');

  const subjects = await lookup.getCodesForHeading(heading);

  if (subjects.length > 0) {
    ui.log(`Found ${subjects.length} subjects under heading "${heading}":`, 'success');
    console.log('');

    // Define column widths
    const columnWidths = [10, 70];

    // Print header
    console.log(formatTableHeader(['Code', 'Subject'], columnWidths));

    // Print each subject
    subjects.forEach(subject => {
      console.log(formatTableRow([subject.code, subject.label], columnWidths));
    });

    console.log('');
  } else {
    ui.log(`No BISAC subjects found under heading: ${chalk.cyan(heading)}`, 'error');
  }
}

/**
 * Look up a code by full label
 * @param fullLabel Full label in the format "HEADING / SUBJECT"
 * @param dataPath Optional path to the BISAC data file
 */
async function lookupByFullLabel(fullLabel: string, _dataPath?: string): Promise<void> {
  ui.log(`Looking up BISAC code for full label: ${chalk.cyan(fullLabel)}`, 'info');

  const code = await lookup.getCodeFromFullLabel(fullLabel);

  if (code) {
    ui.log('Found BISAC code:', 'success');
    console.log('');
    console.log(chalk.bold('Label: ') + fullLabel);
    console.log(chalk.bold('Code:  ') + chalk.cyan(code));
    console.log('');
  } else {
    ui.log(`No BISAC code found for full label: ${chalk.cyan(fullLabel)}`, 'error');
  }
}

/**
 * Search across all BISAC data
 * @param query Search query
 * @param dataPath Optional path to the BISAC data file
 */
async function searchBisac(query: string, _dataPath?: string): Promise<void> {
  ui.log(`Searching BISAC data for: ${chalk.cyan(query)}`, 'info');

  const matches = await lookup.searchBisac(query);

  if (matches.length > 0) {
    ui.log(`Found ${matches.length} matching results:`, 'success');
    console.log('');

    // Define column widths
    const columnWidths = [10, 30, 60];

    // Print header
    console.log(formatTableHeader(['Code', 'Category', 'Subject'], columnWidths));

    // Print each match
    matches.forEach(match => {
      console.log(
        formatTableRow([match.subject.code, match.category, match.subject.label], columnWidths)
      );
    });

    console.log('');
  } else {
    ui.log(`No matches found for query: ${chalk.cyan(query)}`, 'error');
  }
}

export default {
  registerLookupCommand,
  executeLookupCommand,
};
