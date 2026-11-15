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

This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for formatting:

- oxlint runs type-aware (`--type-aware`, through `oxlint-tsgolint`), with the correctness, suspicious, and perf categories as errors, plus rules such as `no-explicit-any`, `no-floating-promises`, `consistent-type-imports`, and `no-console` (see [`.oxlintrc.json`](.oxlintrc.json))
- Tests may use unchecked type assertions and untyped `vi.fn()` mocks; production code needs an `oxlint-disable-next-line` comment with a reason
- oxfmt formats `src` and JSON: tabs, double quotes, semicolons, trailing commas, 100 columns (see [`.oxfmtrc.json`](.oxfmtrc.json))
- pit owns `.pi/functions`, so neither tool touches it

A pre-commit hook runs `npm run check` automatically. To fix issues:

```bash
npm run check:fix
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Ensure all checks pass:
   - `npm run check` (oxlint and oxfmt)
   - `npm run typecheck` (TypeScript)
   - `npm test` (Vitest)
4. Open a PR with a clear description
5. Wait for CI to pass and address any feedback

## Adding New Tools

Each tool module should:

1. Create a file in `src/tools/` (e.g., `src/tools/my-feature.ts`)
2. Use [TypeBox](https://github.com/sinclairzx81/typebox) for parameter schemas (see `src/schemas.ts` for shared types)
3. Use `registerSimpleTool` or `registerArrayTool` from `src/tool-helpers.ts` for Financial Datasets endpoints, and pass `equibles` (a backend from `src/equibles.ts`) when Equibles has the same data. Use `registerEquiblesTool` for Equibles-only data. Users may have a key for only one provider, so give every shared tool both backends when you can
4. Export a `register*Tools(pi: ExtensionAPI)` function
5. Add export to `src/tools/index.ts`
6. Call the register function in `src/index.ts`
7. Add corresponding tests in `src/tools/*.test.ts`

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include steps to reproduce for bugs
- Check existing issues before creating new ones

## Questions?

Open a GitHub Discussion or Issue if you have questions.
