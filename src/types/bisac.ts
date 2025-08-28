/**
 * Type definitions for BISAC-related data structures
 */

/**
 * Subject data structure
 */
export interface Subject {
  /** The subject code (e.g., ANT000000) */
  code: string;
  /** The subject label */
  label: string;
}

/**
 * Category data structure
 */
export interface Category {
  /** The category heading */
  heading: string;
  /** Notes about the category */
  notes: string[];
  /** Subjects within the category */
  subjects: Subject[];
}

/**
 * BISAC data structure with metadata
 */
export interface BisacData {
  /** Timestamp when the data was generated (milliseconds since epoch) */
  timestamp: number;
  /** Human readable date when the data was generated (YYYY-MM-DD) */
  date: string;
  /** List of categories with subjects */
  categories: Category[];
}

/**
 * Result of comparing two BISAC data files
 */
export interface BisacComparisonResult {
  /** First file information */
  file1: {
    /** Path to the file */
    path: string;
    /** Date when the data was generated */
    date: string;
    /** Number of categories in the file */
    categoryCount: number;
    /** Number of subjects in the file */
    subjectCount: number;
  };
  /** Second file information */
  file2: {
    /** Path to the file */
    path: string;
    /** Date when the data was generated */
    date: string;
    /** Number of categories in the file */
    categoryCount: number;
    /** Number of subjects in the file */
    subjectCount: number;
  };
  /** Changes between the files */
  changes: {
    /** Added categories */
    addedCategories: Category[];
    /** Removed categories */
    removedCategories: Category[];
    /** Added subjects */
    addedSubjects: {
      /** The category containing the subject */
      category: string;
      /** The added subject */
      subject: Subject;
    }[];
    /** Removed subjects */
    removedSubjects: {
      /** The category containing the subject */
      category: string;
      /** The removed subject */
      subject: Subject;
    }[];
  };
}
