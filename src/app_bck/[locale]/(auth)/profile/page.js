'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/services/profileService';
import ProfileSidebar from './tabs/ProfileSidebar';
import AccountTab from './tabs/AccountTab';
import SecurityTab from './tabs/SecurityTab';
import StatsTab from './tabs/StatsTab';
// import SettingsTab from './tabs/SettingsTab';
import ActivityTab from './tabs/ActivityTab';

import { User, Shield, BarChart3, Settings, Activity, FileText } from 'lucide-react';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile tabs configuration
  const tabs = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      component: AccountTab
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      component: SecurityTab
    },
    {
      id: 'stats',
      label: 'Statistics',
      icon: BarChart3,
      component: StatsTab
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      component: ActivityTab
    },
  ];

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profileData = await getUserProfile();
        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  // Handle profile updates
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
          <a
            href="/login"
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get active tab component
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className='h-8'></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <ProfileSidebar
              profile={profile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
            />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-3">
                  {tabs.find(tab => tab.id === activeTab)?.icon && (() => {
                    const Icon = tabs.find(tab => tab.id === activeTab).icon;
                    return <Icon className="w-5 h-5 text-red-600" />;
                  })()}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h2>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {ActiveTabComponent && (
                  <ActiveTabComponent
                    profile={profile}
                    onProfileUpdate={handleProfileUpdate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;