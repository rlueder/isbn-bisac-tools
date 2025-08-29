/**
 * Export Command for the ISBN-BISAC Tools CLI
 *
 * This command handles the functionality for exporting BISAC data
 * to various formats (CSV, Excel, XML).
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { exportBISACData, ExportOptions } from '../../export/index.js';
import { loadBisacData } from '../../../lib/utils.js';
import * as ui from '../../ui/index.js';

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
    // Load BISAC data
    const data = await loadBisacData();
    if (!data || data.length === 0) {
      spinner.fail(chalk.red('No BISAC data found. Run scraper first.'));
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

    // Perform export
    const result = await exportBISACData(data, exportOptions);

    if (result.success) {
      spinner.succeed(
        chalk.green(
          `Successfully exported ${result.recordCount} records${
            result.filepath ? ` to ${result.filepath}` : ''
          }`
        )
      );
    } else {
      spinner.fail(chalk.red(`Export failed: ${result.error?.message || 'Unknown error'}`));
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
