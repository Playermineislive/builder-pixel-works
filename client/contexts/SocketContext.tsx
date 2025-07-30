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
      console.log('Initializing Socket.IO connection...');
      const newSocket = io('/', {
        auth: {
          token,
        },
        transports: ['polling', 'websocket'], // Fallback to polling if websocket fails
        upgrade: true,
        rememberUpgrade: true,
        timeout: 5000, // 5 second timeout
        forceNew: true, // Force new connection
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to chat server');
        setIsConnected(true);
        clearTimeout(connectionTimeout);

        // Send user info to server
        if (user) {
          newSocket.emit('user_join', {
            userId: user.id,
            userEmail: user.email
          });
        }

        // Send public key for key exchange
        if (keyPair?.publicKey) {
          console.log('📤 Sending public key for key exchange');
          newSocket.emit('key_exchange', {
            publicKey: keyPair.publicKey
          });
        }
      });

      // Set up connection timeout fallback
      const connectionTimeout = setTimeout(() => {
        if (!newSocket.connected) {
          console.log('⚠️ Socket connection timeout, using fallback mode');
          setIsConnected(true); // Allow chat to work without real-time features
          setPartnerOnline(true); // Assume partner is online for better UX
        }
      }, 3000);

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
            console.log('📨 Received message:', wsMessage.data);
            console.log('👤 Current user ID:', user?.id);
            console.log('📤 Message sender ID:', wsMessage.data.senderId);

            // Don't add messages from the current user to avoid duplicates
            if (wsMessage.data.senderId === user?.id) {
              console.log('❌ Ignoring echo message from self');
              break;
            }

            console.log('✅ Adding partner message to chat');

            let content = wsMessage.data.content;
            console.log('📦 Message content type:', typeof content);
            console.log('📦 Message content:', content);
            console.log('🔐 Key exchange complete:', keyExchangeComplete);

            // Only try to decrypt if it's actually an encrypted object
            if (typeof content === 'object' && content !== null && isValidEncryptedMessage(content)) {
              console.log('🔓 Attempting to decrypt message...');
              const decryptedContent = decryptFromPartner(content as EncryptedMessage);
              if (decryptedContent) {
                console.log('✅ Successfully decrypted message');
                content = decryptedContent;
              } else {
                console.error('❌ Failed to decrypt received message');
                content = '[Failed to decrypt message]';
              }
            } else {
              console.log('📝 Message is plain text, no decryption needed');
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

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error);
      });

      newSocket.on('error', (error: any) => {
        console.error('❌ Socket error:', error);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      clearTimeout(connectionTimeout);
    };
  }, [isAuthenticated, token, isKeysGenerated, keyPair]);

  const sendMessage = (content: string, type: string = 'text') => {
    if (isConnected) { // Remove socket dependency for fallback mode
      let messageContent: string | EncryptedMessage = content;
      
      // Encrypt message if keys are available
      console.log('🔐 Key exchange complete:', keyExchangeComplete);
      console.log('🔑 Available keys:', { hasKeyPair: !!keyPair, hasPartnerKey: !!partnerPublicKey });

      if (keyExchangeComplete) {
        console.log('🔒 Encrypting message...');
        const encrypted = encryptForPartner(content);
        if (encrypted) {
          console.log('✅ Message encrypted successfully');
          messageContent = encrypted;
        } else {
          console.error('❌ Failed to encrypt message, sending plain text');
        }
      } else {
        console.log('📝 Sending plain text (encryption not ready)');
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
      
      // Send to server (encrypted or plain) or simulate in fallback mode
      if (socket && socket.connected) {
        console.log('📤 Sending message via socket:', content);
        socket.emit('send_message', { content: messageContent, type });
      } else {
        console.log('📤 Sending message in fallback mode:', content);
        // In fallback mode, messages are only stored locally
      }
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket && socket.connected) {
      socket.emit('typing', { isTyping });
    }
    // In fallback mode, typing indicators are disabled
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
