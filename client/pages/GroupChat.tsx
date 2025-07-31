import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { useTranslation } from '../contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Users, 
  ArrowLeft, 
  Wifi, 
  WifiOff,
  MessageCircle,
  ShieldCheck,
  Paperclip,
  Smile,
  Languages,
  Settings,
  Search,
  Phone,
  Video,
  MoreVertical,
  UserPlus,
  Volume2,
  VolumeX,
  Pin,
  Star,
  Info,
  Edit,
  Trash,
  Copy,
  Reply,
  Forward,
  Download,
  Eye,
  EyeOff,
  Zap,
  Crown,
  Shield
} from 'lucide-react';
import { ChatMessage, FileUpload, MediaContent } from '@shared/api';
import MessageBubble from '../components/MessageBubble';
import MediaUpload from '../components/MediaUpload';
import EmojiPicker from '../components/EmojiPicker';
import TranslationSettings from '../components/TranslationSettings';

interface GroupMember {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  isOnline: boolean;
  isTyping?: boolean;
  role: 'admin' | 'member';
  joinedAt: string;
  lastSeen?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  createdAt: string;
  createdBy: string;
  members: GroupMember[];
  settings: {
    allowMemberInvites: boolean;
    requireAdminApproval: boolean;
    allowMemberMessages: boolean;
    encryptionLevel: 'standard' | 'enhanced';
  };
}

interface GroupChatProps {
  group: GroupInfo;
  onBack: () => void;
  onUpdateGroup: (group: GroupInfo) => void;
}

