import React, { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPickerComponent({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    onEmojiSelect(emojiData.emoji);
  };

  // Quick emoji shortcuts
  const quickEmojis = ['😀', '😍', '🥰', '😂', '🤣', '😊', '😎', '🔥', '💯', '❤️', '👍', '👎', '��', '💪', '🙏'];

  return (
    <Card className="glass bg-white/95 backdrop-blur-md border-white/20 shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-purple-600" />
            <h3 className="text-gray-800 font-semibold">Pick an Emoji</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Emoji Bar */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Quick picks:</p>
          <div className="flex flex-wrap gap-2">
            {quickEmojis.map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="text-2xl p-1 h-auto hover:bg-purple-100"
                onClick={() => handleEmojiClick({ emoji } as EmojiClickData)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Emoji Picker */}
        <div className="emoji-picker-container">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder="Search emojis..."
            previewConfig={{
              showPreview: true,
              defaultEmoji: '😀',
              defaultCaption: 'Choose an emoji'
            }}
            width={320}
            height={400}
          />
        </div>
      </CardContent>
    </Card>
  );
}
