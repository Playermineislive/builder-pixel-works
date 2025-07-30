import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Copy, 
  RefreshCw, 
  Users, 
  Clock, 
  Shield,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { 
  GenerateCodeResponse, 
  ConnectCodeResponse, 
  ConnectionStatus 
} from '@shared/api';

interface PairingProps {
  onPaired: (partnerInfo: { id: string; email: string }) => void;
}

export default function Pairing({ onPaired }: PairingProps) {
  const { token, user } = useAuth();
  const { clearMessages } = useSocket();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generate code state
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  
  // Connect code state
  const [connectCode, setConnectCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState(false);
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [partner, setPartner] = useState<{ id: string; email: string } | null>(null);

  // Timer for code expiry
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Polling to check for partner connections
  const [polling, setPolling] = useState(false);

  // Check connection status on mount and clean up any stale connections
  useEffect(() => {
    // First, try to disconnect any existing connection
    disconnectExisting().then(() => {
      checkConnectionStatus();
    });
  }, []);

  const disconnectExisting = async () => {
    try {
      await fetch('/api/pairing/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log('No existing connection to disconnect');
    }
  };

  // Update timer for code expiry
  useEffect(() => {
    if (codeExpiry) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = codeExpiry.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft(0);
          setGeneratedCode('');
          setCodeExpiry(null);
        } else {
          setTimeLeft(Math.floor(diff / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [codeExpiry]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/pairing/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const status: ConnectionStatus = await response.json();
        setConnectionStatus(status);
        
        if (status.isConnected && status.partnerEmail) {
          setPartner({
            id: status.partnerId!,
            email: status.partnerEmail,
          });
        }
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const generateCode = async () => {
    setIsGenerating(true);
    setGenerateError('');

    try {
      // First, clean up any existing connections
      await disconnectExisting();

      const response = await fetch('/api/pairing/generate-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: GenerateCodeResponse = await response.json();

      if (data.success && data.code) {
        setGeneratedCode(data.code);
        setCodeExpiry(new Date(data.expiresAt!));
      } else {
        setGenerateError(data.message || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Generate code error:', error);
      setGenerateError('Network error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const connectWithCode = async () => {
    if (!connectCode.trim()) {
      setConnectError('Please enter a code');
      return;
    }

    setIsConnecting(true);
    setConnectError('');
    setConnectSuccess(false);

    try {
      // First, clean up any existing connections
      await disconnectExisting();

      const response = await fetch('/api/pairing/connect-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: connectCode.trim().toUpperCase() }),
      });

      const data: ConnectCodeResponse = await response.json();

      if (data.success) {
        const partnerInfo = {
          id: data.partnerId!,
          email: data.partnerEmail!,
        };
        setPartner(partnerInfo);
        setConnectSuccess(true);
        clearMessages();

        // Add a small delay for smooth transition
        setTimeout(() => {
          onPaired(partnerInfo);
        }, 1500);
      } else {
        setConnectError(data.message || 'Failed to connect');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectError('Network error occurred. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="glass bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Checking connection status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus?.isConnected && partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 flex items-center justify-center p-4">
        <Card className="glass bg-white/10 backdrop-blur-md border-white/20 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">Connected!</CardTitle>
            <CardDescription className="text-purple-100">
              You're now securely connected with your partner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="glass bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Connected to:</p>
                  <p className="text-white font-medium">{partner.email}</p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-purple-100">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-3 text-green-400" />
                End-to-end encryption active
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3 text-blue-400" />
                Private chat session established
              </div>
            </div>

            <Button
              onClick={() => onPaired(partner)}
              className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold py-6"
            >
              Start Secure Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute bottom-32 right-32 w-24 h-24 bg-purple-300/20 rounded-full blur-lg animate-bounce"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Connect Securely</h1>
            <p className="text-purple-100">Generate a code or enter a partner's code to start chatting</p>
          </div>

          {/* Main card */}
          <Card className="glass bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Pairing Options</CardTitle>
              <CardDescription className="text-purple-100">
                Choose how you want to connect with your chat partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                  <TabsTrigger 
                    value="generate" 
                    className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    Generate Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="connect" 
                    className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    Enter Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-4 mt-6">
                  {generateError && (
                    <Alert className="bg-red-500/20 border-red-400/50 text-white">
                      <AlertDescription>{generateError}</AlertDescription>
                    </Alert>
                  )}

                  {generatedCode ? (
                    <div className="space-y-4">
                      <div className="glass bg-white/5 rounded-lg p-6 text-center border border-white/10">
                        <Label className="text-purple-200 text-sm">Your Code</Label>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <span className="text-3xl font-mono font-bold text-white tracking-wider">
                            {generatedCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyCode}
                            className="text-purple-200 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {timeLeft > 0 && (
                          <div className="mt-3 flex items-center justify-center space-x-2 text-purple-200">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Expires in {formatTime(timeLeft)}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-purple-200 mb-3">
                          Share this code with your partner to connect securely
                        </p>
                        <Button
                          variant="outline"
                          onClick={generateCode}
                          disabled={isGenerating}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate New Code
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-purple-100 text-sm">
                        Generate a unique code that your partner can use to connect with you securely.
                      </p>
                      <Button
                        onClick={generateCode}
                        disabled={isGenerating}
                        className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold py-6"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="w-5 h-5 mr-2" />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Pairing Code'}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="connect" className="space-y-4 mt-6">
                  {connectError && (
                    <Alert className="bg-red-500/20 border-red-400/50 text-white">
                      <AlertDescription>{connectError}</AlertDescription>
                    </Alert>
                  )}

                  {connectSuccess && (
                    <Alert className="bg-green-500/20 border-green-400/50 text-white">
                      <AlertDescription className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Successfully connected! Starting secure chat...
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="connectCode" className="text-white font-medium">
                        Partner's Code
                      </Label>
                      <Input
                        id="connectCode"
                        type="text"
                        value={connectCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setConnectCode(value);
                          // Auto-submit when 6 characters are entered
                          if (value.length === 6 && !isConnecting) {
                            setTimeout(() => connectWithCode(), 500);
                          }
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40 font-mono text-center text-lg tracking-wider"
                        placeholder="ENTER CODE"
                        disabled={isConnecting}
                        maxLength={6}
                      />
                    </div>

                    <Button
                      onClick={connectWithCode}
                      disabled={isConnecting || !connectCode.trim()}
                      className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold py-6"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Users className="w-5 h-5 mr-2" />
                      )}
                      {isConnecting ? 'Connecting...' : 'Connect with Partner'}
                    </Button>

                    <p className="text-purple-100 text-sm text-center">
                      Enter the 6-character code shared by your partner
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Security notice */}
          <div className="glass bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm">Secure Connection</p>
                <p className="text-purple-200 text-xs mt-1">
                  All communications are protected with end-to-end encryption. 
                  Codes expire after 5 minutes for maximum security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
