import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Welcome from './pages/Welcome'
import DatabaseSetup from './pages/DatabaseSetup'
import Dashboard from './pages/Dashboard'
import DatabaseErrorPage from './pages/DatabaseErrorPage'
import { checkDatabaseStatus } from './api/apiClient'
import { databaseConfigService } from './services/databaseConfigService'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import './styles/app-settings.css'
import './styles/dark-mode-fixes.css'
import './styles/avatar-fixes.css'
import './styles/user-avatar-fix.css'
import './styles/profile-picture-fix.css'
import './styles/table-avatar-fix.css'
import './styles/header-avatar-fix.css'
import './styles/profile-page-avatar-fix.css'
import './styles/avatar-complete-fix.css'
import './styles/simple-avatar-fix.css'
import './styles/final-avatar-fix.css' /* Final minimal fix */
import './styles/avatar-centering-fix.css' /* Comprehensive centering fix */
import './styles/avatar-exact-fix.css' /* Exact match to User Management page */
import './styles/avatar-override-fix.css';
import './styles/profile-border-fix.css'; /* Critical override with highest specificity */
import './styles/final-avatar-fix-force.css'; /* Absolute force fix for double outline issue */
import './styles/global-avatar-fix.css'; /* Global fix for consistent avatar styling */
import './styles/DatabaseErrorPage.css'; /* Styles for the database error page */

const API_BASE_URL = 'http://localhost:3001'; // Replace with your API base URL

function AppContent() {
  // Get auth context with the new updateUser method
  const { updateUser } = useAuth();
  
  // Initialize translation hook
  const { t } = useTranslation();
  
  // State to track database configuration and connection status
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState<boolean | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);
  const [databaseError, setDatabaseError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  
  // Simple state-based routing
  const [currentPage, setCurrentPage] = useState('loading');

  // Check if API is ready
  const checkApiReady = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.isConfigured !== undefined) {
          setApiReady(true);
          return true;
        }
      }
    } catch (error) {
      console.log('API not ready yet:', error);
    }
    return false;
  };

  // Check database configuration status on startup
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        // Wait for API to be ready
        while (!apiReady) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const isReady = await checkApiReady();
          if (isReady) break;
        }

        // Check local storage first for immediate decision
        const isLocallyConfigured = databaseConfigService.isDatabaseConfigured();
        
        // Pre-set the state based on local info to reduce flashing
        if (isLocallyConfigured) {
          setIsDatabaseConfigured(true);
          setCurrentPage('dashboard');
        }
        
        // Then verify with the API
        const { isConfigured, isConnected, error } = await checkDatabaseStatus();
        
        setIsDatabaseConfigured(isConfigured);
        setIsDatabaseConnected(isConnected);
        setDatabaseError(error);
        
        // If database is configured and connected successfully, go to dashboard
        if (isConfigured && isConnected) {
          setCurrentPage('dashboard');
          // Trigger user state update to ensure current authentication state
          updateUser();
        } else if (isConfigured && !isConnected) {
          // Database is configured but connection failed - show error page
          setCurrentPage('db-error');
        } else if (isLocallyConfigured) {
          // If locally configured but API says not configured, clear local config
          databaseConfigService.clearConfig();
          setCurrentPage('welcome');
        } else {
          // Not configured anywhere
          setCurrentPage('welcome');
        }
      } catch (error) {
        console.error('Failed to check database status:', error);
        setIsDatabaseConfigured(false);
        setCurrentPage('welcome');
      } finally {
        setIsLoading(false);
      }
    };

    checkDbStatus();
  }, [updateUser, apiReady]);

  // Function to navigate between pages
  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  // Function to retry database connection
  const handleRetryConnection = async () => {
    setIsLoading(true);
    try {
      const { isConfigured, isConnected, error } = await checkDatabaseStatus();
      setIsDatabaseConfigured(isConfigured);
      setIsDatabaseConnected(isConnected);
      setDatabaseError(error);
      
      if (isConfigured && isConnected) {
        setCurrentPage('dashboard');
        updateUser();
      }
    } catch (error) {
      console.error('Error checking database connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // When database setup is complete
  const handleSetupComplete = () => {
    setIsDatabaseConfigured(true);
    setCurrentPage('dashboard');
  };

  // Show loading spinner during initial check
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Show loading spinner if API is not ready
  if (!apiReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.waitingForApi')}</p>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <div className="app">
          
          {!isDatabaseConfigured && currentPage === 'welcome' && 
            <Welcome onGetStarted={() => navigateTo('database-setup')} />}
          
          {!isDatabaseConfigured && currentPage === 'database-setup' && 
            <DatabaseSetup onSetupComplete={handleSetupComplete} />}
          
          {currentPage === 'db-error' && (
            <DatabaseErrorPage 
              error={databaseError} 
              onReload={handleRetryConnection}
            />
          )}
          
          {(isDatabaseConfigured && isDatabaseConnected && currentPage !== 'db-error') && (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        </div>
      </ThemeProvider>
    </LanguageProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App