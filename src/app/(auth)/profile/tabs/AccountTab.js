'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { updateUserProfile } from '@/services/profileService';
import { Save, Upload, User, Mail, Phone, Building, Globe, MapPin, FileText, CheckCircle, XCircle } from 'lucide-react';

const AccountTab = ({ profile, onProfileUpdate }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    phone: '',
    company: '',
    website: '',
    location: '',
    avatar: '',
    has_selected_avatar: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Avatar options
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '🧙‍♂️', '🧙‍♀️'
  ];

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.user?.first_name || '',
        last_name: profile.user?.last_name || '',
        email: profile.user?.email || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        company: profile.company || '',
        website: profile.website || '',
        location: profile.location || '',
        avatar: profile.avatar || ''
      });
    }
  }, [profile]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({
      ...prev,
      avatar,
      has_selected_avatar: true
    }));
    setShowAvatarPicker(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updatedProfile = await updateUserProfile(formData);
      onProfileUpdate(updatedProfile);
      setMessage({
        type: 'success',
        text: t('profile.account.updateSuccess')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('profile.account.updateError')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's initials for fallback avatar
  const getInitials = () => {
    const firstName = formData.first_name || '';
    const lastName = formData.last_name || '';
    const email = formData.email || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Render current avatar
  const renderCurrentAvatar = () => {
    if (formData.avatar && avatarOptions.includes(formData.avatar)) {
      return (
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
          {formData.avatar}
        </div>
      );
    }
    
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
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('profile.account.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('profile.account.subtitle')}
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

      {/* Account Type Warning */}
      {profile?.is_google_user && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>{t('profile.account.googleAccount.title')}</strong> {t('profile.account.googleAccount.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('profile.account.avatar.title')}
          </label>
          <div className="flex items-center space-x-4">
            {renderCurrentAvatar()}
            <div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('profile.account.avatar.change')}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                {t('profile.account.avatar.description')}
              </p>
            </div>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {t('profile.account.avatar.select')}
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center text-xl hover:border-red-300 transition-colors ${
                      formData.avatar === avatar ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              {t('profile.account.fields.firstName')}
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder={t('profile.account.placeholders.company')}
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              {t('profile.account.fields.website')}
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder={t('profile.account.placeholders.website')}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
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
                {t('profile.account.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('profile.account.saveChanges')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountTab;