# ISBN-BISAC Tools

## Overview

This TypeScript toolkit provides comprehensive tools for working with BISAC (Book Industry Standards and Communications) Subject Headings and ISBN lookups. It includes functionality to scrape BISAC data from the Book Industry Study Group (BISG) website, perform ISBN to BISAC code conversions using the Google Books API, and various utilities for searching, comparing, and managing BISAC codes.

## Features

- Scrapes all BISAC subject categories or a single specified category
- Extracts headings, notes, and subject codes with labels
- Saves data in structured JSON format with date-stamped filenames
- Provides lookup utilities to search by code, heading, label, or ISBN
- Translates ISBNs to BISAC codes using Google Books API and intelligently identifies the most relevant BISAC code
- Takes screenshots for debugging purposes
- Includes random delays to be respectful to the target website
- Checks for existing JSON files with today's date and confirms before overwriting
- Compares two JSON files to identify changes between different dates
- Written in TypeScript with full type definitions
- Includes unit tests with Vitest
- ESLint and Prettier integration for code quality

## Installation

### Using as a Package

```bash
# Install as a dependency in your project
npm install isbn-bisac-tools
```

Once installed, you can import and use the toolkit in your Node.js/TypeScript projects.

### For Development

```bash
# Clone the repository
git clone [your-repo-url]
cd isbn-bisac-tools

# Install dependencies
npm install

# Build the package
npm run build
```

### Global Installation

```bash
# Install globally to use CLI commands from anywhere
npm install -g isbn-bisac-tools
```

## Usage

### Running the Tools

#### As an Installed Package

If installed globally:

```bash
# Run the scraper to process all categories
isbn-bisac-tools

# Run specific commands
isbn-bisac-tools --isbn 9781234567890
isbn-bisac-tools --code ANT007000
```

If installed locally:

```bash
# Use npx to run the commands
npx isbn-bisac-tools --isbn 9781234567890
```

#### Using from Source (Development)

```bash
# Run the scraper to process all categories
tsx src/index.ts

# Run the scraper for a single category
tsx src/index.ts --url https://www.bisg.org/fiction

# Alternative ways to scrape a single category
tsx src/index.ts --url https://www.bisg.org/fiction
tsx src/index.ts --url https://www.bisg.org/art

# Lookup operations
tsx src/index.ts --code ANT007000         # Get full label for code ANT007000
tsx src/index.ts --heading "FICTION"      # Get all codes for the FICTION heading
tsx src/index.ts --heading "antiques and collectibles"  # Flexible matching (case, "&" vs "AND")
tsx src/index.ts --label "FICTION / War & Military"  # Get code for the given label
tsx src/index.ts --isbn 9781234567890     # Get BISAC code(s) for a book by ISBN

# Compare two JSON files to identify changes
tsx src/index.ts --compare                # Interactive selection of files to compare

# Show help information
tsx src/index.ts --help

# Interactively browse JSON results with fx
npm run browse:json                      # Select and open a JSON file using an interactive menu

# Or build and run the compiled version
npm run build
node dist/src/index.js
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Test BISAC code selection feature with sample ISBNs
npm run test:bisac
```

The `test:bisac` command runs a test script that demonstrates the BISAC code selection functionality with several sample books, showing how the system identifies the most relevant category for each.

### Code Quality Tools

