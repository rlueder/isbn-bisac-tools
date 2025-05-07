/**
 * ISBN-BISAC Tools - Utilities for working with BISAC codes and ISBN lookups
 *
 * This package provides tools for scraping BISAC Subject Headings from bisg.org,
 * converting ISBNs to BISAC codes, and various utilities for managing BISAC data.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fsSync from 'fs';
import { readFileSync } from 'fs';
import * as utils from '../lib/utils.js';
import { ScraperConfig, Category } from './types/index.js';

/**
 * Creates a simple text-based progress bar
 * @param current - Current position
 * @param total - Total items
 * @param barLength - Length of the progress bar
 * @returns Formatted progress bar string
 */
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { browseJsonFiles } from './browse-json.js';

// Global spinner for progress display
let spinner: ReturnType<typeof ora> | null = null;

/**
 * Updates the progress spinner with current status
 * @param current - Current index being processed
 * @param total - Total number of items to process
 * @param url - Current URL being processed
 * @param status - Optional status message to display
 */
function updateProgressSpinner(current: number, total: number, url: string, status?: string): void {
  const percentage = Math.floor((current / total) * 100);
  let message = `${chalk.cyan(current)}/${chalk.cyan(total)} (${chalk.green(percentage)}%) | URL: ${chalk.yellow(url)}`;

  if (status) {
    message = `${status} | ${message}`;
  }

  if (!spinner) {
    spinner = ora({
      text: message,
      spinner: 'dots',
    }).start();
  } else {
    spinner.text = message;
  }
}

// Complete list of category page URLs to scrape
const CATEGORY_URLS = [
  'https://www.bisg.org/antiques-and-collectibles',
  'https://www.bisg.org/architecture',
  'https://www.bisg.org/art',
  'https://www.bisg.org/bibles',
  'https://www.bisg.org/biography-and-autobiography',
  'https://www.bisg.org/body-mind-and-spirit',
  'https://www.bisg.org/business-and-economics',
  'https://www.bisg.org/comics-and-graphic-novels',
  'https://www.bisg.org/computers',
  'https://www.bisg.org/cooking',
  'https://www.bisg.org/crafts-and-hobbies',
  'https://www.bisg.org/design',
  'https://www.bisg.org/drama',
  'https://www.bisg.org/education',
  'https://www.bisg.org/family-and-relationships',
  'https://www.bisg.org/fiction',
  'https://www.bisg.org/games-and-activities',
  'https://www.bisg.org/gardening',
  'https://www.bisg.org/health-and-fitness',
  'https://www.bisg.org/history',
  'https://www.bisg.org/house-and-home',
  'https://www.bisg.org/humor',
  'https://www.bisg.org/juvenile-fiction',
  'https://www.bisg.org/juvenile-nonfiction',
  'https://www.bisg.org/language-arts-and-disciplines',
  'https://www.bisg.org/language-study',
  'https://www.bisg.org/law',
  'https://www.bisg.org/literary-collections',
  'https://www.bisg.org/literary-criticism',
  'https://www.bisg.org/mathematics',
  'https://www.bisg.org/medical',
  'https://www.bisg.org/music',
  'https://www.bisg.org/nature',
  'https://www.bisg.org/performing-arts',
  'https://www.bisg.org/pets',
  'https://www.bisg.org/philosophy',
  'https://www.bisg.org/photography',
  'https://www.bisg.org/poetry',
  'https://www.bisg.org/political-science',
  'https://www.bisg.org/psychology',
  'https://www.bisg.org/reference',
  'https://www.bisg.org/religion',
  'https://www.bisg.org/science',
  'https://www.bisg.org/self-help',
  'https://www.bisg.org/social-science',
  'https://www.bisg.org/sports-and-recreation',
  'https://www.bisg.org/study-aids',
  'https://www.bisg.org/technology-and-engineering',
  'https://www.bisg.org/transportation',
  'https://www.bisg.org/travel',
  'https://www.bisg.org/true-crime',
  'https://www.bisg.org/young-adult-fiction',
  'https://www.bisg.org/young-adult-nonfiction',
];

