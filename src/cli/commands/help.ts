/**
 * Help Command for the ISBN-BISAC Tools CLI
 *
 * This command provides detailed help information about all available commands
 * and their usage.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as ui from '../../ui/index.js';

/**
 * Register the help command with the CLI
 * @param program Commander program instance
 * @returns Command instance for chaining
 */
export function registerHelpCommand(program: Command): Command {
  return program
    .command('help')
    .description('Display detailed help information')
    .option('-c, --command <name>', 'Get help for a specific command')
    .action(options => executeHelpCommand(options, program));
}

/**
 * Execute the help command with provided options
 * @param options Command options
 * @param program Commander program instance
 */
export function executeHelpCommand(options: { command?: string }, program: Command): void {
  if (options.command) {
    // Display help for a specific command
    const command = program.commands.find(cmd => cmd.name() === options.command);

    if (command) {
      displayCommandHelp(command);
    } else {
      ui.log(`Command "${options.command}" not found`, 'error');
      displayAvailableCommands(program);
    }
  } else {
    // Display general help
    displayGeneralHelp(program);
  }
}

/**
 * Display detailed help for a specific command
 * @param command Command to display help for
 */
function displayCommandHelp(command: Command): void {
  console.log('');
  console.log(chalk.bold(`${command.name()}: ${command.description()}`));
  console.log('');

  console.log(chalk.bold('Usage:'));
  console.log(`  isbn-bisac-tools ${command.name()} [options]`);
  console.log('');

  if (command.options.length > 0) {
    console.log(chalk.bold('Options:'));
    command.options.forEach(option => {
      const flags = chalk.yellow(option.flags);
      const desc = option.description;
      console.log(`  ${flags.padEnd(30)} ${desc}`);
    });
    console.log('');
  }

  // Display examples if available
  const examples = getCommandExamples(command.name());
  if (examples.length > 0) {
    console.log(chalk.bold('Examples:'));
    examples.forEach(example => {
      console.log(`  ${chalk.cyan(example.command)}`);
      console.log(`    ${example.description}`);
      console.log('');
    });
  }
}

/**
 * Display general help information
 * @param program Commander program instance
 */
function displayGeneralHelp(program: Command): void {
  console.log('');
  console.log(
    chalk.bold('ISBN-BISAC Tools') +
      ' - A toolkit for working with BISAC subject headings and ISBN lookups'
  );
  console.log('');

  console.log(chalk.bold('Usage:'));
  console.log('  isbn-bisac-tools [command] [options]');
  console.log('');

  displayAvailableCommands(program);

  console.log(chalk.bold('General Options:'));
  console.log('  -v, --version            Display the current version');
  console.log('  -h, --help               Display help for command');
  console.log('');

  console.log(chalk.bold('For more details on a specific command:'));
  console.log('  isbn-bisac-tools help --command <command-name>');
  console.log('');
}

/**
 * Display available commands
 * @param program Commander program instance
 */
function displayAvailableCommands(program: Command): void {
  console.log(chalk.bold('Available Commands:'));
  program.commands.forEach(command => {
    console.log(`  ${chalk.cyan(command.name().padEnd(15))} ${command.description()}`);
  });
  console.log('');
}

/**
 * Get examples for a specific command
 * @param commandName Name of the command
 * @returns Array of examples
 */
function getCommandExamples(commandName: string): Array<{ command: string; description: string }> {
  const examples: Record<string, Array<{ command: string; description: string }>> = {
    scrape: [
      {
        command: 'isbn-bisac-tools scrape',
        description: 'Scrape all BISAC subject headings from the BISG website',
      },
      {
        command: 'isbn-bisac-tools scrape --url https://www.bisg.org/fiction',
        description: 'Scrape only the Fiction category',
      },
      {
        command: 'isbn-bisac-tools scrape --no-headless --screenshots',
        description: 'Scrape with the browser visible and take screenshots',
      },
    ],
    browse: [
      {
        command: 'isbn-bisac-tools browse',
        description: 'Interactively browse BISAC data files',
      },
    ],
    lookup: [
      {
        command: 'isbn-bisac-tools lookup --code FIC000000',
        description: 'Look up a specific BISAC code',
      },
      {
        command: 'isbn-bisac-tools lookup --isbn 9781234567890',
        description: 'Look up BISAC categories for an ISBN',
      },
    ],
    compare: [
      {
        command: 'isbn-bisac-tools compare',
        description: 'Compare two BISAC JSON files to identify changes',
      },
    ],
  };

  return examples[commandName] || [];
}

export default {
  registerHelpCommand,
  executeHelpCommand,
};
