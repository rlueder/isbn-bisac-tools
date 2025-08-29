/**
 * Export Command for the ISBN-BISAC Tools CLI
 *
 * This command handles the functionality for exporting BISAC data
 * to various formats (CSV, Excel, XML).
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { existsSync, readFileSync, statSync as fsStatSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { exportBISACData, ExportOptions } from '../../export/index.js';
import * as ui from '../../ui/index.js';
import { Category } from '../../types/index.js';

// Get directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExportCommandOptions {
  format: 'csv' | 'excel' | 'xml';
  output?: string;
  fields?: string;
  mapping?: string;
  delimiter?: string;
  sheetName?: string;
  xmlRoot?: string;
  pretty?: boolean;
}

/**
 * Register the export command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerExportCommand(program: Command): Command {
  return program
    .command('export')
    .description('Export BISAC data to various formats')
    .option('-f, --format <format>', 'Output format (csv, excel, xml)', 'csv')
    .option('-o, --output <file>', 'Output file path')
    .option('--fields <list>', 'Comma-separated list of fields to include')
    .option('--mapping <json>', 'JSON string of field mappings')
    .option('--delimiter <char>', 'Delimiter for CSV output (default: ,)')
    .option('--sheet-name <name>', 'Sheet name for Excel output')
    .option('--xml-root <name>', 'Root element name for XML output')
    .option('--pretty', 'Pretty print XML output')
    .action(executeExportCommand);
}

/**
 * Execute the export command with provided options
 * @param options Command options
 */
