import CryptoJS from 'crypto-js';
import { 
  KeyPair, 
  EncryptedMessage, 
  EncryptedFile, 
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile
} from './crypto';

export interface GroupKeyPair extends KeyPair {
  groupId: string;
  keyVersion: number;
  createdAt: string;
}

export interface GroupEncryptedMessage {
  groupId: string;
  senderId: string;
  encryptedContent: string;
  encryptedKeys: { [userId: string]: string }; // AES key encrypted for each member
  iv: string;
  keyVersion: number;
  timestamp: string;
  messageId: string;
}

export interface GroupMemberKey {
  userId: string;
  publicKey: string;
  joinedAt: string;
  keyVersion: number;
}

export interface InviteCode {
  code: string;
  groupId?: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  type: 'friend' | 'group';
  metadata?: {
    groupName?: string;
    encryptionLevel?: 'standard' | 'enhanced';
  };
}

export interface SecureSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  publicKey: string;
  createdAt: string;
  lastActive: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

/**
 * Generate a group-specific key pair
 */
export async function generateGroupKeyPair(groupId: string): Promise<GroupKeyPair> {
  const keyPair = await generateKeyPair();
  
  return {
    ...keyPair,
    groupId,
    keyVersion: 1,
    createdAt: new Date().toISOString()
  };
}

/**
 * Generate an enhanced key pair for group admins with additional security
 */
export async function generateEnhancedKeyPair(): Promise<KeyPair> {
  try {
    // Use stronger encryption for enhanced security
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096, // Stronger than standard 2048
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-512", // Stronger hash
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
    console.error('Enhanced key generation failed, using standard:', error);
    return generateKeyPair();
  }
}

/**
 * Encrypt a message for multiple recipients (group chat)
 */
export function encryptForGroup(
  message: string,
  memberKeys: GroupMemberKey[],
  senderId: string,
  groupId: string
): GroupEncryptedMessage {
  try {
    // Generate random AES key and IV for this message
    const aesKey = CryptoJS.lib.WordArray.random(32); // 256 bits
    const iv = CryptoJS.lib.WordArray.random(16); // 128 bits
    
    // Encrypt message with AES-256
    const encryptedContent = CryptoJS.AES.encrypt(message, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    // Encrypt AES key for each group member
    const encryptedKeys: { [userId: string]: string } = {};
    for (const member of memberKeys) {
      try {
        const encryptedKey = CryptoJS.AES.encrypt(
          aesKey.toString(CryptoJS.enc.Base64),
          member.publicKey
        ).toString();
        encryptedKeys[member.userId] = encryptedKey;
      } catch (error) {
        console.error(`Failed to encrypt for user ${member.userId}:`, error);
        // Continue with other members
      }
    }
    
    return {
      groupId,
      senderId,
      encryptedContent,
      encryptedKeys,
      iv: iv.toString(CryptoJS.enc.Base64),
      keyVersion: 1,
      timestamp: new Date().toISOString(),
      messageId: generateMessageId()
    };
  } catch (error) {
    console.error('Group encryption failed:', error);
    throw new Error('Failed to encrypt message for group');
  }
}

/**
 * Decrypt a group message
 */
export function decryptFromGroup(
  encryptedMessage: GroupEncryptedMessage,
  privateKey: string,
  userId: string
): string {
  try {
    // Get the encrypted AES key for this user
    const encryptedAesKey = encryptedMessage.encryptedKeys[userId];
    if (!encryptedAesKey) {
      throw new Error('No encryption key found for this user');
    }
    
    // Decrypt the AES key
    const decryptedKeyBytes = CryptoJS.AES.decrypt(encryptedAesKey, privateKey);
    const aesKeyString = decryptedKeyBytes.toString(CryptoJS.enc.Utf8);
    const aesKey = CryptoJS.enc.Base64.parse(aesKeyString);
    
    // Parse IV
    const iv = CryptoJS.enc.Base64.parse(encryptedMessage.iv);
    
    // Decrypt the message
    const decryptedMessage = CryptoJS.AES.decrypt(
      encryptedMessage.encryptedContent,
      aesKey,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return decryptedMessage.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Group decryption failed:', error);
    throw new Error('Failed to decrypt group message');
  }
}

/**
 * Generate a secure invite code
 */
export function generateInviteCode(
  type: 'friend' | 'group',
  createdBy: string,
  options: {
    groupId?: string;
    groupName?: string;
    expiresInHours?: number;
    maxUses?: number;
    encryptionLevel?: 'standard' | 'enhanced';
  } = {}
): InviteCode {
  const code = generateSecureCode(8);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (options.expiresInHours || 24));
  
  return {
    code,
    groupId: options.groupId,
    createdBy,
    expiresAt: expiresAt.toISOString(),
    maxUses: options.maxUses || 10,
    currentUses: 0,
    type,
    metadata: {
      groupName: options.groupName,
      encryptionLevel: options.encryptionLevel || 'standard'
    }
  };
}

/**
 * Generate a secure random code
 */
export function generateSecureCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for secure randomness
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += characters[randomValues[i] % characters.length];
  }
  
  return result;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `msg_${timestamp}_${random}`;
}

/**
 * Create a secure session for device tracking
 */
