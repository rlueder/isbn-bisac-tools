#!/usr/bin/env node

/**
 * ISBN-BISAC Tools - CLI Entry Point
 *
 * This file serves as the entry point for the command-line interface of isbn-bisac-tools.
 * It handles command-line argument parsing and execution of the appropriate commands.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as mod from './index.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Execute main function if this is the entry point
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  void (async () => {
    try {
      const args = mod.parseCommandLineArgs();

      // Show help if requested or if no valid command is provided
      if (
        args.shouldShowHelp ||
        (!args.scrape && !args.categoryUrl && !args.lookupMode && !args.compare)
      ) {
        mod.showHelp();
        process.exit(0);
      }

      // Handle scraping mode
      if (args.scrape || args.categoryUrl) {
        const config = {
          ...mod.CONFIG,
          takeScreenshots: args.enableScreenshots,
          maxConsecutiveErrors: args.maxErrors,
        };

        await mod.scrape(args.categoryUrl, config);
        process.exit(0);
      }

      // Handle lookup mode
      if (args.lookupMode) {
        // Lookup functionality would be implemented here
        // This will be handled by the existing code in index.ts
        process.exit(0);
      }

      // Handle compare mode
      if (args.compare) {
        // Compare functionality would be implemented here
        // This will be handled by the existing code in index.ts
        process.exit(0);
      }
    } catch (error) {
      console.error('Fatal error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  })();
}
