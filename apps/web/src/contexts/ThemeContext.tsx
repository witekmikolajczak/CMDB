import React, { createContext, useState, useEffect, ReactNode } from 'react';
import UserPreferencesService from '../services/UserPreferencesService';
import { useAuth } from './AuthContext';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  changeTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  changeTheme: () => {},
  toggleTheme: () => {}
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize theme - always light for unauthenticated users
  const [theme, setTheme] = useState<ThemeType>(() => {
    // If no user is logged in, always use light theme
    if (!user) return 'light';
    
    // Otherwise use saved theme or system preference
    return (localStorage.getItem('cmdbTheme') as ThemeType) || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  
  // Load theme preference from database when user logs in
  useEffect(() => {
    const loadThemePreference = async () => {
      // Force light theme for unauthenticated users
      if (!user) {
        setTheme('light');
        return;
      }
      
      try {
        // Try to get theme from database for authenticated users
        const savedTheme = await UserPreferencesService.getPreference('theme');
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme as ThemeType);
          localStorage.setItem('cmdbTheme', savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    // Set data attribute on document element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also add/remove dark-theme class on body for more reliable styling
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Store in localStorage
    localStorage.setItem('cmdbTheme', theme);
  }, [theme]);

  // Change theme function
  const changeTheme = async (newTheme: ThemeType) => {
    // Always use light theme for unauthenticated users, regardless of request
    if (!user) {
      setTheme('light');
      return;
    }
    
    setTheme(newTheme);
    
    // Store in localStorage as fallback
    localStorage.setItem('cmdbTheme', newTheme);
    
    // Store in database if user is logged in
    try {
      await UserPreferencesService.setPreference('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    // Prevent toggling to dark theme for unauthenticated users
    if (!user) {
      return;
    }
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => React.useContext(ThemeContext);