export function createSecureSession(userId: string): SecureSession {
  const deviceId = generateDeviceId();
  
  return {
    sessionId: generateSecureCode(16),
    userId,
    deviceId,
    publicKey: '', // To be set when keys are generated
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    ipAddress: undefined, // Server-side only
    userAgent: navigator.userAgent,
    isActive: true
  };
}

/**
 * Generate a unique device ID
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem('secureChat_deviceId');
  if (stored) {
    return stored;
  }
  
  const deviceId = generateSecureCode(12);
  localStorage.setItem('secureChat_deviceId', deviceId);
  return deviceId;
}

/**
 * Validate invite code format
 */
export function validateInviteCode(code: string): boolean {
  // Check format: 6-12 characters, alphanumeric, uppercase
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  return codeRegex.test(code);
}

/**
 * Check if invite code is expired
 */
export function isInviteCodeExpired(inviteCode: InviteCode): boolean {
  const now = new Date();
  const expiresAt = new Date(inviteCode.expiresAt);
  return now > expiresAt;
}

/**
 * Check if invite code has reached max uses
 */
export function isInviteCodeExhausted(inviteCode: InviteCode): boolean {
  return inviteCode.currentUses >= inviteCode.maxUses;
}

/**
 * Generate QR code data for invite
 */
export function generateQRCodeData(inviteCode: InviteCode): string {
  const baseUrl = window.location.origin;
  const inviteUrl = `${baseUrl}/invite/${inviteCode.code}`;
  
  return JSON.stringify({
    url: inviteUrl,
    code: inviteCode.code,
    type: inviteCode.type,
    app: 'SecureChat',
    version: '1.0'
  });
}

/**
 * Encrypt sensitive user data for local storage
 */
export function encryptLocalData(data: any, userKey: string): string {
  try {
    const dataString = JSON.stringify(data);
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const key = CryptoJS.PBKDF2(userKey, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    const iv = CryptoJS.lib.WordArray.random(128/8);
    const encrypted = CryptoJS.AES.encrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combine salt, iv, and encrypted data
    const combined = salt.concat(iv).concat(encrypted.ciphertext);
    return combined.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('Local data encryption failed:', error);
    throw new Error('Failed to encrypt local data');
  }
}

/**
 * Decrypt sensitive user data from local storage
 */
export function decryptLocalData(encryptedData: string, userKey: string): any {
  try {
    const combined = CryptoJS.enc.Base64.parse(encryptedData);
    
    // Extract salt (16 bytes), iv (16 bytes), and ciphertext
    const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(8));
    
    const key = CryptoJS.PBKDF2(userKey, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Local data decryption failed:', error);
    throw new Error('Failed to decrypt local data');
  }
}

/**
 * Generate a secure backup phrase for key recovery
 */
export function generateBackupPhrase(): string[] {
  const wordList = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt',
    'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice',
    'aerobic', 'affair', 'afford', 'afraid', 'again', 'agent', 'agree', 'ahead',
    'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
    'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already',
    'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused'
  ];
  
  const phrase: string[] = [];
  const randomValues = new Uint8Array(12);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 12; i++) {
    const index = randomValues[i] % wordList.length;
    phrase.push(wordList[index]);
  }
  
  return phrase;
}

/**
 * Validate if object is a valid group encrypted message
 */
export function isValidGroupEncryptedMessage(data: any): data is GroupEncryptedMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.groupId === 'string' &&
    typeof data.senderId === 'string' &&
    typeof data.encryptedContent === 'string' &&
    typeof data.encryptedKeys === 'object' &&
    typeof data.iv === 'string' &&
    typeof data.keyVersion === 'number' &&
    typeof data.timestamp === 'string' &&
    typeof data.messageId === 'string'
  );
}

/**
 * Calculate encryption strength score
 */
export function calculateEncryptionStrength(keyLength: number, algorithm: string): number {
  let score = 0;
  
  // Key length scoring
  if (keyLength >= 4096) score += 40;
  else if (keyLength >= 2048) score += 30;
  else if (keyLength >= 1024) score += 20;
  else score += 10;
  
  // Algorithm scoring
  if (algorithm.includes('SHA-512')) score += 30;
  else if (algorithm.includes('SHA-256')) score += 25;
  else score += 15;
  
  // Additional security features
  score += 30; // For AES-256, IV usage, etc.
  
  return Math.min(score, 100);
}

/**
 * Generate security audit log entry
 */
export function createSecurityAuditEntry(
  action: string,
  userId: string,
  details: any = {}
): any {
  return {
    id: generateMessageId(),
    timestamp: new Date().toISOString(),
    action,
    userId,
    sessionId: getCurrentSessionId(),
    deviceId: generateDeviceId(),
    ipAddress: 'client-side', // Server will populate real IP
    userAgent: navigator.userAgent,
    details,
    severity: getSeverityLevel(action)
  };
}

function getCurrentSessionId(): string {
  return sessionStorage.getItem('secureChat_sessionId') || 'unknown';
}

function getSeverityLevel(action: string): 'low' | 'medium' | 'high' | 'critical' {
  const highSeverityActions = ['key_compromised', 'unauthorized_access', 'encryption_failed'];
  const mediumSeverityActions = ['key_rotation', 'group_member_removed', 'suspicious_login'];
  
  if (highSeverityActions.includes(action)) return 'high';
  if (mediumSeverityActions.includes(action)) return 'medium';
  return 'low';
}
