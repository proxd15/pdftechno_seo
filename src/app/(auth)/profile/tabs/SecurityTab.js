'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { changePassword, getUserSessions, revokeSession, getUserActivity } from '@/services/profileService';
import { Shield, Key, Monitor, Activity, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Smartphone, Globe } from 'lucide-react';

const SecurityTab = ({ profile }) => {
  const { t } = useI18n();
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [sessions, setSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Load sessions and activity on component mount
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoadingSessions(true);
      const [sessionsData, activityData] = await Promise.all([
        getUserSessions(),
        getUserActivity()
      ]);
      setSessions(sessionsData);
      setRecentActivity(activityData.slice(0, 5)); // Show last 5 activities
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({
        type: 'error',
        text: t('profile.security.changePassword.mismatch')
      });
      setIsLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: t('profile.security.changePassword.minLength')
      });
      setIsLoading(false);
      return;
    }

    try {
      await changePassword(passwordData);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setMessage({
        type: 'success',
        text: t('profile.security.changePassword.success')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('profile.security.changePassword.error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle session revocation
  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setMessage({
        type: 'success',
        text: t('profile.security.sessions.revokeSuccess')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('profile.security.sessions.revokeError')
      });
    }
  };

  // Handle revoking all other sessions
  const handleRevokeAllSessions = async () => {
    try {
      await revokeSession(); // No sessionId = revoke all others
      await loadSecurityData(); // Reload to get updated sessions
      setMessage({
        type: 'success',
        text: t('profile.security.sessions.revokeAllSuccess')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('profile.security.sessions.revokeError')
      });
    }
  };

  // Get device icon based on device type
  const getDeviceIcon = (deviceType) => {
    if (deviceType?.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('profile.security.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('profile.security.subtitle')}
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

      {/* Password Change Section */}
      {profile?.has_password && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">
              {t('profile.security.changePassword.title')}
            </h4>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.security.changePassword.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder={t('profile.security.changePassword.currentPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.security.changePassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder={t('profile.security.changePassword.newPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('profile.security.changePassword.lengthNote')}
              </p>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.security.changePassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder={t('profile.security.changePassword.confirmPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('profile.security.changePassword.changing')}
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    {t('profile.security.changePassword.button')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Google Account Notice */}
      {profile?.is_google_user && !profile?.has_password && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                {t('profile.security.googleSecurity.title')}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('profile.security.googleSecurity.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              {t('profile.security.tips.title')}
            </h4>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                {t('profile.security.tips.items', { returnObjects: true }).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;