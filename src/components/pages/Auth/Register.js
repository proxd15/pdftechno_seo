'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, AlertTriangle, Shield } from 'lucide-react';
import { useI18n } from '@/i18n';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function SignUpPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [passwordWarnings, setPasswordWarnings] = useState([]);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const [proceedWithWeakPassword, setProceedWithWeakPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { t, locale, changeLocale } = useI18n();
  
  const { register, setUser, setIsAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('Auth.from') || '/';

  // Check for authentication errors from URL params and handle OAuth success
  useEffect(() => {
    const error = searchParams.get('Auth.error');
    if (error === 'authentication_failed') {
      setFormError('Google authentication failed. Please try again.');
      setIsGoogleLoading(false);
    } else if (error === 'server_error') {
      setFormError('Server error occurred. Please try again.');
      setIsGoogleLoading(false);
    }

    // Check for tokens in URL fragment (from OAuth redirect)
    const handleOAuthTokens = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('Auth.access_token');
      const refreshToken = params.get('Auth.refresh_token');
      const userData = params.get('Auth.user');

      if (accessToken && refreshToken && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          
          // Save tokens
          const storage = sessionStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
          storage.setItem('accessToken', accessToken);
          storage.setItem('refreshToken', refreshToken);
          storage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          setUser(user);
          setIsAuthenticated(true);
          
          // Clean up URL and redirect
          window.location.hash = '';
          router.push(redirectPath);
        } catch (error) {
          console.error('Error processing OAuth tokens:', error);
          setFormError('Authentication processing failed. Please try again.');
          setIsGoogleLoading(false);
        }
      }
    };

    handleOAuthTokens();
  }, [searchParams, setUser, setIsAuthenticated, router, redirectPath]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formError) {
      setFormError('');
    }
    
    // Reset password warning state when password changes
    if (name === 'password' || name === 'password_confirm') {
      setProceedWithWeakPassword(false);
      setShowPasswordWarning(false);
    }
  };

  const checkPasswordStrength = (password, name, email) => {
    const warnings = [];
    
    // Check if password is entirely numeric
    if (/^\d+$/.test(password)) {
      warnings.push('Password cannot be entirely numeric');
    }
    
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', '123456789', 'password123', 'admin', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
      warnings.push('This password is too common and easily guessable');
    }
    
    // Check if password is too similar to email or name
    if (email && password.toLowerCase().includes(email.split('Auth.@')[0].toLowerCase())) {
      warnings.push('Password is too similar to your email address');
    }
    
    if (name && password.toLowerCase().includes(name.toLowerCase())) {
      warnings.push('Password is too similar to your name');
    }
    
    // Check password length strength
    if (password.length < 12) {
      warnings.push('Consider using a longer password (12+ characters) for better security');
    }
    
    // Check for lack of character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const charTypes = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    if (charTypes < 3) {
      warnings.push('Consider using a mix of uppercase, lowercase, numbers, and special characters');
    }
    
    return warnings;
  };

  const validateForm = (skipPasswordWarnings = false) => {
    if (!formData.name.trim()) {
      setFormError('Full Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return false;
    }
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setFormError('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.password !== formData.password_confirm) {
      setFormError('Passwords do not match');
      return false;
    }
    
    // Check for critical password issues (these block registration)
    if (/^\d+$/.test(formData.password)) {
      setFormError('Password cannot be entirely numeric');
      return false;
    }
    
    // Check for password warnings (these show warning but allow continuation)
    if (!skipPasswordWarnings && !proceedWithWeakPassword) {
      const warnings = checkPasswordStrength(formData.password, formData.name, formData.email);
      if (warnings.length > 0) {
        setPasswordWarnings(warnings);
        setShowPasswordWarning(true);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting registration data:", formData);
      
      const result = await register({
        ...formData,
        phone: formData.phone || undefined
      });
      
      if (result.success) {
        router.push('/');
      } else {
        // Handle specific error types
        if (result.error_type === 'user_exists_google') {
          setFormError(result.message || 'Please sign in with Google instead.');
        } else if (result.error_type === 'user_exists') {
          setFormError(result.message || 'User already exists. Please login instead.');
        } else {
          setFormError(result.error || result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle network or unexpected errors
      if (error.message.includes('user_exists') || error.message.toLowerCase().includes('already exists')) {
        setFormError('An account with this email already exists. Please login instead.');
      } else {
        setFormError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedWithWeakPassword = async () => {
    setProceedWithWeakPassword(true);
    setShowPasswordWarning(false);
    setPasswordWarnings([]);
    
    // Directly proceed with registration without re-validation
    try {
      setIsSubmitting(true);
      console.log("Proceeding with weak password - submitting registration data:", formData);
      
      const result = await register({
        ...formData,
        phone: formData.phone || undefined
      });
      
      if (result.success) {
        router.push('/');
      } else {
        // Handle specific error types
        if (result.error_type === 'user_exists_google') {
          setFormError(result.message || 'Please sign in with Google instead.');
        } else if (result.error_type === 'user_exists') {
          setFormError(result.message || 'User already exists. Please login instead.');
        } else {
          setFormError(result.error || result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle network or unexpected errors
      if (error.message.includes('user_exists') || error.message.toLowerCase().includes('already exists')) {
        setFormError('An account with this email already exists. Please login instead.');
      } else {
        setFormError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    // Store remember me preference before redirect
    sessionStorage.setItem('rememberMe', rememberMe.toString());
    
    // Redirect to Django's Google OAuth URL
    window.location.href = `${API_BASE_URL}/accounts/google/login/`;
  };

  const isGoogleAccountError = formError.toLowerCase().includes('google') || 
                               formError.toLowerCase().includes('sign in with google');
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
      <div className='h-12'></div>
      
      {/* Overlay Loader for Google Authentication */}
      {isGoogleLoading && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-filter backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#DA1F10] rounded-full mb-4">
                <svg className="animate-spin w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Creating Your Account</h2>
              <p className="text-gray-600 text-sm">Please wait while we set up your account with Google...</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected to Google</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Creating account...</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Setting up profile</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Warning Modal */}
      {showPasswordWarning && (
        <div className="fixed inset-0 backdrop-filter backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-amber-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Password Security Warning</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                We've identified some security concerns with your password:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {passwordWarnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-700">{warning}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowPasswordWarning(false);
                  setPasswordWarnings([]);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Shield className="inline mr-1" size={16} />
                Choose Better Password
              </button>
              <button
                onClick={handleProceedWithWeakPassword}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">
          <span style={{ color: '#DA1F10' }}>{t('Auth.sign')}</span> {t('Auth.up')}
        </h1>
        
        {formError && (
          <div className={`mb-4 p-3 border rounded-md ${
            formError.toLowerCase().includes('login with google')
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : formError.toLowerCase().includes('already exists') || formError.toLowerCase().includes('login instead')
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start">
              <div className="flex-1">
                {formError}
                
                {/* Show Google login button if user exists with Google account */}
                {formError.toLowerCase().includes('login with google') && (
                  <div className="mt-3">
                    <button 
                      onClick={handleGoogleSignUp}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Image src="/images/google-icon.svg" alt="Google" width={16} height={16} className="h-4 w-4 mr-2" />
                      Login with Google
                    </button>
                  </div>
                )}
                
                {/* Show regular login link if user exists without Google */}
                {(formError.toLowerCase().includes('already exists') && !formError.toLowerCase().includes('login with google')) && (
                  <div className="mt-2">
                    <Link 
                      href={`/login`} 
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Go to Login →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="sr-only">{t('Auth.fullName')}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t('Auth.fullNamePlaceholder')}
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="sr-only">{t('Auth.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder={t('Auth.phonePlaceholder')}
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="sr-only">{t('Auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t('Auth.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder={t('Auth.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
              />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="password_confirm"
              name="password_confirm"
              placeholder={t('Auth.confirmPasswordPlaceholder')}
              value={formData.password_confirm}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2 h-4 w-4 border-gray-300 rounded cursor-pointer"
              disabled={isSubmitting}
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
              {t('Auth.rememberMe')}
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 rounded-md font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#DA1F10' }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('Auth.signingUp')}
              </>
            ) : (
              t('Auth.signUp')
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t('Auth.or')}</span>
            </div>
          </div>
          
          <button 
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
            className="mt-4 w-full flex items-center justify-center p-3 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Image src="/images/google-icon.svg" alt="Google" width={20} height={20} className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Please wait...' : 'Continue with Google'}
          </button>
          
          <p className="mt-6 text-sm text-gray-600">
            {t('Auth.haveAccount')}{' '}
            <Link href={`/login`} className="text-purple-600 hover:underline cursor-pointer">
              {t('Auth.loginToAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
