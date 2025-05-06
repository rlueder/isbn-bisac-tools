# Publishing Guide for isbn-bisac-tools

This document describes how the automated release and publishing process works for `isbn-bisac-tools`.

## Fully Automated Workflow

This package uses a fully automated continuous deployment process that:

1. Monitors pushes to the `master` branch
2. Analyzes commit messages to determine version bumps
3. Updates the version in package.json
4. Generates a new CHANGELOG entry
5. Creates a git tag
6. Releases to npm

## How Version Bumping Works

The system follows [Semantic Versioning](https://semver.org/) and uses commit messages to determine which version number to increment:

- **MAJOR version (x.0.0)**: Incremented when a commit contains `BREAKING CHANGE:` or uses the `!:` notation (e.g., `feat!: change API`)
- **MINOR version (1.x.0)**: Incremented when a commit starts with `feat:` or `feat(...):` 
- **PATCH version (1.0.x)**: Incremented when a commit starts with `fix:` or for other changes (`chore:`, `docs:`, etc.)

## Commit Message Convention

To properly trigger version bumps, follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Where `<type>` is one of:
- `feat`: A new feature (triggers MINOR version bump)
- `fix`: A bug fix (triggers PATCH version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process, dependencies, etc.

Breaking changes should either:
- Include `BREAKING CHANGE:` in the commit body
- Add a `!` after the type: `feat!:` or `fix!:`

## Release Process

When you push to `master`, the following happens automatically:

1. GitHub Actions analyzes commits since the last tag
2. If version-affecting commits are found, the workflow:
   - Determines the appropriate version bump
   - Updates package.json with the new version
   - Updates the CHANGELOG
   - Creates a git tag
   - Builds the package
   - Publishes to npm
   - Pushes changes back to the repository

## Requirements

For this automation to work correctly:

1. The repository must have an `NPM_TOKEN` secret configured
2. Commit messages must follow the conventional commit format

## Manual Override (if needed)

In most cases, the automated process should work without intervention. However, if you need to manually control a release:

1. Update the version in package.json
2. Update the CHANGELOG.md
3. Commit with message: `chore(release): x.x.x [skip ci]`
4. Create a tag: `git tag -a vx.x.x -m "Release vx.x.x"`
5. Push changes and tags: `git push && git push --tags`

## Troubleshooting

If a release fails:

1. Check the GitHub Actions logs for errors
2. Verify that your NPM_TOKEN has not expired
3. Check if the version already exists on npm
4. Ensure commits follow the conventional format
5. For breaking changes, make sure the format includes `BREAKING CHANGE:` or the `!:` notation

For additional help, refer to the [GitHub Actions documentation](https://docs.github.com/en/actions) or contact the package maintainers.