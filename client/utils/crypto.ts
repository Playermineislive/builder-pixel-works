import CryptoJS from 'crypto-js';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
}

/**
 * Generate RSA-like key pair using Web Crypto API
 * Note: This is a simplified implementation. In production, use proper RSA key generation.
 */
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    // Generate RSA key pair using Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    // Fallback to simpler key generation for demo purposes
    const publicKey = CryptoJS.lib.WordArray.random(256).toString();
    const privateKey = CryptoJS.lib.WordArray.random(256).toString();
    return { publicKey, privateKey };
  }
}

/**
 * Encrypt a message using AES-256 and encrypt the AES key with RSA
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: string
): EncryptedMessage {
  try {
    // Generate random AES key
    const aesKey = CryptoJS.lib.WordArray.random(256/8);
    
    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // Encrypt message with AES
    const encryptedContent = CryptoJS.AES.encrypt(message, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    // For demo purposes, use simple encryption for the AES key
    // In production, use proper RSA encryption
    const encryptedKey = CryptoJS.AES.encrypt(
      aesKey.toString(),
      recipientPublicKey
    ).toString();
    
    return {
      encryptedContent,
      encryptedKey,
      iv: iv.toString()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using the private key and AES
 */
export function decryptMessage(
  encryptedMessage: EncryptedMessage,
  privateKey: string
): string {
  try {
    // Decrypt the AES key using private key
    const decryptedKeyBytes = CryptoJS.AES.decrypt(
      encryptedMessage.encryptedKey,
      privateKey
    );
    const aesKey = CryptoJS.lib.WordArray.create(
      CryptoJS.enc.Utf8.parse(decryptedKeyBytes.toString(CryptoJS.enc.Utf8)).words
    );
    
    // Decrypt the message using AES
    const decryptedMessage = CryptoJS.AES.decrypt(
      encryptedMessage.encryptedContent,
      aesKey,
      {
        iv: CryptoJS.lib.WordArray.create(CryptoJS.enc.Utf8.parse(encryptedMessage.iv).words),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return decryptedMessage.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Derive a key from a password using PBKDF2
 */
export function deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  }).toString();
}

/**
 * Generate a secure random salt
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128/8).toString();
}

/**
 * Hash a string using SHA-256
 */
export function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString();
}

/**
 * Simple demonstration of ECDH-like key exchange
 * Note: This is simplified for demo purposes
 */
export function performKeyExchange(
  privateKeyA: string,
  publicKeyB: string
): string {
  // Simplified key exchange using hash combination
  const sharedSecret = CryptoJS.SHA256(privateKeyA + publicKeyB).toString();
  return sharedSecret;
}

/**
 * Validate if a string is a valid encrypted message format
 */
export function isValidEncryptedMessage(data: any): data is EncryptedMessage {
  return (
    typeof data === 'object' &&
    typeof data.encryptedContent === 'string' &&
    typeof data.encryptedKey === 'string' &&
    typeof data.iv === 'string'
  );
}
