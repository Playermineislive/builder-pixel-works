import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  Save, 
  User, 
  Edit2
} from 'lucide-react';

interface ContactRenameProps {
  contact: {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    avatar?: string;
  };
  onRename: (contactId: string, newName: string) => void;
  onClose: () => void;
}

export default function ContactRename({ contact, onRename, onClose }: ContactRenameProps) {
  const [newName, setNewName] = useState(contact.displayName || contact.username || contact.email.split('@')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(contact.id, newName.trim());
      onClose();
    }
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
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center space-x-2">
                <Edit2 className="w-5 h-5" />
                <span>Rename Contact</span>
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

          <CardContent className="space-y-6">
            {/* Contact Info */}
            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-[1.5rem] border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-[1.5rem] flex items-center justify-center text-white font-semibold text-lg border-2 border-white/20">
                {contact.username?.charAt(0) || contact.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">
                  {contact.displayName || contact.username || contact.email}
                </h3>
                <p className="text-white/60 text-sm truncate">
                  {contact.email}
                </p>
              </div>
            </div>

            {/* Rename Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Display Name</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[1.5rem]"
                  placeholder="Enter a custom name for this contact"
                  autoFocus
                  maxLength={50}
                />
                <p className="text-white/50 text-xs">
                  This name is only visible to you
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  disabled={!newName.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
