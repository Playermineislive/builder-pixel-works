import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import Auth from './Auth';
import Pairing from './Pairing';
import Chat from './Chat';
import { Loader2 } from 'lucide-react';
import { ConnectionStatus } from '@shared/api';

type AppState = 'auth' | 'pairing' | 'chat';

export default function Index() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [appState, setAppState] = useState<AppState>('auth');
  const [partner, setPartner] = useState<{ id: string; email: string } | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Check connection status when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      checkConnectionStatus();
    }
  }, [isAuthenticated, token]);

  const checkConnectionStatus = async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch('/api/pairing/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const status: ConnectionStatus = await response.json();
        
        if (status.isConnected && status.partnerEmail) {
          setPartner({
            id: status.partnerId!,
            email: status.partnerEmail,
          });
          setAppState('chat');
        } else {
          setAppState('pairing');
        }
      } else {
        setAppState('pairing');
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setAppState('pairing');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handlePaired = () => {
    setAppState('chat');
    // The partner info will be set by the Pairing component
  };

  const handleDisconnect = () => {
    setPartner(null);
    setAppState('pairing');
  };

  // Show loading while checking authentication
  if (isLoading || isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="glass bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading SecureChat...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Wrap chat-related components with SocketProvider
  if (appState === 'chat' && partner) {
    return (
      <SocketProvider>
        <Chat partner={partner} onDisconnect={handleDisconnect} />
      </SocketProvider>
    );
  }

  if (appState === 'pairing') {
    return (
      <SocketProvider>
        <Pairing onPaired={handlePaired} />
      </SocketProvider>
    );
  }

  // Fallback
  return <Auth />;
}
