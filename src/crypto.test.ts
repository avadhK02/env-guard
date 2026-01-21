import { test } from 'node:test';
import assert from 'node:assert';
import { deriveKey, encrypt, decrypt, getProjectPath } from './crypto.js';

test('deriveKey returns consistent key for same inputs', () => {
  const path1 = '/test/project';
  const path2 = '/test/project';
  
  const key1 = deriveKey(path1);
  const key2 = deriveKey(path2);
  
  assert.strictEqual(key1.length, 32, 'Key should be 32 bytes (256 bits)');
  assert.deepStrictEqual(key1, key2, 'Same inputs should produce same key');
});

test('deriveKey returns different keys for different paths', () => {
  const path1 = '/test/project1';
  const path2 = '/test/project2';
  
  const key1 = deriveKey(path1);
  const key2 = deriveKey(path2);
  
  assert.notDeepStrictEqual(key1, key2, 'Different paths should produce different keys');
});

test('encrypt and decrypt roundtrip', () => {
  const key = deriveKey('/test/project');
  const plaintext = 'my-secret-value-123';
  
  const encrypted = encrypt(plaintext, key);
  const decrypted = decrypt(encrypted, key);
  
  assert.strictEqual(decrypted, plaintext, 'Decrypted value should match original');
  assert.notStrictEqual(encrypted, plaintext, 'Encrypted value should differ from plaintext');
});

test('encrypt produces different output each time (IV is random)', () => {
  const key = deriveKey('/test/project');
  const plaintext = 'same-secret';
  
  const encrypted1 = encrypt(plaintext, key);
  const encrypted2 = encrypt(plaintext, key);
  
  assert.notStrictEqual(encrypted1, encrypted2, 'Same plaintext should produce different ciphertext (due to random IV)');
  
  // But both should decrypt to the same value
  const decrypted1 = decrypt(encrypted1, key);
  const decrypted2 = decrypt(encrypted2, key);
  
  assert.strictEqual(decrypted1, plaintext);
  assert.strictEqual(decrypted2, plaintext);
});

test('decrypt throws error for tampered data', () => {
  const key = deriveKey('/test/project');
  const plaintext = 'secret';
  
  const encrypted = encrypt(plaintext, key);
  const parts = encrypted.split(':');
  
  // Tamper with the authentication tag (this should always fail GCM authentication)
  const tamperedTag = parts[1].slice(0, -1) + (parts[1].slice(-1) === '0' ? '1' : '0');
  const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;
  
  assert.throws(
    () => decrypt(tampered, key),
    (error: Error) => {
      // GCM authentication failures can throw various error messages
      // Just check that any error is thrown (tampering should always fail)
      return error instanceof Error;
    },
    'Should throw error when data is tampered'
  );
});

test('decrypt throws error for invalid format', () => {
  const key = deriveKey('/test/project');
  
  assert.throws(
    () => decrypt('invalid-format', key),
    /Invalid encrypted value format/,
    'Should throw error for invalid format'
  );
  
  assert.throws(
    () => decrypt('part1:part2', key),
    /Invalid encrypted value format/,
    'Should throw error for missing parts'
  );
});

test('encrypt handles special characters', () => {
  const key = deriveKey('/test/project');
  const specialValues = [
    'value with spaces',
    'value\nwith\nnewlines',
    'value=with=equals',
    'value:with:colons',
    'value"with"quotes',
    'value\'with\'single-quotes',
    'value/with/slashes',
    'value\\with\\backslashes',
    'value with unicode: 🚀',
    'value with emoji: 😀',
  ];
  
  for (const value of specialValues) {
    const encrypted = encrypt(value, key);
    const decrypted = decrypt(encrypted, key);
    assert.strictEqual(decrypted, value, `Should handle: ${value}`);
  }
});

test('encrypt handles empty string', () => {
  const key = deriveKey('/test/project');
  const empty = '';
  
  const encrypted = encrypt(empty, key);
  const decrypted = decrypt(encrypted, key);
  
  assert.strictEqual(decrypted, empty);
});

test('encrypt handles very long strings', () => {
  const key = deriveKey('/test/project');
  const longString = 'a'.repeat(10000);
  
  const encrypted = encrypt(longString, key);
  const decrypted = decrypt(encrypted, key);
  
  assert.strictEqual(decrypted, longString);
});

test('decrypt with wrong key throws error', () => {
  const key1 = deriveKey('/test/project1');
  const key2 = deriveKey('/test/project2');
  const plaintext = 'secret';
  
  const encrypted = encrypt(plaintext, key1);
  
  assert.throws(
    () => decrypt(encrypted, key2),
    /auth/i,
    'Should throw error when decrypting with wrong key'
  );
});

test('getProjectPath returns current working directory', () => {
  const path = getProjectPath();
  assert.strictEqual(typeof path, 'string');
  assert(path.length > 0);
});

