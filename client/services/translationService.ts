// Translation service supporting multiple providers
import axios from 'axios';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  confidence?: number;
}

// Popular languages with flags
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
];

class TranslationService {
  private cache = new Map<string, TranslationResult>();

  // Get cache key
  private getCacheKey(text: string, from: string, to: string): string {
    return `${from}-${to}-${text}`;
  }

  // Detect language of text (simple heuristic)
  detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
    if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
    if (/[\u0370-\u03ff]/.test(text)) return 'el'; // Greek
    
    // Default to English for Latin scripts
    return 'en';
  }

  // Translate using LibreTranslate (free, self-hosted option)
  async translateWithLibre(text: string, from: string, to: string): Promise<TranslationResult> {
    try {
      // Using a public LibreTranslate instance (in production, use your own)
      const response = await axios.post('https://libretranslate.de/translate', {
        q: text,
        source: from === 'auto' ? this.detectLanguage(text) : from,
        target: to,
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      return {
        originalText: text,
        translatedText: response.data.translatedText,
        fromLanguage: from,
        toLanguage: to,
        confidence: 0.8
      };
    } catch (error) {
      console.error('LibreTranslate error:', error);
      throw error;
    }
  }

  // Translate using MyMemory (free API)
  async translateWithMyMemory(text: string, from: string, to: string): Promise<TranslationResult> {
    try {
      const langPair = `${from === 'auto' ? this.detectLanguage(text) : from}|${to}`;
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: langPair
        },
        timeout: 10000
      });

      if (response.data.responseStatus === 200) {
        return {
          originalText: text,
          translatedText: response.data.responseData.translatedText,
          fromLanguage: from,
          toLanguage: to,
          confidence: response.data.responseData.match
        };
      } else {
        throw new Error(response.data.responseDetails);
      }
    } catch (error) {
      console.error('MyMemory translate error:', error);
      throw error;
    }
  }

  // Fallback simple translation for demo (when APIs fail)
  async translateFallback(text: string, from: string, to: string): Promise<TranslationResult> {
    // Simple substitution for demo purposes
    const commonTranslations: Record<string, Record<string, string>> = {
      'en': {
        'es': { 'hello': 'hola', 'goodbye': 'adiós', 'thank you': 'gracias', 'yes': 'sí', 'no': 'no' },
        'fr': { 'hello': 'bonjour', 'goodbye': 'au revoir', 'thank you': 'merci', 'yes': 'oui', 'no': 'non' },
        'de': { 'hello': 'hallo', 'goodbye': 'auf wiedersehen', 'thank you': 'danke', 'yes': 'ja', 'no': 'nein' },
        'it': { 'hello': 'ciao', 'goodbye': 'arrivederci', 'thank you': 'grazie', 'yes': 'sì', 'no': 'no' },
        'pt': { 'hello': 'olá', 'goodbye': 'tchau', 'thank you': 'obrigado', 'yes': 'sim', 'no': 'não' },
        'ru': { 'hello': 'привет', 'goodbye': 'до свидания', 'thank you': 'спасибо', 'yes': 'да', 'no': 'нет' },
        'ja': { 'hello': 'こんにちは', 'goodbye': 'さようなら', 'thank you': 'ありがとう', 'yes': 'はい', 'no': 'いいえ' },
        'zh': { 'hello': '你好', 'goodbye': '再见', 'thank you': '谢谢', 'yes': '是', 'no': '不' }
      }
    };

    const translations = commonTranslations[from]?.[to];
    const lowerText = text.toLowerCase();
    const translatedText = translations?.[lowerText] || `[${text}]→${to}`;

    return {
      originalText: text,
      translatedText,
      fromLanguage: from,
      toLanguage: to,
      confidence: 0.3
    };
  }

  // Main translate method with fallbacks
  async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
    // Skip translation if same language
    if (from === to && from !== 'auto') {
      return {
        originalText: text,
        translatedText: text,
        fromLanguage: from,
        toLanguage: to,
        confidence: 1.0
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, from, to);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Try LibreTranslate first
      console.log('🌐 Attempting translation with LibreTranslate...');
      const result = await this.translateWithLibre(text, from, to);
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.log('LibreTranslate failed, trying MyMemory...');
      
      try {
        // Try MyMemory as backup
        const result = await this.translateWithMyMemory(text, from, to);
        this.cache.set(cacheKey, result);
        return result;
      } catch (error2) {
        console.log('MyMemory failed, using fallback...');
        
        // Use fallback
        const result = await this.translateFallback(text, from, to);
        this.cache.set(cacheKey, result);
        return result;
      }
    }
  }

  // Batch translate multiple texts
  async translateBatch(texts: string[], from: string = 'auto', to: string = 'en'): Promise<TranslationResult[]> {
    const promises = texts.map(text => this.translate(text, from, to));
    return Promise.all(promises);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get supported languages
  getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  // Find language by code
  getLanguageByCode(code: string): Language | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }
}

export const translationService = new TranslationService();
