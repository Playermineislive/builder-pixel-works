import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translationService, Language, TranslationResult, SUPPORTED_LANGUAGES } from '../services/translationService';

interface TranslationSettings {
  enabled: boolean;
  targetLanguage: string;
  autoDetect: boolean;
  showOriginal: boolean;
  translateIncoming: boolean;
  translateOutgoing: boolean;
}

interface TranslationContextType {
  settings: TranslationSettings;
  updateSettings: (newSettings: Partial<TranslationSettings>) => void;
  translateMessage: (text: string, fromLang?: string) => Promise<TranslationResult | null>;
  getSupportedLanguages: () => Language[];
  getLanguageByCode: (code: string) => Language | undefined;
  isTranslating: boolean;
  translationCache: Map<string, TranslationResult>;
  clearCache: () => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<TranslationSettings>({
    enabled: false,
    targetLanguage: 'en',
    autoDetect: true,
    showOriginal: true,
    translateIncoming: true,
    translateOutgoing: false
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache] = useState(new Map<string, TranslationResult>());

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('translationSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to load translation settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('translationSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<TranslationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const translateMessage = async (text: string, fromLang?: string): Promise<TranslationResult | null> => {
    if (!settings.enabled || !text.trim()) {
      return null;
    }

    // Check cache first
    const cacheKey = `${fromLang || 'auto'}-${settings.targetLanguage}-${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    
    try {
      const result = await translationService.translate(
        text,
        settings.autoDetect ? 'auto' : fromLang,
        settings.targetLanguage
      );

      // Cache the result
      translationCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const getSupportedLanguages = () => {
    return SUPPORTED_LANGUAGES;
  };

  const getLanguageByCode = (code: string) => {
    return translationService.getLanguageByCode(code);
  };

  const clearCache = () => {
    translationCache.clear();
    translationService.clearCache();
  };

  const value: TranslationContextType = {
    settings,
    updateSettings,
    translateMessage,
    getSupportedLanguages,
    getLanguageByCode,
    isTranslating,
    translationCache,
    clearCache,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
