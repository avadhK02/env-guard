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
env-guard - Secure, encrypted, local-only environment variable manager

Usage:
  env-guard <command> [options]

Commands:
  init              Initialize .env.lock in the current directory
  set KEY=value     Encrypt and store a secret
  list              List all stored secret keys

Examples:
  env-guard init
  env-guard set API_KEY=secret123
  env-guard set DATABASE_URL=postgres://localhost/db
  env-guard list

For more information, visit: https://github.com/yourusername/env-guard
`);
    break;
  
  default:
    console.error(`Error: Unknown command "${command}"`);
    console.error('Run "env-guard --help" for usage information.');
    process.exit(1);
}

