# Selector Validation Guide

## Introduction

Web scraping is inherently fragile because website structures change over time. When a website updates its HTML structure, CSS selectors that were previously working may stop functioning. This can cause the scraper to silently fail, returning no results without a clear error message.

This document explains how to use the selector validation features built into the ISBN-BISAC Tools to:

1. Test selectors before running the full scrape
2. Detect website structure changes early
3. Quickly find and fix broken selectors

## Testing Selectors with the CLI

The `scrape` command includes a `--test-selector` option to validate selectors against the live website:

```bash
# Test the default category links selector
npm run scrape -- --test-selector

# Test a custom selector
npm run scrape -- --test-selector "table td a"
```

This will:
- Load the BISG website
- Try to find elements matching the selector
- Report how many elements were found
- Show sample matches to help verify it's finding the right content

## Using the Validation Script

For more detailed validation, especially as part of CI/CD pipelines or regular maintenance, use the dedicated validation script:

```bash
# Test all critical selectors
npm run validate-selectors

# Test a specific selector
npm run validate-selectors -- --selector "table a"

# Get detailed output
npm run validate-selectors -- --verbose

# Get suggestions for broken selectors
npm run validate-selectors -- --fix
```

### Script Options

- `--selector <selector>`: Test a specific selector
- `--verbose`: Show detailed output, including sample matches
- `--fix`: Attempt to suggest fixes for broken selectors by testing alternative selectors

## Common Selectors

The following selectors are critical for the scraper to function:

| Purpose | Current Selector | Description |
|---------|-----------------|-------------|
| Category Links | `table a` | Finds all category links on the main listing page |
| Category Heading | `h2.subtitle` | Finds the heading on category pages |

## Handling Website Changes

If a selector stops working, follow these steps:

1. **Identify the broken selector**: Run the validation script to identify which selector is broken
   ```bash
   npm run validate-selectors
   ```

2. **Investigate the current website structure**: Use browser developer tools to inspect the HTML structure of the page and identify new selectors

3. **Test alternative selectors**: Use the `--test-selector` option to test new selectors
   ```bash
   npm run scrape -- --test-selector "your-new-selector"
   ```

4. **Update the configuration**: Once you've found a working selector, update it in `src/config/index.ts`

5. **Verify the fix**: Run the scraper to ensure it now works correctly
   ```bash
   npm run scrape
   ```

## Adding to CI/CD Pipeline

To prevent deployment of broken selectors, add the validation script to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Validate selectors
  run: npm run validate-selectors
```

This will fail the build if any selectors are broken, forcing you to update them before deploying.

## Best Practices

1. **Run validation regularly**: Set up a scheduled job to run the validation script weekly to detect changes early

2. **Be specific with selectors**: Use more specific selectors when possible (e.g., `table.category-table a` instead of just `table a`) to reduce the risk of breakage

3. **Document selector changes**: When updating selectors, document the change in commit messages and update this guide if needed

4. **Add fallback selectors**: For critical selectors, consider implementing fallback selectors that the scraper can try if the primary selector fails

By following these practices, you can make your scraper more resilient to website changes and avoid silent failures.