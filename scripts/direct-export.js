#!/usr/bin/env node

/* eslint-disable no-undef */
/**
 * Direct Export Script for ISBN-BISAC Tools
 *
 * This is a standalone script to export BISAC data to various formats.
 * It bypasses the CLI interface and directly uses the export module.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the export functionality
const { exportBISACData } = await import('../dist/src/export/index.js');

// Define output formats
const formats = ['csv', 'excel', 'xml'];

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue('📂 ISBN-BISAC Tools Direct Export Script'));
    console.log(chalk.blue('Current directory:', process.cwd()));

    // Find BISAC data file
    const dataPath = path.join(__dirname, '..', 'data', 'bisac-data.json');
    console.log(chalk.blue('Looking for BISAC data at:', dataPath));

    if (!fs.existsSync(dataPath)) {
      console.error(chalk.red('❌ BISAC data file not found!'));
      process.exit(1);
    }

    console.log(chalk.green('✅ Found BISAC data file'));

    // Load the data
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    let jsonData;

    try {
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      console.error(chalk.red('❌ Error parsing JSON data:', error.message));
      process.exit(1);
    }

    // Get the categories
    const categories = jsonData.categories || jsonData;

    if (!Array.isArray(categories) || categories.length === 0) {
      console.error(chalk.red('❌ Invalid or empty BISAC data'));
      process.exit(1);
    }

    console.log(
      chalk.green(
        `📊 Loaded ${categories.length} categories with ${categories.reduce((count, cat) => count + cat.subjects.length, 0)} subjects`
      )
    );

    // Export to all formats
    for (const format of formats) {
      const outputFile = path.join(
        __dirname,
        '..',
        `bisac-export.${format === 'excel' ? 'xlsx' : format}`
      );
      console.log(chalk.blue(`\n🚀 Exporting to ${format.toUpperCase()} format`));
      console.log(chalk.blue(`Output file: ${outputFile}`));

      try {
        // Configure export options
        const exportOptions = {
          format,
          filepath: outputFile,
          formatOptions: {
            excel: {
              sheetName: 'BISAC Codes',
            },
            xml: {
              rootElement: 'bisac',
              pretty: true,
            },
          },
        };

        // Perform the export
        const result = await exportBISACData(categories, exportOptions);

        if (result.success) {
          console.log(chalk.green(`✅ Successfully exported to ${format.toUpperCase()}`));
          console.log(chalk.green(`📊 Records exported: ${result.recordCount}`));

          if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(chalk.green(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`));
          } else {
            console.log(chalk.yellow(`⚠️ Warning: Output file not found at expected location`));
          }
        } else {
          console.error(
            chalk.red(
              `❌ Export to ${format.toUpperCase()} failed: ${result.error?.message || 'Unknown error'}`
            )
          );
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error exporting to ${format.toUpperCase()}: ${error.message}`));
      }
    }

    console.log(chalk.green('\n✅ Export operations completed'));
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:', error.message));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main();
