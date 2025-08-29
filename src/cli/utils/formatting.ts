/**
 * CLI Formatting Utilities for ISBN-BISAC Tools
 *
 * This module provides utilities for formatting CLI output in a consistent
 * and visually appealing way.
 */

import chalk from 'chalk';

/**
 * Format section headers consistently
 * @param text Header text
 * @returns Formatted header string
 */
export function formatHeader(text: string): string {
  return chalk.bold.cyan(`\n${text}\n${'-'.repeat(text.length)}`);
}

/**
 * Format a table row with consistent column widths
 * @param columns Column data
 * @param widths Column widths
 * @returns Formatted row string
 */
export function formatTableRow(columns: string[], widths: number[]): string {
  return columns.map((col, i) => col.padEnd(widths[i] || 20)).join('  ');
}

/**
 * Format a table header row
 * @param columns Header column names
 * @param widths Column widths
 * @returns Formatted header row string
 */
export function formatTableHeader(columns: string[], widths: number[]): string {
  const headerRow = formatTableRow(columns, widths);
  const separator = formatTableRow(
    columns.map((_, i) => '-'.repeat(widths[i] || 20)),
    widths
  );
  return chalk.bold(headerRow) + '\n' + separator;
}

/**
 * Format a result count
 * @param count Result count
 * @param noun Noun to use (singular form)
 * @returns Formatted count string
 */
export function formatResultCount(count: number, noun: string): string {
  const pluralizedNoun = count === 1 ? noun : `${noun}s`;
  return chalk.italic(`Found ${chalk.bold(count)} ${pluralizedNoun}`);
}

/**
 * Format a key-value pair for display
 * @param key Key name
 * @param value Value
 * @returns Formatted key-value string
 */
export function formatKeyValue(key: string, value: string | number | boolean): string {
  return `${chalk.bold(key.padEnd(20))}: ${value}`;
}

/**
 * Format a success message
 * @param message Success message
 * @returns Formatted success message
 */
export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format an error message
 * @param message Error message
 * @returns Formatted error message
 */
export function formatError(message: string): string {
  return chalk.red(`✖ ${message}`);
}

/**
 * Format a warning message
 * @param message Warning message
 * @returns Formatted warning message
 */
export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format an info message
 * @param message Info message
 * @returns Formatted info message
 */
export function formatInfo(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Create a boxed message with a border
 * @param message Message to display in box
 * @param style Optional chalk style for the border
 * @returns Boxed message string
 */
export function formatBox(message: string, style = chalk.cyan): string {
  const lines = message.split('\n');
  const width = Math.max(...lines.map(line => line.length));

  const top = style(`┌${'─'.repeat(width + 2)}┐`);
  const bottom = style(`└${'─'.repeat(width + 2)}┘`);

  const boxedLines = lines.map(
    line => style('│ ') + line + ' '.repeat(width - line.length) + style(' │')
  );

  return [top, ...boxedLines, bottom].join('\n');
}

export default {
  formatHeader,
  formatTableRow,
  formatTableHeader,
  formatResultCount,
  formatKeyValue,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatBox,
};
