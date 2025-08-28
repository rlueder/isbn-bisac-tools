/**
 * Progress Indicator Module for ISBN-BISAC Tools
 *
 * This module provides utilities for displaying progress indicators
 * during long-running operations like scraping.
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { ScraperProgress } from '../types/index.js';

/**
 * Global spinner instance for progress display
 */
let spinner: Ora | null = null;

/**
 * Updates the progress spinner with current status
 * @param current Current index being processed
 * @param total Total number of items to process
 * @param url Current URL being processed
 * @param status Optional status message to display
 */
export function updateProgressSpinner(
  current: number,
  total: number,
  url: string,
  status?: string
): void {
  const percentage = Math.floor((current / total) * 100);
  let message = `${chalk.cyan(current)}/${chalk.cyan(total)} (${chalk.green(percentage)}%) | URL: ${chalk.yellow(url)}`;

  if (status) {
    message = `${status} | ${message}`;
  }

  if (!spinner) {
    spinner = ora({
      text: message,
      spinner: 'dots',
    }).start();
  } else {
    spinner.text = message;
  }
}

/**
 * Updates progress with a structured progress object
 * @param progress Progress information object
 */
export function updateProgress(progress: ScraperProgress): void {
  updateProgressSpinner(progress.current, progress.total, progress.url, progress.status);
}

/**
 * Creates a simple text-based progress bar
 * @param current Current position
 * @param total Total items
 * @param barLength Length of the progress bar
 * @returns Formatted progress bar string
 */
export function createProgressBar(current: number, total: number, barLength = 30): string {
  const percentage = Math.floor((current / total) * 100);
  const filledLength = Math.floor((current / total) * barLength);

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(barLength - filledLength);

  return `${filled}${empty} ${percentage}% (${current}/${total})`;
}

/**
 * Stops the spinner with success status
 * @param message Success message
 */
export function stopSpinnerWithSuccess(message: string): void {
  if (spinner) {
    spinner.succeed(message);
    spinner = null;
  }
}

/**
 * Stops the spinner with failure status
 * @param message Error message
 */
export function stopSpinnerWithError(message: string): void {
  if (spinner) {
    spinner.fail(message);
    spinner = null;
  }
}

/**
 * Stops the spinner with info status
 * @param message Info message
 */
export function stopSpinnerWithInfo(message: string): void {
  if (spinner) {
    spinner.info(message);
    spinner = null;
  }
}

/**
 * Pauses the spinner temporarily
 * @returns Function to resume the spinner
 */
export function pauseSpinner(): () => void {
  if (spinner) {
    const text = spinner.text;
    spinner.stop();

    return () => {
      if (!spinner) {
        spinner = ora(text).start();
      } else {
        spinner.start();
      }
    };
  }

  return () => {}; // Empty function if no spinner exists
}

/**
 * Clears the spinner
 */
export function clearSpinner(): void {
  if (spinner) {
    spinner.clear();
  }
}

export default {
  updateProgressSpinner,
  updateProgress,
  createProgressBar,
  stopSpinnerWithSuccess,
  stopSpinnerWithError,
  stopSpinnerWithInfo,
  pauseSpinner,
  clearSpinner,
};
