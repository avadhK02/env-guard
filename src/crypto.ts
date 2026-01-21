import { createHash, pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { resolve } from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an encryption key from OS username and project path.
 * This ensures the key is both machine-specific and project-specific.
 */
export function deriveKey(projectPath: string): Buffer {
  const username = process.env.USER || process.env.USERNAME || 'default';
  const resolvedPath = resolve(projectPath);
  
  // Create a salt from username and project path
  const saltInput = `${username}:${resolvedPath}`;
  const salt = createHash('sha256').update(saltInput).digest();
  
  // Use PBKDF2 to derive a consistent key
  const key = pbkdf2Sync(
    saltInput,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  
  return key;
}

/**
 * Encrypts a value using AES-256-GCM.
 * Returns a hex-encoded string containing IV, tag, and ciphertext.
 */
export function encrypt(value: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: IV (hex) : TAG (hex) : CIPHERTEXT (hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a value from the encrypted format.
 * Throws an error if decryption fails (tampering detected).
 */
export function decrypt(encryptedValue: string, key: Buffer): string {
  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }
  
  const [ivHex, tagHex, ciphertext] = parts;
  
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error('Invalid IV or tag length');
  }
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Gets the current project path (directory containing .env.lock or process.cwd()).
 */
export function getProjectPath(): string {
  return process.cwd();
}

