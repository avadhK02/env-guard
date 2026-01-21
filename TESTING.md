# Testing Guide

This document describes the test suite for `env-guard`.

## Test Structure

The test suite consists of:

1. **Unit Tests** (`src/*.test.ts`) - Test individual modules
2. **Integration Tests** (`test-integration.mjs`) - Test end-to-end workflow

## Running Tests

### All Tests

```bash
npm test
```

This will:
1. Build the TypeScript code
2. Run all unit tests
3. Run integration tests (via `prepublishOnly`)

### Unit Tests Only

```bash
npm run build
node --test 'dist/src/**/*.test.js'
```

### Integration Tests Only

```bash
npm run build
npm run test:integration
```

### Watch Mode (Unit Tests)

```bash
npm run test:watch
```

## Test Coverage

### Unit Tests

#### `crypto.test.ts`
- Key derivation consistency
- Encryption/decryption roundtrip
- Random IV generation
- Tamper detection
- Invalid format handling
- Special characters handling
- Empty string handling
- Long string handling
- Wrong key detection

#### `store.test.ts`
- Lock file initialization
- Secret storage and retrieval
- Multiple secrets handling
- Key listing
- Empty store handling
- Corrupted file handling
- Invalid encrypted data handling

#### `loader.test.ts`
- Environment variable loading
- Existing env var preservation
- Multiple secrets loading
- Special characters handling
- Empty store handling

#### `cli.test.ts`
- Init command
- Set command
- List command
- Error handling
- Special characters in values
- Gitignore management

### Integration Tests

The integration test (`test-integration.mjs`) verifies:

1. **Init Command** - Creates `.env.lock` and updates `.gitignore`
2. **Set Command** - Stores encrypted secrets
3. **List Command** - Lists keys without showing values
4. **Runtime Loader** - Loads secrets into `process.env`
5. **Encryption** - Verifies secrets are encrypted in `.env.lock`

## Test Environment

- Tests use temporary directories to avoid polluting the project
- Each test suite cleans up after itself
- Tests are isolated and can run in any order

## Before Publishing

Always run the full test suite before publishing:

```bash
npm run build
npm test
npm run test:integration
```

The `prepublishOnly` script automatically runs tests before publishing.

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure you've built the project:
```bash
npm run build
```

### Integration tests fail

Ensure the build is up to date:
```bash
npm run build
npm run test:integration
```

### Tests pass but CLI doesn't work

Check that the bin file has the shebang:
```bash
head -1 dist/bin/env-guard.js
```

Should output: `#!/usr/bin/env node`

