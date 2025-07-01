'use client';

import { useState } from 'react';
import { formatFileSize, getRelativeTime } from '@/services/profileService';

const ProfileSidebar = ({ profile, activeTab, setActiveTab, tabs }) => {
  const [imageError, setImageError] = useState(false);

  // Get user's initials for fallback avatar
  const getInitials = () => {
    if (!profile?.user) return 'U';
    const firstName = profile.user.first_name || '';
    const lastName = profile.user.last_name || '';
    const email = profile.user.email || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Avatar options for selection
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '🧙‍♂️', '🧙‍♀️'
  ];

  const renderAvatar = () => {
    if (profile?.avatar && !imageError) {
      // If avatar is an emoji
      if (avatarOptions.includes(profile.avatar)) {
        return (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
            {profile.avatar}
          </div>
        );
      }
      // If avatar is an image URL
      return (
        <img
          src={profile.avatar}
          alt="Profile Avatar"
          className="w-20 h-20 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }
    
    // Fallback to initials
    return (
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-xl font-semibold text-red-600">
          {getInitials()}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            {renderAvatar()}
          </div>
          
          {/* User Info */}
          <h3 className="text-lg font-semibold text-gray-900">
            {profile?.user?.full_name || profile?.user?.email || 'User'}
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {profile?.user?.email}
          </p>
          
          {/* Member Since */}
          <p className="text-gray-500 text-xs mt-2">
            Member since {getRelativeTime(profile?.user?.date_joined)}
          </p>
          
          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {profile?.total_files_processed || 0}
                </p>
                <p className="text-xs text-gray-600">Files Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatFileSize(profile?.total_storage_used || 0)}
                </p>
                <p className="text-xs text-gray-600">Storage Used</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-left transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Account Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account Type</span>
            <span className="text-sm font-medium text-green-600">
              {profile?.is_google_user ? 'Google' : 'Standard'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm font-medium text-green-600">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">This Month</span>
            <span className="text-sm font-medium text-blue-600">
              {profile?.files_this_month || 0} files
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('account')}
            className="w-full text-left text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className="w-full text-left text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full text-left text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Update Preferences
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className="w-full text-left text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            View My Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;