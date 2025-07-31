import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useEncryption } from './EncryptionContext';
import { WebSocketMessage, ChatMessage, MediaContent } from '@shared/api';
import { EncryptedMessage, EncryptedFile, isValidEncryptedMessage, isValidEncryptedFile } from '../utils/crypto';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (content: string, type?: string) => void;
  sendFile: (file: File) => Promise<void>;
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
    decryptFileFromPartner,
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
          console.log('⚠️ Socket connection timeout, enabling fallback mode');
          setIsConnected(true); // Allow chat to work without real-time features
          setPartnerOnline(true); // Assume partner is online for better UX
          console.log('📝 Fallback mode: Messages will be stored locally only');
        }
      }, 5000); // Increased timeout to 5 seconds

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
        setPartnerOnline(false);
      });

      // Handle key exchange
      newSocket.on('key_exchange', (data: { publicKey: string; userId: string }) => {
        console.log('📜 Received partner public key for key exchange from:', data.userId);
        console.log('📜 Public key length:', data.publicKey?.length);
        if (data.publicKey && data.publicKey.length > 0) {
          setPartnerPublicKey(data.publicKey);
          console.log('✅ Partner public key set successfully');
        } else {
          console.error('❌ Invalid public key received');
        }
      });

      newSocket.on('message', async (wsMessage: WebSocketMessage) => {
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

            // Handle encrypted/plain text messages and media
            console.log('📦 Processing received message...', { type: wsMessage.data.type });
            console.log('📦 Content type:', typeof content, 'Content:', content);

            // Check if this is a text/emoji message and handle encryption/plain text
            if (wsMessage.data.type === 'text' || wsMessage.data.type === 'emoji') {
              if (typeof content === 'object' && content !== null && isValidEncryptedMessage(content)) {
                console.log('🔓 Attempting to decrypt text message...');
                try {
                  const decryptedContent = decryptFromPartner(content as EncryptedMessage);
                  if (decryptedContent) {
                    console.log('✅ Successfully decrypted text message');
                    content = decryptedContent;
                  } else {
                    console.warn('⚠️ Failed to decrypt text message - showing encrypted indicator');
                    content = '🔒 [Encrypted message - unable to decrypt]';
                  }
                } catch (error) {
                  console.warn('⚠️ Text decryption error, showing encrypted indicator:', error);
                  content = '🔒 [Encrypted message - decryption failed]';
                }
              } else if (typeof content === 'string') {
                console.log('📝 Received plain text message');
                // Content is already plain text, no decryption needed
              } else {
                console.warn('⚠️ Unexpected content format for text message, converting to string');
                content = String(content);
              }
            } else if (wsMessage.data.type && ['image', 'video', 'file'].includes(wsMessage.data.type)) {
              console.log('📁 Processing media message...');
              try {
                // Parse media content
                const mediaContent: MediaContent = typeof content === 'string'
                  ? JSON.parse(content)
                  : content;

                // Check if the media data is encrypted
                if (typeof mediaContent.data === 'string' && mediaContent.data.startsWith('{')) {
                  try {
                    const encryptedFile = JSON.parse(mediaContent.data);
                    if (isValidEncryptedFile(encryptedFile)) {
                      console.log('🔓 Attempting to decrypt file...');
                      const decryptedUrl = await decryptFileFromPartner(encryptedFile);
                      if (decryptedUrl) {
                        mediaContent.data = decryptedUrl;
                        console.log('✅ Successfully decrypted file');
                      } else {
                        console.error('❌ Failed to decrypt file');
                        mediaContent.data = '#'; // Placeholder
                      }
                    }
                  } catch (parseError) {
                    console.log('📝 Media data is not encrypted JSON');
                  }
                }

                content = mediaContent;
              } catch (error) {
                console.error('❌ Media processing error:', error);
                content = '[Failed to process media]';
              }
            } else {
              console.log('📝 Message is plain text or emoji');
              if (typeof content !== 'string') {
                console.warn('⚠️ Non-string content received, converting:', content);
                content = String(content);
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
    console.log('📤 Attempting to send message:', { content, type, isConnected });

    if (!content.trim()) {
      console.warn('⚠️ Empty message content, not sending');
      return;
    }

    // Always add message to local state immediately for better UX
    const localMessage: ChatMessage = {
      id: `${user?.id}-${Date.now()}`,
      senderId: user?.id || '',
      content: content, // Always show original content locally
      timestamp: new Date().toISOString(),
      type: type as any,
    };
    setMessages(prev => [...prev, localMessage]);

    if (isConnected || !socket) { // Allow fallback mode
      let messageContent: string | EncryptedMessage = content;

      // Encrypt message if keys are available and it's a text/emoji message
      console.log('🔐 Key exchange complete:', keyExchangeComplete);
      console.log('🔑 Available keys:', { hasKeyPair: !!keyPair, hasPartnerKey: !!partnerPublicKey });

      if (keyExchangeComplete && (type === 'text' || type === 'emoji')) {
        console.log('🔒 Encryption available - encrypting text/emoji message...');
        try {
          const encrypted = encryptForPartner(content);
          if (encrypted) {
            console.log('✅ Message encrypted successfully');
            messageContent = encrypted;
          } else {
            console.warn('⚠️ Encryption failed, sending plain text');
            messageContent = content;
          }
        } catch (error) {
          console.warn('⚠️ Encryption error, sending plain text:', error);
          messageContent = content;
        }
      } else {
        console.log('📝 No encryption available or not text message - sending plain');
        messageContent = content;
      }

      // Send to server or simulate in fallback mode
      if (socket && socket.connected) {
        console.log('📤 Sending message via socket');
        socket.emit('send_message', { content: messageContent, type });
      } else {
        console.log('🔄 Socket not connected, message stored locally only');
        // In fallback mode, messages are only stored locally
        // This allows the app to work even without a server connection
      }
    } else {
      console.warn('⚠️ Not connected and no fallback mode');
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket && socket.connected) {
      socket.emit('typing', { isTyping });
    }
    // In fallback mode, typing indicators are disabled
  };

  const sendFile = async (file: File): Promise<void> => {
    try {
      // Convert file to base64 for transmission
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create media content
      const mediaContent = {
        data: fileData,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };

      // Send as message with type based on file type
      let messageType = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      }

      sendMessage(JSON.stringify(mediaContent), messageType);
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
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
    sendFile,
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
