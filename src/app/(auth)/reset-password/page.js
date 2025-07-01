'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, Shield, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function ResetPasswordPage() {
  const params = useParams();
  const { locale } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0
  });
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    setPasswordStrength({
      ...checks,
      score
    });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-600';
    if (passwordStrength.score <= 3) return 'text-yellow-600';
    if (passwordStrength.score <= 4) return 'text-blue-600';
    return 'text-green-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!uid || !token) {
        setError('Invalid reset link. The link appears to be malformed or incomplete.');
        setIsValidating(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid, token }),
        });
        
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
        } else {
          setError(data.message || 'This reset link has expired or is invalid. Password reset links are only valid for 24 hours.');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setError('Unable to validate reset link. Please check your internet connection and try again.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [uid, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'new_password') {
      checkPasswordStrength(value);
    }
    
    if (error) setError('');
  };

  const validatePassword = () => {
    if (!formData.new_password) {
      setError('New password is required');
      return false;
    }
    
    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'password123'];
    if (commonPasswords.includes(formData.new_password.toLowerCase())) {
      setError('This password is too common. Please choose a more secure password.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResetSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password. Please try again or request a new reset link.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Reset Link</h2>
          <p className="text-gray-600">Please wait while we verify your password reset link...</p>
          <div className="mt-4 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-lg shadow-sm">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Password Reset Complete!</h1>
            <p className="text-gray-600 text-lg">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800 font-medium">Your account is now secure with the new password</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href={`/${locale}/login`}
              className="w-full inline-flex items-center justify-center p-4 rounded-lg font-semibold text-white transition-colors hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#DA1F10' }}
            >
              Continue to Login
            </Link>
            
            <p className="text-sm text-gray-500">
              For security reasons, you'll need to sign in again with your new password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-lg shadow-sm">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Reset Link Invalid</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href={`/${locale}/forgot-password`}
              className="w-full inline-flex items-center justify-center p-4 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#DA1F10' }}
            >
              Request New Reset Link
            </Link>
            
            <Link
              href={`/${locale}/login`}
              className="w-full inline-flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#DA1F10' }}>
            Create New Password
          </h1>
          <p className="text-gray-600">
            Choose a strong password to keep your account secure.
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mt-0.5 mr-3 text-red-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="new_password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-colors"
                placeholder="Enter your new password"
                required
                disabled={isSubmitting}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.new_password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                  <span className={`text-sm font-semibold ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordStrength.length ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    8+ characters
                  </div>
                  <div className={`flex items-center ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordStrength.uppercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Uppercase letter
                  </div>
                  <div className={`flex items-center ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordStrength.lowercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Lowercase letter
                  </div>
                  <div className={`flex items-center ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordStrength.number ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Number
                  </div>
                  <div className={`flex items-center ${passwordStrength.special ? 'text-green-600' : 'text-gray-400'} col-span-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordStrength.special ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Special character (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors ${
                  formData.confirm_password && formData.new_password !== formData.confirm_password
                    ? 'border-red-300 focus:border-red-300'
                    : formData.confirm_password && formData.new_password === formData.confirm_password
                    ? 'border-green-300 focus:border-green-300'
                    : 'border-gray-300 focus:border-red-300'
                }`}
                placeholder="Confirm your new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            {formData.confirm_password && (
              <div className="mt-2 flex items-center text-sm">
                {formData.new_password === formData.confirm_password ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Passwords match
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Passwords don't match
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || passwordStrength.score < 3 || formData.new_password !== formData.confirm_password}
            className="w-full p-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:opacity-90"
            style={{ backgroundColor: '#DA1F10' }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Update Password
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Security Tips:</p>
                <ul className="mt-1 space-y-0.5">
                  <li>• Use a unique password you haven't used elsewhere</li>
                  <li>• Consider using a password manager</li>
                  <li>• Don't share your password with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}