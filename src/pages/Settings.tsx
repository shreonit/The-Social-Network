import { useState, useEffect } from 'react';
import { User } from '../types';
import { getUserSettings, saveUserSettings } from '../services/userService';
import { logout } from '../services/authService';

interface SettingsProps {
  loggedInUser: User;
  onLogout: () => void;
  onThemeChange: () => void;
}

const Settings = ({ loggedInUser, onLogout, onThemeChange }: SettingsProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check localStorage first (global theme)
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    
    // Also update user settings for backward compatibility
    const settings = getUserSettings(loggedInUser.id);
    if (settings.theme !== savedTheme) {
      settings.theme = savedTheme as 'light' | 'dark';
      saveUserSettings(loggedInUser.id, settings);
    }
  }, [loggedInUser.id]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update user settings
    const settings = getUserSettings(loggedInUser.id);
    settings.theme = newTheme;
    saveUserSettings(loggedInUser.id, settings);
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    
    onThemeChange();
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="container">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-item">
            <label className="settings-label">Theme</label>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                Light
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-item">
            <label className="settings-label">Email</label>
            <div className="settings-value">{loggedInUser.email}</div>
          </div>
          <div className="settings-item">
            <label className="settings-label">Login Method</label>
            <div className="settings-value">
              {loggedInUser.authMethod === 'google' ? 'Google' : 'Email/Password'}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Actions</h2>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

