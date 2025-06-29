import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en.json';
import plTranslation from './locales/pl.json';

// Set up resources
const resources = {
  en: {
    translation: enTranslation
  },
  pl: {
    translation: plTranslation
  }
};

// Helper function to check if a language is supported
const isSupportedLanguage = (lang: string): boolean => {
  return ['en', 'pl'].includes(lang);
};

// Get browser language and check if it's supported
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  return isSupportedLanguage(browserLang) ? browserLang : 'en';
};

// Check if user is authenticated
const isUserAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Get stored language or use browser language
const getInitialLanguage = (): string => {
  // If user is not authenticated, always return Polish
  if (!isUserAuthenticated()) {
    return 'pl';
  }
  
  // Otherwise, use stored preference or browser language
  const storedLang = localStorage.getItem('cmdbLanguage');
  if (storedLang && isSupportedLanguage(storedLang)) {
    return storedLang;
  }
  return getBrowserLanguage();
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLanguage(), // Use helper function to determine initial language
    fallbackLng: 'en', // Default language
    debug: false, // Set to true to see console logs during development

    interpolation: {
      escapeValue: false // Not needed for React as it escapes by default
    },

    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      
      // Cache language in localStorage
      caches: ['localStorage'],
      
      // LocalStorage key
      lookupLocalStorage: 'cmdbLanguage'
    }
  });

export default i18n;
