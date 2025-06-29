// apps/web/src/pages/DatabaseErrorPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearDatabaseConfig } from '../api/apiClient';

interface DatabaseErrorPageProps {
  error?: string;
  onReload: () => void;
}

const DatabaseErrorPage: React.FC<DatabaseErrorPageProps> = ({ error, onReload }) => {
  const { t } = useTranslation();
  // Use translations for text elements
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: ''
  });

  const handleClearConfig = async () => {
    try {
      setIsClearing(true);
      setClearMessage({ text: '', type: '' });
      
      const result = await clearDatabaseConfig();
      
      if (result.success) {
        setClearMessage({
          text: t('database.configClearedSuccess'),
          type: 'success'
        });
        
        // Give user a moment to read the success message before reloading
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setClearMessage({
          text: t('database.clearConfigError', { message: result.message }),
          type: 'error'
        });
      }
    } catch (err) {
      setClearMessage({
        text: t('database.unexpectedError', { message: err instanceof Error ? err.message : t('common.unknownError') }),
        type: 'error'
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="database-error-container">
      <div className="database-error-card">
        <div className="error-icon">❌</div>
        
        <h2>{t('database.connectionError')}</h2>
        
        <p className="error-description">
          {t('database.connectionErrorDesc')}
        </p>
        
        <ul className="error-list">
          <li>{t('database.errorReasons.serverDown')}</li>
          <li>{t('database.errorReasons.notExists')}</li>
          <li>{t('database.errorReasons.badCredentials')}</li>
          <li>{t('database.errorReasons.networkIssue')}</li>
        </ul>
        
        {error && <p className="error-details">{t('database.errorDetails', { error })}</p>}
        
        <div className="action-buttons">
          <button 
            className="primary-button" 
            onClick={onReload}
            disabled={isClearing}
          >
            {t('common.tryAgain')}
          </button>
          
          <button 
            className="secondary-button" 
            onClick={handleClearConfig}
            disabled={isClearing}
          >
            {isClearing ? t('database.clearing') : t('database.clearConfig')}
          </button>
        </div>
        
        {clearMessage.text && (
          <div className={`message ${clearMessage.type}`}>
            {clearMessage.text}
          </div>
        )}
        
        <p className="help-text">
          {t('database.clearConfigHelp')}
        </p>
      </div>
    </div>
  );
};

export default DatabaseErrorPage;
