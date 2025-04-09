// apps/web/src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import '../styles/SettingsPage.css';
import { useAuth } from '../contexts/AuthContext';

// Mock settings data
const MOCK_SETTINGS = {
  system: [
    {
      id: 'site_name',
      name: 'Site Name',
      value: 'InvenTrack CMDB',
      type: 'text',
      group: 'Branding',
      description: 'The name displayed throughout the application'
    },
    {
      id: 'primary_color',
      name: 'Primary Color',
      value: '#8A4FFF',
      type: 'color',
      group: 'Appearance',
      description: 'Main color used in the application interface'
    }
  ],
  security: [
    {
      id: 'password_min_length',
      name: 'Minimum Password Length',
      value: '8',
      type: 'number',
      group: 'Security',
      description: 'Minimum number of characters required for passwords'
    },
    {
      id: 'max_login_attempts',
      name: 'Max Login Attempts',
      value: '5',
      type: 'number',
      group: 'Security',
      description: 'Number of failed login attempts before account lockout'
    },
    {
      id: 'enable_2fa',
      name: 'Two-Factor Authentication',
      value: 'false',
      type: 'boolean',
      group: 'Security',
      description: 'Require two-factor authentication for login'
    }
  ],
  notifications: [
    {
      id: 'enable_email_notifications',
      name: 'Email Notifications',
      value: 'true',
      type: 'boolean',
      group: 'Notifications',
      description: 'Enable email notifications for system events'
    },
    {
      id: 'notification_expiry_days',
      name: 'Notification Expiry',
      value: '30',
      type: 'number',
      group: 'Notifications',
      description: 'Number of days before notifications expire'
    }
  ]
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState('system');
  const [settings, setSettings] = useState(MOCK_SETTINGS);

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin';

  // Handle setting value change
  const handleSettingChange = (groupKey: string, settingId: string, newValue: string) => {
    if (!isAdmin) return;

    const updatedSettings = {...settings};
    const settingIndex = updatedSettings[groupKey as keyof typeof settings].findIndex(
      setting => setting.id === settingId
    );

    if (settingIndex !== -1) {
      updatedSettings[groupKey as keyof typeof settings][settingIndex].value = newValue;
      setSettings(updatedSettings);
    }
  };

  // Render input based on setting type
  const renderSettingInput = (setting: any) => {
    if (!isAdmin) {
      return <span className="setting-value">{setting.value}</span>;
    }

    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(
              Object.keys(settings).find(
                key => settings[key as keyof typeof settings].includes(setting)
              ) || '', 
              setting.id, 
              e.target.value
            )}
            className="setting-input"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(
              Object.keys(settings).find(
                key => settings[key as keyof typeof settings].includes(setting)
              ) || '', 
              setting.id, 
              e.target.value
            )}
            className="setting-input"
          />
        );
      case 'color':
        return (
          <input
            type="color"
            value={setting.value}
            onChange={(e) => handleSettingChange(
              Object.keys(settings).find(
                key => settings[key as keyof typeof settings].includes(setting)
              ) || '', 
              setting.id, 
              e.target.value
            )}
            className="setting-color-input"
          />
        );
      case 'boolean':
        return (
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={setting.value === 'true'}
              onChange={(e) => handleSettingChange(
                Object.keys(settings).find(
                  key => settings[key as keyof typeof settings].includes(setting)
                ) || '', 
                setting.id, 
                e.checked.toString()
              )}
            />
            <span className="slider"></span>
          </label>
        );
      default:
        return <span className="setting-value">{setting.value}</span>;
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>System Settings</h1>
        {isAdmin && (
          <div className="header-actions">
            <button className="primary-btn">Save Changes</button>
          </div>
        )}
      </header>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {Object.keys(settings).map(group => (
              <button
                key={group}
                className={`settings-nav-item ${activeGroup === group ? 'active' : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                {group.charAt(0).toUpperCase() + group.slice(1)} Settings
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          <h2>{activeGroup.charAt(0).toUpperCase() + activeGroup.slice(1)} Settings</h2>
          
          {!isAdmin && (
            <div className="admin-warning">
              <p>Only administrators can modify system settings.</p>
            </div>
          )}

          <div className="settings-list">
            {settings[activeGroup as keyof typeof settings].map(setting => (
              <div key={setting.id} className="setting-item">
                <div className="setting-info">
                  <h3>{setting.name}</h3>
                  <p>{setting.description}</p>
                </div>
                <div className="setting-control">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;