import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  X, 
  Globe, 
  Languages, 
  Settings, 
  Check, 
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Download
} from 'lucide-react';

interface TranslationSettingsProps {
  onClose: () => void;
}

export default function TranslationSettings({ onClose }: TranslationSettingsProps) {
  const {
    settings,
    updateSettings,
    getSupportedLanguages,
    getLanguageByCode,
    clearCache,
    isTranslating
  } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState(settings.targetLanguage);
  const languages = getSupportedLanguages();

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    updateSettings({ targetLanguage: langCode });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-3"
                variants={itemVariants}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Translation Settings</CardTitle>
                  <p className="text-white/70 text-sm">Configure real-time message translation</p>
                </div>
              </motion.div>
              
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
            {/* Enable Translation Toggle */}
            <motion.div 
              className="space-y-4"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Enable Translation</h3>
                    <p className="text-white/70 text-sm">Turn on real-time message translation</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                />
              </div>
            </motion.div>

            <AnimatePresence>
              {settings.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Target Language Selection */}
                  <motion.div variants={itemVariants}>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Languages className="w-5 h-5 mr-2" />
                      Target Language
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2">
                      {languages.map((language) => (
                        <motion.button
                          key={language.code}
                          onClick={() => handleLanguageSelect(language.code)}
                          className={`
                            p-3 rounded-xl border transition-all duration-200 text-left
                            ${selectedLanguage === language.code
                              ? 'bg-white/20 border-white/40 shadow-lg scale-105'
                              : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{language.flag}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-sm truncate">
                                {language.name}
                              </p>
                              <p className="text-white/70 text-xs truncate">
                                {language.nativeName}
                              </p>
                            </div>
                            {selectedLanguage === language.code && (
                              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Translation Options */}
                  <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-white font-semibold flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Translation Options
                    </h3>
                    
                    {[
                      {
                        key: 'autoDetect',
                        icon: RefreshCw,
                        title: 'Auto-detect Language',
                        description: 'Automatically detect the language of incoming messages',
                        value: settings.autoDetect
                      },
                      {
                        key: 'showOriginal',
                        icon: Eye,
                        title: 'Show Original Text',
                        description: 'Display both original and translated text',
                        value: settings.showOriginal
                      },
                      {
                        key: 'translateIncoming',
                        icon: Download,
                        title: 'Translate Incoming Messages',
                        description: 'Translate messages you receive from others',
                        value: settings.translateIncoming
                      },
                      {
                        key: 'translateOutgoing',
                        icon: Send,
                        title: 'Translate Outgoing Messages',
                        description: 'Translate messages you send to others',
                        value: settings.translateOutgoing
                      }
                    ].map((option) => (
                      <div 
                        key={option.key}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
                            <option.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{option.title}</h4>
                            <p className="text-white/70 text-sm">{option.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={option.value}
                          onCheckedChange={(checked) => 
                            updateSettings({ [option.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </motion.div>

                  {/* Current Settings Summary */}
                  <motion.div variants={itemVariants}>
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Current Settings
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-white/20 text-white border-white/20">
                          Target: {getLanguageByCode(selectedLanguage)?.flag} {getLanguageByCode(selectedLanguage)?.name}
                        </Badge>
                        {settings.autoDetect && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-400/20">
                            Auto-detect
                          </Badge>
                        )}
                        {settings.showOriginal && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/20">
                            Show original
                          </Badge>
                        )}
                        {settings.translateIncoming && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/20">
                            Translate incoming
                          </Badge>
                        )}
                        {settings.translateOutgoing && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/20">
                            Translate outgoing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Cache Management */}
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <h4 className="text-white font-medium">Translation Cache</h4>
                        <p className="text-white/70 text-sm">Clear cached translations to free up memory</p>
                      </div>
                      <Button
                        onClick={clearCache}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={isTranslating}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Cache
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div 
              className="flex justify-end space-x-3 pt-4"
              variants={itemVariants}
            >
              <Button
                onClick={onClose}
                className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6 py-2 rounded-xl transition-all duration-200"
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
