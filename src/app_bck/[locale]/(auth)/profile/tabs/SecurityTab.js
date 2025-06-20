'use client';

import { useState, useEffect } from 'react';
import { changePassword, getUserSessions, revokeSession, getUserActivity } from '@/services/profileService';
import { Shield, Key, Monitor, Activity, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Smartphone, Globe } from 'lucide-react';

const SecurityTab = ({ profile }) => {
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
        text: 'New passwords do not match'
      });
      setIsLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
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
        text: 'Password changed successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to change password'
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
        text: 'Session revoked successfully'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to revoke session'
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
        text: 'All other sessions revoked successfully'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to revoke sessions'
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
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account security and view login activity.
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
            <h4 className="text-lg font-medium text-gray-900">Change Password</h4>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
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
                  placeholder="Enter your current password"
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
                New Password
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
                  placeholder="Enter your new password"
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
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
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
                  placeholder="Confirm your new password"
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
                    Changing...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
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
              <h4 className="text-sm font-medium text-blue-800">Google Account Security</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your account is secured by Google. Password changes must be made through your Google account settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Monitor className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">Active Sessions</h4>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllSessions}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Revoke All Others
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading sessions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  session.is_current ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(session.device_type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {session.browser || 'Unknown Browser'}
                      </p>
                      {session.is_current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {session.ip_address} • {session.location || 'Unknown Location'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last active: {formatDate(session.last_activity)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!session.is_current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Security Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Recent Security Activity</h4>
        </div>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {activity.action === 'login' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {activity.action === 'logout' && <XCircle className="w-4 h-4 text-gray-500" />}
                  {activity.action === 'password_change' && <Key className="w-4 h-4 text-blue-500" />}
                  {activity.action === 'profile_update' && <Shield className="w-4 h-4 text-purple-500" />}
                  {!['login', 'logout', 'password_change', 'profile_update'].includes(activity.action) && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action_display}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </p>
                    {activity.ip_address && (
                      <p className="text-xs text-gray-500">
                        {activity.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent security activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Security Tips</h4>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use a strong, unique password for your account</li>
                <li>Log out from shared or public devices</li>
                <li>Regularly review your active sessions</li>
                <li>Enable two-factor authentication when available</li>
                <li>Keep your browser and device software updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;