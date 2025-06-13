'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the uid and token from URL params
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    
    if (uid && token) {
      // Detect user's preferred language
      let locale = 'en'; // default
      
      // Try to get locale from localStorage (if user was previously on the site)
      try {
        const savedLocale = localStorage.getItem('preferred-locale');
        if (savedLocale) {
          locale = savedLocale;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // If no saved locale, use browser language
      if (locale === 'en') {
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        const supportedLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi'];
        
        if (supportedLocales.includes(browserLang)) {
          locale = browserLang;
        }
      }
      
      // Redirect to the localized reset password page
      router.replace(`/${locale}/reset-password?uid=${uid}&token=${token}`);
    } else {
      // No valid params, redirect to forgot password page
      router.replace('/en/forgot-password');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the password reset page.</p>
      </div>
    </div>
  );
}   