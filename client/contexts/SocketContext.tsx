import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { WebSocketMessage, ChatMessage } from '@shared/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (content: string, type?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  partnerTyping: boolean;
  partnerOnline: boolean;
  clearMessages: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      const newSocket = io('/', {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
        setPartnerOnline(false);
      });

      newSocket.on('message', (wsMessage: WebSocketMessage) => {
        console.log('Received message:', wsMessage);
        
        switch (wsMessage.type) {
          case 'message':
            const chatMessage: ChatMessage = {
              id: `${wsMessage.data.senderId}-${wsMessage.timestamp}`,
              senderId: wsMessage.data.senderId,
              content: wsMessage.data.content,
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
  }, [isAuthenticated, token]);

  const sendMessage = (content: string, type: string = 'text') => {
    if (socket && isConnected) {
      // Add message to local state immediately for better UX
      const localMessage: ChatMessage = {
        id: `${user?.id}-${Date.now()}`,
        senderId: user?.id || '',
        content,
        timestamp: new Date().toISOString(),
        type: type as any,
      };
      setMessages(prev => [...prev, localMessage]);
      
      // Send to server
      socket.emit('send_message', { content, type });
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
