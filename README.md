# env-guard

**Secure, encrypted, local-only environment variable manager for developers.**

## Problem Statement

Traditional `.env` files are a security risk. They store secrets in plaintext, making them vulnerable to:
- Accidental commits to version control
- Unauthorized access on shared machines
- Exposure in logs, error messages, or debugging tools
- Compliance violations in enterprise environments

`env-guard` solves this by encrypting your secrets at rest using AES-256-GCM, ensuring they never exist in plaintext on disk.

## Key Features

- **100% Local**: Works completely offline with no cloud services, databases, or external APIs
- **AES-256-GCM Encryption**: Industry-standard encryption for secrets at rest
- **Project-Specific Keys**: Encryption keys are derived from your OS username and project path
- **Machine-Specific**: Secrets encrypted on one machine cannot be decrypted on another
- **Git-Safe**: Automatically adds `.env` and `.env.lock` to `.gitignore`
- **Zero Dependencies**: Uses only Node.js built-in modules
- **TypeScript**: Fully typed with TypeScript support
- **CLI & Runtime API**: Both command-line and programmatic interfaces

## Installation

```bash
npm install env-guard
```

Or install globally:

```bash
npm install -g env-guard
```

## CLI Usage

### Initialize

Create an encrypted `.env.lock` file in your project:

```bash
env-guard init
```

This command:
- Creates `.env.lock` (encrypted storage)
- Adds `.env` and `.env.lock` to `.gitignore`

### Set Secrets

Encrypt and store a secret:

```bash
env-guard set API_KEY=your-secret-key
env-guard set DATABASE_URL=postgres://localhost/mydb
env-guard set JWT_SECRET=super-secret-jwt-token
```

**Important**: Never use quotes around the value. The CLI handles parsing automatically.

### List Keys

View all stored secret keys (values are never displayed):

```bash
env-guard list
```

Output:
```
Stored keys:
  - API_KEY
  - DATABASE_URL
  - JWT_SECRET
```

## Runtime Usage

In your application code, load encrypted secrets at startup:

```typescript
import { loadEnv } from 'env-guard';

// Load all encrypted secrets into process.env
loadEnv();

// Now use them as normal
console.log(process.env.API_KEY);
console.log(process.env.DATABASE_URL);
```

### With Express.js

```typescript
import express from 'express';
import { loadEnv } from 'env-guard';

loadEnv();

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### With Next.js

Create `lib/env.ts`:

```typescript
import { loadEnv } from 'env-guard';

loadEnv();

export const env = {
  API_KEY: process.env.API_KEY!,
  DATABASE_URL: process.env.DATABASE_URL!,
};
```

## Security Explanation

### Encryption

`env-guard` uses **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode), which provides:
- **Confidentiality**: Secrets cannot be read without the key
- **Integrity**: Any tampering with encrypted data is detected
- **Authenticity**: Ensures data came from the original source

### Key Derivation

Encryption keys are derived using **PBKDF2** (Password-Based Key Derivation Function 2) from:
- **OS Username**: Makes keys machine-specific
- **Project Path**: Makes keys project-specific

This means:
- Secrets encrypted on one machine cannot be decrypted on another
- Secrets encrypted in one project cannot be decrypted in another
- No master keys or passwords to manage
- No external key management services required

### Security Guarantees

- ✅ Secrets encrypted at rest (never stored in plaintext)
- ✅ Project-specific encryption (isolated per project)
- ✅ Machine-specific encryption (isolated per machine)
- ✅ Git-safe by default (encrypted files can be committed safely)
- ✅ No secrets logged (CLI never displays secret values)
- ✅ No external dependencies (no network calls, no cloud services)

## Comparison with dotenv

| Feature | dotenv | env-guard |
|---------|--------|-----------|
| Storage format | Plaintext | Encrypted (AES-256-GCM) |
| Git safety | Manual `.gitignore` setup | Automatic |
| Security | Vulnerable to exposure | Encrypted at rest |
| Key management | None | Automatic (derived from machine + project) |
| Cloud dependency | None | None |
| Local-only | Yes | Yes |

**When to use env-guard:**
- You need encrypted storage for secrets
- You work on shared machines or in teams
- You want defense-in-depth security
- You need compliance with security policies

**When dotenv is sufficient:**
- Development-only secrets with no real value
- Secrets that are already public or rotated frequently
- Projects where encryption overhead isn't needed

## Philosophy

### Local-First

`env-guard` is designed to work entirely offline. No cloud services, no databases, no external APIs. Your secrets stay on your machine, encrypted and secure.

### Secure-by-Default

Security is not optional. Every secret is encrypted. Every operation is designed to prevent accidental exposure. Secrets are never logged, never displayed, and never stored in plaintext.

### Developer Experience

Security shouldn't come at the cost of usability. `env-guard` provides a simple CLI and a straightforward runtime API that integrates seamlessly into existing workflows.

### Transparency

`env-guard` is open-source. You can audit the code, understand the encryption, and verify there are no backdoors or external dependencies.

## Publishing Guide

### Building the Package

To build the TypeScript source code:

```bash
npm install
npm run build
```

This compiles all TypeScript files from `src/` and `bin/` into the `dist/` directory.

### Testing Locally

Before publishing, test the package locally:

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Test the CLI:**
   ```bash
   # Make the CLI executable
   chmod +x dist/bin/env-guard.js
   
   # Test init
   node dist/bin/env-guard.js init
   
   # Test set
   node dist/bin/env-guard.js set TEST_KEY=test_value
   
   # Test list
   node dist/bin/env-guard.js list
   ```

3. **Test the runtime API:**
   Create a test file `test.js`:
   ```javascript
   import { loadEnv } from './dist/loader.js';
   
   loadEnv();
   console.log('TEST_KEY:', process.env.TEST_KEY);
   ```
   
   Run it:
   ```bash
   node test.js
   ```

4. **Test as a local npm package:**
   ```bash
   # In the env-guard directory
   npm link
   
   # In another project directory
   npm link env-guard
   
   # Now you can use it
   env-guard init
   ```

### Publishing to npm

1. **Ensure you're logged in:**
   ```bash
   npm login
   ```

2. **Verify package.json:**
   - Check version number
   - Verify author and license
   - Ensure all required fields are present

3. **Build and test:**
   ```bash
   npm run build
   npm test              # Run unit tests
   npm run test:integration  # Run integration tests
   ```
   
   The test suite includes:
   - Unit tests for encryption/decryption
   - Unit tests for file operations
   - Unit tests for CLI commands
   - Integration tests for end-to-end workflow

4. **Dry run (preview what will be published):**
   ```bash
   npm publish --dry-run
   ```

5. **Publish:**
   ```bash
   npm publish
   ```

   For the first publish, use:
   ```bash
   npm publish --access public
   ```

6. **Verify publication:**
   ```bash
   npm view env-guard
   ```

### Version Management

- Use semantic versioning (semver)
- Update version in `package.json` before publishing
- Consider using `npm version patch|minor|major` to bump versions

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct before submitting pull requests.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/env-guard/issues)
- **Documentation**: [Full Documentation](https://github.com/yourusername/env-guard#readme)

---

**Made with ❤️ for developers who care about security.**

