'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function ForgotPasswordPage() {
  const params = useParams();
  const { locale } = params;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const { t } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsGoogleUser(false);
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        if (data.error === 'google_user') {
          setIsGoogleUser(true);
          setError(data.message || 'This account was created with Google. Please use Google to sign in.');
        } else if (data.error === 'email_not_found') {
          setError(data.message || 'No account found with this email address.');
        } else {
          setError(data.message || 'Failed to send reset email. Please try again.');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/accounts/google/login/`;
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-900">Next Steps:</h3>
                <ul className="mt-1 text-sm text-blue-700 space-y-1">
                  <li>• Check your email inbox for the reset link</li>
                  <li>• Don't forget to check your spam/junk folder</li>
                  <li>• The link will expire in 24 hours</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                setError('');
              }}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Send to Different Email
            </button>
            
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#DA1F10' }}>
            Forgot Password?
          </h1>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        {error && (
          <div className={`mb-4 p-3 border rounded-md ${
            isGoogleUser 
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mt-0.5 mr-3" />
              <div className="flex-1">
                {error}
                {isGoogleUser && (
                  <div className="mt-3">
                    <button
                      onClick={handleGoogleLogin}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <img src="/images/google-icon.svg" alt="Google" className="h-4 w-4 mr-2" />
                      Continue with Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              placeholder="Enter your email address"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 rounded-md font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ backgroundColor: '#DA1F10' }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Reset Link
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href={`/${locale}/register`} className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}