# isbn-bisac-tools

[![npm version](https://img.shields.io/npm/v/isbn-bisac-tools.svg)](https://www.npmjs.com/package/isbn-bisac-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18.0.0](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/en/download/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

A comprehensive TypeScript toolkit for working with BISAC (Book Industry Standards and Communications) Subject Headings and ISBN lookups.

> **⚠️ IMPORTANT DISCLAIMER:** This library is not affiliated with, endorsed by, or associated with the Book Industry Study Group (BISG). It is an independent, educational project created for research and learning purposes only. BISAC Subject Headings are owned by BISG and this tool is not intended for commercial use. Users should respect BISG's terms of service and intellectual property rights when using this library.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [CLI Commands](#cli-commands)
  - [Using as a Module](#using-as-a-module)
  - [ISBN to BISAC Conversion](#isbn-to-bisac-conversion)
  - [Smart BISAC Code Selection](#smart-bisac-code-selection)
  - [Utility Commands](#utility-commands)
- [API](#api)
- [Output](#output)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **BISAC Data Scraping**
  - Fetch all BISAC subject categories or a single specified category
  - Extract headings, notes, and subject codes with labels
  - Save data in structured JSON format with date-stamped filenames

- **Lookup Utilities**
  - Search by code, heading, label, or ISBN
  - Translate ISBNs to BISAC codes using Google Books API
  - Intelligently identify the most relevant BISAC code

- **Usability**
  - Interactive JSON browsing with `fx`
  - Compare two JSON files to identify changes between different dates

- **Developer Experience**
  - Written in TypeScript with full type definitions
  - Unit tests with Vitest
  - ESLint and Prettier integration for code quality

## Installation

### Using as a Package

```
# Using npm
npm install isbn-bisac-tools

# Using yarn
yarn add isbn-bisac-tools

# Using pnpm
pnpm add isbn-bisac-tools
```

### For Development

```
# Clone the repository
git clone https://github.com/rlueder/isbn-bisac-tools.git
cd isbn-bisac-tools

# Install dependencies
npm install

# Build the package
npm run build
```

### Global Installation

```
# Using npm
npm install -g isbn-bisac-tools

# Using yarn
yarn global add isbn-bisac-tools
```

## Usage

### CLI Commands

**Basic Usage:**

```
# If installed globally
isbn-bisac-tools [options]

# If installed locally
npx isbn-bisac-tools [options]

# Using from source (development)
npm start          # Shows help information
npm run scrape     # Runs the scraper
# or
tsx src/index.ts [options]
```

**Scraping Commands:**

```
# Scrape all BISAC categories
isbn-bisac-tools --scrape

# Scrape a single category
isbn-bisac-tools --url https://www.bisg.org/fiction --scrape
```

**Lookup Commands:**

```
# Get full label for BISAC code
isbn-bisac-tools --code ANT007000

# Get all codes for a heading
isbn-bisac-tools --heading "FICTION"

# Get code for a specific label
isbn-bisac-tools --label "FICTION / War & Military"

# Get BISAC code(s) for a book by ISBN
isbn-bisac-tools --isbn 9781234567890
```

**Analysis Commands:**

```
# Compare two JSON files
isbn-bisac-tools --compare

# Show help information
isbn-bisac-tools --help
```

**Development Commands:**

```
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test BISAC code selection feature
npm run test:bisac

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Browse JSON results interactively
npm run browse:json
```

### Using as a Module

```javascript
import {
  scrape,
  getFullLabelFromCode,
  getCodesForHeading,
  getCodeFromFullLabel,
  getCodeFromISBN,
  compareBisacJsonFiles
} from 'isbn-bisac-tools';

// Scrape BISAC data
const allData = await scrape();

// Scrape a single category
const fictionData = await scrape('https://www.bisg.org/fiction');

// Lookup by code
const fullLabel = await getFullLabelFromCode('ANT007000', './path/to/data.json');

// Get codes for a heading
const codes = await getCodesForHeading('FICTION', './path/to/data.json');

// Get code from full label
const code = await getCodeFromFullLabel('FICTION / War & Military', './path/to/data.json');

// Get BISAC codes from ISBN
const { title, categories, bestCategory } = await getCodeFromISBN('9781234567890', './path/to/data.json');
console.log(`Book: ${title}`);
console.log(`Best BISAC Category: ${bestCategory.code} | ${bestCategory.fullLabel}`);

// Compare two BISAC JSON files
const comparison = await compareBisacJsonFiles('./older-file.json', './newer-file.json');
console.log(`Found ${comparison.summary.newSubjects} new subjects`);
```

### Code Lookup

The code lookup utility retrieves the full label for a BISAC code.

```
isbn-bisac-tools --code ANT007000
```

Sample output:
```
🔍 Looking up full label for code: ANT007000
📅 Loaded BISAC data from 2025-05-06 (timestamp: 1746569281258)
✅ Found: Antiques & Collectibles / Buttons & Pins
```

### Heading Lookup

The heading lookup utility retrieves all BISAC codes and labels for a specific category heading.

```
isbn-bisac-tools --heading "FICTION"
```

Sample output (abbreviated):
```
🔍 Looking up codes for heading: FICTION
📅 Loaded BISAC data from 2025-05-06 (timestamp: 1746569281258)
✅ Found 394 results:
┌─────────┬─────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ (index) │ code        │ fullLabel                                                                                          │
├─────────┼─────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 0       │ 'FIC000000' │ 'Fiction / General'                                                                                │
│ 1       │ 'FIC064000' │ 'Fiction / Absurdist'                                                                              │
│ 2       │ 'FIC002000' │ 'Fiction / Action & Adventure'                                                                     │
│ 3       │ 'FIC075000' │ 'Fiction / Adaptations & Pastiche'                                                                 │
│ ...     │ ...         │ ...                                                                                                │
│ 393     │ 'FIC077100' │ 'Fiction / World Literature / Russian & Soviet Union'                                              │
└─────────┴─────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Label Lookup

The label lookup utility finds the BISAC code corresponding to a specific label.

```
isbn-bisac-tools --label "FICTION / War & Military"
```

Sample output:
```
🔍 Looking up code for label: FICTION / War & Military
📅 Loaded BISAC data from 2025-05-06 (timestamp: 1746569281258)
✅ Found: FIC032000
```

### ISBN to BISAC Conversion

The ISBN to BISAC conversion utility looks up BISAC codes for any book using its ISBN-10 or ISBN-13.

```
isbn-bisac-tools --isbn 9780735222168
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

### Smart BISAC Code Selection

The system intelligently identifies the most relevant BISAC code using a smart ranking algorithm that:

1. Analyzes Google Books metadata
2. Performs content analysis of book descriptions
3. Evaluates contextual relevance
4. Applies special pattern recognition

### Comparison Tool

The comparison tool identifies changes between different versions of BISAC data JSON files.

```
isbn-bisac-tools --compare
```

When you have multiple backup files available, you'll be prompted to select which files to compare. The tool produces a detailed report of added, removed, and modified subjects.

### Utility Commands

```
# Interactively browse JSON output files
npm run browse:json
```

## API

### scrape(url?: string, options?: ScrapeOptions): Promise<BisacData[]>

Scrapes BISAC data from the BISG website.

- `url`: Optional URL to scrape a single category
- `options`: Optional configuration (screenshots, delays, etc.)
- Returns: Array of BISAC data objects

### getFullLabelFromCode(code: string, dataPath: string): Promise<string | null>

Gets the full label for a BISAC code.

- `code`: BISAC code (e.g., 'ANT007000')
- `dataPath`: Path to the JSON data file
- Returns: Full label or null if not found

### getCodesForHeading(heading: string, dataPath: string): Promise<Array<{code: string, label: string}>>

Gets all codes for a category heading.

- `heading`: Category heading (e.g., 'FICTION')
- `dataPath`: Path to the JSON data file
- Returns: Array of code/label objects

### getCodeFromFullLabel(fullLabel: string, dataPath: string): Promise<string | null>

Gets the code for a full label.

- `fullLabel`: Full BISAC label (e.g., 'FICTION / War & Military')
- `dataPath`: Path to the JSON data file
- Returns: BISAC code or null if not found

### getCodeFromISBN(isbn: string, dataPath: string): Promise<IsbnLookupResult>

Gets BISAC code(s) for a book by ISBN.

- `isbn`: ISBN-10 or ISBN-13
- `dataPath`: Path to the JSON data file
- Returns: Object with title, categories, and best category

### compareBisacJsonFiles(olderFile: string, newerFile: string): Promise<ComparisonResult>

Compares two BISAC JSON files to identify changes.

- `olderFile`: Path to the older JSON file
- `newerFile`: Path to the newer JSON file
- Returns: Object with comparison results

## Output

The script generates:

- JSON file: `./data/bisac-data.json` (shipped with the library)
- Screenshots: `./screenshots/` directory (for debugging)
- Console output: Progress information and statistics

### JSON Structure

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
├── lib/               # Utility functions and core features
├── src/               # Source code
│   ├── index.ts       # Main application entry point
│   ├── browse-json.ts # JSON browsing functionality
│   └── types/         # TypeScript type definitions
├── test/              # Unit tests
├── dist/              # Compiled JavaScript (generated)
├── data/              # BISAC data files (shipped with the library)
├── screenshots/       # Debug screenshots
├── tsconfig.json      # TypeScript configuration
├── eslint.config.js   # ESLint configuration
├── .prettierrc        # Prettier configuration
├── vitest.config.ts   # Vitest configuration
├── package.json       # Project metadata and dependencies
└── README.md          # Project documentation
```

## Development

### Prerequisites

- Node.js >=18.0.0
- npm, yarn, or pnpm

### Setting Up for Development

```
git clone https://github.com/rlueder/isbn-bisac-tools.git
cd isbn-bisac-tools
npm install
```

### Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/) for structured, semantic commit messages. The following tools are set up to help maintain this convention:

- **Commitizen**: Interactive prompt to format commit messages
- **Commitlint**: Validates commit messages against the convention
- **Husky**: Git hooks to enforce validation before commits

To create a properly formatted commit:

```
# Use this instead of git commit
npm run commit
```

This starts an interactive prompt to guide you through creating a conventional commit message. See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for detailed examples and guidelines.

Common types of commits:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks

These commit messages automatically help with semantic versioning:
- `fix:` → patch version (0.0.X)
- `feat:` → minor version (0.X.0)
- `feat:` with `BREAKING CHANGE:` → major version (X.0.0)

### Automated Publishing

This project uses GitHub Actions for fully automated publishing:

1. When you push to the `master` branch, the CI workflow automatically:
   - Analyzes commit messages since the last release
   - Determines the appropriate version bump (patch, minor, or major)
   - Updates the package.json version
   - Generates the CHANGELOG entry
   - Creates a git tag
   - Publishes to npm

This means you don't need to manually run any release commands. Just:
1. Make your code changes
2. Commit with the appropriate conventional commit type
3. Push to master
4. The GitHub Actions workflow handles versioning and publishing automatically

For more details, see [PUBLISHING.md](./PUBLISHING.md).

### Adding New Features

1. Write your TypeScript code
2. Add appropriate tests in the `test` directory
3. Run tests: `npm test`
4. Ensure code passes linting: `npm run lint`
5. Build the project: `npm run build`

## Troubleshooting

- **JSON Exploration**: Use `npm run browse:json` to interactively explore JSON files
- **Screenshots**: Check the `./screenshots` directory for debugging visuals
- **Rate Limiting**: Increase delay values if the website is throttling requests
- **Website Structure Changes**: Adjust selectors if needed
- **File Overwrite Issues**: The scraper prompts before overwriting existing files
- **Command-line Issues**:
  - Use quotes around arguments with spaces
  - In Windows command prompt, use double quotes
  - In PowerShell, escape special characters (e.g., `^&`)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
