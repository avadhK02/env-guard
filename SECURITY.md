# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark:  |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in env-guard, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security details to: [your-email@example.com]
3. Include steps to reproduce the vulnerability
4. We will respond within 48 hours

## Security Features

- AES-256-GCM encryption for all secrets
- Machine-specific and project-specific key derivation
- No external network calls or dependencies
- Open-source code available for security audits

## Security Best Practices

- Never share encryption keys between machines
- Keep your OS username and project paths secure
- Review encrypted `.env.lock` files before committing
- Use environment-specific secrets for different deployments