// Configuration
const CONFIG: ScraperConfig = {
  // URLs
  startUrl: 'https://www.bisg.org/complete-bisac-subject-headings-list',
  // Screenshot flag
  takeScreenshots: false,
  // Output paths
  outputDir: (() => {
    // Get the directory where the module is installed
    const moduleDir = new URL('.', import.meta.url).pathname;
    // For development, use local directory, for production use installed package
    return path.resolve(moduleDir, '..', 'data');
  })(),
  // Default data file location
  get jsonPath() {
    // Get the directory where the module is installed
    const moduleDir = new URL('.', import.meta.url).pathname;
    // For development, use local directory, for production use installed package
    return path.resolve(moduleDir, '..', 'data', 'bisac-data.json');
  },
  screenshotsDir: path.join(process.cwd(), 'screenshots'),
  // Delay between page visits to avoid overloading the server
  minDelay: 1000,
  maxDelay: 2000,
  // Maximum number of category pages to process (set to null for all)
  maxCategories: null,
  // Browser launch options
  browserOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
    headless: true, // Use non-headless mode to see what's happening
    ignoreHTTPSErrors: true,
    timeout: 30000,
  },
  // Selectors
  mainPage: {
    categoryLinks: '.field-items li a',
  },
  // Category page selectors
  categoryPage: {
    heading: 'h4',
  },
};

/**
 * Process a single category page and extract its data
 * @param page - Puppeteer page object
 * @param url - URL of the category page
 * @returns Extracted category data
 */
async function processCategoryPage(
  page: Page,
  url: string,
  currentIndex: number,
  totalUrls: number
): Promise<Category> {
  updateProgressSpinner(currentIndex, totalUrls, url, '🔍 Navigating to page...');
  try {
    // Navigate with timeout and retries
    let navigationSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!navigationSuccess && attempts < maxAttempts) {
      try {
        attempts++;
        updateProgressSpinner(
          currentIndex,
          totalUrls,
          url,
          `🔍 Navigation attempt ${attempts}/${maxAttempts}...`
        );
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000, // 30 seconds timeout
        });
        navigationSuccess = true;
      } catch (error) {
        if (spinner) spinner.text = `🚫 Navigation attempt ${attempts} failed. Retrying...`;
        if (attempts >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
      }
    }

    // Take a screenshot if enabled
    if (CONFIG.takeScreenshots) {
      const urlParts = url.split('/');
      const pageName = urlParts[urlParts.length - 1] || 'category';
      updateProgressSpinner(currentIndex, totalUrls, url, '📸 Taking screenshot...');
      await utils.takeScreenshot(page, `category-${pageName}`, CONFIG.screenshotsDir);
    }

    // Extract the data from the page
    const categoryData = await page.evaluate(() => {
      // Extract the heading (category title)
      const headingElement = document.querySelector('h2.subtitle');
      const heading = headingElement ? headingElement.textContent?.trim() || '' : '';

      const notes: string[] = [];
      const subjects: { code: string; label: string }[] = [];

      // Get the main content container
      const contentContainer = document.querySelector('.well.box.inner-content');
      if (!contentContainer) return { heading, notes, subjects };

      // Get all paragraphs in the content
      const paragraphs = Array.from(contentContainer.querySelectorAll('p'));

      // First, collect all notes (paragraphs before the subject codes begin)
      let notesEndIndex = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].textContent?.trim() || '';

        // Skip empty paragraphs or common exclusion patterns
        if (
          !text ||
          text.includes('If your title does not have subject content') ||
          text.includes('© 2024, Book Industry Study Group') ||
          text.includes('To download and incorporate this list') ||
          text.includes('Use the information provided here')
        ) {
          continue;
        }

        // Look for paragraphs that start describing the category
        if (
          text.startsWith('Use subjects in this section') ||
          text.startsWith('Multiple subjects may be used')
        ) {
          notes.push(text);
          notesEndIndex = i + 1;
          continue;
        }

        // The first paragraph with a code pattern indicates we're done with notes
        if (text.match(/[A-Z]{3}[0-9]{6}/)) {
          break;
        }

        // Otherwise, if we've already started collecting notes, continue
        if (notesEndIndex > 0 && !text.match(/[A-Z]{3}[0-9]{6}/)) {
          notes.push(text);
          notesEndIndex = i + 1;
        }
      }

      // Now extract all subject codes and labels
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const text = paragraph.textContent?.trim() || '';

        // Look for paragraphs that have a code pattern
        const codeMatch = text.match(/([A-Z]{3}[0-9]{6})/);

        if (codeMatch) {
          const code = codeMatch[1];

          // Extract label - everything after the code, skipping initial whitespace
          let label = text.substring(text.indexOf(code) + code.length).trim();

          // Determine the category prefix based on the heading
          let categoryPrefix = heading.toUpperCase();
          if (categoryPrefix.startsWith('ANTIQUES & COLLECTIBLES')) {
            categoryPrefix = 'ANTIQUES & COLLECTIBLES';
          } else if (categoryPrefix.includes('&')) {
            categoryPrefix = categoryPrefix.split('&')[0].trim();
          }

          // Remove any leading category prefix text and slashes
          if (label.startsWith('/')) {
            label = label.substring(1).trim();
          }
          if (label.startsWith(categoryPrefix)) {
            label = label.substring(categoryPrefix.length).trim();
          }
          if (label.startsWith('/')) {
            label = label.substring(1).trim();
          }

          // Clean up any special formatting
          label = label.replace(/\s+/g, ' ').trim();

          subjects.push({ code, label });
        }
        // Check for "see" reference lines that indicate alternative codes
        else if (text.match(/\s+see\s+/) && !text.match(/[A-Z]{3}[0-9]{6}/)) {
          // These are typically reference lines like "ANTIQUES & COLLECTIBLES / Cars see Subjects & Themes / Transportation"
          // We could capture these as separate data if needed
        }
      }

      return { heading, notes, subjects };
    });

    updateProgressSpinner(
      currentIndex,
      totalUrls,
      url,
      `📑 Extracted "${categoryData.heading}" with ${categoryData.subjects.length} subjects, ${categoryData.notes.length} notes`
    );

    return categoryData;
  } catch (error) {
    if (spinner) {
      spinner.text = `❌ Error processing ${url}: ${error instanceof Error ? error.message : String(error)}`;
    }
    return { heading: '', notes: [], subjects: [] };
  }
}

