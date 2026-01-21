import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { chdir } from 'process';
import { existsSync } from 'fs';
import {
  initializeLockFile,
  saveSecret,
  loadSecrets,
  listKeys,
  lockFileExists,
} from './store.js';

let testDir: string;
let originalCwd: string;

before(async () => {
  originalCwd = process.cwd();
  testDir = await mkdtemp(join(tmpdir(), 'env-guard-test-'));
  chdir(testDir);
});

after(async () => {
  chdir(originalCwd);
  await rm(testDir, { recursive: true, force: true });
});

async function cleanupLockFile() {
  if (existsSync('.env.lock')) {
    await unlink('.env.lock').catch(() => {});
  }
}

test('initializeLockFile creates .env.lock', async () => {
  await cleanupLockFile();
  assert.strictEqual(lockFileExists(), false, 'Lock file should not exist initially');
  
  initializeLockFile();
  
  assert.strictEqual(lockFileExists(), true, 'Lock file should exist after init');
});

test('initializeLockFile throws if .env.lock already exists', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  assert.throws(
    () => initializeLockFile(),
    /already exists/,
    'Should throw if lock file already exists'
  );
});

test('saveSecret creates and stores encrypted secret', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  saveSecret('TEST_KEY', 'test-value');
  
  const keys = listKeys();
  assert.strictEqual(keys.length, 1);
  assert.strictEqual(keys[0], 'TEST_KEY');
});

test('saveSecret updates existing secret', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  saveSecret('TEST_KEY', 'value1');
  saveSecret('TEST_KEY', 'value2');
  
  const keys = listKeys();
  assert.strictEqual(keys.length, 1);
  
  const secrets = loadSecrets();
  assert.strictEqual(secrets.TEST_KEY, 'value2', 'Should have updated value');
});

test('saveSecret stores multiple secrets', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  saveSecret('KEY1', 'value1');
  saveSecret('KEY2', 'value2');
  saveSecret('KEY3', 'value3');
  
  const keys = listKeys();
  assert.strictEqual(keys.length, 3);
  assert(keys.includes('KEY1'));
  assert(keys.includes('KEY2'));
  assert(keys.includes('KEY3'));
});

test('loadSecrets returns empty object if .env.lock does not exist', async () => {
  await cleanupLockFile();
  // Ensure lock file doesn't exist
  const secrets = loadSecrets();
  assert.deepStrictEqual(secrets, {});
});

test('loadSecrets decrypts and returns secrets', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  saveSecret('API_KEY', 'secret-api-key');
  saveSecret('DB_URL', 'postgres://localhost/db');
  
  const secrets = loadSecrets();
  
  assert.strictEqual(secrets.API_KEY, 'secret-api-key');
  assert.strictEqual(secrets.DB_URL, 'postgres://localhost/db');
  assert.strictEqual(Object.keys(secrets).length, 2);
});

test('loadSecrets handles special characters', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  const specialValue = 'value with spaces and = and : and "quotes"';
  saveSecret('SPECIAL_KEY', specialValue);
  
  const secrets = loadSecrets();
  assert.strictEqual(secrets.SPECIAL_KEY, specialValue);
});

test('listKeys returns empty array if .env.lock does not exist', async () => {
  await cleanupLockFile();
  const keys = listKeys();
  assert.deepStrictEqual(keys, []);
});

test('listKeys returns sorted keys', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  saveSecret('Z_KEY', 'value');
  saveSecret('A_KEY', 'value');
  saveSecret('M_KEY', 'value');
  
  const keys = listKeys();
  assert.deepStrictEqual(keys, ['A_KEY', 'M_KEY', 'Z_KEY']);
});

test('saveSecret works without explicit init (creates file if needed)', async () => {
  await cleanupLockFile();
  // Don't call initializeLockFile
  saveSecret('AUTO_KEY', 'auto-value');
  
  assert.strictEqual(lockFileExists(), true);
  
  const secrets = loadSecrets();
  assert.strictEqual(secrets.AUTO_KEY, 'auto-value');
});

test('loadSecrets throws error for corrupted JSON', async () => {
  await cleanupLockFile();
  const { writeFileSync } = await import('fs');
  const { resolve } = await import('path');
  
  initializeLockFile();
  
  // Write invalid JSON
  writeFileSync(resolve(process.cwd(), '.env.lock'), 'invalid json{', 'utf8');
  
  assert.throws(
    () => loadSecrets(),
    /Invalid JSON/,
    'Should throw error for corrupted JSON'
  );
});

test('loadSecrets throws error for invalid encrypted data', async () => {
  await cleanupLockFile();
  const { writeFileSync } = await import('fs');
  const { resolve } = await import('path');
  
  initializeLockFile();
  
  // Write valid JSON but invalid encrypted format
  const invalidStore = {
    TEST_KEY: 'invalid-encrypted-format'
  };
  writeFileSync(
    resolve(process.cwd(), '.env.lock'),
    JSON.stringify(invalidStore),
    'utf8'
  );
  
  assert.throws(
    () => loadSecrets(),
    /Failed to decrypt/,
    'Should throw error for invalid encrypted data'
  );
});

