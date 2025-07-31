import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, MediaContent } from '@shared/api';
import { useTranslation } from '../contexts/TranslationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Play, 
  Image as ImageIcon, 
  FileText, 
  ShieldCheck,
  AlertCircle,
  Eye,
  Languages,
  Volume2,
  Copy,
  MoreHorizontal,
  Globe
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  isEncrypted: boolean;
  onImageClick?: (imageUrl: string) => void;
}

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  isEncrypted,
  onImageClick 
}: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const { 
    settings, 
    translateMessage, 
    getLanguageByCode,
    isTranslating: globalTranslating 
  } = useTranslation();

  // Auto-translate incoming messages if enabled
  useEffect(() => {
    if (
      !isOwnMessage && 
      settings.enabled && 
      settings.translateIncoming && 
      message.type === 'text' &&
      typeof message.content === 'string'
    ) {
      handleTranslate();
    }
  }, [message, settings, isOwnMessage]);

  const handleTranslate = async () => {
    if (typeof message.content !== 'string' || isTranslating) return;

    setIsTranslating(true);
    try {
      const result = await translateMessage(message.content);
      if (result && result.translatedText !== message.content) {
        setTranslatedText(result.translatedText);
        setShowTranslation(true);
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = showTranslation && translatedText ? translatedText : message.content;
    navigator.clipboard.writeText(textToCopy as string);
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const bubbleVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      x: isOwnMessage ? 50 : -50 
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.3
      }
    }
  };

  const renderTextMessage = () => (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Original text */}
      <p className="text-sm leading-relaxed">
        {message.content as string}
      </p>

      {/* Translation */}
      <AnimatePresence>
        {showTranslation && translatedText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`
              p-3 rounded-xl border-l-4 
              ${isOwnMessage 
                ? 'bg-white/10 border-purple-200' 
                : 'bg-white/20 border-blue-300'
              }
            `}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Globe className="w-3 h-3 text-blue-300" />
              <span className="text-xs text-blue-300 font-medium">
                Translated to {getLanguageByCode(settings.targetLanguage)?.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-blue-100">
              {translatedText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timestamp and actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
            {formatTime(message.timestamp)}
          </span>
          
          {/* Translation controls */}
          {settings.enabled && message.type === 'text' && (
            <div className="flex items-center space-x-1">
              {!isOwnMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className={`
                    h-6 w-6 p-0 rounded-md
                    ${isOwnMessage 
                      ? 'hover:bg-purple-200/20 text-purple-200' 
                      : 'hover:bg-white/20 text-purple-300'
                    }
                  `}
                >
                  <Languages className="w-3 h-3" />
                </Button>
              )}
              
              {translatedText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`
                    h-6 w-6 p-0 rounded-md
                    ${showTranslation ? 'bg-blue-500/20' : ''}
                    ${isOwnMessage 
                      ? 'hover:bg-purple-200/20 text-purple-200' 
                      : 'hover:bg-white/20 text-purple-300'
                    }
                  `}
                >
                  <Globe className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`
              h-6 w-6 p-0 rounded-md
              ${isOwnMessage 
                ? 'hover:bg-purple-200/20 text-purple-200' 
                : 'hover:bg-white/20 text-purple-300'
              }
            `}
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          {isEncrypted && (
            <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderEmojiMessage = () => (
    <motion.div 
      className="text-center space-y-2"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.span 
        className="text-4xl block"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        {message.content as string}
      </motion.span>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
          {formatTime(message.timestamp)}
        </span>
        {isEncrypted && (
          <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
        )}
      </div>
    </motion.div>
  );

  const renderImageMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative group">
          {imageError ? (
            <div className="w-48 h-32 bg-gray-200/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <motion.img
              src={media.thumbnail || media.data}
              alt={media.fileName}
              className={`
                max-w-48 max-h-64 rounded-lg cursor-pointer transition-opacity
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={() => onImageClick?.(media.data)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          )}
          
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200/20 rounded-lg animate-pulse" />
          )}
          
          <motion.div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors duration-200 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onImageClick?.(media.data)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-300 truncate max-w-32">{media.fileName}</p>
            <p className="text-xs text-gray-400">{formatFileSize(media.fileSize)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
              {formatTime(message.timestamp)}
            </span>
            {isEncrypted && (
              <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderVideoMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative group">
          <video
            className="max-w-48 max-h-64 rounded-lg"
            controls
            poster={media.thumbnail}
          >
            <source src={media.data} type={media.fileType} />
            Your browser does not support the video tag.
          </video>
          
          <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0">
            <Play className="w-3 h-3 mr-1" />
            Video
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-300 truncate max-w-32">{media.fileName}</p>
            <p className="text-xs text-gray-400">{formatFileSize(media.fileSize)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
              {formatTime(message.timestamp)}
            </span>
            {isEncrypted && (
              <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderFileMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <FileText className="w-8 h-8 text-gray-300" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{media.fileName}</p>
            <p className="text-xs text-gray-400">{formatFileSize(media.fileSize)}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>
        </motion.div>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
            {formatTime(message.timestamp)}
          </span>
          {isEncrypted && (
            <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
          )}
        </div>
      </motion.div>
    );
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return renderTextMessage();
      case 'emoji':
        return renderEmojiMessage();
      case 'image':
        return renderImageMessage();
      case 'video':
        return renderVideoMessage();
      case 'file':
        return renderFileMessage();
      default:
        return renderTextMessage();
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`
        px-4 py-3 rounded-2xl backdrop-blur-sm relative group
        ${isOwnMessage 
          ? 'bg-gradient-to-br from-purple-500/80 to-violet-600/80 text-white ml-auto' 
          : 'bg-white/20 text-white border border-white/30'
        }
        ${message.type === 'emoji' ? 'bg-transparent border-0' : ''}
        max-w-xs lg:max-w-md
      `}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {/* Translation indicator */}
      {isTranslating && (
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Badge className="bg-blue-500 text-white text-xs animate-pulse">
            <Languages className="w-3 h-3 mr-1" />
            Translating...
          </Badge>
        </motion.div>
      )}

      {renderMessageContent()}
    </motion.div>
  );
}
