/**
 * Export module for ISBN-BISAC Tools
 *
 * This module provides functionality to export BISAC data in various formats:
 * - CSV: Comma-separated values
 * - Excel: XLSX spreadsheet
 * - XML: Structured XML format
 */

import { writeFile } from 'fs/promises';
import { parse as json2csv } from 'json2csv';
import * as XLSX from 'xlsx';
import { create as createXML } from 'xmlbuilder2';
import path from 'path';
import { Category } from '../types/index.js';

/**
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'excel' | 'xml';

/**
 * Configuration options for data export
 */
export interface ExportOptions {
  /** Output format for the export */
  format: ExportFormat;
  /** Optional output file path */
  filepath?: string;
  /** Fields to include in the export (defaults to all) */
  includeFields?: string[];
  /** Custom field mappings */
  customMapping?: Record<string, string>;
  /** Format-specific options */
  formatOptions?: {
    /** CSV options */
    csv?: {
      delimiter?: string;
      quote?: string;
      escape?: string;
    };
    /** Excel options */
    excel?: {
      sheetName?: string;
      dateFormat?: string;
    };
    /** XML options */
    xml?: {
      rootElement?: string;
      itemElement?: string;
      pretty?: boolean;
    };
  };
}

/**
 * Result of the export operation
 */
export interface ExportResult {
  /** Whether the export was successful */
  success: boolean;
  /** Path to the exported file if saved */
  filepath?: string;
  /** Export format used */
  format: ExportFormat;
  /** Number of records exported */
  recordCount: number;
  /** Error information if export failed */
  error?: {
    message: string;
    details?: unknown;
  };
}

/**
 * Exports BISAC data to CSV format
 */
async function exportToCSV(data: Category[], options: ExportOptions): Promise<string> {
  const fields = options.includeFields || ['code', 'heading', 'label'];
  // Transform field names if custom mapping is provided
  const fieldMapping = options.customMapping || {};
  const csvFields = fields.map(field => ({
    label: fieldMapping[field] || field,
    value: field,
  }));

  const csvOptions = {
    fields: csvFields,
    delimiter: options.formatOptions?.csv?.delimiter || ',',
    quote: options.formatOptions?.csv?.quote || '"',
    escape: options.formatOptions?.csv?.escape || '"',
    header: true,
    includeEmptyRows: false,
  };

  // Flatten categories for CSV export
  // Create flattened data with all available fields
  const flatData = data.flatMap(category =>
    category.subjects.map(subject => {
      const baseData = {
        code: subject.code,
        heading: category.heading,
        label: subject.label,
      };

      // Filter fields if specific fields are requested
      if (options.includeFields) {
        return Object.fromEntries(
          Object.entries(baseData).filter(([key]) => options.includeFields?.includes(key))
        );
      }
      return baseData;
    })
  );

  return json2csv(flatData, csvOptions);
}

/**
 * Exports BISAC data to Excel format
 */
async function exportToExcel(data: Category[], options: ExportOptions): Promise<Buffer> {
  const flatData = data.flatMap(category =>
    category.subjects.map(subject => ({
      code: subject.code,
      heading: category.heading,
      label: subject.label,
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(flatData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    options.formatOptions?.excel?.sheetName || 'BISAC Codes'
  );

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Exports BISAC data to XML format
 */
async function exportToXML(data: Category[], options: ExportOptions): Promise<string> {
  const xmlOptions = options.formatOptions?.xml;
  const root = createXML({ version: '1.0', encoding: 'UTF-8' }).ele(
    xmlOptions?.rootElement || 'bisac'
  );

  data.forEach(category => {
    const categoryElement = root.ele('category');
    categoryElement.ele('heading').txt(category.heading);

    category.subjects.forEach(subject => {
      const subjectElement = categoryElement.ele(xmlOptions?.itemElement || 'subject');
      subjectElement.ele('code').txt(subject.code);
      subjectElement.ele('label').txt(subject.label);
    });
  });

  return root.end({ prettyPrint: xmlOptions?.pretty !== false });
}

/**
 * Main export function for BISAC data
 *
 * @param data - Array of BISAC categories to export
 * @param options - Export configuration options
 * @returns Promise resolving to export result
 */
export async function exportBISACData(
  data: Category[],
  options: ExportOptions
): Promise<ExportResult> {
  try {
    let content: string | Buffer;

    console.log(`📊 Exporting ${data.length} categories to ${options.format} format`);

    // Generate export content based on format
    switch (options.format) {
      case 'csv':
        content = await exportToCSV(data, options);
        break;
      case 'excel':
        content = await exportToExcel(data, options);
        break;
      case 'xml':
        content = await exportToXML(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Save to file if filepath provided
    if (options.filepath) {
      console.log(`💾 Saving file to: ${options.filepath}`);
      const resolvedPath =
        options.filepath.startsWith('./') || options.filepath.startsWith('../')
          ? path.resolve(process.cwd(), options.filepath)
          : options.filepath;
      console.log(`💾 Absolute path: ${resolvedPath}`);
      await writeFile(options.filepath, content);
      console.log(`✅ File saved successfully`);
    }

    // Calculate total records
    const recordCount = data.reduce((total, category) => total + category.subjects.length, 0);

    return {
      success: true,
      filepath: options.filepath,
      format: options.format,
      recordCount,
    };
  } catch (error) {
    return {
      success: false,
      format: options.format,
      recordCount: 0,
      error: {
        message: error instanceof Error ? error.message : String(error),
        details: error,
      },
    };
  }
}
