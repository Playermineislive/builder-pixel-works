import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Shield, 
  Users, 
  LogOut, 
  Wifi, 
  WifiOff,
  MessageCircle,
  User,
  ShieldCheck,
  AlertTriangle,
  Paperclip,
  Smile,
  Camera,
  Video,
  X
} from 'lucide-react';
import { ChatMessage, FileUpload, MediaContent } from '@shared/api';
import MessageBubble from '../components/MessageBubble';
import MediaUpload from '../components/MediaUpload';
import EmojiPicker from '../components/EmojiPicker';

interface ChatProps {
  partner: { id: string; email: string };
  onDisconnect: () => void;
}

export default function Chat({ partner, onDisconnect }: ChatProps) {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    partnerTyping, 
    partnerOnline, 
    isConnected,
    keyExchangeComplete 
  } = useSocket();
  const { keyPair, partnerPublicKey, encryptFileForPartner } = useEncryption();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (isTyping) {
      sendTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, sendTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() && isConnected) {
      sendMessage(newMessage.trim(), 'text');
      setNewMessage('');
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.length > 0 && !isTyping) {
      setIsTyping(true);
    } else if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (emoji.length === 1) {
      // Single emoji - send as emoji message
      sendMessage(emoji, 'emoji');
    } else {
      // Multiple emojis or text - add to input
      setNewMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (fileUpload: FileUpload) => {
    try {
      console.log('📁 Processing file upload:', fileUpload.file.name);
      
      if (keyExchangeComplete) {
        // Encrypt the file
        console.log('🔒 Encrypting file...');
        const encryptedFile = await encryptFileForPartner(fileUpload.file);
        
        if (encryptedFile) {
          const mediaContent: MediaContent = {
            fileName: encryptedFile.fileName,
            fileType: encryptedFile.fileType,
            fileSize: encryptedFile.fileSize,
            data: JSON.stringify(encryptedFile), // Send encrypted file as JSON
            thumbnail: fileUpload.thumbnail
          };
          
          sendMessage(JSON.stringify(mediaContent), fileUpload.type);
          console.log('✅ Encrypted file sent');
        } else {
          console.error('❌ Failed to encrypt file');
          alert('Failed to encrypt file. Please try again.');
        }
      } else {
        // Send file without encryption (fallback)
        console.log('📝 Sending file without encryption');
        const reader = new FileReader();
        reader.onload = () => {
          const mediaContent: MediaContent = {
            fileName: fileUpload.file.name,
            fileType: fileUpload.file.type,
            fileSize: fileUpload.file.size,
            data: reader.result as string,
            thumbnail: fileUpload.thumbnail
          };
          
          sendMessage(JSON.stringify(mediaContent), fileUpload.type);
        };
        reader.readAsDataURL(fileUpload.file);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setShowMediaUpload(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/pairing/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const getEncryptionStatus = () => {
    if (keyExchangeComplete) {
      return {
        icon: ShieldCheck,
        text: 'End-to-end encrypted',
        color: 'bg-green-500/20 text-green-300',
        iconColor: 'text-green-400'
      };
    } else if (keyPair && !partnerPublicKey) {
      return {
        icon: AlertTriangle,
        text: 'Setting up encryption',
        color: 'bg-yellow-500/20 text-yellow-300',
        iconColor: 'text-yellow-400'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: 'Plain text mode',
        color: 'bg-blue-500/20 text-blue-300',
        iconColor: 'text-blue-400'
      };
    }
  };

  const encryptionStatus = getEncryptionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 relative overflow-hidden prevent-horizontal-scroll">
      {/* Background elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute bottom-32 right-32 w-24 h-24 bg-purple-300/10 rounded-full blur-lg animate-bounce"></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <Card className="glass bg-white/10 backdrop-blur-md border-white/20 rounded-none border-0 border-b border-white/20">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">{partner.email}</h2>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <span className="text-purple-200">
                      {partnerOnline ? 'Online' : 'Offline'}
                    </span>
                    {partnerTyping && (
                      <Badge variant="secondary" className="bg-white/20 text-purple-200 text-xs typing-indicator">
                        Typing...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={`${encryptionStatus.color} border-0 text-xs`}
                >
                  <encryptionStatus.icon className={`w-3 h-3 mr-1 ${encryptionStatus.iconColor}`} />
                  {encryptionStatus.text}
                </Badge>

                <Badge 
                  variant={isConnected ? "default" : "destructive"} 
                  className={`${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border-0`}
                >
                  {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-purple-200 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="glass bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md">
                    <MessageCircle className="w-12 h-12 text-white/60 mx-auto mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">Secure Chat Active</h3>
                    <p className="text-purple-200 text-sm mb-4">
                      Your connection is protected with end-to-end encryption. 
                      Start the conversation with {partner.email}!
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-purple-300">
                      <div className="flex items-center">
                        <encryptionStatus.icon className={`w-3 h-3 mr-1 ${encryptionStatus.iconColor}`} />
                        E2EE
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Private
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`message-bubble max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'order-2' : 'order-1'}`}>
                        <MessageBubble
                          message={message}
                          isOwnMessage={message.senderId === user?.id}
                          isEncrypted={keyExchangeComplete}
                          onImageClick={setSelectedImage}
                        />
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <Card className="glass bg-white/10 backdrop-blur-md border-white/20 rounded-none border-0 border-t border-white/20">
              <CardContent className="p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMediaUpload(true)}
                      className="text-purple-200 hover:text-white hover:bg-white/10"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(true)}
                      className="text-purple-200 hover:text-white hover:bg-white/10"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40 py-6"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-white text-purple-700 hover:bg-white/90 px-6 py-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>

                {/* Security indicator */}
                <div className="flex items-center justify-center mt-3 text-xs text-purple-300">
                  <Shield className="w-3 h-3 mr-1" />
                  {keyExchangeComplete 
                    ? 'Messages are end-to-end encrypted with AES-256'
                    : 'Setting up end-to-end encryption...'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Media Upload Modal */}
      {showMediaUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <MediaUpload
            onFileSelect={handleFileUpload}
            onClose={() => setShowMediaUpload(false)}
          />
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 z-10"
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
