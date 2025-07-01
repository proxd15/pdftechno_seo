'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/i18n';
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

export default function NotFound() {
  const { t, getLocalizedHref } = useI18n();

  return (
    <>
        <div className='h-8'></div>
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="w-16 h-16 text-red-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg">
              <span className="text-4xl font-bold text-gray-800">404</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href={getLocalizedHref('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaHome className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Popular Tools Section */}
        <div className="mt-16 p-8 bg-white rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Popular PDF Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href={getLocalizedHref('/merge-pdf')}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Image
                  src="/images/icons/merge.png"
                  width={24}
                  height={24}
                  alt="Merge PDF"
                />
              </div>
              <span className="text-sm text-gray-700">Merge PDF</span>
            </Link>
            <Link
              href={getLocalizedHref('/split-pdf')}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Image
                  src="/images/icons/split.png"
                  width={24}
                  height={24}
                  alt="Split PDF"
                />
              </div>
              <span className="text-sm text-gray-700">Split PDF</span>
            </Link>
            <Link
              href={getLocalizedHref('/compress-pdf')}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Image
                  src="/images/icons/compress.png"
                  width={24}
                  height={24}
                  alt="Compress PDF"
                />
              </div>
              <span className="text-sm text-gray-700">Compress PDF</span>
            </Link>
            <Link
              href={getLocalizedHref('/pdf-to-word')}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Image
                  src="/images/icons/pdftoword.png"
                  width={24}
                  height={24}
                  alt="PDF to Word"
                />
              </div>
              <span className="text-sm text-gray-700">PDF to Word</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}