```bash
# Check code for linting issues
npm run lint

# Fix linting issues automatically where possible
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

### ISBN to BISAC Conversion

The ISBN to BISAC conversion utility allows you to:
- Look up BISAC codes for any book using its ISBN-10 or ISBN-13
- Displays the book title to confirm you're looking at the correct book
- Automatically fetches book metadata from the Google Books API
- Intelligently identifies and highlights the most relevant BISAC code using smart ranking algorithm
- Extracts official BISAC codes when available in the book's industry identifiers
- Attempts to match book categories to BISAC categories as a fallback
- Analyzes book descriptions to determine the best category match
- Handles ISBN formats with or without hyphens

```bash
# Look up BISAC codes for a book by ISBN
tsx src/index.ts --isbn 9781234567890
tsx src/index.ts --isbn 978-1234-567890   # With hyphens is also accepted
```

Sample output:
```
🔍 Looking up BISAC code(s) for ISBN: 9780735222168
📚 Book Title: All of the Marvels
🌟 BEST MATCH: LIT017000 | Literary Criticism / Comics & Graphic Novels
✅ Found 70 BISAC categories:
┌─────────┬────────────┬──────────────────────────────────────┐
│ (index) │    code    │              fullLabel               │
├─────────┼────────────┼──────────────────────────────────────┤
│    0    │ 'ARC001000' │    'Architecture / Criticism'       │
│    1    │ 'FIC019000' │    'Fiction / Literary'             │
│    2    │ 'LIT000000' │    'Literary Criticism / General'   │
└─────────┴────────────┴──────────────────────────────────────┘
```

Note: The quality of results depends on the metadata available in the Google Books API for the given ISBN.

### Smart BISAC Code Selection

When looking up BISAC codes for a book via ISBN, the system now intelligently identifies and highlights the most relevant BISAC code using a smart ranking algorithm:

```bash
# Look up BISAC codes for a book with smart category selection
tsx src/index.ts --isbn 9780735222168
```

Sample output:
```
🔍 Looking up BISAC code(s) for ISBN: 9780735222168
📚 Book Title: All of the Marvels
🌟 BEST MATCH: LIT017000 | Literary Criticism / Comics & Graphic Novels
✅ Found 70 BISAC categories:
┌─────────┬─────────────┬───────────────────────────────────────────┐
│ (index) │ code        │ fullLabel                                 │
├─────────┼─────────────┼───────────────────────────────────────────┤
│ 0       │ 'ARC001000' │ 'Architecture / Criticism'                │
│ 1       │ 'FIC019000' │ 'Fiction / Literary'                      │
│ 2       │ 'LIT000000' │ 'Literary Criticism / General'            │
│ ...     │ ...         │ ...                                       │
└─────────┴─────────────┴───────────────────────────────────────────┘
```

The algorithm determines the best match by:

1. **Analyzing Google Books metadata**: Checks if categories provided by Google Books API match any BISAC categories
2. **Content analysis**: Looks for keywords in the book description that match BISAC categories
3. **Contextual relevance**: Gives higher weight to subcategories that appear in the description
4. **Special pattern recognition**: Applies additional weighting for special topics (e.g., comics, graphic novels)

This smart selection is particularly useful when a book has many potential BISAC categories (some books can have 50+ matches) but you need to quickly identify the most relevant one.

### Utility Commands

```bash
# Interactively browse JSON output files with fx
npm run browse:json                      # Displays a list of available JSON files to select from
```

The `browse:json` command:
- Lists all JSON files in the `output` directory sorted by modification time (newest first)
- Shows file modification dates and times for easy identification
- Allows you to interactively select a file using arrow keys
- Opens the selected file in the fx JSON viewer for interactive exploration
- fx provides features like syntax highlighting, collapsible sections, and JSON path filtering

This is particularly useful for:
- Examining the structure of scraped BISAC data
- Verifying data integrity after scraping
- Comparing different versions of the data visually
- Exploring specific sections of large JSON files

## Output

The script generates:

- A JSON file at `./output/bisac-subjects-YYYY-MM-DD.json` containing all the scraped data (date-stamped with current year, month, and day)
- Screenshots in the `./screenshots` directory (useful for debugging)
- Comprehensive console output with progress information and summary statistics

## JSON Structure

The output follows this format:

```json
[
  {
    "heading": "ANTIQUES & COLLECTIBLES",
    "notes": [
      "Use subjects in this section for works about collecting the objects...",
      "Multiple subjects may be used to describe a work fully..."
    ],
    "subjects": [
      {
        "code": "ANT000000",
        "label": "ANTIQUES & COLLECTIBLES / General"
      },
      ...
    ]
  },
  ...
]
```

## Project Structure

```
./
|-- lib/               # Utility functions and core features
|   `-- utils.ts       # Utilities for BISAC and ISBN operations
|-- src/               # Source code
|   |-- index.ts       # Main application entry point
|   |-- browse-json.ts # JSON browsing functionality
|   `-- types/         # TypeScript type definitions
|-- test/              # Unit tests
|   |-- bisac-selection.script.ts  # Script for demonstrating BISAC code selection
|   `-- other test files         # Various unit tests
|-- dist/              # Compiled JavaScript (generated)
|-- output/            # Generated data files
|-- screenshots/       # Debug screenshots
|-- tsconfig.json      # TypeScript configuration
|-- eslint.config.js   # ESLint configuration
|-- .prettierrc        # Prettier configuration
|-- vitest.config.ts   # Vitest configuration
|-- package.json       # Project metadata and dependencies
`-- README.md          # Project documentation
```

## Configuration

You can modify the configuration in `src/index.ts` by editing the `CONFIG` object:

- `maxCategories`: Limit the number of categories to process (null = all)
- `minDelay` & `maxDelay`: Control the delay between page requests
- Selectors: Adjust if the website structure changes

### Command Line Options

The scraper accepts the following command line options:

#### Scraping Options:
- `-u, --url <url>`: Scrape a single category from the specified URL
                     (Must be a valid BISAC category URL from bisg.org)
- `-s, --screenshots`: Enable taking screenshots during scraping

#### Lookup Options:
- `-c, --code <code>`: Get the full label for a BISAC code (e.g., ANT007000)
- `-H, --heading <head>`: Get all codes and labels for a category heading (e.g., "ANTIQUES & COLLECTIBLES")
- `-l, --label <label>`: Get the code for a full label (e.g., "ANTIQUES & COLLECTIBLES / Buttons & Pins")
- `-i, --isbn <isbn>`: Get BISAC code(s) for a book with the given ISBN (e.g., "9781234567890"). Uses Google Books API to fetch book metadata, displays the book title, and extracts BISAC categories.

#### Analysis Options:
- `--compare`: Compare two BISAC JSON files to identify changes between versions
  - Interactively select files to compare
  - See detailed report of added, removed, and modified categories and subjects

The lookup utilities support flexible matching:
- Case-insensitive matching: `--heading "fiction"` works the same as `--heading "FICTION"`
- "&" vs "AND" interchangeability: `--heading "ANTIQUES AND COLLECTIBLES"` matches `"ANTIQUES & COLLECTIBLES"`
- Extra whitespace handling: `--label "  FICTION  /  War & Military  "` works correctly
- ISBN format flexibility: `--isbn "978-1234-567890"` works the same as `--isbn "9781234567890"`

#### General Options:
- `-h, --help`: Display help information and usage examples

## Using as a Module

### In a Node.js/TypeScript Project

After installing the package with npm, you can import and use it in your projects:

```typescript
import {
  scrape,
  getFullLabelFromCode,
  getCodesForHeading,
  getCodeFromFullLabel,
  getCodeFromISBN,
  compareBisacJsonFiles,
  checkExistingJsonFileForToday,
  browseJsonFile
} from 'isbn-bisac-tools';

