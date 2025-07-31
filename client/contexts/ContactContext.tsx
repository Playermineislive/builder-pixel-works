import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { generateSecureCode, generateInviteCode, InviteCode } from '../utils/groupCrypto';

export interface Contact {
  id: string;
  email: string;
  username?: string;
  displayName?: string; // Custom name set by user
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  unreadCount?: number;
  isTyping?: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
  publicKey?: string;
  connectionDate?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    isOwn: boolean;
  };
}

export interface GroupMember extends Contact {
  role: 'admin' | 'member';
  joinedAt: string;
  permissions: {
    canInvite: boolean;
    canRemoveMembers: boolean;
    canEditGroup: boolean;
    canDeleteMessages: boolean;
  };
}

export interface Group {
  id: string;
  name: string;
  displayName?: string; // Custom name set by user
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  createdAt: string;
  createdBy: string;
  members: GroupMember[];
  admins: string[]; // Array of user IDs who are admins
  settings: {
    allowMemberInvites: boolean;
    requireAdminApproval: boolean;
    allowMemberMessages: boolean;
    encryptionLevel: 'standard' | 'enhanced';
    allowNameChange: boolean;
  };
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
}

interface ContactContextType {
  contacts: Contact[];
  groups: Group[];
  pendingRequests: Contact[];
  currentInviteCode: InviteCode | null;
  userProfile: {
    id: string;
    email: string;
    username?: string;
    avatar?: string;
  } | null;
  addContact: (contact: Contact) => void;
  removeContact: (contactId: string) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  renameContact: (contactId: string, newName: string) => void;
  updateUserProfile: (updates: { username?: string; avatar?: string }) => void;
  createGroup: (name: string, members: Contact[]) => Group;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  renameGroup: (groupId: string, newName: string) => void;
  addGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateGroupSettings: (groupId: string, settings: Partial<Group['settings']>) => void;
  generateNewInviteCode: () => void;
  forceRefreshInviteCode: () => void; // Instant refresh button
  addFriendByCode: (code: string, userInfo: { email: string; username?: string }) => Promise<boolean>;
  searchContacts: (query: string) => Contact[];
  getFavoriteContacts: () => Contact[];
  getOnlineContacts: () => Contact[];
  getRecentContacts: () => Contact[];
  sendFriendRequest: (email: string) => Promise<boolean>;
  acceptFriendRequest: (contactId: string) => void;
  rejectFriendRequest: (contactId: string) => void;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

interface ContactProviderProps {
  children: ReactNode;
}

export const ContactProvider: React.FC<ContactProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [currentInviteCode, setCurrentInviteCode] = useState<InviteCode | null>(null);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    username?: string;
    avatar?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize invite code and load saved data
  useEffect(() => {
    if (user) {
      setUserProfile({
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        avatar: undefined
      });
      loadSavedData();
      generateInitialInviteCode();
      startInviteCodeRotation();
    }
  }, [user]);

