import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/ThemeSwitcher.css';

interface ThemeOption {
  value: 'light' | 'dark';
  name: string;
  icon: string;
}

const ThemeSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { theme, changeTheme } = useTheme();
  
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as 'light' | 'dark';
    changeTheme(newTheme);
  };
  
  const themeOptions: ThemeOption[] = [
    { value: 'light', name: t('common.lightTheme'), icon: '☀️' },
    { value: 'dark', name: t('common.darkTheme'), icon: '🌙' }
  ];
  
  // Find current theme details
  const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[0];
  
  return (
    <div className="theme-switcher">
      <div className="custom-select-wrapper">
        <select 
          value={theme} 
          onChange={handleThemeChange}
          aria-label={t('common.theme')}
          title={t('common.theme')}
          className="theme-select"
        >
          {themeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        
        {/* Visual representation of the current selection */}
        <div className="current-theme">
          <span className="theme-icon">{currentTheme.icon}</span>
          <span className="theme-name">{currentTheme.name}</span>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
