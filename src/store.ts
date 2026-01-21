import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { encrypt, decrypt, deriveKey, getProjectPath } from './crypto.js';

const LOCK_FILE = '.env.lock';

export interface EncryptedStore {
  [key: string]: string;
}

/**
 * Gets the path to the .env.lock file in the current project.
 */
function getLockFilePath(): string {
  return resolve(getProjectPath(), LOCK_FILE);
}

/**
 * Reads and decrypts all secrets from .env.lock.
 * Returns an object with decrypted key-value pairs.
 */
export function loadSecrets(): Record<string, string> {
  const lockFilePath = getLockFilePath();
  
  if (!existsSync(lockFilePath)) {
    return {};
  }
  
  try {
    const fileContent = readFileSync(lockFilePath, 'utf8');
    const encryptedStore: EncryptedStore = JSON.parse(fileContent);
    
    const key = deriveKey(getProjectPath());
    const decrypted: Record<string, string> = {};
    
    for (const [envKey, encryptedValue] of Object.entries(encryptedStore)) {
      try {
        decrypted[envKey] = decrypt(encryptedValue, key);
      } catch (error) {
        throw new Error(`Failed to decrypt key "${envKey}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return decrypted;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${LOCK_FILE}. File may be corrupted.`);
    }
    throw error;
  }
}

/**
 * Encrypts and stores a secret in .env.lock.
 */
export function saveSecret(key: string, value: string): void {
  const lockFilePath = getLockFilePath();
  const keyBuffer = deriveKey(getProjectPath());
  
  let encryptedStore: EncryptedStore = {};
  
  // Load existing secrets if file exists
  if (existsSync(lockFilePath)) {
    try {
      const fileContent = readFileSync(lockFilePath, 'utf8');
      encryptedStore = JSON.parse(fileContent);
    } catch (error) {
      // If file is corrupted, start fresh
      if (error instanceof SyntaxError) {
        encryptedStore = {};
      } else {
        throw error;
      }
    }
  }
  
  // Encrypt and store the new/updated secret
  encryptedStore[key] = encrypt(value, keyBuffer);
  
  // Ensure directory exists
  const lockDir = dirname(lockFilePath);
  if (!existsSync(lockDir)) {
    mkdirSync(lockDir, { recursive: true });
  }
  
  // Write encrypted store to file
  writeFileSync(lockFilePath, JSON.stringify(encryptedStore, null, 2), 'utf8');
}

/**
 * Lists all secret keys (without decrypting values).
 */
export function listKeys(): string[] {
  const lockFilePath = getLockFilePath();
  
  if (!existsSync(lockFilePath)) {
    return [];
  }
  
  try {
    const fileContent = readFileSync(lockFilePath, 'utf8');
    const encryptedStore: EncryptedStore = JSON.parse(fileContent);
    return Object.keys(encryptedStore).sort();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${LOCK_FILE}. File may be corrupted.`);
    }
    throw error;
  }
}

/**
 * Checks if .env.lock exists.
 */
export function lockFileExists(): boolean {
  return existsSync(getLockFilePath());
}

/**
 * Initializes .env.lock file (creates empty encrypted store).
 */
export function initializeLockFile(): void {
  const lockFilePath = getLockFilePath();
  
  if (existsSync(lockFilePath)) {
    throw new Error(`${LOCK_FILE} already exists.`);
  }
  
  const encryptedStore: EncryptedStore = {};
  const lockDir = dirname(lockFilePath);
  
  if (!existsSync(lockDir)) {
    mkdirSync(lockDir, { recursive: true });
  }
  
  writeFileSync(lockFilePath, JSON.stringify(encryptedStore, null, 2), 'utf8');
}

