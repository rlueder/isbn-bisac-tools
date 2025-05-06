#!/usr/bin/env node

/**
 * Helper script for publishing isbn-bisac-tools to npm.
 * Usage: node scripts/publish.js <version>
 * Where <version> is one of: patch, minor, major, or a specific version
 */

/* global process, console */

import { execSync } from 'child_process';
import * as readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Get command line arguments
const args = process.argv.slice(2);
const versionType = args[0] || 'patch';

// Validate version type
const validVersionTypes = ['patch', 'minor', 'major'];
if (!validVersionTypes.includes(versionType) && !versionType.match(/^\d+\.\d+\.\d+$/)) {
  console.error(
    `Error: Version must be one of ${validVersionTypes.join(', ')} or a valid semver version (e.g. 1.2.3)`
  );
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility to run a command and return its output
function runCommand(command, options = {}) {
  try {
    // Set HUSKY=0 before running git commands to bypass hooks
    if (command.startsWith('git ')) {
      process.env.HUSKY = '0';
    }
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.stdio || 'pipe',
      cwd: ROOT_DIR,
      env: { ...process.env },
    });
  } catch (error) {
    if (options.ignoreError) {
      return '';
    }
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

// Check for uncommitted changes
function checkGitStatus() {
  const status = runCommand('git status --porcelain');
  if (status.trim() !== '') {
    console.error(
      'Error: You have uncommitted changes. Please commit or stash them before publishing.'
    );
    console.error(status);
    process.exit(1);
  }
}

// Update version in package.json
function updateVersion() {
  let newVersion;
  if (versionType.match(/^\d+\.\d+\.\d+$/)) {
    newVersion = versionType;
    runCommand(`npm version ${newVersion} --no-git-tag-version`);
  } else {
    const output = runCommand(`npm version ${versionType} --no-git-tag-version`);
    newVersion = output.trim().replace('v', '');
  }

  // Run the version script that's defined in package.json to update CHANGELOG
  runCommand(`npm run version`);

  return newVersion;
}

// Update CHANGELOG.md
function updateChangelog() {
  console.log('Generating CHANGELOG...');

  // Use conventional-changelog to update the changelog
  runCommand('npm run changelog', {
    stdio: 'inherit',
  });

  console.log('CHANGELOG generated');

  return true;
}

// Run tests and linting
function runChecks() {
  console.log('Running linting...');
  runCommand('npm run lint', { stdio: 'inherit' });

  console.log('Running tests...');
  runCommand('npm test', { stdio: 'inherit' });

  console.log('Building package...');
  runCommand('npm run build', { stdio: 'inherit' });
}

// Commit changes, tag and push
function commitAndTag(version) {
  runCommand(`git add package.json package-lock.json CHANGELOG.md`);
  runCommand(`git commit -m "chore(release): ${version} [skip ci]"`);
  runCommand(`git tag -a v${version} -m "Release v${version}"`);
}

// Check if a version exists on npm
function versionExists(version) {
  try {
    const response = runCommand(`npm view isbn-bisac-tools@${version} version`, {
      ignoreError: true,
    });
    return response.trim() === version;
  } catch (error) {
    return false;
  }
}

// Publish to npm
function publishToNpm(version) {
  if (versionExists(version)) {
    console.error(
      `\n❌ Error: Version ${version} already exists on npm. Please bump to a new version first.`
    );

    // Ask user if they want to automatically bump to the next patch version
    rl.question(`\nDo you want to automatically bump to the next patch version? (y/n) `, answer => {
      if (answer.toLowerCase() === 'y') {
        console.log(`Bumping to next patch version...`);
        const newVersion = runCommand(`npm version patch --no-git-tag-version`)
          .trim()
          .replace('v', '');
        console.log(`New version: ${newVersion}`);

        // Ask for confirmation before publishing new version
        rl.question(`\nReady to publish version ${newVersion} to npm. Continue? (y/n) `, answer => {
          if (answer.toLowerCase() === 'y') {
            runCommand('npm publish', { stdio: 'inherit' });
            // Update git after successful publish
            commitAndTag(newVersion);
            pushChanges();
            console.log(`\n✅ Successfully published version ${newVersion}!`);
          } else {
            console.log('Publishing cancelled');
          }
          rl.close();
        });
      } else {
        console.log('Publishing cancelled');
        rl.close();
        process.exit(1);
      }
    });
  } else {
    runCommand('npm publish', { stdio: 'inherit' });
  }
}

// Push changes to remote
function pushChanges() {
  runCommand('git push', { stdio: 'inherit' });
  runCommand('git push --tags', { stdio: 'inherit' });
}

// Main function
async function main() {
  try {
    // Temporarily disable Husky for this script
    process.env.HUSKY = '0';
    console.log('Husky hooks temporarily disabled for publishing');

    // Check git status
    checkGitStatus();

    // Run checks
    runChecks();

    // Update version
    const newVersion = updateVersion();
    console.log(`\nPreparing version ${newVersion}...`);

    // Update changelog
    updateChangelog();
    console.log('Updated CHANGELOG.md');

    // Confirm publishing
    rl.question(`\nReady to publish version ${newVersion} to npm. Continue? (y/n) `, answer => {
      if (answer.toLowerCase() !== 'y') {
        console.log('Publishing cancelled');
        rl.close();
        process.exit(0);
      }

      // Commit and tag first
      commitAndTag(newVersion);
      console.log(`Committed and tagged v${newVersion}`);

      // Publish to npm with version check
      publishToNpm(newVersion);

      // If publishToNpm doesn't exit the process, it means publishing was successful
      pushChanges();
      console.log(`Pushed changes to remote repository`);

      console.log(`\n✅ Successfully published version ${newVersion}!`);
      rl.close();
    });
  } catch (error) {
    console.error('An error occurred during publishing:', error);
    rl.close();
    process.exit(1);
  }
}

main();
