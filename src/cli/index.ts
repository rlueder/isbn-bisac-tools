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

/**
 * Initialize the CLI with all available commands
 * @returns Configured Command instance
 */
export function initializeCLI(): Command {
  const program = new Command();

  // Set up the program metadata
  program
    .name('isbn-bisac-tools')
    .description('Utilities for working with BISAC codes and ISBN lookups')
    .version(process.env.npm_package_version || '0.0.0');

  // Register all commands from the commands directory
  registerScrapeCommand(program);
  registerHelpCommand(program);
  registerLookupCommand(program);
  registerBrowseCommand(program);
  registerCompareCommand(program);
  registerExportCommand(program);

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
