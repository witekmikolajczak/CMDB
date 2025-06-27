import React, { useState } from 'react';
import '../styles/DatabaseSetup.css';
import {
  testDatabaseConnection,
  executeDatabaseSchema,
  createAdminUser,
  type DatabaseConnectionConfig,
  type AdminUserConfig
} from '../api/apiClient';
import { databaseConfigService } from '../services/databaseConfigService';

// Dialog component for showing feedback
const Dialog = ({ 
  isOpen, 
  title, 
  message, 
  isSuccess, 
  onClose, 
  onConfirm = null,
  confirmText = 'OK' 
}: { 
  isOpen: boolean;
  title: string;
  message: string;
  isSuccess: boolean;
  onClose: () => void;
  onConfirm?: (() => void) | null;
  confirmText?: string;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3 className={`dialog-title ${isSuccess ? 'success' : 'error'}`}>{title}</h3>
        <div className="dialog-content">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          {onConfirm && (
            <button className="primary-btn" onClick={onConfirm}>
              {confirmText}
            </button>
          )}
          <button className={onConfirm ? "secondary-btn" : "primary-btn"} onClick={onClose}>
            {onConfirm ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DatabaseSetupProps {
    onSetupComplete?: () => void;
  }
  
  const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onSetupComplete }) => {
  // Form state
  const [formData, setFormData] = useState({
    hostname: 'localhost',
    port: '5432',
    database: '',
    username: 'postgres',
    password: '',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    confirmPassword: ''
  });

  // Error state
  const [errors, setErrors] = useState({
    database: '',
    username: '',
    password: '',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    confirmPassword: ''
  });

  // Step state (1 = Database Connection, 2 = Admin User)
  const [currentStep, setCurrentStep] = useState(1);

  // Processing state for buttons
  const [isProcessing, setIsProcessing] = useState(false);

  // Connection test and database status
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isSchemaCreated, setIsSchemaCreated] = useState(false);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isSuccess: false,
    onConfirm: null as (() => void) | null,
    confirmText: 'OK'
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being edited
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate database connection form
  const validateDatabaseForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.database.trim()) {
      newErrors.database = 'Database name is required';
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate admin user form
  const validateAdminForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.adminUsername.trim()) {
      newErrors.adminUsername = 'Admin username is required';
      isValid = false;
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Email is invalid';
      isValid = false;
    }

    if (!formData.adminPassword.trim()) {
      newErrors.adminPassword = 'Password is required';
      isValid = false;
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Password must be at least 8 characters long';
      isValid = false;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Test database connection
  const handleTestConnection = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!validateDatabaseForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const connectionConfig: DatabaseConnectionConfig = {
        hostname: formData.hostname,
        port: parseInt(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password
      };
      
      const result = await testDatabaseConnection(connectionConfig);
      
      setDialog({
        isOpen: true,
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        message: result.message,
        isSuccess: result.success,
        onConfirm: result.success ? 
          (() => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            setIsDbConnected(true);
            showSchemaConfirmDialog();
          }) : 
          null,
        confirmText: result.success ? 'Continue' : 'OK'
      });
      
    } catch (error) {
      setDialog({
        isOpen: true,
        title: 'Error',
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        onConfirm: null,
        confirmText: 'OK'
      });
    } finally {
      setIsProcessing(false);
    }
  };






  
  // Show schema creation confirmation dialog
  const showSchemaConfirmDialog = () => {
    setDialog({
      isOpen: true,
      title: 'Create Database Schema',
      message: 'Would you like to create the database schema now? This is required before creating an admin user.',
      isSuccess: true,
      onConfirm: () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        handleCreateSchema();
      },
      confirmText: 'Create Schema'
    });
  };

  // Create database schema
  const handleCreateSchema = async () => {
    setIsProcessing(true);
    
    try {
      const connectionConfig: DatabaseConnectionConfig = {
        hostname: formData.hostname,
        port: parseInt(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password
      };
      
      const result = await executeDatabaseSchema(connectionConfig);
      
      setDialog({
        isOpen: true,
        title: result.success ? 'Schema Created' : 'Schema Creation Failed',
        message: result.message,
        isSuccess: result.success,
        onConfirm: result.success ? 
          (() => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            setIsSchemaCreated(true);
            setCurrentStep(2);
          }) : 
          null,
        confirmText: result.success ? 'Continue to Admin Setup' : 'OK'
      });
      
    } catch (error) {
      setDialog({
        isOpen: true,
        title: 'Error',
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        onConfirm: null,
        confirmText: 'OK'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle next step
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDatabaseForm()) {
      if (!isDbConnected) {
        // If not connected yet, test connection first
        handleTestConnection(e as unknown as React.MouseEvent);
      } else if (!isSchemaCreated) {
        // If connected but schema not created, prompt for schema creation
        showSchemaConfirmDialog();
      } else {
        // If everything is ready, proceed to next step
        setCurrentStep(2);
      }
    }
  };

  // Handle form submission for admin user creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAdminForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const dbConfig: DatabaseConnectionConfig = {
        hostname: formData.hostname,
        port: parseInt(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password
      };
      
      const adminConfig: AdminUserConfig = {
        username: formData.adminUsername,
        email: formData.adminEmail,
        password: formData.adminPassword
      };
      
      const result = await createAdminUser(dbConfig, adminConfig);
      
      if (result.success) {
        // Save the database configuration
        databaseConfigService.saveConfig({
          ...dbConfig,
          isConfigured: true
        });
        
        setDialog({
          isOpen: true,
          title: 'Success',
          message: 'Admin user created successfully! You can now log in with your credentials.',
          isSuccess: true,
          onConfirm: () => {
            // Call the onSetupComplete callback to navigate to Dashboard
            if (onSetupComplete) {
              onSetupComplete();
            } else {
              // Fallback if no callback provided
              window.location.href = '/';
            }
          },
          confirmText: 'Go to Dashboard'
        });
      } else {
        setDialog({
          isOpen: true,
          title: 'Error',
          message: `Admin user creation failed: ${result.message}`,
          isSuccess: false,
          onConfirm: null,
          confirmText: 'OK'
        });
      }
    } catch (error) {
      setDialog({
        isOpen: true,
        title: 'Error',
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        onConfirm: null,
        confirmText: 'OK'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    setCurrentStep(1);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="setup-container">
      <header className="setup-header">
        <div className="logo-container">
          <img src="./logo-small.svg" alt="logo" width="60px" />
          <h1 className="app-title">InvenTrack</h1>
          <p className="app-subtitle">Setup Wizard</p>
        </div>
      </header>

      <main className="setup-content">
        <div className="setup-card">
          <div className="setup-steps">
            <div className={`setup-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Database Connection</div>
            </div>
            <div className="step-connector"></div>
            <div className={`setup-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Admin User</div>
            </div>
          </div>

          {currentStep === 1 ? (
            <form onSubmit={handleNextStep} className="setup-form">
              <h2>Database Connection</h2>
              <p className="form-description">
                Enter your PostgreSQL database connection details. This database will be used to store all your CMDB information.
              </p>

              <div className="form-group">
                <label htmlFor="hostname">Hostname</label>
                <input
                  type="text"
                  id="hostname"
                  name="hostname"
                  value={formData.hostname}
                  onChange={handleChange}
                  placeholder="e.g., localhost or db.example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="port">Port</label>
                <input
                  type="text"
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  placeholder="5432"
                />
              </div>

              <div className="form-group">
                <label htmlFor="database">Database Name*</label>
                <input
                  type="text"
                  id="database"
                  name="database"
                  value={formData.database}
                  onChange={handleChange}
                  placeholder="e.g., inventrack"
                  className={errors.database ? 'error' : ''}
                />
                {errors.database && <div className="error-message">{errors.database}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="username">Username*</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g., postgres"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <div className="error-message">{errors.username}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password*</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter database password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <div className="form-note">
                <strong>Note:</strong> Make sure your database user has permission to create tables and schemas.
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={handleTestConnection}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Testing...' : 'Test Connection'}
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Next'}
                </button>
              </div>
              
              {isDbConnected && (
                <div className="connection-status success">
                  <span className="status-icon">✓</span> Database schema created successfully
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="setup-form">
              <h2>Create Admin User</h2>
              <p className="form-description">
                Create your administrator account. This account will have full access to the InvenTrack system.
              </p>

              <div className="form-group">
                <label htmlFor="adminUsername">Username*</label>
                <input
                  type="text"
                  id="adminUsername"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  placeholder="Enter admin username"
                  className={errors.adminUsername ? 'error' : ''}
                />
                {errors.adminUsername && <div className="error-message">{errors.adminUsername}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="adminEmail">Email*</label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="Enter admin email"
                  className={errors.adminEmail ? 'error' : ''}
                />
                {errors.adminEmail && <div className="error-message">{errors.adminEmail}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="adminPassword">Password*</label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className={errors.adminPassword ? 'error' : ''}
                />
                {errors.adminPassword && <div className="error-message">{errors.adminPassword}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password*</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
              </div>

              <div className="form-note">
                This account will have full administrative privileges. Keep these credentials secure.
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={handleBack} disabled={isProcessing}>
                  Back
                </button>
                <button type="submit" className="primary-btn" disabled={isProcessing}>
                  {isProcessing ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="setup-footer">
        <p>&copy; {new Date().getFullYear()} Witold Mikołajczak & Dawid Skrzypacz. All rights reserved.</p>
      </footer>

      {/* Dialog for messages and confirmations */}
      <Dialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        isSuccess={dialog.isSuccess}
        onClose={handleCloseDialog}
        onConfirm={dialog.onConfirm}
        confirmText={dialog.confirmText}
      />
    </div>
  );
};

export default DatabaseSetup;
                 