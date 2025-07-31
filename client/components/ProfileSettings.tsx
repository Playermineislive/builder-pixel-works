import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContacts } from '../contexts/ContactContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Camera, 
  User, 
  Mail, 
  Edit2, 
  Save, 
  Upload,
  RefreshCw,
  Copy,
  Check,
  Settings,
  Shield,
  Key,
  Smartphone,
  Monitor,
  Palette
} from 'lucide-react';

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { 
    userProfile, 
    updateUserProfile, 
    uploadProfilePicture, 
    currentInviteCode,
    forceRefreshInviteCode,
    isLoading, 
    error 
  } = useContacts();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.username || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUsernameUpdate = () => {
    if (newUsername.trim() !== userProfile?.username) {
      updateUserProfile({ username: newUsername.trim() });
      setSuccessMessage('Username updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setEditingUsername(false);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await uploadProfilePicture(file);
      if (result) {
        setSuccessMessage('Profile picture updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const copyInviteCode = async () => {
    if (!currentInviteCode) return;
    
    try {
      await navigator.clipboard.writeText(currentInviteCode.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleRefreshCode = () => {
    forceRefreshInviteCode();
    setSuccessMessage('Invite code refreshed!');
    setTimeout(() => setSuccessMessage(''), 3000);
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
        className="w-full max-w-md max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
          {/* Header */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Settings</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Success/Error Messages */}
            <AnimatePresence>
              {(successMessage || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert className={`${
                    successMessage 
                      ? 'bg-green-500/20 border-green-400/50 text-green-300' 
                      : 'bg-red-500/20 border-red-400/50 text-red-300'
                  } backdrop-blur-sm rounded-[1.5rem]`}>
                    <AlertDescription>
                      {successMessage || error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Picture */}
            <motion.div 
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white/20">
                  <AvatarImage src={userProfile?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-2xl font-bold">
                    {userProfile?.username?.charAt(0) || userProfile?.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
              
              <p className="text-white/70 text-sm text-center">
                Click the camera icon to update your profile picture
              </p>
            </motion.div>

            {/* Profile Information */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white font-semibold text-lg">Profile Information</h3>
              
              {/* Email (read-only) */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <div className="bg-white/5 border border-white/20 rounded-[1.5rem] px-4 py-3 text-white/60">
                  {userProfile?.email}
                </div>
              </div>

              {/* Username (editable) */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                </label>
                
                {editingUsername ? (
                  <div className="flex space-x-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[1.5rem] flex-1"
                      placeholder="Enter username"
                      autoFocus
                    />
                    <Button
                      onClick={handleUsernameUpdate}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white rounded-[1.5rem]"
                      disabled={!newUsername.trim()}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(userProfile?.username || '');
                      }}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 rounded-[1.5rem]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="bg-white/10 border border-white/20 rounded-[1.5rem] px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:bg-white/15 transition-all duration-200"
                    onClick={() => setEditingUsername(true)}
                  >
                    <span>{userProfile?.username}</span>
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Invite Code Section */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Your Invite Code</span>
              </h3>
              
              <div className="bg-white/5 border border-white/20 rounded-[1.5rem] p-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-white tracking-wider mb-2">
                    {currentInviteCode?.code || 'LOADING...'}
                  </div>
                  <p className="text-white/60 text-sm">
                    Share this code with friends to connect
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={copyInviteCode}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    variant="outline"
                    disabled={!currentInviteCode}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleRefreshCode}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <p className="text-white/50 text-xs mt-3 text-center">
                  Codes refresh automatically every 24 hours or instantly with the refresh button
                </p>
              </div>
            </motion.div>

            {/* Security Info */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/5 border border-white/20 rounded-[1.5rem] p-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">End-to-End Encryption</p>
                    <p className="text-white/60 text-xs">All messages are encrypted</p>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/20 rounded-[1.5rem] p-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Secure Key Exchange</p>
                    <p className="text-white/60 text-xs">RSA 2048-bit encryption</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex justify-end space-x-3 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onClose}
                className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                Done
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
