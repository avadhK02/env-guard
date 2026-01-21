import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { chdir } from 'process';
import { existsSync } from 'fs';
import { loadEnv } from './loader.js';
import { initializeLockFile, saveSecret } from './store.js';

let testDir: string;
let originalCwd: string;
let originalEnv: NodeJS.ProcessEnv;

before(async () => {
  originalCwd = process.cwd();
  originalEnv = { ...process.env };
  testDir = await mkdtemp(join(tmpdir(), 'env-guard-loader-test-'));
  chdir(testDir);
  
  // Clear process.env for clean test
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith('npm_') && !key.startsWith('NODE_')) {
      delete process.env[key];
    }
  }
});

after(async () => {
  chdir(originalCwd);
  process.env = originalEnv;
  await rm(testDir, { recursive: true, force: true });
});

async function cleanupLockFile() {
  if (existsSync('.env.lock')) {
    await unlink('.env.lock').catch(() => {});
  }
}

test('loadEnv loads secrets into process.env', async () => {
  await cleanupLockFile();
  initializeLockFile();
  saveSecret('TEST_API_KEY', 'secret-key-123');
  saveSecret('TEST_DB_URL', 'postgres://localhost/test');
  
  loadEnv();
  
  assert.strictEqual(process.env.TEST_API_KEY, 'secret-key-123');
  assert.strictEqual(process.env.TEST_DB_URL, 'postgres://localhost/test');
});

test('loadEnv does not overwrite existing env vars', async () => {
  await cleanupLockFile();
  initializeLockFile();
  saveSecret('EXISTING_KEY', 'secret-value');
  
  process.env.EXISTING_KEY = 'already-set-value';
  
  loadEnv();
  
  assert.strictEqual(process.env.EXISTING_KEY, 'already-set-value', 'Should not overwrite existing env var');
});

test('loadEnv handles empty .env.lock', async () => {
  await cleanupLockFile();
  initializeLockFile();
  
  loadEnv();
  
  // Should not throw and should not set any vars
  assert.strictEqual(process.env.TEST_NONEXISTENT, undefined);
});

test('loadEnv loads multiple secrets', async () => {
  await cleanupLockFile();
  initializeLockFile();
  saveSecret('KEY1', 'value1');
  saveSecret('KEY2', 'value2');
  saveSecret('KEY3', 'value3');
  
  loadEnv();
  
  assert.strictEqual(process.env.KEY1, 'value1');
  assert.strictEqual(process.env.KEY2, 'value2');
  assert.strictEqual(process.env.KEY3, 'value3');
});

test('loadEnv handles special characters in values', async () => {
  await cleanupLockFile();
  initializeLockFile();
  saveSecret('SPECIAL_KEY', 'value with spaces and = and :');
  
  loadEnv();
  
  assert.strictEqual(process.env.SPECIAL_KEY, 'value with spaces and = and :');
});

test('loadEnv works when .env.lock does not exist', () => {
  // Don't initialize lock file
  loadEnv();
  
  // Should not throw
  assert.ok(true);
});

