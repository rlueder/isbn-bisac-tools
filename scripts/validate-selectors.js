#!/usr/bin/env node

/**
 * Validate Selectors Script for ISBN-BISAC Tools
 *
 * This script validates critical CSS selectors used in the scraper
 * against the live website to detect structure changes early.
 *
 * Usage:
 *   node scripts/validate-selectors.js
 *
 * Options:
 *   --selector <selector>  Test a specific selector (default: tests all critical selectors)
 *   --verbose              Show detailed output for each selector test
 *   --fix                  Attempt to suggest fixes for broken selectors
 */

import puppeteer from 'puppeteer';
import ora from 'ora';
import chalk from 'chalk';
import { getScraperConfig } from '../dist/config/index.js';

// Critical selectors to validate
const CRITICAL_SELECTORS = [
  {
    name: 'Category Links',
    selector: null, // Will be populated from config
    description: 'Finds category links on the main page',
    url: null, // Will be populated from config
    expectedMinCount: 20, // We expect at least 20 category links
    fallbackSelectors: [
      'table a',
      'a[href*="collectibles"], a[href*="fiction"], a[href*="biography"]',
      '.container a[href*="/"]'
    ]
  },
  {
    name: 'Category Heading',
    selector: null, // Will be populated from config
    description: 'Finds the heading on category pages',
    url: 'https://www.bisg.org/fiction',
    expectedMinCount: 1,
    fallbackSelectors: [
      'h2.subtitle',
      '.header-ribbon h2',
      '.container h1, .container h2'
    ]
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  selector: args.includes('--selector') ? args[args.indexOf('--selector') + 1] : null,
  verbose: args.includes('--verbose'),
  fix: args.includes('--fix')
};

async function main() {
  try {
    // Load configuration
    const config = getScraperConfig();

    // Update selectors from config
    CRITICAL_SELECTORS[0].selector = config.mainPage.categoryLinks;
    CRITICAL_SELECTORS[0].url = config.startUrl;
    CRITICAL_SELECTORS[1].selector = config.categoryPage.heading;

    console.log(chalk.blue('🔍 Validating selectors against the BISG website...'));
    console.log(chalk.gray('This helps detect website structure changes early.\n'));

    // Launch browser
    const spinner = ora('Launching browser...').start();
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    spinner.succeed('Browser launched');

    let allValid = true;
    let testCount = 0;

    // Filter selectors if a specific one was requested
    const selectorsToTest = options.selector
      ? [{ name: 'Custom', selector: options.selector, url: config.startUrl, expectedMinCount: 1 }]
      : CRITICAL_SELECTORS;

    // Test each selector
    for (const selectorInfo of selectorsToTest) {
      testCount++;
      const spinner = ora(`Testing "${selectorInfo.name}" selector: ${selectorInfo.selector}`).start();

      try {
        const page = await browser.newPage();
        await page.goto(selectorInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Test the selector
        const elements = await page.$$eval(selectorInfo.selector, els => {
          return els.map(el => ({
            tagName: el.tagName.toLowerCase(),
            text: el.textContent?.trim().substring(0, 50) || '(no text)',
            href: el.tagName.toLowerCase() === 'a' ? el.getAttribute('href') : null
          }));
        });

        const elementCount = elements.length;
        const isValid = elementCount >= selectorInfo.expectedMinCount;

        if (isValid) {
          spinner.succeed(chalk.green(`✅ "${selectorInfo.name}" selector is valid (found ${elementCount} elements)`));

          if (options.verbose && elementCount > 0) {
            console.log(chalk.gray('  Sample matches:'));
            elements.slice(0, 3).forEach((el, i) => {
              console.log(chalk.gray(`    ${i+1}. <${el.tagName}> "${el.text}"${el.href ? ` → ${el.href}` : ''}`));
            });
            console.log();
          }
        } else {
          spinner.fail(chalk.red(`❌ "${selectorInfo.name}" selector failed (found ${elementCount} elements, expected at least ${selectorInfo.expectedMinCount})`));
          allValid = false;

          // Try fallback selectors if fix option is enabled
          if (options.fix && selectorInfo.fallbackSelectors) {
            console.log(chalk.yellow('  Attempting to find working alternatives...'));

            for (const fallbackSelector of selectorInfo.fallbackSelectors) {
              try {
                const fallbackElements = await page.$$eval(fallbackSelector, els => els.length);
                if (fallbackElements >= selectorInfo.expectedMinCount) {
                  console.log(chalk.green(`  ✓ Alternative selector works: "${fallbackSelector}" (found ${fallbackElements} elements)`));
                  console.log(chalk.yellow(`  Suggested fix: Update the ${selectorInfo.name} selector to "${fallbackSelector}"`));
                  break;
                } else {
                  console.log(chalk.gray(`  × Alternative "${fallbackSelector}" found only ${fallbackElements} elements`));
                }
              } catch (error) {
                console.log(chalk.gray(`  × Alternative "${fallbackSelector}" failed: ${error.message}`));
              }
            }
          }
        }

        await page.close();
      } catch (error) {
        spinner.fail(chalk.red(`Error testing "${selectorInfo.name}" selector: ${error.message}`));
        allValid = false;
      }
    }

    // Summary
    console.log('\n' + chalk.blue('📊 Validation Summary:'));
    if (allValid) {
      console.log(chalk.green(`✅ All ${testCount} selectors are working correctly!`));
    } else {
      console.log(chalk.red(`❌ Some selectors are not working. Please update them in the configuration.`));
      console.log(chalk.yellow('Tip: Run with --fix to get suggestions for broken selectors'));
    }

    await browser.close();
    process.exit(allValid ? 0 : 1);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
