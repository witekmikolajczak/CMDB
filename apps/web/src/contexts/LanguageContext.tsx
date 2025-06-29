import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import UserPreferencesService from '../services/UserPreferencesService';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {}
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { i18n: i18nInstance } = useTranslation();
  
  // Initialize language - always Polish for unauthenticated users
  const [language, setLanguage] = useState<string>(() => {
    // If no user is logged in, always use Polish
    if (!user) return 'pl';
    
    // Otherwise use saved language or default to English
    return localStorage.getItem('cmdbLanguage') || i18n.language || 'en';
  });
  
  // Load language preference from database when user logs in
  useEffect(() => {
    const loadLanguagePreference = async () => {
      // Force Polish language for unauthenticated users
      if (!user) {
        i18nInstance.changeLanguage('pl');
        setLanguage('pl');
        return;
      }
      
      try {
        // Try to get language from database for authenticated users
        const savedLanguage = await UserPreferencesService.getPreference('language');
        
        if (savedLanguage) {
          i18nInstance.changeLanguage(savedLanguage);
          setLanguage(savedLanguage);
          localStorage.setItem('cmdbLanguage', savedLanguage); // Also update localStorage as fallback
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    
    loadLanguagePreference();
  }, [user, i18nInstance]);

  // Change language function
  const changeLanguage = async (lang: string) => {
    // Always use Polish language for unauthenticated users, regardless of request
    if (!user) {
      i18nInstance.changeLanguage('pl');
      setLanguage('pl');
      return;
    }
    
    i18nInstance.changeLanguage(lang);
    setLanguage(lang);
    
    // Store in localStorage as fallback
    localStorage.setItem('cmdbLanguage', lang);
    
    // Store in database for authenticated users
    try {
      await UserPreferencesService.setPreference('language', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Ensure the language is set correctly on initial load
  useEffect(() => {
    // Force Polish for unauthenticated users
    if (!user) {
      i18nInstance.changeLanguage('pl');
      setLanguage('pl');
    } else if (language) {
      i18nInstance.changeLanguage(language);
    }
  }, [language, i18nInstance, user]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => React.useContext(LanguageContext);
