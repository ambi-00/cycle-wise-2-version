/**
 * Encryption utilities for sensitive data (passwords, etc.)
 * Uses native Web Crypto API (no external dependencies)
 */

// Default encryption key - IMPORTANT: Change in production!
const DEFAULT_ENCRYPTION_KEY = 'cyclewise-trades-default-key-change-in-production-2026';

/**
 * Derive a key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string using AES-GCM
 * Returns: Base64 encoded string with salt and IV prepended
 */
export async function encryptData(data: string, password = DEFAULT_ENCRYPTION_KEY): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + iv + encrypted data, then base64 encode
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with encryptData()
 */
export async function decryptData(encryptedBase64: string, password = DEFAULT_ENCRYPTION_KEY): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
