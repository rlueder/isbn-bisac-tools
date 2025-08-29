/**
 * Command Line Interface module for ISBN-BISAC Tools
 *
 * This module provides the entry point for the CLI interface,
 * parsing command-line arguments and dispatching to the appropriate
 * command handlers.
 */

import { Command } from 'commander';
import { registerScrapeCommand } from './commands/scrape.js';
import { registerHelpCommand } from './commands/help.js';
import { registerLookupCommand } from './commands/lookup.js';
import { registerBrowseCommand } from './commands/browse.js';
import { registerCompareCommand } from './commands/compare.js';
import { registerExportCommand } from './commands/export.js';
import { registerIsbnCommand } from './commands/isbn.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Initialize the CLI with all available commands
 * @returns Configured Command instance
 */
export function initializeCLI(): Command {
  const program = new Command();

  // Get version from package.json
  let version = '0.0.0';
  try {
    // For ESM, we need to get the directory path differently than in CommonJS
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Try to find package.json by going up directories
    // First try: dist/src/cli -> dist/src -> dist -> root
    const packagePath = join(__dirname, '../../../package.json');
    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      version = packageJson.version;
    } catch (e) {
      // If that fails, we might be running from the source directory
      // Try: src/cli -> src -> root
      const altPackagePath = join(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(altPackagePath, 'utf8'));
      version = packageJson.version;
    }
  } catch (error) {
    // Fall back to npm_package_version or default
    version = process.env.npm_package_version || '0.0.0';
    console.error('Warning: Unable to determine package version, using fallback:', version);
  }

  // Set up the program metadata
  program
    .name('isbn-bisac-tools')
    .description('Utilities for working with BISAC codes and ISBN lookups')
    .version(version);

  // Register all commands from the commands directory
  registerScrapeCommand(program);
  registerHelpCommand(program);
  registerLookupCommand(program);
  registerBrowseCommand(program);
  registerCompareCommand(program);
  registerExportCommand(program);
  registerIsbnCommand(program);

  return program;
}

/**
 * Parse command line arguments and execute the appropriate command
 * @param args Command line arguments
 */
export async function parseCommandLineArgs(args: string[] = process.argv): Promise<void> {
  const program = initializeCLI();

  // Parse arguments and handle any errors
  try {
    // Add a default action for the root command to show help
    program.action(() => {
      program.help();
    });

    await program.parseAsync(args);
  } catch (error) {
    console.error('Error executing command:', error);
    process.exit(1);
  }
}

// Default export for direct import
export default {
  initializeCLI,
  parseCommandLineArgs,
};
