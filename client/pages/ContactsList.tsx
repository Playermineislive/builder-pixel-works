import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  Plus, 
  MessageCircle, 
  UserPlus, 
  Copy, 
  Check, 
  QrCode,
  Globe,
  Shield,
  Star,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Filter,
  ArrowLeft,
  Video,
  Phone,
  MoreVertical,
  Heart,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  unreadCount?: number;
  isTyping?: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
  lastMessage?: {
    content: string;
    timestamp: string;
    isOwn: boolean;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  members: Contact[];
  avatar?: string;
  isPrivate: boolean;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
}

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
  onCreateGroup: (contacts: Contact[]) => void;
  onBack: () => void;
}

export default function ContactsList({ onSelectContact, onCreateGroup, onBack }: ContactsListProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'invites'>('contacts');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'online' | 'favorites' | 'recent'>('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showQRCode, setShowQRCode] = useState(false);

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        email: 'alice@example.com',
        username: 'Alice Johnson',
        isOnline: true,
        status: 'online',
        unreadCount: 3,
        isFavorite: true,
        isPinned: true,
        tags: ['work', 'team'],
        lastMessage: {
          content: 'Hey! How are you doing?',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isOwn: false
        }
      },
      {
        id: '2',
        email: 'bob@example.com',
        username: 'Bob Smith',
        isOnline: true,
        status: 'away',
        unreadCount: 0,
        isFavorite: false,
        isPinned: false,
        tags: ['friend'],
        lastMessage: {
          content: 'Thanks for the help!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isOwn: true
        }
      },
      {
        id: '3',
        email: 'carol@example.com',
        username: 'Carol Wilson',
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unreadCount: 0,
        isFavorite: true,
        isPinned: false,
        tags: ['family'],
        lastMessage: {
          content: 'See you tomorrow!',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isOwn: false
        }
      },
      {
        id: '4',
        email: 'david@example.com',
        username: 'David Brown',
        isOnline: true,
        status: 'busy',
        unreadCount: 1,
        isTyping: true,
        isFavorite: false,
        isPinned: true,
        tags: ['colleague'],
        lastMessage: {
          content: 'Can we schedule a meeting?',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isOwn: false
        }
      }
    ];

    const mockGroups: Group[] = [
      {
        id: 'g1',
        name: 'Team Project',
        description: 'Work collaboration group',
        members: mockContacts.slice(0, 3),
        isPrivate: false,
        unreadCount: 5,
        lastMessage: {
          content: 'Let\'s finalize the presentation',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          sender: 'Alice Johnson'
        }
      },
      {
        id: 'g2',
        name: 'Family Chat',
        description: 'Family group',
        members: [mockContacts[2]],
        isPrivate: true,
        unreadCount: 2,
        lastMessage: {
          content: 'Dinner at 7?',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          sender: 'Carol Wilson'
        }
      }
    ];

    setContacts(mockContacts);
    setGroups(mockGroups);

    // Generate invite code
    setInviteCode(Math.random().toString(36).substring(2, 8).toUpperCase());

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterBy) {
      case 'online':
        return contact.isOnline;
      case 'favorites':
        return contact.isFavorite;
      case 'recent':
        return contact.lastMessage && 
               new Date(contact.lastMessage.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contact: Contact) => {
    if (isSelectionMode) {
      setSelectedContacts(prev =>
        prev.includes(contact.id)
          ? prev.filter(id => id !== contact.id)
          : [...prev, contact.id]
      );
    } else {
      onSelectContact(contact);
    }
  };

  const handleCreateGroup = () => {
    const selectedContactObjects = contacts.filter(c => selectedContacts.includes(c.id));
    onCreateGroup(selectedContactObjects);
    setIsSelectionMode(false);
    setSelectedContacts([]);
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const tabs = [
    { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
    { id: 'groups', label: 'Groups', icon: MessageCircle, count: groups.length },
    { id: 'invites', label: 'Invite', icon: UserPlus, count: 0 }
  ] as const;

  const filters = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'online', label: 'Online', icon: Wifi },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock }
  ] as const;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-white/5 backdrop-blur-sm"
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
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <h1 className="text-2xl font-bold text-white">SecureChat</h1>
              <p className="text-white/70 text-sm">
                {isOnline ? `${contacts.filter(c => c.isOnline).length} online` : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                isSelectionMode 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Create Group"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            <motion.button
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <Input
              placeholder="Search contacts, groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[1.5rem] pl-10 backdrop-blur-sm focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center space-x-2 px-4 pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-[1.5rem] transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    {tab.count}
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Filters for contacts tab */}
        {activeTab === 'contacts' && (
          <motion.div 
            className="flex items-center space-x-2 px-4 pb-4 overflow-x-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filters.map((filter) => {
              const isActive = filterBy === filter.id;
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => setFilterBy(filter.id as any)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-[1rem] transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <filter.icon className="w-3 h-3" />
                  <span className="text-xs">{filter.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Selection mode header */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              className="bg-blue-500/20 border-t border-blue-400/30 px-4 py-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedContacts([]);
                    }}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateGroup}
                    disabled={selectedContacts.length < 2}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {filteredContacts.map((contact, index) => {
                  const isSelected = selectedContacts.includes(contact.id);
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                          isSelected ? 'ring-2 ring-blue-400/50 bg-blue-500/20' : ''
                        }`}
                        onClick={() => handleSelectContact(contact)}
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          animate={{
                            x: [-100, 100],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-[1.5rem] flex items-center justify-center text-white font-semibold text-lg border-2 border-white/20">
                                  {contact.username?.charAt(0) || contact.email.charAt(0).toUpperCase()}
                                </div>
                                <motion.div 
                                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(contact.status)} rounded-full border-2 border-white`}
                                  animate={contact.isOnline ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                {contact.isPinned && (
                                  <motion.div 
                                    className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Crown className="w-2 h-2 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-white font-medium truncate">
                                    {contact.username || contact.email}
                                  </h3>
                                  {contact.isFavorite && (
                                    <Heart className="w-4 h-4 text-red-400 fill-current" />
                                  )}
                                  {contact.isTyping && (
                                    <motion.div
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="text-blue-400 text-xs"
                                    >
                                      typing...
                                    </motion.div>
                                  )}
                                </div>
                                
                                <p className="text-white/60 text-sm truncate">
                                  {contact.lastMessage?.content || contact.email}
                                </p>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  {contact.tags?.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="bg-white/10 text-white/70 text-xs border-white/20">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              {contact.lastMessage && (
                                <span className="text-white/50 text-xs">
                                  {formatLastSeen(contact.lastMessage.timestamp)}
                                </span>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                {contact.unreadCount! > 0 && (
                                  <motion.div
                                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    <span className="text-white text-xs font-bold">
                                      {contact.unreadCount}
                                    </span>
                                  </motion.div>
                                )}
                                
                                {!isSelectionMode && (
                                  <motion.button
                                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all duration-200"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle more options
                                    }}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                
                {filteredContacts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">No contacts found</h3>
                    <p className="text-white/60 text-sm">
                      {searchQuery ? 'Try adjusting your search' : 'Start by inviting some friends'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{
                          x: [-100, 100],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      <CardContent className="p-4 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-[1.5rem] flex items-center justify-center text-white font-semibold text-lg border-2 border-white/20">
                                <MessageCircle className="w-6 h-6" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                                {group.members.length}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-white font-medium truncate">{group.name}</h3>
                                {group.isPrivate && (
                                  <Shield className="w-4 h-4 text-yellow-400" />
                                )}
                              </div>
                              <p className="text-white/60 text-sm truncate">
                                {group.lastMessage?.content || group.description}
                              </p>
                              <p className="text-white/50 text-xs">
                                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            {group.lastMessage && (
                              <span className="text-white/50 text-xs">
                                {formatLastSeen(group.lastMessage.timestamp)}
                              </span>
                            )}
                            
                            {group.unreadCount! > 0 && (
                              <motion.div
                                className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <span className="text-white text-xs font-bold">
                                  {group.unreadCount}
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {filteredGroups.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">No groups found</h3>
                    <p className="text-white/60 text-sm">
                      {searchQuery ? 'Try adjusting your search' : 'Create your first group chat'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'invites' && (
              <motion.div
                key="invites"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Your invite code */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: [-100, 100],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <QrCode className="w-5 h-5" />
                      <span>Your Invite Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="bg-white/10 rounded-[1.5rem] p-4 text-center">
                      <div className="text-3xl font-bold text-white tracking-wider mb-2">
                        {inviteCode}
                      </div>
                      <p className="text-white/60 text-sm">
                        Share this code with friends to connect securely
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={copyInviteCode}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        variant="outline"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => setShowQRCode(!showQRCode)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                    
                    <AnimatePresence>
                      {showQRCode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white rounded-[1.5rem] p-4 text-center"
                        >
                          <div className="w-32 h-32 bg-black/10 rounded-[1rem] mx-auto flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-black/50" />
                          </div>
                          <p className="text-black/60 text-sm mt-2">
                            QR Code for {inviteCode}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Add friend by code */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <UserPlus className="w-5 h-5" />
                      <span>Add Friend</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Enter invite code"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[1.5rem] uppercase tracking-wider text-center"
                      maxLength={6}
                    />
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent invites */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">
                        No recent invite activity
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Connection status */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            className="fixed bottom-4 left-4 right-4 bg-red-500/20 backdrop-blur-md border border-red-400/50 text-red-300 px-4 py-3 rounded-[1.5rem] flex items-center justify-center space-x-2 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
