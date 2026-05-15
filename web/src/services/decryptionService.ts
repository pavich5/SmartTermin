/**
 * Decryption service for API responses
 * Uses AES decryption to decrypt responses from the backend in production
 * 
 * NOTE: This is obfuscation, not true security. The key is visible in the frontend code.
 * For true security, use HTTPS and proper authentication. This prevents casual inspection
 * of network traffic but determined attackers can still decrypt the data.
 */

// Encryption key (must match backend key)
// Can be overridden via environment variable for production
const ENCRYPTION_KEY = 
  import.meta.env.VITE_ENCRYPTION_KEY || 
  'replace-with-the-api-encryption-key';

/**
 * Derives a key of the specified length from a password using SHA256
 */
async function deriveKey(password: string, keyLength: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  if (hashArray.length >= keyLength) {
    return hashArray.slice(0, keyLength);
  } else {
    // If hash is shorter, pad with repeated hash
    const result = new Uint8Array(keyLength);
    for (let i = 0; i < keyLength; i++) {
      result[i] = hashArray[i % hashArray.length];
    }
    return result;
  }
}

/**
 * Decrypts an encrypted string using AES-256-CBC
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  try {
    // Decode base64
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Derive key and IV
    const key = await deriveKey(ENCRYPTION_KEY, 32); // 32 bytes for AES-256
    const iv = await deriveKey(ENCRYPTION_KEY + 'IV', 16); // 16 bytes for IV

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      cryptoKey,
      encryptedData
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt response');
  }
}

/**
 * Checks if a response is encrypted (has encrypted: true and data field)
 */
export function isEncryptedResponse(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.encrypted === true &&
    typeof data.data === 'string'
  );
}

/**
 * Decrypts a response if it's encrypted, otherwise returns as-is
 */
export async function decryptResponseIfNeeded<T>(data: any): Promise<T> {
  if (isEncryptedResponse(data)) {
    const decryptedJson = await decrypt(data.data);
    return JSON.parse(decryptedJson) as T;
  }
  return data as T;
}
