import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Shield, 
  ShieldOff, 
  Wifi, 
  WifiOff, 
  Key, 
  Users, 
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface DebugPanelProps {
  onClose: () => void;
}

export default function DebugPanel({ onClose }: DebugPanelProps) {
  const { isConnected, messages, keyExchangeComplete, partnerOnline } = useSocket();
  const { keyPair, partnerPublicKey } = useEncryption();

  const getStatusColor = (status: boolean) => status ? 'text-green-400' : 'text-red-400';
  const getStatusIcon = (status: boolean) => status ? CheckCircle : XCircle;

  const encryptionStatus = {
    hasOwnKeys: !!keyPair,
    hasPartnerKey: !!partnerPublicKey,
    keyExchangeComplete,
    isConnected,
    partnerOnline
  };

  const messageStats = {
    total: messages.length,
    encrypted: messages.filter(m => typeof m.content === 'object').length,
    plainText: messages.filter(m => typeof m.content === 'string').length,
    failed: messages.filter(m => m.content?.includes?.('[Encrypted message')).length
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center space-x-2">
                <Bug className="w-5 h-5" />
                <span>Debug Panel</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                <EyeOff className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Connection Status */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <Wifi className="w-5 h-5" />
                <span>Connection Status</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({
                  'Socket Connected': encryptionStatus.isConnected,
                  'Partner Online': encryptionStatus.partnerOnline,
                  'Own Keys Generated': encryptionStatus.hasOwnKeys,
                  'Partner Key Received': encryptionStatus.hasPartnerKey,
                }).map(([label, status]) => {
                  const IconComponent = getStatusIcon(status);
                  return (
                    <div key={label} className="bg-white/5 rounded-[1.5rem] p-3 flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${getStatusColor(status)}`} />
                      <div>
                        <p className="text-white text-sm font-medium">{label}</p>
                        <p className={`text-xs ${getStatusColor(status)}`}>
                          {status ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Encryption Status */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Encryption Status</span>
              </h3>
              
              <div className="bg-white/5 rounded-[1.5rem] p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {keyExchangeComplete ? (
                    <Shield className="w-6 h-6 text-green-400" />
                  ) : (
                    <ShieldOff className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {keyExchangeComplete ? 'Encryption Ready' : 'Encryption Not Available'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {keyExchangeComplete 
                        ? 'Messages will be encrypted end-to-end'
                        : 'Messages will be sent as plain text'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/60">Own Keys:</p>
                    <p className={getStatusColor(encryptionStatus.hasOwnKeys)}>
                      {encryptionStatus.hasOwnKeys ? 'Generated' : 'Missing'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Partner Key:</p>
                    <p className={getStatusColor(encryptionStatus.hasPartnerKey)}>
                      {encryptionStatus.hasPartnerKey ? 'Received' : 'Waiting'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Statistics */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Message Statistics</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-[1.5rem] p-3">
                  <p className="text-white font-medium text-lg">{messageStats.total}</p>
                  <p className="text-white/60 text-sm">Total Messages</p>
                </div>
                <div className="bg-white/5 rounded-[1.5rem] p-3">
                  <p className="text-green-400 font-medium text-lg">{messageStats.plainText}</p>
                  <p className="text-white/60 text-sm">Plain Text</p>
                </div>
                <div className="bg-white/5 rounded-[1.5rem] p-3">
                  <p className="text-blue-400 font-medium text-lg">{messageStats.encrypted}</p>
                  <p className="text-white/60 text-sm">Encrypted</p>
                </div>
                <div className="bg-white/5 rounded-[1.5rem] p-3">
                  <p className="text-red-400 font-medium text-lg">{messageStats.failed}</p>
                  <p className="text-white/60 text-sm">Failed Decrypt</p>
                </div>
              </div>
            </div>

            {/* Key Information */}
            {(keyPair || partnerPublicKey) && (
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Key Information</span>
                </h3>
                
                <div className="space-y-2">
                  {keyPair && (
                    <div className="bg-white/5 rounded-[1.5rem] p-3">
                      <p className="text-white text-sm font-medium mb-1">Own Public Key</p>
                      <p className="text-white/60 text-xs font-mono break-all">
                        {keyPair.publicKey.substring(0, 64)}...
                      </p>
                    </div>
                  )}
                  
                  {partnerPublicKey && (
                    <div className="bg-white/5 rounded-[1.5rem] p-3">
                      <p className="text-white text-sm font-medium mb-1">Partner Public Key</p>
                      <p className="text-white/60 text-xs font-mono break-all">
                        {partnerPublicKey.substring(0, 64)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Messages Preview */}
            {messages.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-lg">Recent Messages</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {messages.slice(-5).map((message, index) => (
                    <div key={index} className="bg-white/5 rounded-[1.5rem] p-3 text-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            typeof message.content === 'object' 
                              ? 'border-blue-400/50 text-blue-400' 
                              : message.content?.includes?.('[Encrypted message')
                                ? 'border-red-400/50 text-red-400'
                                : 'border-green-400/50 text-green-400'
                          }`}
                        >
                          {typeof message.content === 'object' 
                            ? 'Encrypted' 
                            : message.content?.includes?.('[Encrypted message')
                              ? 'Failed'
                              : 'Plain'
                          }
                        </Badge>
                        <span className="text-white/60">{message.type}</span>
                      </div>
                      <p className="text-white/80 truncate">
                        {typeof message.content === 'string' 
                          ? message.content 
                          : '[Encrypted Object]'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Troubleshooting Tips */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Troubleshooting</span>
              </h3>
              
              <div className="bg-yellow-500/10 border border-yellow-400/50 rounded-[1.5rem] p-4">
                <div className="space-y-2 text-sm">
                  {!encryptionStatus.isConnected && (
                    <p className="text-yellow-400">• Socket not connected - running in fallback mode</p>
                  )}
                  {!encryptionStatus.hasOwnKeys && (
                    <p className="text-yellow-400">• Own encryption keys not generated</p>
                  )}
                  {!encryptionStatus.hasPartnerKey && (
                    <p className="text-yellow-400">• Waiting for partner's public key</p>
                  )}
                  {messageStats.failed > 0 && (
                    <p className="text-yellow-400">• {messageStats.failed} messages failed to decrypt</p>
                  )}
                  {encryptionStatus.isConnected && encryptionStatus.hasOwnKeys && encryptionStatus.hasPartnerKey && (
                    <p className="text-green-400">• All systems operational ✓</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
