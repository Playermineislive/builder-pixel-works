import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  Paperclip, 
  X, 
  Upload,
  Image as ImageIcon,
  FileText,
  Music
} from 'lucide-react';
import { FileUpload } from '@shared/api';

interface MediaUploadProps {
  onFileSelect: (file: FileUpload) => void;
  onClose: () => void;
  maxFileSize?: number; // in MB
}

export default function MediaUpload({ onFileSelect, onClose, maxFileSize = 50 }: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    setUploading(true);
    
    try {
      let type: 'image' | 'video' | 'file' = 'file';
      let thumbnail: string | undefined;

      if (file.type.startsWith('image/')) {
        type = 'image';
        thumbnail = await createImageThumbnail(file);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
        thumbnail = await createVideoThumbnail(file);
      }

      const fileUpload: FileUpload = {
        file,
        type,
        thumbnail
      };

      onFileSelect(fileUpload);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createImageThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const maxSize = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const createVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(video.duration / 2, 1); // Seek to middle or 1 second
      };

      video.onseeked = () => {
        canvas.width = 200;
        canvas.height = (video.videoHeight / video.videoWidth) * 200;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  return (
    <Card className="glass bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Share Media</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => imageInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-col h-20"
            disabled={uploading}
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-sm">Photo</span>
          </Button>
          
          <Button
            onClick={() => videoInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-col h-20"
            disabled={uploading}
          >
            <Video className="w-6 h-6 mb-1" />
            <span className="text-sm">Video</span>
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-col h-20"
            disabled={uploading}
          >
            <Paperclip className="w-6 h-6 mb-1" />
            <span className="text-sm">File</span>
          </Button>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragOver 
              ? 'border-purple-400 bg-purple-500/10' 
              : 'border-white/30 hover:border-white/50'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">
            {uploading ? 'Processing...' : 'Drag and drop files here'}
          </p>
          <p className="text-purple-200 text-sm mb-4">
            or click above to browse files
          </p>
          <Badge variant="secondary" className="bg-white/10 text-purple-200">
            Max {maxFileSize}MB
          </Badge>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </CardContent>
    </Card>
  );
}
