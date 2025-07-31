import React, { useState } from 'react';
import { ChatMessage, MediaContent } from '@shared/api';
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
  Eye
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

  const renderTextMessage = () => (
    <div>
      <p className="text-sm leading-relaxed">{message.content as string}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
          {formatTime(message.timestamp)}
        </span>
        {isEncrypted && (
          <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
        )}
      </div>
    </div>
  );

  const renderEmojiMessage = () => (
    <div className="text-center">
      <span className="text-4xl">{message.content as string}</span>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
          {formatTime(message.timestamp)}
        </span>
        {isEncrypted && (
          <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
        )}
      </div>
    </div>
  );

  const renderImageMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <div className="space-y-2">
        <div className="relative">
          {imageError ? (
            <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <img
              src={media.thumbnail || media.data}
              alt={media.fileName}
              className={`
                max-w-48 max-h-64 rounded-lg cursor-pointer transition-opacity
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={() => onImageClick?.(media.data)}
            />
          )}
          
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse" />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
            onClick={() => onImageClick?.(media.data)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 truncate max-w-32">{media.fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(media.fileSize)}</p>
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
      </div>
    );
  };

  const renderVideoMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <video
            className="max-w-48 max-h-64 rounded-lg"
            controls
            poster={media.thumbnail}
          >
            <source src={media.data} type={media.fileType} />
            Your browser does not support the video tag.
          </video>
          
          <Badge className="absolute top-2 left-2 bg-black/50 text-white">
            <Play className="w-3 h-3 mr-1" />
            Video
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 truncate max-w-32">{media.fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(media.fileSize)}</p>
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
      </div>
    );
  };

  const renderFileMessage = () => {
    const media = message.content as MediaContent;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FileText className="w-8 h-8 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{media.fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(media.fileSize)}</p>
          </div>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-purple-200'}`}>
            {formatTime(message.timestamp)}
          </span>
          {isEncrypted && (
            <ShieldCheck className={`w-3 h-3 ${isOwnMessage ? 'text-purple-200' : 'text-purple-300'}`} />
          )}
        </div>
      </div>
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
    <div
      className={`
        px-4 py-3 rounded-2xl glass backdrop-blur-sm message-appear
        ${isOwnMessage 
          ? 'bg-gradient-to-br from-purple-500/80 to-violet-600/80 text-white ml-auto' 
          : 'bg-white/20 text-white border border-white/30'
        }
        ${message.type === 'emoji' ? 'bg-transparent border-0' : ''}
      `}
    >
      {renderMessageContent()}
    </div>
  );
}
