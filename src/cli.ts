#!/usr/bin/env node

/**
 * ISBN-BISAC Tools - CLI Entry Point
 *
 * This file serves as the entry point for the command-line interface of isbn-bisac-tools.
 * It handles command-line argument parsing and execution of the appropriate commands.
 */

// Execute main function if this is the entry point
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  // Dynamic import to maintain ESM compatibility
  void import('./cli/index.js').then(({ parseCommandLineArgs }) => {
    void (async () => {
      try {
        await parseCommandLineArgs(process.argv);
      } catch (error) {
        console.error('Fatal error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    })();
  });
}
