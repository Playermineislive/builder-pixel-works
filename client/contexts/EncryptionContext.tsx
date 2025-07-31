import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
  KeyPair,
  EncryptedMessage,
  EncryptedFile,
  isValidEncryptedMessage,
  isValidEncryptedFile,
  cleanEncryptedMessage,
  fileToArrayBuffer,
  createBlobUrl
} from '../utils/crypto';

interface EncryptionContextType {
  keyPair: KeyPair | null;
  partnerPublicKey: string | null;
  sharedKey: string | null;
  isKeysGenerated: boolean;
  generateKeys: () => Promise<void>;
  setPartnerPublicKey: (key: string) => void;
  encryptForPartner: (message: string) => EncryptedMessage | null;
  decryptFromPartner: (encryptedMessage: EncryptedMessage) => string | null;
  encryptFileForPartner: (file: File) => Promise<EncryptedFile | null>;
  decryptFileFromPartner: (encryptedFile: EncryptedFile) => Promise<string | null>;
  clearKeys: () => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

interface EncryptionProviderProps {
  children: ReactNode;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({ children }) => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [partnerPublicKey, setPartnerPublicKeyState] = useState<string | null>(null);
  const [isKeysGenerated, setIsKeysGenerated] = useState(false);

  // Load keys from localStorage on mount
  useEffect(() => {
    const savedKeyPair = localStorage.getItem('encryptionKeyPair');
    const savedPartnerKey = localStorage.getItem('partnerPublicKey');

    if (savedKeyPair) {
      try {
        const parsedKeyPair = JSON.parse(savedKeyPair);
        setKeyPair(parsedKeyPair);
        setIsKeysGenerated(true);
      } catch (error) {
        console.error('Failed to load saved key pair:', error);
        localStorage.removeItem('encryptionKeyPair');
      }
    }

    if (savedPartnerKey) {
      setPartnerPublicKeyState(savedPartnerKey);
    }
  }, []);

  const generateKeys = async () => {
    try {
      console.log('Generating encryption keys...');
      const newKeyPair = await generateKeyPair();
      setKeyPair(newKeyPair);
      setIsKeysGenerated(true);
      
      // Save to localStorage
      localStorage.setItem('encryptionKeyPair', JSON.stringify(newKeyPair));
      console.log('Encryption keys generated successfully');
    } catch (error) {
      console.error('Failed to generate encryption keys:', error);
      throw error;
    }
  };

  const setPartnerPublicKey = (key: string) => {
    setPartnerPublicKeyState(key);
    localStorage.setItem('partnerPublicKey', key);
  };

  const encryptForPartner = (message: string): EncryptedMessage | null => {
    if (!partnerPublicKey) {
      console.error('No partner public key available for encryption');
      return null;
    }

    try {
      return encryptMessage(message, partnerPublicKey);
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      return null;
    }
  };

  const decryptFromPartner = (encryptedMessage: EncryptedMessage): string | null => {
    if (!keyPair?.privateKey) {
      console.error('No private key available for decryption');
      return null;
    }

    // Clean and validate the encrypted message
    const cleanedMessage = cleanEncryptedMessage(encryptedMessage);
    if (!cleanedMessage) {
      console.error('❌ Invalid or corrupted encrypted message format');
      console.error('📦 Original message:', encryptedMessage);
      return null;
    }

    console.log('🔓 Attempting to decrypt message with private key...');
    console.log('🔑 Private key length:', keyPair.privateKey.length);
    console.log('📦 Cleaned encrypted message structure:', {
      contentLength: cleanedMessage.encryptedContent.length,
      keyLength: cleanedMessage.encryptedKey.length,
      ivLength: cleanedMessage.iv.length
    });

    try {
      const result = decryptMessage(cleanedMessage, keyPair.privateKey);
      console.log('✅ Decryption successful in EncryptionContext, result length:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to decrypt message in EncryptionContext:', error);

      // Check if this might be a key mismatch or data corruption
      if (error.message.includes('UTF-8') || error.message.includes('malformed')) {
        console.error('🔑 Data corruption detected - UTF-8 conversion failed');
        console.error('🔑 This usually means wrong decryption key or corrupted data');
      } else if (error.message.includes('key')) {
        console.error('🔑 Key-related error - possible key mismatch');
      } else if (error.message.includes('Base64')) {
        console.error('📦 Base64 encoding issue - data may be corrupted');
      }

      return null;
    }
  };

  const encryptFileForPartner = async (file: File): Promise<EncryptedFile | null> => {
    if (!partnerPublicKey) {
      console.error('No partner public key available for file encryption');
      return null;
    }

    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      return encryptFile(arrayBuffer, file.name, file.type, partnerPublicKey);
    } catch (error) {
      console.error('Failed to encrypt file:', error);
      return null;
    }
  };

  const decryptFileFromPartner = async (encryptedFile: EncryptedFile): Promise<string | null> => {
    if (!keyPair?.privateKey) {
      console.error('No private key available for file decryption');
      return null;
    }

    if (!isValidEncryptedFile(encryptedFile)) {
      console.error('Invalid encrypted file format');
      return null;
    }

    try {
      const decryptedData = decryptFile(encryptedFile, keyPair.privateKey);
      return createBlobUrl(decryptedData, encryptedFile.fileType);
    } catch (error) {
      console.error('Failed to decrypt file:', error);
      return null;
    }
  };

  const clearKeys = () => {
    setKeyPair(null);
    setPartnerPublicKeyState(null);
    setIsKeysGenerated(false);
    localStorage.removeItem('encryptionKeyPair');
    localStorage.removeItem('partnerPublicKey');
  };

  const value: EncryptionContextType = {
    keyPair,
    partnerPublicKey,
    isKeysGenerated,
    generateKeys,
    setPartnerPublicKey,
    encryptForPartner,
    decryptFromPartner,
    encryptFileForPartner,
    decryptFileFromPartner,
    clearKeys,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = (): EncryptionContextType => {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};
