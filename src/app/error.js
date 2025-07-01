'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaHome, FaRedo, FaTools } from 'react-icons/fa';
import { useI18n } from '@/i18n';

export default function Error({ error, reset }) {
  const { getLocalizedHref } = useI18n();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <FaTools className="w-16 h-16 text-red-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg">
              <span className="text-3xl font-bold text-gray-800">500</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Something went wrong!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto">
          We're sorry, but something unexpected happened. Our team has been notified and we're working on fixing it.
        </p>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-md mx-auto">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaRedo className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href={getLocalizedHref('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaHome className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-16 p-8 bg-white rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Need Help?
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              If the problem persists, here are some things you can try:
            </p>
            <ul className="list-disc list-inside space-y-2 text-left max-w-md mx-auto">
              <li>Clear your browser cache and cookies</li>
              <li>Try using a different browser</li>
              <li>Check your internet connection</li>
              <li>Wait a few moments and try again</li>
            </ul>
            <p className="mt-6">
              Still having issues? Contact our support team at{' '}
              <a
                href="mailto:support@pdftechno.com"
                className="text-red-600 hover:text-red-700 underline"
              >
                support@pdftechno.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}