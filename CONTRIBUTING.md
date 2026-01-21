# Contributing to env-guard

Thank you for considering contributing to env-guard. This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/env-guard.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
npm install
npm run build
npm test
```

## Making Changes

1. Make your changes in the `src/` directory
2. Add or update tests in `src/*.test.ts`
3. Ensure all tests pass: `npm test`
4. Run integration tests: `npm run test:integration`
5. Build the project: `npm run build`

## Code Style

- Follow existing code style and patterns
- Use TypeScript strict mode
- Write clear, self-documenting code
- Add JSDoc comments for public functions

## Submitting Changes

1. Commit your changes with clear messages
2. Push to your fork: `git push origin feature/your-feature-name`
3. Open a pull request on GitHub
4. Provide a clear description of changes

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include tests for new functionality
- Update documentation if needed
- Ensure CI checks pass

## Questions?

Open an issue for discussion before making significant changes.

