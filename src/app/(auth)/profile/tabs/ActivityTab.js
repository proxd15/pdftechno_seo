'use client';

import { useState, useEffect } from 'react';
import { getUserActivity, getUserSessions, formatDate, getRelativeTime } from '@/services/profileService';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  Key, 
  User, 
  FileText, 
  Download, 
  Trash2, 
  Mail, 
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  MapPin,
  Filter
} from 'lucide-react';

const ActivityTab = ({ profile }) => {
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSessions, setShowSessions] = useState(false);

  // Activity filter options
  const filterOptions = [
    { value: 'all', label: 'All Activity', icon: Activity },
    { value: 'login', label: 'Login Events', icon: LogIn },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'profile', label: 'Profile Changes', icon: User },
    { value: 'files', label: 'File Activity', icon: FileText }
  ];

  // Load activity data
  useEffect(() => {
    const loadActivityData = async () => {
      try {
        setLoading(true);
        const [activityData, sessionsData] = await Promise.all([
          getUserActivity(),
          getUserSessions()
        ]);
        setActivities(activityData);
        setSessions(sessionsData);
        setError(null);
      } catch (err) {
        console.error('Error loading activity data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, []);

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    if (activeFilter === 'all') return true;
    
    switch (activeFilter) {
      case 'login':
        return ['login', 'logout'].includes(activity.action);
      case 'security':
        return ['password_change', 'login', 'logout'].includes(activity.action);
      case 'profile':
        return ['profile_update', 'avatar_change', 'email_change'].includes(activity.action);
      case 'files':
        return ['file_upload', 'file_download', 'file_delete'].includes(activity.action);
      default:
        return true;
    }
  });

  // Get activity icon based on action type
  const getActivityIcon = (action) => {
    const iconMap = {
      'login': <LogIn className="w-4 h-4 text-green-500" />,
      'logout': <LogOut className="w-4 h-4 text-gray-500" />,
      'password_change': <Key className="w-4 h-4 text-blue-500" />,
      'profile_update': <User className="w-4 h-4 text-purple-500" />,
      'avatar_change': <User className="w-4 h-4 text-orange-500" />,
      'email_change': <Mail className="w-4 h-4 text-yellow-500" />,
      'file_upload': <FileText className="w-4 h-4 text-blue-500" />,
      'file_download': <Download className="w-4 h-4 text-green-500" />,
      'file_delete': <Trash2 className="w-4 h-4 text-red-500" />
    };
    
    return iconMap[action] || <Activity className="w-4 h-4 text-gray-500" />;
  };

  // Get device icon based on device type
  const getDeviceIcon = (deviceType) => {
    if (deviceType?.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4 text-blue-500" />;
    }
    return <Monitor className="w-4 h-4 text-gray-500" />;
  };

  // Get activity color based on action type
  const getActivityColor = (action) => {
    const colorMap = {
      'login': 'bg-green-50 border-green-200',
      'logout': 'bg-gray-50 border-gray-200',
      'password_change': 'bg-blue-50 border-blue-200',
      'profile_update': 'bg-purple-50 border-purple-200',
      'avatar_change': 'bg-orange-50 border-orange-200',
      'email_change': 'bg-yellow-50 border-yellow-200',
      'file_upload': 'bg-blue-50 border-blue-200',
      'file_download': 'bg-green-50 border-green-200',
      'file_delete': 'bg-red-50 border-red-200'
    };
    
    return colorMap[action] || 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Account Activity</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track your account activity and login sessions.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showSessions
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showSessions ? 'Hide Sessions' : 'Show Sessions'}
          </button>
        </div>
      </div>

      {/* Activity Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 text-gray-600 mr-2" />
          <h4 className="text-sm font-medium text-gray-900">Filter Activity</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === filter.value
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions Section */}
      {showSessions && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Monitor className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">Active Sessions</h4>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {sessions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  session.is_current 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getDeviceIcon(session.device_type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          {session.browser || 'Unknown Browser'}
                        </h5>
                        {session.is_current && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>{session.ip_address}</span>
                        {session.location && (
                          <>
                            <span className="mx-1">•</span>
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Last active: {getRelativeTime(session.last_activity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-6">
              <Monitor className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active sessions found</p>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Recent Activity</h4>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {filteredActivities.length}
          </span>
        </div>

        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`relative flex items-start space-x-3 p-4 rounded-lg border ${getActivityColor(activity.action)}`}
              >
                {/* Timeline line */}
                {index !== filteredActivities.length - 1 && (
                  <div className="absolute left-7 top-12 bottom-0 w-px bg-gray-200"></div>
                )}

                {/* Activity icon */}
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-200">
                  {getActivityIcon(activity.action)}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-900">
                      {activity.action_display}
                    </h5>
                    <time className="text-xs text-gray-500">
                      {getRelativeTime(activity.timestamp)}
                    </time>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDate(activity.timestamp)}</span>
                    </div>
                    
                    {activity.ip_address && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>{activity.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeFilter === 'all' ? 'No Activity Yet' : `No ${filterOptions.find(f => f.value === activeFilter)?.label} Found`}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFilter === 'all' 
                  ? 'Start using our tools to see your activity here.'
                  : 'Try selecting a different filter to see more activities.'
                }
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Show All Activity
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredActivities.length >= 50 && (
          <div className="mt-6 text-center">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Load More Activity
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Showing the last 50 activities
            </p>
          </div>
        )}
      </div>

      {/* Activity Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Activity Summary</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Activities */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {activities.length}
            </div>
            <div className="text-sm text-blue-800">Total Activities</div>
          </div>

          {/* Login Count */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.action === 'login').length}
            </div>
            <div className="text-sm text-green-800">Logins</div>
          </div>

          {/* Active Sessions */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {sessions.length}
            </div>
            <div className="text-sm text-purple-800">Active Sessions</div>
          </div>

          {/* Security Events */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {activities.filter(a => ['password_change', 'email_change'].includes(a.action)).length}
            </div>
            <div className="text-sm text-orange-800">Security Events</div>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Security Monitoring</h4>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">
                Regularly monitor your account activity for any suspicious behavior:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check for unrecognized login locations or devices</li>
                <li>Look for unexpected password changes or profile updates</li>
                <li>Monitor file activity for unauthorized access</li>
                <li>Report any suspicious activity immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTab;