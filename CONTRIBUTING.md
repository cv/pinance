# Contributing to pinance

Thanks for your interest in contributing! This document outlines the process for contributing to pinance.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make your changes
4. Run checks before committing:
   ```bash
   npm run check
   npm run typecheck
   npm test
   ```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting with strict settings:

- All lint rules enabled
- Tabs for indentation
- Double quotes
- Semicolons required
- Trailing commas

A pre-commit hook runs `npm run check` automatically. To fix issues:

```bash
npm run check:fix
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Ensure all checks pass:
   - `npm run check` (Biome lint/format)
   - `npm run typecheck` (TypeScript)
   - `npm test` (Vitest)
4. Open a PR with a clear description
5. Wait for CI to pass and address any feedback

## Adding New Tools

Each tool should:

1. Have its own file in `src/tools/`
2. Use TypeBox for parameter schemas
3. Include proper error handling
4. Have corresponding tests in `src/tools/*.test.ts`
5. Be registered in `src/index.ts`

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include steps to reproduce for bugs
- Check existing issues before creating new ones

## Questions?

Open a GitHub Discussion or Issue if you have questions.
