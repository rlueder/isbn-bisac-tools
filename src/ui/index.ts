/**
 * UI module for ISBN-BISAC Tools
 *
 * This module provides user interface components for the application,
 * including progress indicators, interactive prompts, and formatted output.
 */

import ora, { Ora, Options } from 'ora';
import chalk from 'chalk';
import * as progress from './progress.js';

/**
 * Global spinner instance for progress display
 */
let spinner: Ora | null = null;

/**
 * Creates a new spinner or updates the existing one
 * @param text Message to display with the spinner
 * @param options Additional spinner options
 * @returns Ora spinner instance
 */
export function createSpinner(text: string, options?: Options): Ora {
  if (!spinner) {
    spinner = ora({
      text,
      spinner: 'dots',
      ...options,
    }).start();
  } else {
    spinner.text = text;
  }
  return spinner;
}

/**
 * Updates the progress spinner with current status
 * @param current Current index being processed
 * @param total Total number of items to process
 * @param context Additional context (e.g. URL being processed)
 * @param status Optional status message to display
 */
export function updateProgress(
  current: number,
  total: number,
  context: string,
  status?: string
): void {
  const percentage = Math.floor((current / total) * 100);
  let message = `${chalk.cyan(current)}/${chalk.cyan(total)} (${chalk.green(percentage)}%) | ${context}`;

  if (status) {
    message = `${status} | ${message}`;
  }

  createSpinner(message);
}

/**
 * Stops the spinner with a success message
 * @param text Success message to display
 */
export function succeedSpinner(text: string): void {
  if (spinner) {
    spinner.succeed(text);
    spinner = null;
  }
}

/**
 * Stops the spinner with a failure message
 * @param text Failure message to display
 */
export function failSpinner(text: string): void {
  if (spinner) {
    spinner.fail(text);
    spinner = null;
  }
}

/**
 * Creates a formatted message for terminal output
 * @param message The message to format
 * @param type The type of message (info, success, warning, error)
 * @returns Formatted message string
 */
export function formatMessage(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): string {
  const prefixes = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    warning: chalk.yellow('⚠'),
    error: chalk.red('✖'),
  };

  const colors = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
  };

  return `${prefixes[type]} ${colors[type](message)}`;
}

/**
 * Logs a formatted message to the console
 * @param message The message to log
 * @param type The type of message (info, success, warning, error)
 */
export function log(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): void {
  console.log(formatMessage(message, type));
}

// Re-export all from progress module
export * from './progress.js';

// Default export for direct import
export default {
  createSpinner,
  succeedSpinner,
  failSpinner,
  formatMessage,
  log,
  // Include progress module exports which already contains updateProgress
  ...progress.default,
};
