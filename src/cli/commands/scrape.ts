/**
 * Scrape Command for the ISBN-BISAC Tools CLI
 *
 * This command handles the functionality for scraping BISAC subject headings
 * from the BISG website.
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import * as scraper from '../../scraper/index.js';
import { getScraperConfig } from '../../config/index.js';
import * as ui from '../../ui/index.js';
import { ScrapeOptions } from '../../types/index.js';

/**
 * Register the scrape command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerScrapeCommand(program: Command): Command {
  return program
    .command('scrape')
    .description('Scrape BISAC subject headings from the BISG website')
    .option('-u, --url <url>', 'Specific category URL to scrape')
    .option('--headless', 'Run in headless mode (default)')
    .option('--no-headless', 'Run in non-headless mode to see the browser')
    .option('-s, --screenshots', 'Take screenshots during scraping')
    .option('-o, --output <path>', 'Custom output directory')
    .option('-l, --limit <number>', 'Maximum number of categories to process')
    .option('-m, --merge', 'Merge with existing data instead of replacing')
    .action(executeScrapeCommand);
}

/**
 * Execute the scrape command with provided options
 * @param options Command options
 */
export async function executeScrapeCommand(options: ScrapeOptions): Promise<void> {
  try {
    // Display initial message
    ui.log('Starting BISAC subject headings scraper...', 'info');

    // Configure scraper based on command line options
    const config = getScraperConfig({
      browserOptions: {
        headless: options.headless !== false, // Default to true if not specified
      },
      takeScreenshots: options.screenshots || false,
      outputDir: options.outputDir || undefined,
      maxCategories: options.maxCategories ? parseInt(options.maxCategories.toString(), 10) : null,
    });

    // If specific URL is provided, use it
    if (options.specificUrl) {
      ui.log(`Scraping specific URL: ${options.specificUrl}`, 'info');
    }

    // Start spinner
    const spinner = ora({
      text: 'Initializing scraper...',
      spinner: 'dots',
    }).start();

    // Run the scraper
    try {
      await scraper.scrape({
        ...config,
        specificUrl: options.specificUrl,
        mergeWithExisting: options.mergeWithExisting,
      });

      // Scraping completed successfully
      spinner.succeed(chalk.green('BISAC subject headings scraped successfully!'));
      ui.log(`Data saved to: ${config.jsonPath}`, 'success');
    } catch (error) {
      // Scraping failed
      spinner.fail(chalk.red('Scraping failed'));
      ui.log(`Error: ${error.message}`, 'error');

      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  } catch (error) {
    ui.log(`Error initializing scraper: ${error.message}`, 'error');
    process.exit(1);
  }
}

export default {
  registerScrapeCommand,
  executeScrapeCommand,
};
