/**
 * Command Line Interface module for ISBN-BISAC Tools
 *
 * This module provides the entry point for the CLI interface,
 * parsing command-line arguments and dispatching to the appropriate
 * command handlers.
 */

import { Command } from 'commander';

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

  // TODO: Register all commands from the commands directory

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