export default function GroupChat({ group, onBack, onUpdateGroup }: GroupChatProps) {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    partnerTyping, 
    partnerOnline, 
    isConnected,
    sendFile 
  } = useSocket();
  const { encryptMessage } = useEncryption();
  const { 
    isTranslationEnabled, 
    targetLanguage, 
    translateMessage,
    supportedLanguages 
  } = useTranslation();

  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optimized message filtering
  const filteredMessages = useMemo(() => {
    let msgs = messages;
    
    if (searchQuery) {
      msgs = msgs.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (showPinned) {
      msgs = msgs.filter(msg => pinnedMessages.includes(msg.id));
    }
    
    return msgs;
  }, [messages, searchQuery, showPinned, pinnedMessages]);

  const onlineMembers = group.members.filter(member => member.isOnline);
  const typingMembers = group.members.filter(member => member.isTyping);
  const currentUserRole = group.members.find(m => m.id === user?.id)?.role || 'member';
  const canManageGroup = currentUserRole === 'admin';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    try {
      let messageToSend = newMessage;
      
      // Add reply reference if replying
      if (replyingTo) {
        messageToSend = `@${replyingTo.senderEmail}: ${newMessage}`;
        setReplyingTo(null);
      }

      const encryptedMessage = await encryptMessage(messageToSend);
      await sendMessage(encryptedMessage, 'text');
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [newMessage, encryptMessage, sendMessage, replyingTo]);

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 1000);
  }, [isTyping, sendTyping]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      await sendFile(file);
      setShowMediaUpload(false);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  }, [sendFile]);

  const handlePinMessage = useCallback((messageId: string) => {
    setPinnedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  }, []);

  const handleReplyToMessage = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  const quickActions = [
    { icon: Phone, label: "Voice Call", action: () => console.log('Voice call'), color: "text-green-400" },
    { icon: Video, label: "Video Call", action: () => console.log('Video call'), color: "text-blue-400" },
    { icon: Search, label: "Search", action: () => setShowSearch(!showSearch), color: "text-yellow-400" },
    { icon: Info, label: "Group Info", action: () => setShowGroupInfo(true), color: "text-purple-400" }
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Mobile Members Sidebar */}
      <AnimatePresence>
        {isMobile && showSidebar && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 bg-white/10 backdrop-blur-xl border-l border-white/20"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-semibold">Group Members</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="text-white/70 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <motion.div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                            {member.username?.charAt(0) || member.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.isOnline && (
                          <motion.div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium truncate">
                            {member.username || member.email}
                          </p>
                          {member.role === 'admin' && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-white/60 text-xs">
                          {member.isOnline ? 'Online' : `Last seen ${member.lastSeen ? new Date(member.lastSeen).toLocaleDateString() : 'recently'}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <motion.header 
          className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={onBack}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200"
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-[1.5rem] flex items-center justify-center text-white border-2 border-white/20">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {onlineMembers.length}
                  </motion.div>
                </div>
                
                <div>
                  <h2 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <span>{group.name}</span>
                    {group.isPrivate && <Shield className="w-4 h-4 text-yellow-400" />}
                  </h2>
                  <div className="flex items-center space-x-2 text-white/70 text-sm">
                    <span>{group.members.length} members</span>
                    <span>•</span>
                    <span>{onlineMembers.length} online</span>
                    {typingMembers.length > 0 && (
                      <>
                        <span>•</span>
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-blue-400"
                        >
                          {typingMembers.length} typing...
                        </motion.span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={action.action}
                  className={`w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[1rem] flex items-center justify-center ${action.color} hover:text-white transition-all duration-200 backdrop-blur-sm`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </motion.button>
              ))}
              
              {isMobile && (
                <motion.button
                  onClick={() => setShowSidebar(true)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Users className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                className="mt-4"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[1.5rem] pl-10 backdrop-blur-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPinned(!showPinned)}
                    className={`bg-white/10 border-white/20 text-white hover:bg-white/20 ${showPinned ? 'bg-blue-500/30' : ''}`}
                  >
                    <Pin className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reply preview */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                className="mt-4 bg-white/10 rounded-[1.5rem] p-3 backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-blue-400" />
                    <span className="text-white/70 text-sm">
                      Replying to {replyingTo.senderEmail}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="text-white/70 hover:text-white h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <p className="text-white/80 text-sm mt-1 truncate">
                  {replyingTo.content}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((message, index) => (
              <motion.div
                key={`${message.id}-${index}`}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.02,
                  type: "spring",
                  bounce: 0.3
                }}
                layout
              >
                <div className="max-w-xs lg:max-w-md relative group">
                  {/* Sender info for group messages */}
                  {message.senderId !== user?.id && (
                    <div className="flex items-center space-x-2 mb-1 ml-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                          {message.senderEmail?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-xs font-medium">
                        {group.members.find(m => m.email === message.senderEmail)?.username || message.senderEmail}
                      </span>
                    </div>
                  )}
                  
                  <motion.div
                    className={`p-4 rounded-[2rem] backdrop-blur-sm border border-white/20 relative overflow-hidden ${
                      message.senderId === user?.id
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-gray-600 to-gray-700 text-white'
                    } ${pinnedMessages.includes(message.id) ? 'ring-2 ring-yellow-400/50' : ''}`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    onLongPress={() => setSelectedMessage(message.id)}
                  >
                    {/* Pinned indicator */}
                    {pinnedMessages.includes(message.id) && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Pin className="w-3 h-3 text-yellow-400 fill-current" />
                      </motion.div>
                    )}

                    <MessageBubble 
                      message={message} 
                      isOwn={message.senderId === user?.id}
                      onReact={(emoji) => console.log('React:', emoji)}
                    />
                    
                    {/* Message actions on hover */}
                    <motion.div
                      className="absolute -top-8 right-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <motion.button
                        onClick={() => handleReplyToMessage(message)}
                        className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title="Reply"
                      >
                        <Reply className="w-4 h-4 text-white" />
                      </motion.button>
                      
                      {canManageGroup && (
                        <motion.button
                          onClick={() => handlePinMessage(message.id)}
                          className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          title="Pin Message"
                        >
                          <Pin className="w-4 h-4 text-white" />
                        </motion.button>
                      )}
                      
                      <motion.button
                        onClick={() => console.log('More options')}
                        className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title="More"
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </motion.button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing indicators for multiple users */}
          <AnimatePresence>
            {typingMembers.length > 0 && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-[2rem] px-4 py-3 border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-white/60 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-white/70 text-sm">
                      {typingMembers.map(m => m.username || m.email).join(', ')} 
                      {typingMembers.length === 1 ? ' is' : ' are'} typing...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input section */}
        <motion.div 
          className="p-4 bg-white/5 backdrop-blur-xl border-t border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-end space-x-3">
            <div className="flex space-x-2">
              <motion.button
                onClick={() => setShowMediaUpload(true)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-[1.5rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Paperclip className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-[1.5rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Smile className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${group.name}...`}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[2rem] pr-12 h-12 backdrop-blur-sm focus:ring-2 focus:ring-white/30 transition-all duration-200"
                disabled={!isConnected}
                style={{ fontSize: '16px' }}
              />
              
              {isTranslationEnabled && (
                <motion.div 
                  className="absolute right-12 top-1/2 transform -translate-y-1/2"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Languages className="w-4 h-4 text-white/60" />
                </motion.div>
              )}
            </div>
            
            <motion.button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 rounded-[1.5rem] flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Connection status */}
          <AnimatePresence>
            {!isConnected && (
              <motion.div
                className="mt-3 flex items-center justify-center space-x-2 text-red-300 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <WifiOff className="w-4 h-4" />
                <span>Connection lost. Reconnecting...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Desktop Members Sidebar */}
      {!isMobile && (
        <motion.div 
          className="w-80 bg-white/5 backdrop-blur-xl border-l border-white/20 p-4 overflow-y-auto"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="space-y-6">
            {/* Group actions */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => console.log('Leave group')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </div>
            </div>

            {/* Members list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Members ({group.members.length})</h3>
                {canManageGroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    onClick={() => console.log('Add member')}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {group.members.map((member) => (
                  <motion.div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                          {member.username?.charAt(0) || member.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <motion.div 
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium truncate">
                          {member.username || member.email}
                        </p>
                        {member.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                        {member.id === user?.id && (
                          <Badge variant="outline" className="bg-white/10 text-white/70 text-xs border-white/20">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/60 text-xs">
                        {member.isOnline ? 'Online' : `Last seen ${member.lastSeen ? new Date(member.lastSeen).toLocaleDateString() : 'recently'}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Group settings preview */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Settings</h3>
              <div className="bg-white/5 rounded-[1.5rem] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Encryption</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/50">
                    {group.settings.encryptionLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Privacy</span>
                  <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
                    {group.isPrivate ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            className="absolute bottom-20 left-4 z-50"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setNewMessage(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMediaUpload && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <MediaUpload
                onFileSelect={handleFileUpload}
                onClose={() => setShowMediaUpload(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTranslationSettings && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <TranslationSettings
                onClose={() => setShowTranslationSettings(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security indicator */}
      <motion.div 
        className="fixed bottom-4 right-4 bg-green-500/20 backdrop-blur-md border border-green-400/50 text-green-300 px-3 py-2 rounded-[1.5rem] flex items-center space-x-2 z-40"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs font-medium">End-to-End Encrypted</span>
      </motion.div>
    </div>
  );
}
