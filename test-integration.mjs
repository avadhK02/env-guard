#!/usr/bin/env node

/**
 * Integration test script to verify the package works end-to-end.
 * Run this before publishing: npm run build && node test-integration.mjs
 */

import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { chdir } from 'process';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testDir;
let originalCwd;

async function runTest(name, fn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    console.log('✓ PASSED');
    return true;
  } catch (error) {
    console.log('✗ FAILED');
    console.error(`  Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

async function setup() {
  originalCwd = process.cwd();
  testDir = await mkdtemp(join(tmpdir(), 'env-guard-integration-'));
  chdir(testDir);
}

async function cleanup() {
  if (testDir) {
    chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  }
}

async function main() {
  await setup();
  
  const cliPath = join(__dirname, 'dist', 'bin', 'env-guard.js');
  const results = [];
  
  // Test 1: Init command
  results.push(await runTest('init command', async () => {
    execSync(`node ${cliPath} init`, { stdio: 'pipe' });
    assert(existsSync('.env.lock'), '.env.lock should exist');
    assert(existsSync('.gitignore'), '.gitignore should exist');
    
    const gitignoreContent = await readFile('.gitignore', 'utf8');
    assert(gitignoreContent.includes('.env'), '.gitignore should contain .env');
    assert(gitignoreContent.includes('.env.lock'), '.gitignore should contain .env.lock');
  }));
  
  // Test 2: Set command
  results.push(await runTest('set command', async () => {
    execSync(`node ${cliPath} set API_KEY=secret123`, { stdio: 'pipe' });
    execSync(`node ${cliPath} set DATABASE_URL=postgres://localhost/db`, { stdio: 'pipe' });
    
    const { loadSecrets } = await import(join(__dirname, 'dist', 'src', 'store.js'));
    const secrets = loadSecrets();
    assert(secrets.API_KEY === 'secret123', 'API_KEY should be stored');
    assert(secrets.DATABASE_URL === 'postgres://localhost/db', 'DATABASE_URL should be stored');
  }));
  
  // Test 3: List command
  results.push(await runTest('list command', async () => {
    const output = execSync(`node ${cliPath} list`, { encoding: 'utf8', stdio: 'pipe' });
    assert(output.includes('API_KEY'), 'Should list API_KEY');
    assert(output.includes('DATABASE_URL'), 'Should list DATABASE_URL');
    assert(!output.includes('secret123'), 'Should not show secret values');
    assert(!output.includes('postgres://'), 'Should not show secret values');
  }));
  
  // Test 4: Runtime loader
  results.push(await runTest('runtime loader', async () => {
    const { loadEnv } = await import(join(__dirname, 'dist', 'src', 'loader.js'));
    
    // Clear existing env vars
    delete process.env.API_KEY;
    delete process.env.DATABASE_URL;
    
    loadEnv();
    
    assert(process.env.API_KEY === 'secret123', 'API_KEY should be loaded');
    assert(process.env.DATABASE_URL === 'postgres://localhost/db', 'DATABASE_URL should be loaded');
  }));
  
  // Test 5: Encryption (values should be encrypted in .env.lock)
  results.push(await runTest('encryption', async () => {
    const lockContent = await readFile('.env.lock', 'utf8');
    const lockData = JSON.parse(lockContent);
    
    assert(typeof lockData.API_KEY === 'string', 'API_KEY should be stored as string');
    assert(!lockContent.includes('secret123'), '.env.lock should not contain plaintext');
    assert(!lockContent.includes('postgres://'), '.env.lock should not contain plaintext');
    
    // Encrypted format should be IV:TAG:CIPHERTEXT
    const parts = lockData.API_KEY.split(':');
    assert(parts.length === 3, 'Encrypted value should have 3 parts (IV:TAG:CIPHERTEXT)');
  }));
  
  await cleanup();
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`Tests: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('✓ All integration tests passed!');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  cleanup().finally(() => process.exit(1));
});