  const loadSavedData = () => {
    try {
      const savedContacts = localStorage.getItem('secureChat_contacts');
      const savedGroups = localStorage.getItem('secureChat_groups');
      const savedRequests = localStorage.getItem('secureChat_pendingRequests');
      const savedProfile = localStorage.getItem('secureChat_userProfile');

      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      }
      if (savedRequests) {
        setPendingRequests(JSON.parse(savedRequests));
      }
      if (savedProfile && user) {
        const profile = JSON.parse(savedProfile);
        setUserProfile({
          ...profile,
          id: user.id,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem('secureChat_contacts', JSON.stringify(contacts));
      localStorage.setItem('secureChat_groups', JSON.stringify(groups));
      localStorage.setItem('secureChat_pendingRequests', JSON.stringify(pendingRequests));
      if (userProfile) {
        localStorage.setItem('secureChat_userProfile', JSON.stringify(userProfile));
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Save data whenever it changes
  useEffect(() => {
    saveData();
  }, [contacts, groups, pendingRequests, userProfile]);

  const generateInitialInviteCode = () => {
    if (!user) return;
    
    const savedCode = localStorage.getItem('secureChat_inviteCode');
    const savedCodeDate = localStorage.getItem('secureChat_inviteCodeDate');
    
    // Check if saved code is still valid (less than 24 hours old)
    if (savedCode && savedCodeDate) {
      const codeDate = new Date(savedCodeDate);
      const now = new Date();
      const hoursDiff = (now.getTime() - codeDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        try {
          const parsedCode = JSON.parse(savedCode);
          setCurrentInviteCode(parsedCode);
          return;
        } catch (error) {
          console.error('Invalid saved code:', error);
        }
      }
    }
    
    // Generate new code if no valid saved code
    generateNewInviteCode();
  };

  const generateNewInviteCode = () => {
    if (!user) return;

    const newCode = generateInviteCode('friend', user.id, {
      expiresInHours: 24,
      maxUses: 50
    });

    setCurrentInviteCode(newCode);
    localStorage.setItem('secureChat_inviteCode', JSON.stringify(newCode));
    localStorage.setItem('secureChat_inviteCodeDate', new Date().toISOString());
  };

  const forceRefreshInviteCode = () => {
    // Instantly generate new code regardless of time
    generateNewInviteCode();
  };

  const startInviteCodeRotation = () => {
    // Rotate invite code every 24 hours
    const interval = setInterval(() => {
      generateNewInviteCode();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  };

  const addContact = (contact: Contact) => {
    setContacts(prev => {
      const exists = prev.find(c => c.id === contact.id || c.email === contact.email);
      if (exists) {
        return prev.map(c => c.id === contact.id ? { ...c, ...contact } : c);
      }
      return [...prev, { ...contact, connectionDate: new Date().toISOString() }];
    });
  };

  const removeContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setGroups(prev => prev.map(group => ({
      ...group,
      members: group.members.filter(m => m.id !== contactId)
    })));
  };

  const updateContact = (contactId: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    ));
  };

  const createGroup = (name: string, members: Contact[]): Group => {
    const newGroup: Group = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: `Group chat with ${members.length} members`,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || '',
      members: [
        // Add current user as admin
        {
          id: user?.id || '',
          email: user?.email || '',
          username: user?.username || user?.email,
          isOnline: true,
          status: 'online' as const,
          connectionDate: new Date().toISOString()
        },
        ...members
      ],
      unreadCount: 0
    };

    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
  };

  const addFriendByCode = async (code: string, userInfo: { email: string; username?: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate code format
      if (!/^[A-Z0-9]{6,12}$/.test(code)) {
        setError('Invalid code format');
        return false;
      }

      // Check if user already exists
      const existingContact = contacts.find(c => c.email === userInfo.email);
      if (existingContact) {
        setError('This user is already in your contacts');
        return false;
      }

      // In a real app, this would make an API call to validate the code
      // For now, we'll simulate a successful addition
      const newContact: Contact = {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userInfo.email,
        username: userInfo.username || userInfo.email.split('@')[0],
        isOnline: Math.random() > 0.5, // Random online status for demo
        status: 'online',
        connectionDate: new Date().toISOString(),
        unreadCount: 0,
        isFavorite: false,
        isPinned: false,
        tags: ['new']
      };

      addContact(newContact);
      return true;
    } catch (error) {
      console.error('Failed to add friend:', error);
      setError('Failed to add friend. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Invalid email address');
        return false;
      }

      // Check if user already exists
      const existingContact = contacts.find(c => c.email === email);
      if (existingContact) {
        setError('This user is already in your contacts');
        return false;
      }

      // Check if request already sent
      const existingRequest = pendingRequests.find(r => r.email === email);
      if (existingRequest) {
        setError('Friend request already sent');
        return false;
      }

      // In a real app, this would send a request to the server
      // For demo purposes, we'll simulate a pending request
      const pendingContact: Contact = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        username: email.split('@')[0],
        isOnline: false,
        status: 'offline',
        connectionDate: new Date().toISOString(),
        unreadCount: 0
      };

      setPendingRequests(prev => [...prev, pendingContact]);
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      setError('Failed to send friend request. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = (contactId: string) => {
    const request = pendingRequests.find(r => r.id === contactId);
    if (request) {
      addContact({ ...request, isOnline: true, status: 'online' });
      setPendingRequests(prev => prev.filter(r => r.id !== contactId));
    }
  };

  const rejectFriendRequest = (contactId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== contactId));
  };

  const searchContacts = (query: string): Contact[] => {
    if (!query.trim()) return contacts;
    
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.email.toLowerCase().includes(lowerQuery) ||
      contact.username?.toLowerCase().includes(lowerQuery) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  const getFavoriteContacts = (): Contact[] => {
    return contacts.filter(contact => contact.isFavorite);
  };

  const getOnlineContacts = (): Contact[] => {
    return contacts.filter(contact => contact.isOnline);
  };

  const getRecentContacts = (): Contact[] => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return contacts.filter(contact => 
      contact.lastMessage && 
      new Date(contact.lastMessage.timestamp) > oneDayAgo
    ).sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  };

  const value: ContactContextType = {
    contacts,
    groups,
    pendingRequests,
    currentInviteCode,
    addContact,
    removeContact,
    updateContact,
    createGroup,
    updateGroup,
    generateNewInviteCode,
    addFriendByCode,
    searchContacts,
    getFavoriteContacts,
    getOnlineContacts,
    getRecentContacts,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    isLoading,
    error
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = (): ContactContextType => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
};
