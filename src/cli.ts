#!/usr/bin/env node

/**
 * ISBN-BISAC Tools - CLI Entry Point
 *
 * This file serves as the entry point for the command-line interface of isbn-bisac-tools.
 * It handles command-line argument parsing and execution of the appropriate commands.
 */

import { parseCommandLineArgs } from './cli/index.js';
import chalk from 'chalk';

// Set up error handlers
process.on('uncaughtException', error => {
  console.error(chalk.red('Fatal error:'), error instanceof Error ? error.message : String(error));
  process.exit(1);
});

process.on('unhandledRejection', error => {
  console.error(
    chalk.red('Unhandled promise rejection:'),
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});

// Only execute if this is the main module
const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  // Execute main function with proper error handling
  try {
    parseCommandLineArgs(process.argv)
      .then(() => {
        // Give process time to flush stdout
        setTimeout(() => {
          process.exit(0);
        }, 10);
      })
      .catch(error => {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      });
  } catch (error) {
    console.error(
      chalk.red('Fatal error:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Export nothing - this is just an entry point
export {};