(async () => {
  // Scraping functionality
  const allData = await scrape();

  // Or scrape a single category
  const singleCategoryData = await scrape('https://www.bisg.org/fiction');

  // Check if a file for today already exists
  const existingFile = await checkExistingJsonFileForToday('./output');
  if (existingFile) {
    console.log(`A file for today already exists: ${existingFile}`);
  }

  // Lookup functionality
    const dataFilePath = './output/bisac-subjects-2023-01-01.json';

    // Get full label from code
    const fullLabel = await getFullLabelFromCode('ANT007000', dataFilePath);

    // Get all codes for a heading
    const codesList = await getCodesForHeading('FICTION', dataFilePath);

    // Get code from full label
    const code = await getCodeFromFullLabel('FICTION / War & Military', dataFilePath);

    // Get BISAC codes from ISBN
    const { title, categories, bestCategory } = await getCodeFromISBN('9781234567890', dataFilePath);
    console.log(`Book Title: ${title}`);
    if (bestCategory) {
      console.log(`Best BISAC Category: ${bestCategory.code} | ${bestCategory.fullLabel}`);
    }

  // Compare two BISAC JSON files
  const olderFile = './output/bisac-subjects-2023-01-01.json';
  const newerFile = './output/bisac-subjects-2023-02-01.json';
  const comparison = await compareBisacJsonFiles(olderFile, newerFile);
  console.log(`Found ${comparison.summary.newSubjects} new subjects`);

  // Interactively browse JSON files with the fx viewer
  const success = await browseJsonFile('./output');
  if (success) {
    console.log('Successfully browsed JSON file');
  }

  // Do something with the data
})()
```

### For Development (Local Import)

If you're developing the library or using it from source:

```typescript
import { scrape } from './src/index.js';
import {
  getFullLabelFromCode,
  getCodesForHeading,
  getCodeFromFullLabel,
  getCodeFromISBN,
  compareBisacJsonFiles,
  checkExistingJsonFileForToday,
  browseJsonFile
} from './lib/utils.js';

// Use the functions as shown above
```

## Development

### Adding New Features

1. Write your TypeScript code
2. Add appropriate tests in the `test` directory
3. Run tests to verify your implementation
4. Ensure code passes linting and formatting checks
5. Build the project with `npm run build`

## Troubleshooting

If you encounter issues:

1. Use the `npm run browse:json` command to select and interactively explore any JSON output file with the fx viewer
2. Check the screenshots in the `./screenshots` directory
3. Increase the delay values if the website is throttling requests
4. Adjust the selectors if the website structure has changed
5. For file overwrite confirmations:
   - The scraper will check for existing files with today's date and prompt before overwriting
   - If you always want to overwrite without confirmation, modify the code to bypass the prompt
6. For command-line issues:
   - Use quotes around arguments containing spaces: `tsx src/index.ts --heading "ANTIQUES & COLLECTIBLES"`
   - If using Windows command prompt, use double quotes: `tsx src/index.ts --heading "ANTIQUES & COLLECTIBLES"`
   - If using PowerShell, escape the `&` character: `tsx src/index.ts --heading "ANTIQUES ^& COLLECTIBLES"`

## License

MIT
