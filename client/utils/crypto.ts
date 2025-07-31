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

export interface EncryptedFile {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Generate a secure key pair for encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    // Use Web Crypto API for better security
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
      privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
  } catch (error) {
    console.error('Web Crypto API failed, using fallback:', error);
    // Fallback to CryptoJS for compatibility
    const publicKey = CryptoJS.lib.WordArray.random(256).toString();
    const privateKey = CryptoJS.lib.WordArray.random(256).toString();
    return { publicKey, privateKey };
  }
}

/**
 * Encrypt a text message using AES-256 with shared key
 */
export function encryptMessage(
  message: string,
  sharedKey: string
): EncryptedMessage {
  try {
    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(16); // 128 bits

    // Create a consistent key from the shared key
    const key = CryptoJS.SHA256(sharedKey);

    // Encrypt message with AES-256
    const encryptedContent = CryptoJS.AES.encrypt(message, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    // For symmetric encryption, we don't need to encrypt the key separately
    // Just use a hash of the shared key as verification
    const keyHash = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Base64);

    return {
      encryptedContent,
      encryptedKey: keyHash, // Store key hash for verification
      iv: iv.toString(CryptoJS.enc.Base64)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a text message
 */
export function decryptMessage(
  encryptedMessage: EncryptedMessage,
  sharedKey: string
): string {
  try {
    // Validate input
    if (!encryptedMessage || !sharedKey) {
      throw new Error('Missing encryption parameters');
    }

    if (!encryptedMessage.encryptedContent || !encryptedMessage.encryptedKey || !encryptedMessage.iv) {
      throw new Error('Invalid encrypted message structure');
    }

    console.log('🔓 Starting symmetric decryption process...');
    console.log('📦 Encrypted content length:', encryptedMessage.encryptedContent.length);
    console.log('🔐 IV:', encryptedMessage.iv);

    // Verify key hash (optional security check)
    const expectedKeyHash = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Base64);
    if (encryptedMessage.encryptedKey !== expectedKeyHash) {
      console.warn('⚠️ Key hash mismatch - possible key incompatibility');
    }

    // Create consistent key from shared key
    const key = CryptoJS.SHA256(sharedKey);

    // Parse IV
    let iv: CryptoJS.lib.WordArray;
    try {
      iv = CryptoJS.enc.Base64.parse(encryptedMessage.iv);
      if (!iv || iv.sigBytes <= 0) {
        throw new Error('Invalid IV format');
      }
    } catch (ivError) {
      console.error('IV parsing failed:', ivError);
      throw new Error('Invalid IV Base64 format');
    }

    console.log('🔐 IV parsed successfully');

    // Decrypt the message
    const decryptedMessage = CryptoJS.AES.decrypt(
      encryptedMessage.encryptedContent,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    // Check if decryption was successful
    if (!decryptedMessage || decryptedMessage.sigBytes <= 0) {
      throw new Error('Message decryption failed - no data');
    }

    // Convert to UTF-8 with error handling
    let plaintext: string;
    try {
      plaintext = decryptedMessage.toString(CryptoJS.enc.Utf8);
      if (!plaintext || plaintext.length === 0) {
        throw new Error('Decrypted message is empty');
      }
    } catch (utf8Error) {
      console.error('UTF-8 conversion failed for message:', utf8Error);
      // Try Latin1 as fallback
      try {
        plaintext = decryptedMessage.toString(CryptoJS.enc.Latin1);
        console.warn('⚠️ Used Latin1 fallback for message decoding');
        if (!plaintext || plaintext.length === 0) {
          throw new Error('Fallback decoding also failed');
        }
      } catch (fallbackError) {
        console.error('Fallback decoding failed:', fallbackError);
        throw new Error('Message contains malformed data - unable to decode');
      }
    }

    console.log('✅ Message decrypted successfully, length:', plaintext.length);
    return plaintext;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt message: ${error.message}`);
  }
}

/**
 * Encrypt a file (image, video, etc.)
 */
export function encryptFile(
  fileData: ArrayBuffer,
  fileName: string,
  fileType: string,
  recipientPublicKey: string
): EncryptedFile {
  try {
    // Convert ArrayBuffer to Base64
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileData)));
    
    // Generate random AES key and IV
    const aesKey = CryptoJS.lib.WordArray.random(32);
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt file data with AES-256
    const encryptedData = CryptoJS.AES.encrypt(base64Data, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    // Encrypt AES key with recipient's public key
    const encryptedKey = CryptoJS.AES.encrypt(
      aesKey.toString(CryptoJS.enc.Base64),
      recipientPublicKey
    ).toString();
    
    return {
      encryptedData,
      encryptedKey,
      iv: iv.toString(CryptoJS.enc.Base64),
      fileName,
      fileType,
      fileSize: fileData.byteLength
    };
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file
 */
export function decryptFile(
  encryptedFile: EncryptedFile,
  privateKey: string
): ArrayBuffer {
  try {
    // Decrypt the AES key
    const decryptedKeyBytes = CryptoJS.AES.decrypt(
      encryptedFile.encryptedKey,
      privateKey
    );
    const aesKeyString = decryptedKeyBytes.toString(CryptoJS.enc.Utf8);
    const aesKey = CryptoJS.enc.Base64.parse(aesKeyString);
    
    // Parse IV
    const iv = CryptoJS.enc.Base64.parse(encryptedFile.iv);
    
    // Decrypt the file data
    const decryptedData = CryptoJS.AES.decrypt(
      encryptedFile.encryptedData,
      aesKey,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    const base64Data = decryptedData.toString(CryptoJS.enc.Utf8);
    
    // Convert Base64 back to ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file');
  }
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
 * Validate if an object is a valid encrypted message
 */
export function isValidEncryptedMessage(data: any): data is EncryptedMessage {
  if (typeof data !== 'object' || data === null) {
    console.log('🔍 Invalid encrypted message: not an object');
    return false;
  }

  const hasContent = typeof data.encryptedContent === 'string' && data.encryptedContent.length > 0;
  const hasKey = typeof data.encryptedKey === 'string' && data.encryptedKey.length > 0;
  const hasIv = typeof data.iv === 'string' && data.iv.length > 0;

  console.log('🔍 Validating encrypted message:', {
    hasContent,
    hasKey,
    hasIv,
    contentLength: data.encryptedContent?.length,
    keyLength: data.encryptedKey?.length,
    ivLength: data.iv?.length
  });

  return hasContent && hasKey && hasIv;
}

/**
 * Validate if a Base64 string is properly formatted
 */
export function isValidBase64(str: string): boolean {
  try {
    // Check if string contains only valid Base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }

    // Try to decode and re-encode to verify validity
    const decoded = atob(str);
    const encoded = btoa(decoded);
    return encoded === str;
  } catch {
    return false;
  }
}

/**
 * Clean and validate encrypted message data
 */
export function cleanEncryptedMessage(data: any): EncryptedMessage | null {
  if (!data || typeof data !== 'object') {
    console.error('🧹 Invalid encrypted message data type');
    return null;
  }

  try {
    // Clean and validate each field
    const encryptedContent = typeof data.encryptedContent === 'string'
      ? data.encryptedContent.trim()
      : '';
    const encryptedKey = typeof data.encryptedKey === 'string'
      ? data.encryptedKey.trim()
      : '';
    const iv = typeof data.iv === 'string'
      ? data.iv.trim()
      : '';

    // Validate Base64 format for IV (required for proper decryption)
    if (!isValidBase64(iv)) {
      console.error('🧹 Invalid IV Base64 format');
      return null;
    }

    if (!encryptedContent || !encryptedKey || !iv) {
      console.error('🧹 Missing required encrypted message fields');
      return null;
    }

    const cleaned: EncryptedMessage = {
      encryptedContent,
      encryptedKey,
      iv
    };

    console.log('🧹 Cleaned encrypted message:', {
      contentLength: cleaned.encryptedContent.length,
      keyLength: cleaned.encryptedKey.length,
      ivLength: cleaned.iv.length
    });

    return cleaned;
  } catch (error) {
    console.error('🧹 Failed to clean encrypted message:', error);
    return null;
  }
}

/**
 * Validate if an object is a valid encrypted file
 */
export function isValidEncryptedFile(data: any): data is EncryptedFile {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.encryptedData === 'string' &&
    typeof data.encryptedKey === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.fileName === 'string' &&
    typeof data.fileType === 'string' &&
    typeof data.fileSize === 'number'
  );
}

/**
 * Convert file to ArrayBuffer
 */
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create a blob URL from decrypted file data
 */
export function createBlobUrl(data: ArrayBuffer, mimeType: string): string {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}
