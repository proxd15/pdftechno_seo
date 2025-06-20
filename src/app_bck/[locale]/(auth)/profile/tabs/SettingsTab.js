'use client';

import { useState, useEffect } from 'react';
import { updateUserProfile, deleteAccount } from '@/services/profileService';
import { 
  Settings, 
  Palette, 
  Globe, 
  Bell, 
  Mail, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

const SettingsTab = ({ profile, onProfileUpdate }) => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    email_notifications: true,
    marketing_emails: false,
    profile_visibility: 'private'
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    password: '',
    confirmation: '',
    error: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'ur', label: 'اردو' },
    { value: 'de', label: 'Deutsch' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light' },
    { value: 'auto', label: 'Auto', description: 'Matches your system preference' }
  ];

  // Initialize preferences from profile
  useEffect(() => {
    if (profile) {
      setPreferences({
        theme: profile.theme || 'light',
        language: profile.language || 'en',
        email_notifications: profile.email_notifications ?? true,
        marketing_emails: profile.marketing_emails ?? false,
        profile_visibility: profile.profile_visibility || 'private'
      });
    }
  }, [profile]);

  // Handle preference changes
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updatedProfile = await updateUserProfile(preferences);
      onProfileUpdate(updatedProfile);
      setMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save settings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const { password, confirmation } = deleteModal;

    if (confirmation !== 'DELETE') {
      setDeleteModal(prev => ({
        ...prev,
        error: 'Please type DELETE to confirm'
      }));
      return;
    }

    if (!password && profile?.has_password) {
      setDeleteModal(prev => ({
        ...prev,
        error: 'Password is required'
      }));
      return;
    }

    try {
      await deleteAccount({ password, confirmation });
      // Account deleted successfully - redirect or handle logout
      window.location.href = '/';
    } catch (error) {
      setDeleteModal(prev => ({
        ...prev,
        error: error.message || 'Failed to delete account'
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Preferences & Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Customize your experience and manage your account preferences.
        </p>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Palette className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Appearance</h4>
        </div>

        <div className="space-y-4">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {themeOptions.map((theme) => (
                <div
                  key={theme.value}
                  className={`relative rounded-lg border-2 cursor-pointer transition-colors ${
                    preferences.theme === theme.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handlePreferenceChange('theme', theme.value)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {theme.label}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {theme.description}
                        </p>
                      </div>
                      {preferences.theme === theme.value && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {/* Theme Preview */}
                    <div className="mt-3 flex space-x-1">
                      <div className={`w-4 h-4 rounded ${
                        theme.value === 'light' ? 'bg-white border border-gray-300' :
                        theme.value === 'dark' ? 'bg-gray-800' :
                        'bg-gradient-to-r from-white via-gray-400 to-gray-800'
                      }`}></div>
                      <div className={`w-4 h-4 rounded ${
                        theme.value === 'light' ? 'bg-gray-100' :
                        theme.value === 'dark' ? 'bg-gray-700' :
                        'bg-gradient-to-r from-gray-100 via-gray-500 to-gray-700'
                      }`}></div>
                      <div className={`w-4 h-4 rounded ${
                        theme.value === 'light' ? 'bg-red-500' :
                        theme.value === 'dark' ? 'bg-red-400' :
                        'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Language
            </label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              {languageOptions.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Interface language preference
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Notifications</h4>
        </div>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">Email Notifications</h5>
                <p className="text-sm text-gray-500">
                  Receive notifications about your account activity and file processing
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('email_notifications', !preferences.email_notifications)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                preferences.email_notifications ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">Marketing Emails</h5>
                <p className="text-sm text-gray-500">
                  Receive updates about new features, tips, and promotional content
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('marketing_emails', !preferences.marketing_emails)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                preferences.marketing_emails ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.marketing_emails ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Eye className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Privacy</h4>
        </div>

     
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          disabled={isLoading}
          className={`flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
   
      {/* Delete Account Modal */}
   
    </div>
  );
};

export default SettingsTab;