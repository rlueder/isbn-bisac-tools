# Publishing Guide for isbn-bisac-tools

This document outlines the process for publishing new versions of `isbn-bisac-tools` to npm.

## Semantic Versioning

This package follows [Semantic Versioning](https://semver.org/) principles:

- **PATCH version (1.0.x)** - for backwards-compatible bug fixes
- **MINOR version (1.x.0)** - for new backwards-compatible functionality
- **MAJOR version (x.0.0)** - for backwards-incompatible changes

## Prerequisites

Before publishing, ensure you have:

1. An [npm account](https://www.npmjs.com/signup)
2. Been added as a collaborator to the package
3. Logged in via the CLI: `npm login`

## Publishing Methods

### Method 1: Using the Helper Script (Recommended)

The package includes a helper script that automates the publishing process.

```bash
# For a patch release (0.1.0 -> 0.1.1)
npm run publish

# Specify version type explicitly
npm run publish -- patch
npm run publish -- minor
npm run publish -- major

# Or specify an exact version
npm run publish -- 1.2.3
```

This script will:
1. Check for uncommitted changes
2. Run tests and linting
3. Update the version in package.json
4. Update the CHANGELOG.md
5. Build the package
6. Commit the changes and create a git tag
7. Publish to npm
8. Push changes to GitHub

### Method 2: Using npm CLI Commands

If you prefer manual control, use the provided npm scripts:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm run release:patch

# Minor version (0.1.0 -> 0.2.0)
npm run release:minor

# Major version (0.1.0 -> 1.0.0)
npm run release:major
```

### Method 3: Using GitHub Actions (Automated)

You can trigger the publishing workflow from GitHub:

1. Go to the GitHub repository
2. Navigate to Actions > "Publish to npm"
3. Click "Run workflow"
4. Select the version type (patch, minor, or major)
5. Click "Run workflow"

This requires setting up an NPM_TOKEN secret in your GitHub repository.

## Manual Publishing Steps (Detailed)

If you need to perform a completely manual publication:

1. **Update the version**:
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**:
   - Move changes from "Unreleased" to a new version section
   - Add the current date
   - Update the comparison links at the bottom

3. **Build the package**:
   ```bash
   npm run build
   ```

4. **Run tests and linting**:
   ```bash
   npm run lint
   npm test
   ```

5. **Publish to npm**:
   ```bash
   npm publish
   ```

6. **Push changes and tags to GitHub**:
   ```bash
   git push && git push --tags
   ```

## Release Checklist

Before publishing, ensure:

- [ ] All tests pass
- [ ] Code linting passes
- [ ] Documentation is up-to-date
- [ ] CHANGELOG.md is updated
- [ ] Version number follows semantic versioning
- [ ] Required Node.js version is correct

## Post-Publishing

After publishing, verify:

1. The package is available on npm: `npm view isbn-bisac-tools`
2. The package can be installed: `npm install -g isbn-bisac-tools`
3. CLI commands work: `isbn-bisac-tools --help`

## Troubleshooting

### Common Issues

1. **Permission errors**:
   - Ensure you're logged in: `npm login`
   - Verify you have publishing rights: `npm owner ls isbn-bisac-tools`

2. **Package already exists**:
   - Check if the version is already published: `npm view isbn-bisac-tools versions`

3. **Failed tests or linting**:
   - Fix issues before attempting to publish

4. **Tarball creation failures**:
   - Check the `.npmignore` file for potential conflicts

For additional help, contact the package maintainers or refer to the [npm documentation](https://docs.npmjs.com/cli/v8/commands/npm-publish).