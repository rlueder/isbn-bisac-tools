#!/usr/bin/env node

/* eslint-disable no-undef */

/**
 * Test script for debugging the export functionality
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exportBISACData } from '../dist/src/export/index.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('📂 Current directory:', process.cwd());

    // Try to load BISAC data
    const dataPath = path.join(__dirname, '..', 'data', 'bisac-data.json');
    console.log('📂 Looking for BISAC data at:', dataPath);

    if (!fs.existsSync(dataPath)) {
      console.error('❌ BISAC data file not found!');
      process.exit(1);
    }

    console.log('✅ Found BISAC data file');

    // Load the data
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Get the categories
    const categories = jsonData.categories || jsonData;

    if (!Array.isArray(categories) || categories.length === 0) {
      console.error('❌ Invalid or empty BISAC data');
      process.exit(1);
    }

    console.log(`📊 Loaded ${categories.length} categories`);

    // Define export options
    const testFile = path.join(__dirname, '..', 'test-output.xlsx');
    console.log('💾 Will export to:', testFile);

    const exportOptions = {
      format: 'excel',
      filepath: testFile,
    };

    // Perform export
    console.log('🚀 Exporting data...');
    const result = await exportBISACData(categories, exportOptions);

    // Check result
    if (result.success) {
      console.log('✅ Export successful!');
      console.log(`📁 File saved to: ${result.filepath}`);
      console.log(`📊 Records exported: ${result.recordCount}`);
    } else {
      console.error('❌ Export failed:', result.error?.message);
      console.error('Details:', result.error?.details);
    }

    // Verify file exists
    if (fs.existsSync(testFile)) {
      console.log('✅ Output file verified on disk');
      console.log('📊 File size:', fs.statSync(testFile).size, 'bytes');
    } else {
      console.error('❌ Output file not found on disk!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