export async function executeExportCommand(options: ExportCommandOptions): Promise<void> {
  const spinner = ora('Loading BISAC data...').start();

  try {
    // Try to find and load BISAC data
    let data: Category[] = [];

    // Possible locations for the BISAC data file
    const possibleLocations = [
      path.join(process.cwd(), 'data', 'bisac-data.json'),
      path.join(process.cwd(), 'bisac-data.json'),
      path.join(process.cwd(), '..', 'data', 'bisac-data.json'),
      path.join(process.cwd(), 'dist', 'data', 'bisac-data.json'),
      path.join(__dirname, '..', '..', '..', 'data', 'bisac-data.json'),
      path.join(__dirname, '..', '..', '..', '..', 'data', 'bisac-data.json'),
      path.join(path.resolve(process.cwd()), 'data', 'bisac-data.json'),
    ];

    // Try each location
    let dataFilePath: string | null = null;
    for (const location of possibleLocations) {
      if (existsSync(location)) {
        dataFilePath = location;
        spinner.info(chalk.blue(`Found BISAC data file at: ${location}`));
        break;
      }
    }

    // If found, load the data
    if (dataFilePath) {
      try {
        const fileContent = readFileSync(dataFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // Check if this is the new format (with timestamp and categories)
        if (jsonData.categories && Array.isArray(jsonData.categories)) {
          data = jsonData.categories as Category[];
          spinner.succeed(chalk.green(`Loaded BISAC data from ${jsonData.date || 'unknown date'}`));
        }
        // Legacy format (array of categories directly)
        else if (Array.isArray(jsonData)) {
          data = jsonData as Category[];
          spinner.succeed(chalk.green('Loaded BISAC data (legacy format)'));
        } else {
          throw new Error('Invalid BISAC data format');
        }
      } catch (parseError) {
        spinner.warn(
          chalk.yellow(
            `Error parsing BISAC data file: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          )
        );
      }
    } else {
      spinner.warn(chalk.yellow('No BISAC data file found in standard locations'));

      // Try running the scraper as a fallback
      spinner.text = '🚀 Attempting to run BISAC scraper to generate data...';
      try {
        // Use the npm script to run the scraper
        const { spawn } = await import('child_process');
        const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

        // Run the scraper
        const scraperProcess = spawn(npmExecutable, ['run', 'scrape'], {
          stdio: 'inherit',
          shell: true,
        });

        // Wait for scraper to complete
        await new Promise<void>((resolve, reject) => {
          scraperProcess.on('close', code => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Scraper process exited with code ${code}`));
            }
          });

          scraperProcess.on('error', reject);
        });

        spinner.succeed(chalk.green('Scraper completed, checking for data file...'));
        console.log(chalk.blue('Looking for data files in:'));
        console.log(chalk.blue('- ' + process.cwd() + '/data/bisac-data.json'));
        console.log(chalk.blue('- ' + process.cwd() + '/bisac-data.json'));
        console.log(chalk.blue('- ' + process.cwd() + '/../data/bisac-data.json'));
        console.log(chalk.blue('- ' + process.cwd() + '/dist/data/bisac-data.json'));

        // Check if the scraper created a data file
        for (const location of possibleLocations) {
          if (existsSync(location)) {
            dataFilePath = location;
            spinner.info(chalk.blue(`Found newly created BISAC data file at: ${location}`));

            // Load the data
            const fileContent = readFileSync(dataFilePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);

            if (jsonData.categories && Array.isArray(jsonData.categories)) {
              data = jsonData.categories as Category[];
            } else if (Array.isArray(jsonData)) {
              data = jsonData as Category[];
            }

            break;
          }
        }
      } catch (scraperError) {
        spinner.fail(
          chalk.red(
            `Failed to generate BISAC data: ${scraperError instanceof Error ? scraperError.message : String(scraperError)}`
          )
        );
        console.log(chalk.yellow('Please run the scraper manually first: isbn-bisac-tools scrape'));
        process.exit(1);
      }
    }

    if (!data || data.length === 0) {
      spinner.fail(chalk.red('No BISAC data found. Run scraper first: isbn-bisac-tools scrape'));
      process.exit(1);
    }

    // Parse field mappings if provided
    let customMapping: Record<string, string> | undefined;
    if (options.mapping) {
      try {
        customMapping = JSON.parse(options.mapping);
      } catch (error) {
        spinner.fail(chalk.red('Invalid JSON format for field mappings'));
        process.exit(1);
      }
    }

    // Configure export options
    const exportOptions: ExportOptions = {
      format: options.format,
      filepath: options.output,
      includeFields: options.fields?.split(','),
      customMapping,
      formatOptions: {
        csv: {
          delimiter: options.delimiter,
        },
        excel: {
          sheetName: options.sheetName,
        },
        xml: {
          rootElement: options.xmlRoot,
          pretty: options.pretty,
        },
      },
    };

    spinner.text = `Exporting BISAC data to ${options.format.toUpperCase()} format...`;

    // Show export information
    console.log(chalk.blue('Export options:'));
    console.log(chalk.blue(`- Format: ${exportOptions.format}`));
    console.log(chalk.blue(`- Output file: ${exportOptions.filepath || 'console output'}`));
    if (exportOptions.filepath) {
      console.log(chalk.blue(`- Absolute output path: ${path.resolve(exportOptions.filepath)}`));
    }

    // Ensure filepath is absolute and directory exists
    if (exportOptions.filepath) {
      // Convert relative paths to absolute
      if (!path.isAbsolute(exportOptions.filepath)) {
        exportOptions.filepath = path.resolve(process.cwd(), exportOptions.filepath);
        console.log(chalk.blue(`- Resolved absolute path: ${exportOptions.filepath}`));
      }

      // Ensure output directory exists
      const outputDir = path.dirname(exportOptions.filepath);
      if (!existsSync(outputDir)) {
        console.log(chalk.blue(`- Creating output directory: ${outputDir}`));
        mkdirSync(outputDir, { recursive: true });
      }
    }

    // Perform export
    // Perform the export operation with robust error handling
    let result;
    try {
      result = await exportBISACData(data, exportOptions);
    } catch (exportError) {
      spinner.fail(
        chalk.red(
          `Export operation failed: ${exportError instanceof Error ? exportError.message : String(exportError)}`
        )
      );
      console.error(chalk.red('Export error details:'), exportError);
      process.exit(1);
    }

    if (result.success) {
      spinner.succeed(
        chalk.green(
          `Successfully exported ${result.recordCount} records${
            result.filepath ? ` to ${result.filepath}` : ''
          }`
        )
      );
      if (result.filepath) {
        // Verify file exists
        try {
          const stats = fsStatSync(result.filepath);
          console.log(
            chalk.green(`File saved to: ${result.filepath} (${(stats.size / 1024).toFixed(2)} KB)`)
          );
        } catch (error) {
          console.log(chalk.yellow(`Warning: Output file was not found at: ${result.filepath}`));
          console.log(
            chalk.yellow(`This may indicate a permission issue or a problem with the file path.`)
          );
          console.log(chalk.yellow(`Try using an absolute path with the -o option.`));
        }
      }
    } else {
      spinner.fail(chalk.red(`Export failed: ${result.error?.message || 'Unknown error'}`));
      console.log(chalk.red('Export error details:'), result.error?.details);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(
      chalk.red(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    );
    ui.log(error instanceof Error && error.stack ? error.stack : '', 'error');
    process.exit(1);
  }
}

export default {
  registerExportCommand,
  executeExportCommand,
};
