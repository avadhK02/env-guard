#!/usr/bin/env node

import { handleInit, handleSet, handleList } from '../src/cli.js';

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'init':
    handleInit();
    break;
  
  case 'set':
    handleSet(args);
    break;
  
  case 'list':
    handleList();
    break;
  
  case '--help':
  case '-h':
  case undefined:
    console.log(`
secure-env-vault - Secure, encrypted, local-only environment variable manager

Usage:
  secure-env-vault <command> [options]

Commands:
  init              Initialize .env.lock in the current directory
  set KEY=value     Encrypt and store a secret
  list              List all stored secret keys

Examples:
  secure-env-vault init
  secure-env-vault set API_KEY=secret123
  secure-env-vault set DATABASE_URL=postgres://localhost/db
  secure-env-vault list

For more information, visit: https://github.com/avadhK02/env-guard
`);
    break;
  
  default:
    console.error(`Error: Unknown command "${command}"`);
    console.error('Run "secure-env-vault --help" for usage information.');
    process.exit(1);
}

