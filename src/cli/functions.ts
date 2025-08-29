/**
 * CLI Functions for BISAC tools
 *
 * This file exports functions that are needed by tests but were not
 * previously exposed in the main API.
 */

import chalk from 'chalk';

/**
 * Command line options interface
 */
export interface CommandLineOptions {
  shouldShowHelp: boolean;
  lookupMode: boolean;
  enableScreenshots: boolean;
  compare: boolean;
  scrape: boolean;
  maxErrors: number;
  categoryUrl?: string;
  code?: string;
  heading?: string;
  label?: string;
  isbn?: string;
}

/**
 * Parse command line arguments for the BISAC scraper
 * @returns Parsed command line options
 */
export function parseCommandLineArgs(): CommandLineOptions {
  // Default options
  const options: CommandLineOptions = {
    shouldShowHelp: false,
    lookupMode: false,
    enableScreenshots: false,
    compare: false,
    scrape: false,
    maxErrors: 5,
  };

  // Skip the first two arguments (node and script path)
  const args = process.argv.slice(2);

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = i + 1 < args.length ? args[i + 1] : undefined;

    switch (arg) {
      case '-h':
      case '--help':
        options.shouldShowHelp = true;
        break;

      case '-u':
      case '--url':
        if (nextArg && nextArg.startsWith('http')) {
          options.categoryUrl = nextArg;
          i++; // Skip the next arg since we've used it
        } else {
          console.error('URL must start with http:// or https://');
          options.shouldShowHelp = true;
        }
        break;

      case '-c':
      case '--code':
        if (nextArg) {
          options.code = nextArg;
          options.lookupMode = true;
          i++;
        }
        break;

      case '-H':
      case '--heading':
        if (nextArg) {
          options.heading = nextArg;
          options.lookupMode = true;
          i++;
        }
        break;

      case '-l':
      case '--label':
        if (nextArg) {
          options.label = nextArg;
          options.lookupMode = true;
          i++;
        }
        break;

      case '-i':
      case '--isbn':
        if (nextArg) {
          options.isbn = nextArg;
          options.lookupMode = true;
          i++;
        }
        break;

      case '-s':
      case '--screenshots':
        options.enableScreenshots = true;
        break;

      case '--compare':
        options.compare = true;
        break;

      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          options.shouldShowHelp = true;
        }
    }
  }

  return options;
}

/**
 * Display help information
 */
export function showHelp(): void {
  console.log(chalk.bold('\nBISAC Subject Headings Scraper\n'));
  console.log('Usage:');
  console.log('  isbn-bisac-tools [options]\n');

  console.log('Options:');
  console.log('  -h, --help             Show this help message');
  console.log('  -u, --url <url>        Scrape a specific category URL');
  console.log('  -c, --code <code>      Look up a BISAC code');
  console.log('  -H, --heading <text>   Look up codes for a category heading');
  console.log(
    '  -l, --label <text>     Look up a code by full label (format: "HEADING / SUBJECT")'
  );
  console.log('  -i, --isbn <isbn>      Look up BISAC codes for an ISBN');
  console.log('  -s, --screenshots      Enable taking screenshots during scraping');
  console.log('  --compare              Compare BISAC data from different time periods\n');

  console.log('Examples:');
  console.log('  isbn-bisac-tools                          Run the scraper for all categories');
  console.log(
    '  isbn-bisac-tools --url https://bisg.org/page/Fiction    Scrape only Fiction category'
  );
  console.log('  isbn-bisac-tools --code FIC000000         Look up the FICTION / General code');
  console.log('  isbn-bisac-tools --heading FICTION        List all codes in the FICTION category');
  console.log('  isbn-bisac-tools --isbn 9781234567890     Look up BISAC codes for an ISBN\n');
}
