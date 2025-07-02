'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { getUserStats, formatFileSize, getRelativeTime } from '@/services/profileService';
import { BarChart3, FileText, HardDrive, Calendar, TrendingUp, Download, Clock, Activity } from 'lucide-react';

const StatsTab = ({ profile }) => {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const statsData = await getUserStats();
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError(t('profile.stats.error'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [t]);

  // Get conversion type display name
  const getConversionTypeName = (type) => {
    const typeMap = {
      'pdf_to_image': t('pdfTools.tools.pdfToImage.title'),
      'pdf_to_word': t('pdfTools.tools.pdfToWord.title'),
      'pdf_to_ppt': t('pdfTools.tools.pdfToPowerpoint.title'),
      'pdf_to_excel': t('pdfTools.tools.pdfToExcel.title'),
      'pdf_merge': t('pdfTools.tools.mergePdf.title'),
      'pdf_split': t('pdfTools.tools.splitPdf.title'),
      'pdf_compress': t('pdfTools.tools.compressPdf.title'),
      'pdf_ocr': t('pdfTools.tools.ocrPdf.title'),
      'pdf_watermark': t('pdfTools.tools.watermark.title')
    };
    return typeMap[type] || type;
  };

  // Get conversion type color
  const getConversionTypeColor = (type) => {
    const colorMap = {
      'pdf_to_image': 'bg-blue-100 text-blue-800',
      'pdf_to_word': 'bg-green-100 text-green-800',
      'pdf_to_ppt': 'bg-orange-100 text-orange-800',
      'pdf_to_excel': 'bg-purple-100 text-purple-800',
      'pdf_merge': 'bg-indigo-100 text-indigo-800',
      'pdf_split': 'bg-pink-100 text-pink-800',
      'pdf_compress': 'bg-yellow-100 text-yellow-800',
      'pdf_ocr': 'bg-red-100 text-red-800',
      'pdf_watermark': 'bg-teal-100 text-teal-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('profile.stats.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('profile.stats.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('profile.stats.subtitle')}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Files */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_files || 0}
              </p>
              <p className="text-sm text-gray-600">
                {t('profile.stats.overview.totalFiles')}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HardDrive className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(stats?.total_storage || 0)}
              </p>
              <p className="text-sm text-gray-600">
                {t('profile.stats.overview.storageUsed')}
              </p>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.files_this_month || 0}
              </p>
              <p className="text-sm text-gray-600">
                {t('profile.stats.overview.thisMonth')}
              </p>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">
                {getRelativeTime(stats?.member_since)}
              </p>
              <p className="text-sm text-gray-600">
                {t('profile.stats.overview.memberSince')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Files by Type */}
      {stats?.files_by_type && Object.keys(stats.files_by_type).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">
              {t('profile.stats.filesByType.title')}
            </h4>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.files_by_type)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([type, count]) => {
                const percentage = (count / stats.total_files) * 100;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConversionTypeColor(type)}`}>
                        {getConversionTypeName(type)}
                      </span>
                      <span className="text-sm text-gray-600">{count} files</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Files */}
      {stats?.recent_files && stats.recent_files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">
              {t('profile.stats.recentFiles.title')}
            </h4>
          </div>
          
          <div className="space-y-3">
            {stats.recent_files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getConversionTypeName(file.type)} • {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {getRelativeTime(file.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-red-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">
            {t('profile.stats.accountSummary.title')}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              {t('profile.stats.accountSummary.accountInfo')}
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.accountSummary.accountType')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.is_google_user 
                    ? t('profile.stats.accountSummary.googleAccount')
                    : t('profile.stats.accountSummary.standardAccount')
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.overview.memberSince')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(stats?.member_since).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.accountSummary.lastLogin')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.last_login 
                    ? getRelativeTime(stats.last_login) 
                    : t('profile.stats.accountSummary.never')
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              {t('profile.stats.accountSummary.usageSummary')}
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.accountSummary.totalConversions')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.total_files || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.overview.storageUsed')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatFileSize(stats?.total_storage || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('profile.stats.accountSummary.averageFileSize')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.total_files > 0 
                    ? formatFileSize(Math.round((stats?.total_storage || 0) / stats.total_files))
                    : '0 B'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {stats?.total_files === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('profile.stats.noData.title')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('profile.stats.noData.description')}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            {t('profile.stats.noData.exploreButton')}
          </a>
        </div>
      )}
    </div>
  );
};

export default StatsTab;