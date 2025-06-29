import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/LanguageSwitcher.css';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const languages: LanguageOption[] = [
    { code: 'en', name: t('common.english'), flag: '🇬🇧' },
    { code: 'pl', name: t('common.polish'), flag: '🇵🇱' }
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);
  };
  


  // Find current language details
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="language-switcher">
      <div className="language-display">
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.name}</span>
      </div>
      
      {/* Language dropdown */}
      <div className="custom-select-wrapper">
        <select 
          value={language} 
          onChange={handleLanguageChange}
          aria-label={t('common.language')}
          title={t('common.language')}
          className="language-select"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code} data-flag={lang.flag}>
              {lang.name}
            </option>
          ))}
        </select>
        
        {/* Visual representation of the current selection */}
        <div className="current-language">
          <span className="language-flag">{currentLanguage.flag}</span>
          <span className="language-name">{currentLanguage.name}</span>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
