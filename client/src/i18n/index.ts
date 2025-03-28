import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly
import enTranslation from './locales/en';
import isTranslation from './locales/is';
import esTranslation from './locales/es';
import frTranslation from './locales/fr';
import deTranslation from './locales/de';

// Language resources
const resources = {
  en: {
    translation: enTranslation
  },
  is: {
    translation: isTranslation
  },
  es: {
    translation: esTranslation
  },
  fr: {
    translation: frTranslation
  },
  de: {
    translation: deTranslation
  }
};

// Configure i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English as fallback
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already escapes variables
    },
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // Other options
    react: {
      useSuspense: true, // Use React Suspense for loading
    },
  });

export default i18n;

// Helper hooks and utilities
export const getLanguageName = (code: string): string => {
  const languageNames: Record<string, string> = {
    en: 'English',
    is: 'Íslenska',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  };
  
  return languageNames[code] || code;
};

export const getSupportedLanguages = (): { code: string; name: string }[] => {
  return [
    { code: 'en', name: 'English' },
    { code: 'is', name: 'Íslenska' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];
};