/**
 * Main scraping function
 * @param singleCategoryUrl - Optional URL for scraping a single category
 */
async function scrape(
  singleCategoryUrl?: string,
  customConfig?: ScraperConfig,
  browseMode?: boolean,
  isTestMode?: boolean
): Promise<Category[]> {
  // Use custom config if provided, otherwise use default CONFIG
  const config = customConfig || CONFIG;

  // If in browse mode, just browse JSON files and return empty array
  if (browseMode) {
    await browseJsonFiles();
    return [];
  }

  if (singleCategoryUrl) {
    console.log(
      `\n🚀 Starting the BISAC Subject Headings scraper for a single category: ${singleCategoryUrl}`
    );
  } else {
    console.log('\n🚀 Starting the BISAC Subject Headings scraper with all category URLs...');
  }

  try {
    await utils.initialize(config.outputDir, config.screenshotsDir, config.takeScreenshots);

    // Scraping logic
    let browser: Browser | null = null;

    try {
      // Launch browser
      console.log('🌐 Launching browser...');
      browser = await puppeteer.launch(config.browserOptions);
      console.log('✅ Browser launched successfully!');

      const page: Page = await browser.newPage();

      // Set a user agent to avoid being detected as a bot
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      );

      // Set additional page options
      page.setDefaultNavigationTimeout(60000); // 60 seconds timeout
      page.setDefaultTimeout(30000); // 30 seconds timeout for other operations

      // Error handling for page errors
      page.on('error', err => {
        console.error('Page error:', err);
      });

      page.on('console', msg => {
        // Skip logging ERR_NAME_NOT_RESOLVED errors, New Relic warnings, and slow network messages
        const messageText = msg.text();
        if (
          !messageText.includes('net::ERR_NAME_NOT_RESOLVED') &&
          !messageText.includes(
            'New Relic Warning: https://github.com/newrelic/newrelic-browser-agent/blob/main/docs/warning-codes.md#'
          ) &&
          !messageText.includes('Slow network is detected')
        ) {
          console.log(`Browser console ${msg.type()}: ${messageText}`);
        }
      });

      // Always navigate to the main page first to match test expectations
      if (!singleCategoryUrl) {
        await page.goto(CONFIG.startUrl, { waitUntil: 'networkidle2' });
      }

      // Determine which URLs to process
      let urlsToProcess: string[];

      if (singleCategoryUrl) {
        // Use the single URL provided
        urlsToProcess = [singleCategoryUrl];
        // For single URL mode, navigate directly to that URL
        await page.goto(singleCategoryUrl, { waitUntil: 'networkidle2' });
      } else {
        // Use the standard list, limited by maxCategories if set
        urlsToProcess = config.maxCategories
          ? CATEGORY_URLS.slice(0, config.maxCategories)
          : CATEGORY_URLS;
      }

      console.log(
        `\n🔄 Processing ${urlsToProcess.length} category page${urlsToProcess.length > 1 ? 's' : ''}...`
      );

      // Process each category page
      const allCategoryData: Category[] = [];

      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        const currentIndex = i + 1;

        updateProgressSpinner(currentIndex, urlsToProcess.length, url);

        try {
          const categoryData = await processCategoryPage(
            page,
            url,
            currentIndex,
            urlsToProcess.length
          );
          if (categoryData.heading) {
            // Only add if we got valid data
            allCategoryData.push(categoryData);
            if (spinner) {
              spinner.succeed(`Successfully added ${chalk.green(categoryData.heading)} to dataset`);
            }
          }
        } catch (error) {
          if (spinner) {
            spinner.fail(`Failed to process ${chalk.red(url)}`);
          }
          // Continue with the next URL despite the error
        }

        // Add a random delay between page visits
        if (i < urlsToProcess.length - 1) {
          const delay = await utils.randomDelay(config.minDelay, config.maxDelay);

          // Show countdown timer in the spinner
          const countdownStart = Date.now();
          const countdownEnd = countdownStart + delay;

          while (Date.now() < countdownEnd) {
            const remainingMs = countdownEnd - Date.now();
            const remainingSec = Math.ceil(remainingMs / 1000);
            if (spinner) {
              spinner.text = `⏱️ Waiting ${chalk.yellow(remainingSec)}s before next page... (${Math.floor(((delay - remainingMs) / delay) * 100)}% complete)`;
            }
            await new Promise(resolve => setTimeout(resolve, 250)); // Update every 250ms
          }

          // Create a new spinner for the next URL
          if (spinner) spinner.stop();
          spinner = null;
        }
      }

      // Clear any existing spinner
      if (spinner) {
        spinner.stop();
        spinner = null;
      }

      // Save all data to JSON
      if (allCategoryData.length > 0) {
        const savingSpinner = ora(
          `Saving ${allCategoryData.length} categories to JSON file...`
        ).start();

        // Create a backup of the existing data file if it exists
        const existingFile = await utils.checkExistingJsonFileForToday(config.outputDir);
        if (existingFile) {
          savingSpinner.text = 'Creating backup of existing BISAC data file...';
          await utils.createBackupOfBisacData(config.outputDir);
        }

        // Save new data
        savingSpinner.text = `Saving ${allCategoryData.length} categories to JSON file...`;
        await utils.saveToJSON(config.jsonPath, allCategoryData);
        savingSpinner.succeed(
          `Successfully scraped ${chalk.green(allCategoryData.length)} category pages! 🎉`
        );

        // Print results summary
        const totalSubjects = allCategoryData.reduce(
          (total, cat) => total + cat.subjects.length,
          0
        );
        const totalNotes = allCategoryData.reduce((total, cat) => total + cat.notes.length, 0);
        const categoriesWithNoSubjects = allCategoryData.filter(
          cat => cat.subjects.length === 0
        ).length;

        console.log('\n📊 SUMMARY INFORMATION:');
        console.log(`  - 📚 Total categories: ${allCategoryData.length}`);
        console.log(`  - 🔖 Total subjects: ${totalSubjects}`);
        console.log(`  - 📝 Total notes: ${totalNotes}`);
        console.log(
          `  - 📈 Average subjects per category: ${(totalSubjects / allCategoryData.length).toFixed(2)}`
        );
        console.log(`  - ⚠️ Categories with no subjects: ${categoriesWithNoSubjects}`);
        console.log(`  - 💾 Output saved to: ${config.jsonPath}`);

        // Display interactive JSON output
        console.log('\n📄 JSON OUTPUT PREVIEW:');
        // Skip the interactive display in test mode
        if (!isTestMode) {
          await displayInteractiveJSON(allCategoryData);
        }
      } else {
        console.warn('⚠️ No data was collected. Please check the website structure or connection.');
      }

      return allCategoryData;
    } finally {
      // Ensure browser is closed properly
      if (browser) {
        try {
          await browser.close();
          console.log('\n🏁 Browser closed. Scraping complete.');
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Parse command line arguments
 * @returns Object containing parsed command line arguments
 */
function parseCommandLineArgs(): {
  categoryUrl?: string;
  shouldShowHelp: boolean;
  code?: string;
  heading?: string;
  label?: string;
  isbn?: string;
  lookupMode: boolean;
  enableScreenshots: boolean;
  compare: boolean;
  scrape: boolean;
} {
  // Read package.json to get version
  let packageJson;

  // Try multiple possible locations for package.json
  const possibleLocations = [
    '../package.json', // From dist/src to root
    '../../package.json', // From dist/src up two levels
    './package.json', // Same directory as index.js
    '../../../package.json', // Up three levels
  ];

  // Try each location until we find one that works
  let found = false;
  for (const location of possibleLocations) {
    try {
      packageJson = JSON.parse(readFileSync(new URL(location, import.meta.url), 'utf8'));
      found = true;
      break;
    } catch (error) {
      // Continue to next location
    }
  }

  // If we couldn't find the package.json
  if (!found) {
    console.error('ERROR: Could not locate package.json to determine version.');
    process.exit(1);
  }

  const program = new Command();
  const result: {
    categoryUrl?: string;
    shouldShowHelp: boolean;
    code?: string;
    heading?: string;
    label?: string;
    isbn?: string;
    lookupMode: boolean;
    enableScreenshots: boolean;
    compare: boolean;
    scrape: boolean;
  } = {
    shouldShowHelp: false,
    lookupMode: false,
    enableScreenshots: false,
    compare: false,
    scrape: false,
  };

  program
    .name('isbn-bisac-tools')
    .version(packageJson.version, '-v, --version', 'Display the current version')
    .description('A toolkit for working with BISAC subject headings and ISBN lookups')
    .option('-u, --url <url>', 'Specific category URL to scrape')
    .option('-c, --code <code>', 'Look up a specific BISAC code')
    .option('-H, --heading <heading>', 'Look up a specific heading')
    .option('-l, --label <label>', 'Look up a specific label')
    .option('-i, --isbn <isbn>', 'Look up BISAC code(s) for a specific ISBN')
    .option('-s, --screenshots', 'Enable taking screenshots during scraping')
    .option('--scrape', 'Run the BISAC web scraper to gather up-to-date data')
    .option('--compare', 'Compare two BISAC JSON files to identify changes')
    .helpOption('-h, --help', 'Display help for command')
    .action(options => {
      if (options.url) {
        result.categoryUrl = options.url;

        // Validate URL
        if (result.categoryUrl && !result.categoryUrl.match(/^https?:\/\//)) {
          console.error('❌ Error: URL must start with http:// or https://');
          result.shouldShowHelp = true;
          result.categoryUrl = undefined;
        }
      }

      if (options.code) {
        result.code = options.code;
        result.lookupMode = true;
      }

      if (options.heading) {
        result.heading = options.heading;
        result.lookupMode = true;
      }

      if (options.label) {
        result.label = options.label;
        result.lookupMode = true;
      }

      if (options.isbn) {
        result.isbn = options.isbn;
        result.lookupMode = true;
      }

      if (options.screenshots) {
        result.enableScreenshots = true;
      }

      if (options.compare) {
        result.compare = true;
      }

      if (options.scrape) {
        result.scrape = true;
      }
    });

  program.parse();

  // Set help flag if explicitly asked for help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    result.shouldShowHelp = true;
  }

  // Version flag is handled by Commander directly, so we don't need to handle it here

  return result;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
📚 BISAC Subject Headings Scraper - Help 📚
--------------------------------------------

Usage:
  npm start -- [options]

Scraping Options:
  -u, --url <url>    Scrape a single category from the specified URL
                     (Must be a valid BISAC category URL from bisg.org)
  -s, --screenshots  Enable taking screenshots during scraping

Lookup Options:
  -c, --code <code>      Get the full label for a BISAC code (e.g., ANT007000)
  -H, --heading <head>   Get all codes and labels for a category heading (e.g., "ANTIQUES & COLLECTIBLES")
  -l, --label <label>    Get the code for a full label (e.g., "ANTIQUES & COLLECTIBLES / Buttons & Pins")
  -i, --isbn <isbn>      Get BISAC code(s) for a book with the given ISBN (e.g., "9781234567890")

Analysis Options:
  --compare              Compare bisac-data.json with a backup to identify changes between versions

Flexible Matching:
  The lookup utilities support flexible matching:
  - Case-insensitive matching: "fiction" works the same as "FICTION"
  - "&" vs "AND" interchangeability: "ANTIQUES AND COLLECTIBLES" matches "ANTIQUES & COLLECTIBLES"
  - Extra whitespace handling: "  FICTION  /  War & Military  " works correctly

General Options:
  -h, --help             Show this help message
  -v, --version          Display the current version

Examples:
  npm start                              # Scrape all categories
  npm start -- --url https://www.bisg.org/fiction  # Scrape only Fiction category
  npm start -- --screenshots            # Enable screenshots during scraping
  npm run scrape:url https://www.bisg.org/art       # Alternative way to scrape a single category

  npm start -- --code ANT007000         # Get full label for code ANT007000
  npm start -- --heading "FICTION"      # Get all codes for the FICTION heading
  npm start -- --isbn 9781234567890     # Get BISAC code(s) for a book with ISBN 9781234567890
  npm start -- --label "FICTION / War & Military"  # Get code for the given label
  npm start -- --compare                # Compare current bisac-data.json with a backup file
  npm start -- --version                # Display the current version

Note:
  The scraper output will be saved to output/bisac-data.json.
  Lookup operations use this file for reference.
`);
}

// Execute when run directly or when called as a CLI command
// This ensures it works both with direct node execution and when installed globally
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('isbn-bisac-tools')
) {
  void (async () => {
    try {
      // Parse command line arguments
      const {
        categoryUrl,
        shouldShowHelp,
        code,
        heading,
        label,
        isbn,
        lookupMode,
        enableScreenshots,
        compare,
        scrape: shouldScrape,
      } = parseCommandLineArgs();

      // Show help and exit if requested or if there's an issue with arguments
      if (shouldShowHelp) {
        showHelp();
        process.exit(1);
      }

      // Handle lookup operations
      if (lookupMode) {
        // Use the fixed filename for the data file
        const dataFilePath = CONFIG.jsonPath;

        // Check if the file exists
        let actualFilePath = dataFilePath;
        if (!fsSync.existsSync(dataFilePath)) {
          console.log(`⚠️ BISAC data file not found: ${dataFilePath}`);
          console.log('🔍 Looking for alternative data files...');

          try {
            // First check in the package directory
            if (fsSync.existsSync(CONFIG.outputDir)) {
              const files = fsSync
                .readdirSync(CONFIG.outputDir)
                .filter((file: string) => file.endsWith('.json') && file.includes('bisac-data'))
                .sort()
                .reverse();

              if (files.length > 0) {
                actualFilePath = path.join(CONFIG.outputDir, files[0]);
                console.log(`✅ Using data file: ${actualFilePath}`);
              } else {
                // Also check in the current working directory as fallback
                const cwdOutputDir = path.join(process.cwd(), 'data');
                if (fsSync.existsSync(cwdOutputDir)) {
                  const cwdFiles = fsSync
                    .readdirSync(cwdOutputDir)
                    .filter((file: string) => file.endsWith('.json') && file.includes('bisac-data'))
                    .sort()
                    .reverse();

                  if (cwdFiles.length > 0) {
                    actualFilePath = path.join(cwdOutputDir, cwdFiles[0]);
                    console.log(`✅ Using data file from current directory: ${actualFilePath}`);
                  } else {
                    console.error('❌ No BISAC data files found. Please run the scraper first.');
                    process.exit(1);
                  }
                } else {
                  console.error('❌ No BISAC data files found. Please run the scraper first.');
                  process.exit(1);
                }
              }
            } else {
              console.error('❌ Data directory not found. Please run the scraper first.');
              process.exit(1);
            }
          } catch (error) {
            console.error('❌ Error finding data files:', error);
            process.exit(1);
          }
        }

        // Handle code lookup (code -> full label)
        if (code) {
          console.log(`🔍 Looking up full label for code: ${code}`);
          const fullLabel = await utils.getFullLabelFromCode(code, actualFilePath);

          if (fullLabel) {
            console.log(`✅ Found: ${fullLabel}`);
          } else {
            console.log(`❌ No label found for code: ${code}`);
            console.log(
              `   This may be because the code doesn't exist or isn't in the current dataset.`
            );
            if (categoryUrl) {
              console.log(`   You're currently using data from: ${categoryUrl}`);
              console.log(
                `   Try using a different URL or run without --url to use the complete dataset.`
              );
            }
          }
          process.exit(0);
        }

        // Handle heading lookup (heading -> all codes and labels)
        if (heading) {
          console.log(`🔍 Looking up codes for heading: ${heading}`);
          const results = await utils.getCodesForHeading(heading, actualFilePath);

          if (results.length > 0) {
            console.log(`✅ Found ${results.length} results:`);
            console.table(results);
          } else {
            console.log(`❌ No codes found for heading: ${heading}`);
          }
          process.exit(0);
        }

        // Handle label lookup (full label -> code)
        if (label) {
          console.log(`🔍 Looking up code for label: ${label}`);
          const code = await utils.getCodeFromFullLabel(label, actualFilePath);

          if (code) {
            console.log(`✅ Found: ${code}`);
          } else {
            console.log(`❌ No code found for label: ${label}`);
          }
          process.exit(0);
        }

        // Handle ISBN lookup (ISBN -> BISAC code(s))
        if (isbn) {
          console.log(`🔍 Looking up BISAC code(s) for ISBN: ${isbn}`);
          const { title, categories, bestCategory } = await utils.getCodeFromISBN(
            isbn,
            actualFilePath
          );

          console.log(`📚 Book Title: ${chalk.green(title)}`);

          if (categories.length > 0) {
            if (bestCategory) {
              console.log(
                `🌟 ${chalk.yellow('BEST MATCH')}: ${chalk.green(bestCategory.code)} | ${chalk.green(bestCategory.fullLabel)}`
              );
            }
            console.log(`✅ Found ${categories.length} BISAC categories:`);
            console.table(categories);
          } else {
            console.log(`❌ No BISAC codes found for ISBN: ${isbn}`);
          }
          process.exit(0);
        }
      }

      // Handle file comparison
      if (compare) {
        console.log('🔄 Comparing BISAC Subject Headings Files');

        // Select files for comparison
        const selectedFiles = await utils.selectFilesForComparison(CONFIG.outputDir);

        if (!selectedFiles) {
          console.log('🛑 Comparison cancelled or no files available.');
          process.exit(0);
        }

        try {
          console.log(`\n🔍 Comparing:`);
          console.log(`  - Old: ${path.basename(selectedFiles.olderFile)}`);
          console.log(`  - New: ${path.basename(selectedFiles.newerFile)}`);

          // Run comparison
          const comparisonResult = await utils.compareBisacJsonFiles(
            selectedFiles.olderFile,
            selectedFiles.newerFile
          );

          // Display comparison report
          await utils.printComparisonReport(comparisonResult);

          console.log('\n✅ Comparison complete!');
          process.exit(0);
        } catch (error) {
          console.error(`❌ Error during comparison: ${(error as Error).message}`);
          process.exit(1);
        }
      }

      // Check if we're explicitly asked to scrape
      const isScrapeCommand = process.argv[2] === 'scrape' || process.argv.includes('--scrape');
      if (!isScrapeCommand && !categoryUrl && !shouldScrape) {
        // If not explicitly asked to scrape, show help
        console.log('ℹ️ To start scraping, use the --scrape flag or run with "scrape" command');
        showHelp();
        process.exit(0);
      }

      // Check if we're going to overwrite the default data file
      const defaultDataExists = fsSync.existsSync(CONFIG.jsonPath);
      if (defaultDataExists) {
        console.log(
          `⚠️ This will overwrite the default BISAC data file: ${path.basename(CONFIG.jsonPath)}`
        );

        // Prompt for confirmation
        const { shouldContinue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldContinue',
            message: 'Do you want to continue and overwrite the default data file?',
            default: false,
          },
        ]);

        if (!shouldContinue) {
          console.log('🛑 Scraping cancelled by user.');
          process.exit(0);
        }

        console.log('✅ Continuing with scraping...');
      }

      // Also check for today's file
      const existingTodayFile = await utils.checkExistingJsonFileForToday(CONFIG.outputDir);
      if (existingTodayFile && existingTodayFile !== CONFIG.jsonPath) {
        console.log(
          `⚠️ A BISAC data file for today already exists: ${path.basename(existingTodayFile)}`
        );

        // Prompt for confirmation
        const { shouldContinue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldContinue',
            message: 'Do you want to continue and overwrite the existing file?',
            default: false,
          },
        ]);

        if (!shouldContinue) {
          console.log('🛑 Scraping cancelled by user.');
          process.exit(0);
        }

        console.log('✅ Continuing with scraping...');
      }

      // Set screenshot option in CONFIG
      CONFIG.takeScreenshots = Boolean(enableScreenshots);
      const data = await scrape(categoryUrl);
      console.log(`🏆 Final data count: ${data.length} categories.`);

      // Check if we have data and print overall statistics
      if (data.length > 0) {
        // Calculate total subjects across all categories
        const totalSubjects = data.reduce(
          (total: number, category: Category) => total + category.subjects.length,
          0
        );

        // Find categories with most and least subjects
        const categoryWithMostSubjects = [...data].sort(
          (a, b) => b.subjects.length - a.subjects.length
        )[0];
        const categoryWithLeastSubjects = [...data]
          .filter(c => c.subjects.length > 0)
          .sort((a, b) => a.subjects.length - b.subjects.length)[0];

        console.log('\n🏁 FINAL REPORT:');
        console.log(`  - 💾 JSON output saved to: ${CONFIG.jsonPath}`);
        console.log(`  - 📚 Total categories: ${data.length}`);
        console.log(`  - 🔖 Total subjects: ${totalSubjects}`);
        console.log(
          `  - 🏆 Category with most subjects: ${categoryWithMostSubjects.heading} (${categoryWithMostSubjects.subjects.length} subjects)`
        );
        if (categoryWithLeastSubjects) {
          console.log(
            `  - 🥉 Category with least subjects: ${categoryWithLeastSubjects.heading} (${categoryWithLeastSubjects.subjects.length} subjects)`
          );
        }

        // Add completion message with celebration emojis
        console.log('\n🎉 SCRAPING COMPLETED SUCCESSFULLY! 🎉');
        console.log('🌟 All BISAC subject headings have been collected and saved 🌟');

        // Print the complete JSON data with formatting
        await utils.printFormattedJSON(data, '📊 COMPLETE DATASET:');
      }

      process.exit(0);
    } catch (error) {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    }
  })();
}

