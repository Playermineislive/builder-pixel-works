import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { useTranslation } from '../contexts/TranslationContext';
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
  X,
  Languages,
  Settings,
  Globe,
  Sparkles,
  Zap
} from 'lucide-react';
import { ChatMessage, FileUpload, MediaContent } from '@shared/api';
import MessageBubble from '../components/MessageBubble';
import MediaUpload from '../components/MediaUpload';
import EmojiPicker from '../components/EmojiPicker';
import TranslationSettings from '../components/TranslationSettings';

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
  const { settings: translationSettings } = useTranslation();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messageComposerFocused, setMessageComposerFocused] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
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
      inputRef.current?.focus();
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
            data: JSON.stringify(encryptedFile),
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
        text: 'Awaiting partner keys',
        color: 'bg-yellow-500/20 text-yellow-300',
        iconColor: 'text-yellow-400'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: 'Setting up encryption',
        color: 'bg-orange-500/20 text-orange-300',
        iconColor: 'text-orange-400'
      };
    }
  };

  const encryptionStatus = getEncryptionStatus();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const headerVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  const inputVariants = {
    focused: {
      scale: 1.02,
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
      transition: { duration: 0.2 }
    },
    unfocused: {
      scale: 1,
      boxShadow: "0 0 0px rgba(139, 92, 246, 0)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 relative overflow-hidden prevent-horizontal-scroll"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 right-32 w-24 h-24 bg-purple-300/10 rounded-full blur-lg"
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div variants={headerVariants}>
          <Card className="glass bg-white/10 backdrop-blur-xl border-white/20 rounded-none border-0 border-b border-white/20 shadow-xl">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <User className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{partner.email}</h2>
                    <div className="flex items-center space-x-2 text-sm">
                      <motion.div 
                        className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-green-400' : 'bg-gray-400'}`}
                        animate={{
                          scale: partnerOnline ? [1, 1.2, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: partnerOnline ? Infinity : 0,
                        }}
                      />
                      <span className="text-purple-200 font-medium">
                        {partnerOnline ? 'Online' : 'Offline'}
                      </span>
                      <AnimatePresence>
                        {partnerTyping && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge variant="secondary" className="bg-white/20 text-purple-200 text-xs animate-pulse">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Zap className="w-3 h-3 mr-1" />
                              </motion.div>
                              Typing...
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Translation status */}
                  {translationSettings.enabled && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/20 text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Translation ON
                    </Badge>
                  )}

                  <Badge 
                    variant="secondary" 
                    className={`${encryptionStatus.color} border-0 text-xs transition-all duration-300`}
                  >
                    <encryptionStatus.icon className={`w-3 h-3 mr-1 ${encryptionStatus.iconColor}`} />
                    {encryptionStatus.text}
                  </Badge>

                  <Badge 
                    variant={isConnected ? "default" : "destructive"} 
                    className={`${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border-0 transition-all duration-300`}
                  >
                    {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslationSettings(true)}
                    className="text-purple-200 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <Languages className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-purple-200 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="glass bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md shadow-2xl">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <MessageCircle className="w-16 h-16 text-white/60 mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-white font-bold text-xl mb-3">Secure Chat Active</h3>
                    <p className="text-purple-200 text-base mb-6 leading-relaxed">
                      Your connection is protected with end-to-end encryption. 
                      Start the conversation with {partner.email}!
                    </p>
                    <div className="flex items-center justify-center space-x-6 text-sm text-purple-300">
                      <motion.div 
                        className="flex items-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <encryptionStatus.icon className={`w-4 h-4 mr-2 ${encryptionStatus.iconColor}`} />
                        E2EE
                      </motion.div>
                      <motion.div 
                        className="flex items-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Private
                      </motion.div>
                      {translationSettings.enabled && (
                        <motion.div 
                          className="flex items-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Translate
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className={`message-bubble ${message.senderId === user?.id ? 'order-2' : 'order-1'}`}>
                          <MessageBubble
                            message={message}
                            isOwnMessage={message.senderId === user?.id}
                            isEncrypted={keyExchangeComplete}
                            onImageClick={setSelectedImage}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </div>

            {/* Message input */}
            <Card className="glass bg-white/10 backdrop-blur-xl border-white/20 rounded-none border-0 border-t border-white/20 shadow-xl">
              <CardContent className="p-4">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMediaUpload(true)}
                          className="text-purple-200 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEmojiPicker(true)}
                          className="text-purple-200 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
                        >
                          <Smile className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="flex-1"
                      variants={inputVariants}
                      animate={messageComposerFocused ? "focused" : "unfocused"}
                    >
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        onFocus={() => setMessageComposerFocused(true)}
                        onBlur={() => setMessageComposerFocused(false)}
                        placeholder="Type your message..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/60 focus:bg-white/20 backdrop-blur-sm py-6 rounded-xl transition-all duration-300"
                        disabled={!isConnected}
                      />
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || !isConnected}
                        className="bg-gradient-to-r from-white to-white/90 text-purple-700 hover:from-white/90 hover:to-white/80 font-bold px-6 py-6 rounded-xl shadow-lg transition-all duration-300"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Security indicator */}
                  <motion.div 
                    className="flex items-center justify-center text-xs text-purple-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {keyExchangeComplete 
                      ? 'Messages are end-to-end encrypted with AES-256'
                      : 'Setting up end-to-end encryption...'}
                    {translationSettings.enabled && (
                      <>
                        <span className="mx-2">•</span>
                        <Globe className="w-3 h-3 mr-1" />
                        Real-time translation enabled
                      </>
                    )}
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showMediaUpload && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MediaUpload
              onFileSelect={handleFileUpload}
              onClose={() => setShowMediaUpload(false)}
            />
          </motion.div>
        )}

        {showEmojiPicker && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </motion.div>
        )}

        {showTranslationSettings && (
          <TranslationSettings
            onClose={() => setShowTranslationSettings(false)}
          />
        )}

        {selectedImage && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 z-10 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
              <motion.img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full rounded-xl shadow-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
