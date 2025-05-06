# Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/), a specification for adding human and machine-readable meaning to commit messages.

## Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**:

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

## Header

The header is mandatory and has a special format that includes a **type**, an optional **scope**, and a **description**:

- **type**: Describes the kind of change you're making. Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `build`: Changes that affect the build system or external dependencies
  - `ci`: Changes to our CI configuration files and scripts
  - `chore`: Other changes that don't modify src or test files
  - `revert`: Reverts a previous commit

- **scope**: Optional, can be anything specifying the place of the commit change (e.g., `core`, `cli`, `api`, etc.)

- **description**: A brief summary of the change, written in the imperative mood (e.g., "change" not "changed" or "changes")

## Body

The body is optional and should include the motivation for the change and contrast it with previous behavior.

## Footer

The footer is optional and should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit closes.

Breaking Changes should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for explaining the breaking change.

## Examples

### Simple feature

```
feat: add ISBN validation feature
```

### Feature with scope

```
feat(cli): add --validate flag for ISBN verification
```

### Bug fix with scope and issue reference

```
fix(api): ensure correct error handling for invalid ISBNs

Closes #123
```

### Documentation update

```
docs: update README with new validation examples
```

### Breaking change

```
feat(api): change ISBN lookup method signature

BREAKING CHANGE: The ISBN lookup now requires a region parameter.
Previously valid calls without region will now fail.
```

### Chore with scope

```
chore(deps): update dependencies to latest versions
```

## Relationship to Semantic Versioning

This commit convention is directly tied to [Semantic Versioning](https://semver.org/):

- `fix:` corresponds to a `PATCH` version increment
- `feat:` corresponds to a `MINOR` version increment
- `BREAKING CHANGE:` corresponds to a `MAJOR` version increment

This allows automated tools to generate version numbers and changelogs based on commit messages.

## Tooling

This project uses the following tools to enforce this convention:

- **Commitizen**: Helps with formatting commit messages
- **Commitlint**: Validates commit messages
- **Husky**: Runs commit-msg hook to validate commits

### Using Commitizen

To create a formatted commit message, run:

```bash
npm run commit
```

This will start an interactive prompt to help you create a properly formatted commit message.