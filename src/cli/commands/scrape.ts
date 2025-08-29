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
    .option('--test-selector [selector]', 'Test a specific selector against the website')
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
      takeScreenshots: options.takeScreenshots || false,
      outputDir: options.outputDir || undefined,
      maxCategories: options.maxCategories ? parseInt(options.maxCategories.toString(), 10) : null,
    });

    // If a custom selector is provided for testing
    if (options.testSelector !== undefined) {
      const selectorToTest =
        typeof options.testSelector === 'string'
          ? options.testSelector
          : config.mainPage.categoryLinks;

      ui.log(`Testing selector: "${selectorToTest}"`, 'info');

      // Start spinner for selector test
      const spinner = ora({
        text: 'Testing selector against the website...',
        spinner: 'dots',
      }).start();

      try {
        // Import the browser module for testing the selector
        const browser = await import('../../scraper/browser.js');
        const instance = await browser.initializeBrowser(config);
        const page = await browser.createPage(instance, config.startUrl);

        // Test the selector - first wait for network to be idle
        await page.waitForNetworkIdle();
        const elements = await page.$$eval(selectorToTest, els => els.length);

        if (elements > 0) {
          spinner.succeed(chalk.green(`Selector test successful! Found ${elements} elements.`));

          // Get some examples of what was matched
          const examples = await page.$$eval(selectorToTest, els =>
            els.slice(0, 3).map(el => ({
              text: el.textContent?.trim() || '(no text)',
              href: el.getAttribute('href') || '(no href)',
            }))
          );

          ui.log('Example matches:', 'info');
          examples.forEach((ex, i) => {
            ui.log(`  ${i + 1}. "${ex.text}" → ${ex.href}`, 'info');
          });
        } else {
          spinner.fail(
            chalk.red(`Selector test failed! No elements found with "${selectorToTest}"`)
          );
          ui.log('The website structure may have changed. Try a different selector.', 'error');
        }

        // Clean up
        await page.close();
        await instance.close();
        return;
      } catch (error) {
        spinner.fail(chalk.red('Selector test failed'));
        ui.log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
        process.exit(1);
      }
    }

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
        specificUrl: options.specificUrl as string | undefined,
        mergeWithExisting: options.mergeWithExisting,
      });

      // Scraping completed successfully
      spinner.succeed(chalk.green('BISAC subject headings scraped successfully!'));
      ui.log(`Data saved to: ${config.jsonPath}`, 'success');
    } catch (error) {
      // Scraping failed
      spinner.fail(chalk.red('Scraping failed'));
      ui.log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');

      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  } catch (error) {
    ui.log(
      `Error initializing scraper: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    process.exit(1);
  }
}

export default {
  registerScrapeCommand,
  executeScrapeCommand,
};
