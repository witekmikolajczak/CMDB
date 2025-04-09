import { useState, useEffect } from 'react'
import Welcome from './pages/Welcome'
import DatabaseSetup from './pages/DatabaseSetup'
import Dashboard from './pages/Dashboard'
import { checkDatabaseStatus } from './api/apiClient'
import { databaseConfigService } from './services/databaseConfigService'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const API_BASE_URL = 'http://localhost:3001'; // Replace with your API base URL

function AppContent() {
  // Get auth context with the new updateUser method
  const { isAuthenticated, updateUser } = useAuth();
  
  // State to track database configuration status
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState<boolean | null>(null);
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
        const { isConfigured } = await checkDatabaseStatus();
        
        setIsDatabaseConfigured(isConfigured);
        
        // If database is configured, go to dashboard
        if (isConfigured) {
          setCurrentPage('dashboard');
          // Trigger user state update to ensure current authentication state
          updateUser();
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
        <p>Loading application...</p>
      </div>
    );
  }

  // Show loading spinner if API is not ready
  if (!apiReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Waiting for API server to start...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {!isDatabaseConfigured && currentPage === 'welcome' && 
        <Welcome onGetStarted={() => navigateTo('database-setup')} />}
      
      {!isDatabaseConfigured && currentPage === 'database-setup' && 
        <DatabaseSetup onSetupComplete={handleSetupComplete} />}
      
      {(isDatabaseConfigured || isAuthenticated) && (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )}
    </div>
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