# Contributing to state-sync

Thank you for your interest in contributing to state-sync! This document provides guidelines and instructions for contributing.

## Prerequisites

- Node.js 18+
- pnpm 8+

## Local Setup

```bash
# Clone the repository
git clone https://github.com/777genius/state-sync.git
cd state-sync

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/core && pnpm test
```

### Type Checking

```bash
# Check types across all packages
pnpm typecheck
```

### Linting & Formatting

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for lint issues
pnpm lint

# Format code
pnpm format
```

### Documentation

```bash
# Start docs dev server
pnpm docs:dev

# Build docs
pnpm docs:build

# Generate API docs
pnpm docs:api
```

## Adding a New Adapter

1. Create a new package directory: `packages/<adapter-name>/`

2. Copy the structure from an existing adapter (e.g., `packages/zustand/`):
   - `package.json`
   - `tsconfig.json`
   - `tsup.config.ts`
   - `src/index.ts`
   - `src/<adapter-name>.ts`
   - `tests/<adapter-name>.test.ts`
   - `README.md`

3. Update `package.json`:
   - Set `name` to `@statesync/<adapter-name>`
   - Set `version` to `1.0.0`
   - Add appropriate `peerDependencies`

4. Implement the adapter following the `SnapshotApplier` interface from `@statesync/core`

5. Add tests covering:
   - Patch mode (default)
   - Replace mode
   - `pickKeys` / `omitKeys` filtering
   - `toState` transformation
   - Error handling with `strict` option

6. Create a README with installation and usage examples

7. Add the package to workspace in `pnpm-workspace.yaml` (if needed)

## Code Style Guidelines

- Use TypeScript for all source code
- Follow existing patterns in the codebase
- Keep adapters dependency-free from their target frameworks when possible
- Export only the public API from `index.ts`
- Use JSDoc comments for public APIs

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting: `pnpm test && pnpm lint`
5. Commit with a descriptive message
6. Push to your fork and create a Pull Request

## Versioning

We use [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset
pnpm changeset

# Apply version bumps
pnpm version

# Publish to npm
pnpm release
```

## Questions?

Feel free to open an issue for any questions or suggestions.
