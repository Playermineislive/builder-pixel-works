import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useEncryption } from './EncryptionContext';
import { WebSocketMessage, ChatMessage } from '@shared/api';
import { EncryptedMessage, isValidEncryptedMessage } from '../utils/crypto';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (content: string, type?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  partnerTyping: boolean;
  partnerOnline: boolean;
  clearMessages: () => void;
  keyExchangeComplete: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const { 
    keyPair, 
    partnerPublicKey, 
    encryptForPartner, 
    decryptFromPartner, 
    setPartnerPublicKey,
    generateKeys,
    isKeysGenerated 
  } = useEncryption();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [keyExchangeComplete, setKeyExchangeComplete] = useState(false);

  // Generate keys when socket provider initializes
  useEffect(() => {
    if (isAuthenticated && !isKeysGenerated) {
      generateKeys();
    }
  }, [isAuthenticated, isKeysGenerated, generateKeys]);

  // Check if key exchange is complete
  useEffect(() => {
    setKeyExchangeComplete(!!(keyPair && partnerPublicKey));
  }, [keyPair, partnerPublicKey]);

  useEffect(() => {
    if (isAuthenticated && token && !socket && isKeysGenerated) {
      const newSocket = io('/', {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        
        // Send public key for key exchange
        if (keyPair?.publicKey) {
          newSocket.emit('key_exchange', { 
            publicKey: keyPair.publicKey 
          });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
        setPartnerOnline(false);
      });

      // Handle key exchange
      newSocket.on('key_exchange', (data: { publicKey: string; userId: string }) => {
        console.log('Received partner public key for key exchange');
        setPartnerPublicKey(data.publicKey);
      });

      newSocket.on('message', (wsMessage: WebSocketMessage) => {
        console.log('Received message:', wsMessage);
        
        switch (wsMessage.type) {
          case 'message':
            let content = wsMessage.data.content;
            
            // Try to decrypt if it's an encrypted message
            if (typeof content === 'object' && isValidEncryptedMessage(content)) {
              const decryptedContent = decryptFromPartner(content as EncryptedMessage);
              if (decryptedContent) {
                content = decryptedContent;
              } else {
                content = '[Failed to decrypt message]';
                console.error('Failed to decrypt received message');
              }
            }
            
            const chatMessage: ChatMessage = {
              id: `${wsMessage.data.senderId}-${wsMessage.timestamp}`,
              senderId: wsMessage.data.senderId,
              content: content as string,
              timestamp: wsMessage.data.timestamp,
              type: wsMessage.data.type,
            };
            setMessages(prev => [...prev, chatMessage]);
            break;
            
          case 'typing':
            setPartnerTyping(wsMessage.data.isTyping);
            // Clear typing indicator after 3 seconds if no update
            if (wsMessage.data.isTyping) {
              setTimeout(() => setPartnerTyping(false), 3000);
            }
            break;
            
          case 'user_connected':
            setPartnerOnline(true);
            // Request key exchange when partner connects
            if (keyPair?.publicKey) {
              newSocket.emit('key_exchange', { 
                publicKey: keyPair.publicKey 
              });
            }
            break;
            
          case 'user_disconnected':
            setPartnerOnline(false);
            setPartnerTyping(false);
            break;
            
          case 'error':
            console.error('WebSocket error:', wsMessage.data);
            break;
        }
      });

      newSocket.on('message_sent', (data: { success: boolean }) => {
        if (data.success) {
          console.log('Message sent successfully');
        }
      });

      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, token, isKeysGenerated, keyPair]);

  const sendMessage = (content: string, type: string = 'text') => {
    if (socket && isConnected) {
      let messageContent: string | EncryptedMessage = content;
      
      // Encrypt message if keys are available
      if (keyExchangeComplete) {
        const encrypted = encryptForPartner(content);
        if (encrypted) {
          messageContent = encrypted;
        } else {
          console.error('Failed to encrypt message, sending plain text');
        }
      }
      
      // Add message to local state immediately for better UX
      const localMessage: ChatMessage = {
        id: `${user?.id}-${Date.now()}`,
        senderId: user?.id || '',
        content: content, // Always show decrypted content locally
        timestamp: new Date().toISOString(),
        type: type as any,
      };
      setMessages(prev => [...prev, localMessage]);
      
      // Send to server (encrypted or plain)
      socket.emit('send_message', { content: messageContent, type });
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { isTyping });
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    messages,
    sendMessage,
    sendTyping,
    partnerTyping,
    partnerOnline,
    clearMessages,
    keyExchangeComplete,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
