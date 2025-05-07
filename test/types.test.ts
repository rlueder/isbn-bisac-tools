import { describe, it, expect } from 'vitest';
import { ScraperConfig, Subject, Category, BisacData } from '../src/types/index.js';

describe('BISAC Types', () => {
  describe('ScraperConfig', () => {
    it('should validate correct ScraperConfig object', () => {
      const validConfig: ScraperConfig = {
        startUrl: 'https://www.bisg.org/complete-bisac-subject-headings-list',
        outputDir: './data',
        jsonPath: './data/bisac-subjects.json',
        screenshotsDir: './screenshots',
        mainPage: {
          categoryLinks: '.field-items li a',
        },
        categoryPage: {
          heading: 'h4',
          potentialNotes: 'p',
          subjects: 'table tr',
          excludePatterns: ['Moved to', 'Discontinued'],
        },
        minDelay: 500,
        maxDelay: 2000,
        maxCategories: null,
        takeScreenshots: true,
        browserOptions: {
          headless: true,
          defaultViewport: { width: 1200, height: 800 },
        },
      };

      // TypeScript compilation is the main test here
      // If the object structure doesn't match the interface, the test would fail during compilation
      expect(validConfig).toBeDefined();
      expect(validConfig.startUrl).toBe(
        'https://www.bisg.org/complete-bisac-subject-headings-list'
      );
      expect(validConfig.mainPage.categoryLinks).toBe('.field-items li a');
      expect(validConfig.categoryPage.heading).toBe('h4');
      expect(validConfig.minDelay).toBe(500);
      expect(validConfig.maxDelay).toBe(2000);
    });

    it('should handle optional properties in ScraperConfig', () => {
      const minimalConfig: ScraperConfig = {
        startUrl: 'https://example.com',
        outputDir: './data',
        jsonPath: './data/data.json',
        screenshotsDir: './screenshots',
        mainPage: {
          categoryLinks: '.links',
        },
        categoryPage: {
          heading: 'h1',
          // No potentialNotes, subjects, or excludePatterns
        },
        minDelay: 100,
        maxDelay: 300,
        maxCategories: 5,
        takeScreenshots: false,
        browserOptions: {
          headless: true,
        },
      };

      expect(minimalConfig).toBeDefined();
      expect(minimalConfig.categoryPage.potentialNotes).toBeUndefined();
      expect(minimalConfig.categoryPage.subjects).toBeUndefined();
      expect(minimalConfig.categoryPage.excludePatterns).toBeUndefined();
    });
  });

  describe('Subject', () => {
    it('should validate correct Subject object', () => {
      const validSubject: Subject = {
        code: 'FIC000000',
        label: 'FICTION / General',
      };

      expect(validSubject).toBeDefined();
      expect(validSubject.code).toBe('FIC000000');
      expect(validSubject.label).toBe('FICTION / General');
    });
  });

  describe('Category', () => {
    it('should validate correct Category object', () => {
      const validCategory: Category = {
        heading: 'FICTION',
        notes: ['This category includes fictional works'],
        subjects: [
          { code: 'FIC000000', label: 'FICTION / General' },
          { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
        ],
      };

      expect(validCategory).toBeDefined();
      expect(validCategory.heading).toBe('FICTION');
      expect(validCategory.notes).toHaveLength(1);
      expect(validCategory.subjects).toHaveLength(2);
      expect(validCategory.subjects[0].code).toBe('FIC000000');
    });

    it('should validate a Category with empty notes or subjects', () => {
      const emptyCategory: Category = {
        heading: 'EMPTY',
        notes: [],
        subjects: [],
      };

      expect(emptyCategory).toBeDefined();
      expect(emptyCategory.notes).toHaveLength(0);
      expect(emptyCategory.subjects).toHaveLength(0);
    });
  });

  describe('Type relationships', () => {
    it('should correctly build a structured BISAC hierarchy', () => {
      const categories: Category[] = [
        {
          heading: 'FICTION',
          notes: ['Fiction category note'],
          subjects: [
            { code: 'FIC000000', label: 'FICTION / General' },
            { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
          ],
        },
        {
          heading: 'BUSINESS & ECONOMICS',
          notes: ['Business category note', 'Another note'],
          subjects: [
            { code: 'BUS000000', label: 'BUSINESS & ECONOMICS / General' },
            { code: 'BUS005000', label: 'BUSINESS & ECONOMICS / Accounting' },
          ],
        },
      ];

      expect(categories).toHaveLength(2);
      expect(categories[0].heading).toBe('FICTION');
      expect(categories[0].subjects[1].code).toBe('FIC001000');
      expect(categories[1].notes).toHaveLength(2);
      expect(categories[1].subjects[1].label).toBe('BUSINESS & ECONOMICS / Accounting');
    });
  });

  describe('BisacData', () => {
    it('should validate correct BisacData object', () => {
      const validBisacData: BisacData = {
        timestamp: 1684948800000, // Example timestamp (May 24, 2023)
        date: '2023-05-24',
        categories: [
          {
            heading: 'FICTION',
            notes: ['Fiction category note'],
            subjects: [
              { code: 'FIC000000', label: 'FICTION / General' },
              { code: 'FIC001000', label: 'FICTION / Action & Adventure' },
            ],
          },
        ],
      };

      expect(validBisacData).toBeDefined();
      expect(validBisacData.timestamp).toBe(1684948800000);
      expect(validBisacData.date).toBe('2023-05-24');
      expect(validBisacData.categories).toHaveLength(1);
      expect(validBisacData.categories[0].heading).toBe('FICTION');
      expect(validBisacData.categories[0].subjects).toHaveLength(2);
    });

    it('should validate BisacData with empty categories array', () => {
      const emptyBisacData: BisacData = {
        timestamp: 1684948800000,
        date: '2023-05-24',
        categories: [],
      };

      expect(emptyBisacData).toBeDefined();
      expect(emptyBisacData.timestamp).toBe(1684948800000);
      expect(emptyBisacData.date).toBe('2023-05-24');
      expect(emptyBisacData.categories).toHaveLength(0);
    });
  });
});
