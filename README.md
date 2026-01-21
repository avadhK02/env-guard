# secure-env-vault

[![npm version](https://img.shields.io/npm/v/secure-env-vault.svg)](https://www.npmjs.com/package/secure-env-vault)
[![npm downloads](https://img.shields.io/npm/dm/secure-env-vault.svg)](https://www.npmjs.com/package/secure-env-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

**Secure, encrypted, local-only environment variable and secrets manager for Node.js developers.**

Traditional `.env` files store secrets in plaintext, creating security risks in version control, shared environments, and production deployments. secure-env-vault provides a secure dotenv alternative that encrypts your environment variables at rest using AES-256-GCM, ensuring secrets never exist in plaintext on disk.

## Why secure-env-vault?

Managing secure environment variables is a common challenge for Node.js developers. Standard `.env` files expose several security vulnerabilities:

- **Plaintext storage**: Secrets are readable by anyone with file system access
- **Accidental commits**: Easy to mistakenly commit sensitive data to version control
- **Shared machine risks**: Secrets visible to other users on the same system
- **Log exposure**: Plaintext secrets can appear in application logs and error messages
- **Compliance gaps**: Many security policies require encryption at rest

secure-env-vault solves these problems by providing a local secrets manager that encrypts your environment variables before storing them. Unlike cloud-based solutions, secure-env-vault works entirely offline with no external dependencies, making it ideal for local-first security workflows.

## Key Features

- **Encrypted storage**: All secrets encrypted with AES-256-GCM before being written to disk
- **Local-only operation**: No cloud services, databases, or external APIs required
- **Machine-specific encryption**: Keys derived from OS username and project path prevent cross-machine decryption
- **Project isolation**: Secrets encrypted in one project cannot be decrypted in another
- **Git-safe by default**: Automatically configures `.gitignore` to prevent accidental commits
- **Zero dependencies**: Uses only Node.js built-in modules for maximum security and minimal footprint
- **TypeScript support**: Full type definitions included
- **Simple CLI**: Intuitive commands for managing encrypted secrets
- **Runtime API**: Programmatic access for loading secrets in your application

## Installation

```bash
npm install secure-env-vault
```

For global CLI access:

```bash
npm install -g secure-env-vault
```

## Quick Start

### Initialize

Create an encrypted `.env.lock` file in your project:

```bash
secure-env-vault init
```

This creates the encrypted storage file and automatically adds `.env` and `.env.lock` to your `.gitignore`.

### Store Secrets

Encrypt and store your environment variables:

```bash
secure-env-vault set API_KEY=your-secret-api-key
secure-env-vault set DATABASE_URL=postgres://localhost/mydb
secure-env-vault set JWT_SECRET=your-jwt-secret-token
```

The CLI never displays secret values, only confirmation messages.

### List Keys

View all stored secret keys without exposing values:

```bash
secure-env-vault list
```

Output:
```
Stored keys:
  - API_KEY
  - DATABASE_URL
  - JWT_SECRET
```

## Runtime Usage

Load encrypted secrets into your application using the `loadEnv()` function:

```typescript
import { loadEnv } from 'secure-env-vault';

// Load all encrypted secrets into process.env
loadEnv();

// Use secrets as normal environment variables
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

### Express.js Example

```typescript
import express from 'express';
import { loadEnv } from 'env-guard';

loadEnv();

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/data', (req, res) => {
  // process.env.API_KEY is available here
  res.json({ message: 'API key loaded securely' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Next.js Example

Create `lib/env.ts`:

```typescript
import { loadEnv } from 'secure-env-vault';

loadEnv();

export const env = {
  apiKey: process.env.API_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
};
```

Import in your Next.js pages or API routes:

```typescript
import { env } from '@/lib/env';

// Use env.apiKey, env.databaseUrl, etc.
```

## Security Model

secure-env-vault uses industry-standard cryptography to protect your secrets.

### Encryption

All secrets are encrypted using **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode). This provides:

- **Confidentiality**: Secrets cannot be read without the decryption key
- **Integrity**: Any tampering with encrypted data is automatically detected
- **Authenticity**: Ensures encrypted data originated from the expected source

### Key Derivation

Encryption keys are automatically derived using **PBKDF2** (Password-Based Key Derivation Function 2) with 100,000 iterations. Keys are generated from:

- **OS username**: Ensures machine-specific encryption
- **Project path**: Ensures project-specific encryption

This means:
- Secrets encrypted on one machine cannot be decrypted on another
- Secrets encrypted in one project cannot be decrypted in another project
- No master keys or passwords to manage or remember
- No external key management services required

### Security Guarantees

- Secrets are encrypted at rest and never stored in plaintext
- Each project has isolated encryption keys
- Each machine has isolated encryption keys
- Encrypted files can be safely committed to version control
- Secret values are never logged or displayed by the CLI
- No network calls or external dependencies

## Comparison: secure-env-vault vs dotenv

| Feature | dotenv | secure-env-vault |
|---------|--------|-----------|
| Storage format | Plaintext | Encrypted (AES-256-GCM) |
| Git safety | Manual `.gitignore` setup | Automatic configuration |
| Security | Vulnerable to file system access | Encrypted at rest |
| Key management | None required | Automatic derivation |
| Cloud dependency | None | None |
| Local-only | Yes | Yes |
| Zero dependencies | No | Yes |

## When to Use secure-env-vault

secure-env-vault is ideal when:

- You need encrypted storage for sensitive environment variables
- You work on shared machines or in team environments
- You want defense-in-depth security for your secrets
- You need compliance with security policies requiring encryption at rest
- You prefer local-first solutions without cloud dependencies
- You want a secure dotenv alternative with minimal setup

Consider using standard dotenv when:

- You're working with development-only secrets with no real value
- Secrets are already public or rotated very frequently
- Encryption overhead is not a requirement for your use case

## Philosophy

### Local-First Security

env-guard is designed for local-first security. Your secrets never leave your machine. There are no cloud services, databases, or external APIs. Everything works offline, giving you complete control over your sensitive data.

### Secure-by-Default

Security is not optional. Every secret is encrypted. Every operation is designed to prevent accidental exposure. Secrets are never logged, never displayed, and never stored in plaintext. The default behavior prioritizes security over convenience.

### Developer Experience

Security should not come at the cost of usability. env-guard provides a simple CLI and straightforward runtime API that integrates seamlessly into existing Node.js workflows. The learning curve is minimal, and the security benefits are immediate.

### Transparency

env-guard is open-source. You can audit the code, understand the encryption implementation, and verify there are no backdoors or hidden dependencies. The security model is documented and can be independently verified.

## FAQ

### Can I share encrypted secrets between team members?

No. secure-env-vault uses machine-specific and project-specific key derivation. Secrets encrypted on one machine cannot be decrypted on another, even in the same project. This is by design for security. For team sharing, consider using a separate secrets management solution or sharing decryption keys through a secure channel.

### What happens if I move my project to a different machine?

You'll need to re-encrypt your secrets on the new machine. The encryption keys are derived from the OS username and project path, so they differ between machines. You can export secrets from the old machine (by temporarily decrypting them) and re-encrypt them on the new machine using `secure-env-vault set`.

### Is it safe to commit `.env.lock` to version control?

Yes. The `.env.lock` file contains only encrypted data. Without the encryption key (derived from your machine and project), the encrypted values cannot be decrypted. However, be aware that key names are visible in the file, so avoid using sensitive information in environment variable names.

### How does this compare to cloud secrets managers?

secure-env-vault is designed for local development and single-machine use. Cloud secrets managers (like AWS Secrets Manager, HashiCorp Vault) provide features like centralized management, access control, audit logs, and team collaboration. secure-env-vault focuses on local-first security with zero external dependencies. Choose based on your needs: local development vs. production infrastructure.

### Can I use secure-env-vault in production?

secure-env-vault is designed primarily for local development and single-machine scenarios. For production environments, consider using dedicated secrets management solutions that provide features like centralized access control, audit logging, and team collaboration. However, if your production setup matches the local-first model (single machine, no team sharing needed), secure-env-vault can work.

## License

MIT License - see [LICENSE](LICENSE) file for details.
