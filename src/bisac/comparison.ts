/**
 * BISAC Comparison Module for ISBN-BISAC Tools
 *
 * This module provides functionality for comparing different versions of BISAC data,
 * identifying additions, removals, and modifications between versions.
 */

import path from 'path';
import { promises as fs } from 'fs';
import inquirer from 'inquirer';
import { BisacComparisonResult, Category, Subject } from '../types/index.js';
import { loadBisacData } from './index.js';
import * as ui from '../ui/index.js';

/**
 * Compare two BISAC data files
 * @param file1Path Path to the first BISAC data file (older)
 * @param file2Path Path to the second BISAC data file (newer)
 * @returns Comparison result
 */
export async function compareBisacJsonFiles(
  file1Path: string,
  file2Path: string
): Promise<BisacComparisonResult> {
  try {
    // Load both data files
    const data1 = await loadBisacData(file1Path);
    const data2 = await loadBisacData(file2Path);

    // Validate data
    if (!data1 || !data2 || !data1.categories || !data2.categories) {
      throw new Error('One or both of the JSON files could not be loaded or are empty');
    }

    // Initialize result object
    const result: BisacComparisonResult = {
      file1: {
        path: file1Path,
        date: data1.date,
        categoryCount: data1.categories.length,
        subjectCount: data1.categories.reduce((acc, cat) => acc + cat.subjects.length, 0),
      },
      file2: {
        path: file2Path,
        date: data2.date,
        categoryCount: data2.categories.length,
        subjectCount: data2.categories.reduce((acc, cat) => acc + cat.subjects.length, 0),
      },
      changes: {
        addedCategories: [],
        removedCategories: [],
        addedSubjects: [],
        removedSubjects: [],
      },
    };

    // Create maps for faster lookups
    const categoriesMap1 = new Map<string, Category>();
    const categoriesMap2 = new Map<string, Category>();
    const subjectsMap1 = new Map<string, { category: string; subject: Subject }>();
    const subjectsMap2 = new Map<string, { category: string; subject: Subject }>();

    // Build maps for first file
    for (const category of data1.categories) {
      categoriesMap1.set(category.heading, category);
      for (const subject of category.subjects) {
        subjectsMap1.set(subject.code, { category: category.heading, subject });
      }
    }

    // Build maps for second file
    for (const category of data2.categories) {
      categoriesMap2.set(category.heading, category);
      for (const subject of category.subjects) {
        subjectsMap2.set(subject.code, { category: category.heading, subject });
      }
    }

    // Find added and removed categories
    for (const [heading, category] of categoriesMap2.entries()) {
      if (!categoriesMap1.has(heading)) {
        result.changes.addedCategories.push(category);
      }
    }

    for (const [heading, category] of categoriesMap1.entries()) {
      if (!categoriesMap2.has(heading)) {
        result.changes.removedCategories.push(category);
      }
    }

    // Find added and removed subjects
    for (const [code, { category, subject }] of subjectsMap2.entries()) {
      if (!subjectsMap1.has(code)) {
        result.changes.addedSubjects.push({ category, subject });
      } else {
        // Check if the subject moved categories or changed label
        const oldSubjectEntry = subjectsMap1.get(code)!;
        if (
          oldSubjectEntry.category !== category ||
          oldSubjectEntry.subject.label !== subject.label
        ) {
          // Handle subject modifications by removing old and adding new
          result.changes.removedSubjects.push(oldSubjectEntry);
          result.changes.addedSubjects.push({ category, subject });
        }
      }
    }

    for (const [code, { category, subject }] of subjectsMap1.entries()) {
      if (!subjectsMap2.has(code)) {
        result.changes.removedSubjects.push({ category, subject });
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Error comparing BISAC JSON files: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Print a formatted comparison report
 * @param comparisonResult Comparison result
 */
export async function printComparisonReport(
  comparisonResult: BisacComparisonResult
): Promise<void> {
  const { file1, file2, changes } = comparisonResult;

  // Print header
  console.log('\n📊 BISAC Subject Headings Comparison Report 📊');
  console.log('==============================================\n');

  // Print file information
  console.log(`📆 Comparing data from ${file1.date} to ${file2.date}`);
  console.log(`Old file: ${path.basename(file1.path)}`);
  console.log(`New file: ${path.basename(file2.path)}`);
  console.log('');

  // Print summary
  console.log('📈 Summary:');
  console.log(
    `- Categories: ${file1.categoryCount} → ${file2.categoryCount} (${
      file2.categoryCount > file1.categoryCount
        ? '+' + (file2.categoryCount - file1.categoryCount)
        : file2.categoryCount < file1.categoryCount
          ? '-' + (file1.categoryCount - file2.categoryCount)
          : 'no change'
    })`
  );
  console.log(
    `- Subjects: ${file1.subjectCount} → ${file2.subjectCount} (${
      file2.subjectCount > file1.subjectCount
        ? '+' + (file2.subjectCount - file1.subjectCount)
        : file2.subjectCount < file1.subjectCount
          ? '-' + (file1.subjectCount - file2.subjectCount)
          : 'no change'
    })`
  );
  console.log(`- New categories: ${changes.addedCategories.length}`);
  console.log(`- Removed categories: ${changes.removedCategories.length}`);

  // Calculate modified categories (those with added or removed subjects)
  const modifiedCategories = new Set<string>();
  changes.addedSubjects.forEach(({ category }) => modifiedCategories.add(category));
  changes.removedSubjects.forEach(({ category }) => modifiedCategories.add(category));

  // Remove pure additions and removals
  changes.addedCategories.forEach(category => modifiedCategories.delete(category.heading));
  changes.removedCategories.forEach(category => modifiedCategories.delete(category.heading));

  console.log(`- Modified categories: ${modifiedCategories.size}`);
  console.log(`- New subjects: ${changes.addedSubjects.length}`);
  console.log(`- Removed subjects: ${changes.removedSubjects.length}`);

  // Calculate modified subjects (same code, different label)
  const modifiedSubjects = changes.addedSubjects.filter(({ subject: addedSubject }) =>
    changes.removedSubjects.some(
      ({ subject: removedSubject }) => addedSubject.code === removedSubject.code
    )
  );

  console.log(`- Modified subjects: ${modifiedSubjects.length}`);
  console.log('');

  // Print added categories
  if (changes.addedCategories.length > 0) {
    console.log('🆕 New Categories:');
    changes.addedCategories.forEach(category => {
      console.log(`- ${category.heading} (${category.subjects.length} subjects)`);
    });
    console.log('');
  }

  // Print removed categories
  if (changes.removedCategories.length > 0) {
    console.log('🗑️ Removed Categories:');
    changes.removedCategories.forEach(category => {
      console.log(`- ${category.heading} (${category.subjects.length} subjects)`);
    });
    console.log('');
  }

  // Print modified categories
  if (modifiedCategories.size > 0) {
    console.log('📝 Modified Categories:\n');

    for (const categoryHeading of modifiedCategories) {
      console.log(`📂 ${categoryHeading}:`);

      // Find added subjects in this category
      const addedSubjects = changes.addedSubjects.filter(
        ({ category, subject }) =>
          category === categoryHeading &&
          !changes.removedSubjects.some(
            ({ subject: removedSubject }) => subject.code === removedSubject.code
          )
      );

      if (addedSubjects.length > 0) {
        console.log('  ➕ New subjects:');
        addedSubjects.forEach(({ subject }) => {
          console.log(`    - ${subject.code}: ${subject.label}`);
        });
      }

      // Find removed subjects in this category
      const removedSubjects = changes.removedSubjects.filter(
        ({ category, subject }) =>
          category === categoryHeading &&
          !changes.addedSubjects.some(
            ({ subject: addedSubject }) => subject.code === addedSubject.code
          )
      );

      if (removedSubjects.length > 0) {
        console.log('  ➖ Removed subjects:');
        removedSubjects.forEach(({ subject }) => {
          console.log(`    - ${subject.code}: ${subject.label}`);
        });
      }

      // Find modified subjects in this category
      const modifiedSubjectsInCategory = modifiedSubjects.filter(
        ({ category }) => category === categoryHeading
      );

      if (modifiedSubjectsInCategory.length > 0) {
        console.log('  🔄 Modified subjects:');
        modifiedSubjectsInCategory.forEach(({ subject: newSubject }) => {
          const oldSubject = changes.removedSubjects.find(
            ({ subject }) => subject.code === newSubject.code
          )?.subject;

          if (oldSubject) {
            console.log(`    - ${newSubject.code}:`);
            console.log(`      FROM: ${oldSubject.label}`);
            console.log(`      TO:   ${newSubject.label}`);
          }
        });
      }
    }
  }

  console.log('\n✅ End of comparison report');
}

/**
 * Select two files for comparison
 * @param directory Directory to search for BISAC JSON files
 * @returns Array with paths to the two selected files
 */
export async function selectFilesForComparison(directory = 'data'): Promise<[string, string]> {
  try {
    // Ensure the directory exists
    try {
      await fs.access(directory);
    } catch (error) {
      throw new Error(`Directory not found: ${directory}`);
    }

    // Find all JSON files in the directory
    const files = await fs.readdir(directory);
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directory, file));

    if (jsonFiles.length < 2) {
      throw new Error(
        'Need at least two BISAC JSON files for comparison. Please create backups of your bisac-data.json file before updating.'
      );
    }

    // Get file stats for sorting by modification time
    const fileStats = await Promise.all(
      jsonFiles.map(async filePath => {
        const stats = await fs.stat(filePath);

        // Try to read the file to get date from content
        let displayDate = stats.mtime.toLocaleDateString();
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          if (data.date) {
            displayDate = data.date;
          }
        } catch {
          // Ignore errors and use file stats
        }

        return {
          path: filePath,
          mtime: stats.mtime,
          displayDate,
        };
      })
    );

    // Sort files by modification time (newest first)
    const sortedFiles = fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Format choices for display
    const fileChoices = sortedFiles.map(file => ({
      name: `${path.basename(file.path)} (${file.displayDate})`,
      value: file.path,
    }));

    // Prompt user to select the first file (newer)
    const { file1 } = await inquirer.prompt<{ file1: string }>([
      {
        type: 'list',
        name: 'file1',
        message: 'Select the NEWER file:',
        choices: fileChoices,
        pageSize: 15,
      },
    ]);

    // Remove the selected file from choices
    const remainingChoices = fileChoices.filter(choice => choice.value !== file1);

    // Prompt user to select the second file (older)
    const { file2 } = await inquirer.prompt<{ file2: string }>([
      {
        type: 'list',
        name: 'file2',
        message: 'Select the OLDER file:',
        choices: remainingChoices,
        pageSize: 15,
      },
    ]);

    return [file2, file1]; // Return [older, newer] for comparison
  } catch (error) {
    throw new Error(
      `Error selecting files for comparison: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a backup of BISAC data
 * @param filePath Path to the BISAC data file to back up
 * @returns Path to the created backup file
 */
export async function createBackupOfBisacData(
  filePath = path.join(process.cwd(), 'data', 'bisac-data.json')
): Promise<string> {
  try {
    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Load the data to get the date
    const data = await loadBisacData(filePath);

    // Use the date from the file or generate one
    const dateStr = data.date || new Date().toISOString().split('T')[0];

    // Create backup filename
    const dirPath = path.dirname(filePath);
    const backupPath = path.join(dirPath, `bisac-data-backup-${dateStr}.json`);

    // Copy the file
    await fs.copyFile(filePath, backupPath);

    ui.log(`✅ Created backup at: ${backupPath}`, 'success');
    return backupPath;
  } catch (error) {
    throw new Error(
      `Error creating backup: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export default {
  compareBisacJsonFiles,
  printComparisonReport,
  selectFilesForComparison,
  createBackupOfBisacData,
};
