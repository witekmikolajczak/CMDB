import React from 'react';
import '../styles/Welcome.css';

interface WelcomeProps {
  onGetStarted: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <div className="logo-container">
            <img src="./logo-small.svg" alt="logo" width="100px"/>
          <h1 className="app-title">InvenTrack</h1>
          <p className="app-subtitle">Your Assets, Our Priority</p>
        </div>
      </header>
      
      <main className="welcome-content">
        <section className="hero-section">
          <h2>Welcome to InvenTrack</h2>
          <p>
            A centralized platform for tracking, managing, and assigning IT assets 
            within your organization.
          </p>
          <div className="cta-buttons">
            <button className="primary-btn" onClick={onGetStarted}>
              Get Started
            </button>
          </div>
        </section>

        <section className="features-section">
          <h2>Simple and Powerful IT Asset Management</h2>
          <p className="features-description">
            Set up your PostgreSQL database connection and start organizing your IT assets in minutes. Our intuitive system 
            helps you manage users, track equipment, and generate reports with ease.
          </p>
          <div className="simplified-features">
            <div className="simplified-feature">
              <div className="feature-icon">🔄</div>
              <p>Fast and simple setup process</p>
            </div>
            <div className="simplified-feature">
              <div className="feature-icon">🔒</div>
              <p>Role-based access control</p>
            </div>
            <div className="simplified-feature">
              <div className="feature-icon">📊</div>
              <p>Comprehensive reporting</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>&copy; {new Date().getFullYear()} Witold Mikołajczak & Dawid Skrzypacz. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;