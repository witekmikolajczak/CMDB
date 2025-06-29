// apps/web/src/pages/Login.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Login.css';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

const Login: React.FC<LoginProps> = ({ 
  onLoginSuccess, 
  onRegisterClick 
}) => {
  const { t } = useTranslation();
  // Form state
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Use auth context to access updateUser method
  const { updateUser } = useAuth();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!credentials.username.trim()) {
      setError(t('auth.usernameRequired', 'Username is required'));
      return;
    }
    
    if (!credentials.password.trim()) {
      setError(t('auth.passwordRequired', 'Password is required'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.login(credentials);
      // Update user state before calling onLoginSuccess
      updateUser();
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed', 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo-container">
          <img src="./logo-small.svg" alt="logo" width="60px" />
          <h1 className="app-title">{t('welcome.appTitle', 'InvenTrack')}</h1>
        </div>
      </header>

      <main className="login-content">
        <div className="login-card">
          <h2>{t('auth.login', 'Sign In')}</h2>
          <p className="login-subtitle">{t('login.subtitle', 'Sign in to your account to continue')}</p>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">{t('auth.username', 'Username')}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder={t('login.usernamePlaceholder', 'Enter your username')}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">{t('auth.password', 'Password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="primary-btn login-btn"
              disabled={isLoading}
            >
              {isLoading ? t('login.signingIn', 'Signing in...') : t('auth.login', 'Sign In')}
            </button>
          </form>
          
          <div className="register-prompt">
            <p>{t('login.noAccount', 'Don\'t have an account?')}</p>
            <button 
              className="text-btn" 
              onClick={onRegisterClick}
              disabled={isLoading}
            >
              {t('auth.register', 'Register')}
            </button>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} {t('common.footerText', 'Witold Mikołajczak & Dawid Skrzypacz. All rights reserved.')}</p>
      </footer>
    </div>
  );
};

export default Login;