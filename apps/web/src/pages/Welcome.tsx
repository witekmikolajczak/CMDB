import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Welcome.css';

interface WelcomeProps {
  onGetStarted: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <div className="logo-container">
            <img src="./logo-small.svg" alt="logo" width="100px"/>
          <h1 className="app-title">{t('welcome.appTitle', 'InvenTrack')}</h1>
          <p className="app-subtitle">{t('welcome.appSubtitle', 'Your Assets, Our Priority')}</p>
        </div>
      </header>
      
      <main className="welcome-content">
        <section className="hero-section">
          <h2>{t('welcome.heroTitle', 'Welcome to InvenTrack')}</h2>
          <p>
            {t('welcome.heroDescription', 'A centralized platform for tracking, managing, and assigning IT assets within your organization.')}
          </p>
          <div className="cta-buttons">
            <button className="primary-btn" onClick={onGetStarted}>
              {t('welcome.getStartedButton', 'Get Started')}
            </button>
          </div>
        </section>

        <section className="features-section">
          <h2>{t('welcome.featuresTitle', 'Simple and Powerful IT Asset Management')}</h2>
          <p className="features-description">
            {t('welcome.featuresDescription', 'Set up your PostgreSQL database connection and start organizing your IT assets in minutes. Our intuitive system helps you manage users, track equipment, and generate reports with ease.')}
          </p>
          <div className="simplified-features">
            <div className="simplified-feature">
              <div className="feature-icon">🔄</div>
              <p>{t('welcome.feature1', 'Fast and simple setup process')}</p>
            </div>
            <div className="simplified-feature">
              <div className="feature-icon">🔒</div>
              <p>{t('welcome.feature2', 'Role-based access control')}</p>
            </div>
            <div className="simplified-feature">
              <div className="feature-icon">📊</div>
              <p>{t('welcome.feature3', 'Comprehensive reporting')}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>&copy; {new Date().getFullYear()} {t('common.footerText', 'Witold Mikołajczak & Dawid Skrzypacz. All rights reserved.')}</p>
      </footer>
    </div>
  );
};

export default Welcome;