/**
 * Extract all category URLs from the main page
 * @param page - Puppeteer page object
 * @returns Array of category URLs
 */
async function extractCategoryUrls(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const linkElements = document.querySelectorAll('.field-items li a');
    const urls: string[] = [];

    linkElements.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        urls.push(href);
      }
    });

    return urls;
  });
}

/**
 * Displays an interactive JSON view of categories with collapsible sections
 * @param categories - The categories data to display
 */
async function displayInteractiveJSON(categories: Category[]): Promise<void> {
  if (categories.length === 0) {
    console.log(chalk.yellow('No data available to display.'));
    return;
  }

  // Create a list of category choices with proper typing
  const choices = [
    ...categories.map((category, index) => ({
      name: `${chalk.cyan(category.heading)} - ${chalk.green(category.subjects.length)} subjects, ${chalk.yellow(category.notes.length)} notes`,
      value: index.toString(), // Convert to string to be consistent with other values
    })),
    { type: 'separator', line: '─'.repeat(50) },
    {
      name: chalk.gray('Exit viewer'),
      value: 'exit',
    },
  ];

  let viewing = true;

  while (viewing) {
    try {
      const { selectedCategory } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedCategory',
          message: 'Select a category to expand or exit:',
          choices: choices,
          pageSize: Math.min(15, choices.length),
        },
      ]);

      if (selectedCategory === 'exit') {
        viewing = false;
        continue;
      }

      // Convert the string index back to number
      const categoryIndex = parseInt(selectedCategory, 10);
      const category = categories[categoryIndex];

      // Display category details
      console.log('\n' + chalk.bold.cyan('='.repeat(80)));
      console.log(chalk.bold.white(`Category: ${chalk.cyan(category.heading)}`));
      console.log(chalk.bold.cyan('='.repeat(80)));

      if (category.notes.length > 0) {
        console.log(chalk.bold.yellow('\nNotes:'));
        category.notes.forEach((note, i) => {
          console.log(`${chalk.yellow(i + 1)}: ${note}`);
        });
      }

      if (category.subjects.length > 0) {
        // Offer subject viewing options
        const { viewOption } = await inquirer.prompt([
          {
            type: 'list',
            name: 'viewOption',
            message: `How would you like to view ${category.subjects.length} subjects?`,
            choices: [
              { name: 'View first 10 subjects', value: 'first10' },
              { name: 'View all subjects', value: 'all' },
              { name: 'Search subjects', value: 'search' },
              { name: 'Back to category list', value: 'back' },
            ],
          },
        ]);

        if (viewOption === 'first10') {
          console.log(chalk.bold.green('\nSubjects (First 10):'));
          category.subjects.slice(0, 10).forEach(subject => {
            console.log(`${chalk.magenta(subject.code)}: ${chalk.green(subject.label)}`);
          });
          if (category.subjects.length > 10) {
            console.log(chalk.gray(`... and ${category.subjects.length - 10} more subjects`));
          }
        } else if (viewOption === 'all') {
          console.log(chalk.bold.green('\nAll Subjects:'));
          category.subjects.forEach(subject => {
            console.log(`${chalk.magenta(subject.code)}: ${chalk.green(subject.label)}`);
          });
        } else if (viewOption === 'search') {
          const { searchTerm } = await inquirer.prompt([
            {
              type: 'input',
              name: 'searchTerm',
              message: 'Enter search term:',
            },
          ]);

          const results = category.subjects.filter(
            subject =>
              subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              subject.label.toLowerCase().includes(searchTerm.toLowerCase())
          );

          console.log(chalk.bold.green(`\nSearch Results (${results.length} matches):`));
          if (results.length > 0) {
            results.forEach(subject => {
              console.log(`${chalk.magenta(subject.code)}: ${chalk.green(subject.label)}`);
            });
          } else {
            console.log(chalk.yellow('No matches found.'));
          }
        }
      } else {
        console.log(chalk.yellow('\nNo subjects available for this category.'));
      }

      // Prompt to continue
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Return to category list', value: 'back' },
            { name: 'Exit viewer', value: 'exit' },
          ],
        },
      ]);

      if (action === 'exit') {
        viewing = false;
      }

      // Clear some space before showing the menu again
      console.log('\n');
    } catch (error) {
      console.error('Error in interactive display:', error);
      viewing = false;
    }
  }
}

// Export functions for use as a module
export {
  scrape,
  processCategoryPage,
  extractCategoryUrls,
  parseCommandLineArgs,
  showHelp,
  CONFIG,
  CATEGORY_URLS,
};
