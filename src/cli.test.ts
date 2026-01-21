import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { chdir } from 'process';
import { existsSync } from 'fs';
import {
  handleInit,
  handleSet,
  handleList,
} from './cli.js';
import { lockFileExists, loadSecrets } from './store.js';

let testDir: string;
let originalCwd: string;
let originalExit: typeof process.exit;
let originalConsoleError: typeof console.error;
let originalConsoleLog: typeof console.log;
let exitCode: number | null = null;
let consoleOutput: string[] = [];
let consoleErrors: string[] = [];

before(async () => {
  originalCwd = process.cwd();
  testDir = await mkdtemp(join(tmpdir(), 'env-guard-cli-test-'));
  chdir(testDir);
  
  // Mock process.exit
  originalExit = process.exit;
  process.exit = ((code?: number) => {
    exitCode = code ?? 0;
    throw new Error('EXIT');
  }) as typeof process.exit;
  
  // Capture console output
  originalConsoleLog = console.log;
  originalConsoleError = console.error;
  console.log = ((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  }) as typeof console.log;
  console.error = ((...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' '));
  }) as typeof console.error;
});

after(async () => {
  chdir(originalCwd);
  process.exit = originalExit;
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  await rm(testDir, { recursive: true, force: true });
});

async function cleanupFiles() {
  if (existsSync('.env.lock')) {
    await unlink('.env.lock').catch(() => {});
  }
  if (existsSync('.gitignore')) {
    await unlink('.gitignore').catch(() => {});
  }
}

function resetMocks() {
  exitCode = null;
  consoleOutput = [];
  consoleErrors = [];
}

test('handleInit creates .env.lock and updates .gitignore', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    // Ignore exit mock
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(lockFileExists(), true, '.env.lock should be created');
  assert.strictEqual(existsSync('.gitignore'), true, '.gitignore should be created');
  
  // Check .gitignore content
  const content = await readFile('.gitignore', 'utf8');
  assert(content.includes('.env'), '.gitignore should contain .env');
  assert(content.includes('.env.lock'), '.gitignore should contain .env.lock');
  
  assert(consoleOutput.some(msg => msg.includes('Initialized')), 'Should log success message');
});

test('handleInit fails if .env.lock already exists', async () => {
  await cleanupFiles();
  resetMocks();
  
  // First init
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  // Second init should fail
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(exitCode, 1, 'Should exit with code 1');
  assert(consoleErrors.some(msg => msg.includes('already exists')), 'Should show error message');
});

test('handleSet stores secret', async () => {
  await cleanupFiles();
  resetMocks();
  
  // Initialize first
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  // Set a secret
  try {
    handleSet(['TEST_KEY=test-value']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  const secrets = loadSecrets();
  assert.strictEqual(secrets.TEST_KEY, 'test-value');
  assert(consoleOutput.some(msg => msg.includes('Set TEST_KEY')), 'Should log success message');
});

test('handleSet fails without init', async () => {
  await cleanupFiles();
  resetMocks();
  
  // Don't initialize
  try {
    handleSet(['TEST_KEY=test-value']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(exitCode, 1, 'Should exit with code 1');
  assert(consoleErrors.some(msg => msg.includes('not found')), 'Should show error message');
});

test('handleSet fails with invalid format', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  try {
    handleSet(['INVALID_FORMAT']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(exitCode, 1);
  assert(consoleErrors.some(msg => msg.includes('Invalid format') || msg.includes('KEY=value')));
});

test('handleSet fails with empty key', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  try {
    handleSet(['=value']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(exitCode, 1);
  assert(consoleErrors.some(msg => msg.includes('cannot be empty')));
});

test('handleSet handles values with special characters', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  try {
    handleSet(['SPECIAL_KEY=value with spaces and = and :']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  const secrets = loadSecrets();
  assert.strictEqual(secrets.SPECIAL_KEY, 'value with spaces and = and :');
});

test('handleList shows keys', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  try {
    handleSet(['KEY1=value1']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  try {
    handleSet(['KEY2=value2']);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  try {
    handleList();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  const output = consoleOutput.join('\n');
  assert(output.includes('KEY1'), 'Should list KEY1');
  assert(output.includes('KEY2'), 'Should list KEY2');
  assert(!output.includes('value1'), 'Should not show values');
  assert(!output.includes('value2'), 'Should not show values');
});

test('handleList shows message when no secrets', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleInit();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  resetMocks();
  
  try {
    handleList();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  const output = consoleOutput.join('\n');
  assert(output.includes('No secrets') || output.includes('stored'), 'Should show no secrets message');
});

test('handleList fails without init', async () => {
  await cleanupFiles();
  resetMocks();
  
  try {
    handleList();
  } catch (e) {
    if (!(e instanceof Error && e.message === 'EXIT')) throw e;
  }
  
  assert.strictEqual(exitCode, 1);
  assert(consoleErrors.some(msg => msg.includes('not found')));
});

