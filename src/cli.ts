import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { initializeLockFile, saveSecret, listKeys, lockFileExists } from './store.js';

const GITIGNORE = '.gitignore';
const ENV_LOCK = '.env.lock';
const ENV_FILE = '.env';

/**
 * Ensures .env and .env.lock are in .gitignore.
 */
function ensureGitignore(): void {
  const gitignorePath = resolve(process.cwd(), GITIGNORE);
  let gitignoreContent = '';
  
  if (existsSync(gitignorePath)) {
    gitignoreContent = readFileSync(gitignorePath, 'utf8');
  }
  
  const lines = gitignoreContent.split('\n').map(line => line.trim());
  const needsEnv = !lines.includes(ENV_FILE);
  const needsEnvLock = !lines.includes(ENV_LOCK);
  
  if (needsEnv || needsEnvLock) {
    if (gitignoreContent && !gitignoreContent.endsWith('\n') && gitignoreContent.length > 0) {
      gitignoreContent += '\n';
    }
    
    if (needsEnv) {
      gitignoreContent += `${ENV_FILE}\n`;
    }
    
    if (needsEnvLock) {
      gitignoreContent += `${ENV_LOCK}\n`;
    }
    
    writeFileSync(gitignorePath, gitignoreContent, 'utf8');
  }
}

/**
 * Handles the 'init' command.
 */
export function handleInit(): void {
  if (lockFileExists()) {
    console.error(`Error: ${ENV_LOCK} already exists.`);
    process.exit(1);
  }
  
  try {
    initializeLockFile();
    ensureGitignore();
    console.log(`✓ Initialized ${ENV_LOCK}`);
    console.log(`✓ Added ${ENV_FILE} and ${ENV_LOCK} to .gitignore`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Handles the 'set KEY=value' command.
 */
export function handleSet(args: string[]): void {
  if (args.length === 0) {
    console.error('Error: Usage: env-guard set KEY=value');
    process.exit(1);
  }
  
  const assignment = args[0];
  const equalIndex = assignment.indexOf('=');
  
  if (equalIndex === -1) {
    console.error('Error: Invalid format. Use KEY=value');
    process.exit(1);
  }
  
  const key = assignment.slice(0, equalIndex).trim();
  const value = assignment.slice(equalIndex + 1).trim();
  
  if (!key) {
    console.error('Error: Key cannot be empty');
    process.exit(1);
  }
  
  if (!lockFileExists()) {
    console.error(`Error: ${ENV_LOCK} not found. Run 'env-guard init' first.`);
    process.exit(1);
  }
  
  try {
    saveSecret(key, value);
    console.log(`✓ Set ${key}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Handles the 'list' command.
 */
export function handleList(): void {
  if (!lockFileExists()) {
    console.error(`Error: ${ENV_LOCK} not found. Run 'env-guard init' first.`);
    process.exit(1);
  }
  
  try {
    const keys = listKeys();
    
    if (keys.length === 0) {
      console.log('No secrets stored.');
      return;
    }
    
    console.log('Stored keys:');
    for (const key of keys) {
      console.log(`  - ${key}`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

