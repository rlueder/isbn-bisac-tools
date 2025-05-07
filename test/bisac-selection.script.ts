#!/usr/bin/env tsx

/**
 * Test script for BISAC code selection
 * This script tests the enhanced BISAC code selection functionality
 * by looking up various ISBNs and displaying the best category match
 */

import * as path from 'path';
import * as utils from '../lib/utils.js';
import chalk from 'chalk';

// Test ISBNs
const testISBNs: string[] = [
  '9780735222168', // All of the Marvels
  '9781451673319', // Fahrenheit 451
  '9780679783268', // Pride and Prejudice
  '9780307269751', // The Girl with the Dragon Tattoo
  '9781982135607', // The Anthropocene Reviewed
];

async function runTests(): Promise<void> {
  console.log('🧪 Testing BISAC code selection functionality\n');

  // Get the latest BISAC data file
  let dataFilePath: string;
  try {
    const outputDir = path.join(process.cwd(), 'data');
    dataFilePath = await utils.getLatestJsonFilePath(outputDir);
  } catch (error) {
    console.error(`❌ Error finding BISAC data file: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log(`📄 Using BISAC data from: ${dataFilePath}\n`);

  // Test each ISBN
  for (const isbn of testISBNs) {
    console.log(`\n📚 Testing ISBN: ${chalk.cyan(isbn)}`);

    try {
      const { title, categories, bestCategory } = await utils.getCodeFromISBN(isbn, dataFilePath);

      console.log(`📖 Book Title: ${chalk.green(title)}`);

      if (categories.length > 0) {
        if (bestCategory) {
          console.log(
            `🌟 ${chalk.yellow('BEST MATCH')}: ${chalk.green(bestCategory.code)} | ${chalk.green(bestCategory.fullLabel)}`
          );
        }
        console.log(`✅ Found ${categories.length} BISAC categories`);
        // Only display the first 5 categories to keep output manageable
        console.table(categories.slice(0, 5));
      } else {
        console.log(`❌ No BISAC codes found for ISBN: ${isbn}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ISBN ${isbn}: ${(error as Error).message}`);
    }
  }
}

runTests().catch(error => {
  console.error(`❌ Unhandled error in test script: ${error.message}`);
  process.exit(1);
});
