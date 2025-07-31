/**
 * Shared types between client and server for the secure chat application
 */

// Authentication types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Pairing system types
export interface PairingCode {
  code: string;
  userId: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface GenerateCodeResponse {
  success: boolean;
  code?: string;
  expiresAt?: string;
  message?: string;
}

export interface ConnectCodeRequest {
  code: string;
}

export interface ConnectCodeResponse {
  success: boolean;
  partnerId?: string;
  partnerEmail?: string;
  message?: string;
}

// Chat types
export interface Connection {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string | MediaContent; // Can be text or media
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'file' | 'emoji' | 'typing' | 'status';
}

export interface MediaContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // Base64 or encrypted data
  thumbnail?: string; // For videos/images
}

export interface FileUpload {
  file: File;
  type: 'image' | 'video' | 'file';
  thumbnail?: string;
}

// Real-time WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_connected' | 'user_disconnected' | 'error';
  data: any;
  timestamp: string;
}

// Encryption types (for client-side use)
export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  encryptedKey: string; // AES key encrypted with recipient's public key
  iv: string; // Initialization vector for AES
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Connection status
export interface ConnectionStatus {
  isConnected: boolean;
  partnerId?: string;
  partnerEmail?: string;
  connectionId?: string;
}

// Demo response (keep existing)
export interface DemoResponse {
  message: string;
}
