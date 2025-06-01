'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const params = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { t, locale, changeLocale } = useI18n();
  
  const { login, setUser, setIsAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('from') || '/';

  // Check for authentication errors from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'authentication_failed') {
      setFormError('Google authentication failed. Please try again.');
    } else if (error === 'server_error') {
      setFormError('Server error occurred. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        router.push(redirectPath);
      } else {
        setFormError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setFormError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    // Store remember me preference before redirect
    sessionStorage.setItem('rememberMe', rememberMe.toString());
    
    // Redirect to Django's Google OAuth URL (keeping original URL structure)
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/google/login/`;
  };
  
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-4">
      {/* Overlay Loader for Google Authentication */}
      {isGoogleLoading && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-filter backdrop-blur-mdflex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#DA1F10] bg-opacity-10 rounded-full mb-4">
                <svg className="animate-spin w-8 h-8 text-[#DA1F10]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Completing Authentication</h2>
              <p className="text-gray-600 text-sm">Please wait while we finish setting up your account...</p>
            </div>
            
            {/* Progress indicators */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected to Google</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Verifying account...</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Setting up profile</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: '#DA1F10' }}>
          {t('login')}
        </h1>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              id="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              disabled={isSubmitting}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 h-4 w-4 cursor-pointer border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                {t('rememberMe')}
              </label>
            </div>
            
            <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 rounded-md cursor-pointer hover:bg-red-800 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ backgroundColor: '#DA1F10' }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loggingIn')}
              </>
            ) : (
              t('login')
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t('or')}</span>
            </div>
          </div>
          
          <button 
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="mt-4 w-full flex cursor-pointer items-center justify-center p-3 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/images/google-icon.svg" alt="Google" className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Please wait...' : 'Continue with Google'}
          </button>
          
          <p className="mt-6 text-sm text-gray-600">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="text-purple-600 hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}