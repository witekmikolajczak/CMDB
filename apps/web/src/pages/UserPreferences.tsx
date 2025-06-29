import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';
import '../styles/UserPreferences.css';

const UserPreferences: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="user-preferences-container">
      <h1>{t('userPreferences.title')}</h1>
      
      <div className="preferences-section">
        <h2>{t('userPreferences.appearance')}</h2>
        
        <div className="preference-item">
          <div className="preference-info">
            <h3>{t('common.language')}</h3>
            <p>{t('userPreferences.languageDescription')}</p>
          </div>
          <div className="preference-control">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="preference-item">
          <div className="preference-info">
            <h3>{t('common.theme')}</h3>
            <p>{t('userPreferences.themeDescription')}</p>
          </div>
          <div className="preference-control">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
      

      <div className="preferences-info">
        <p>{t('userPreferences.savedAutomatically')}</p>
      </div>
    </div>
  );
};

export default UserPreferences;
