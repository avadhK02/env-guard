import { loadSecrets } from './store.js';

/**
 * Loads encrypted secrets from .env.lock and sets them in process.env.
 * This function should be called at the start of your application.
 * 
 * @example
 * ```ts
 * import { loadEnv } from 'env-guard';
 * 
 * loadEnv();
 * 
 * // Now process.env contains your decrypted secrets
 * console.log(process.env.API_KEY);
 * ```
 */
export function loadEnv(): void {
  const secrets = loadSecrets();
  
  for (const [key, value] of Object.entries(secrets)) {
    // Only set if not already set (existing env vars take precedence)
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

