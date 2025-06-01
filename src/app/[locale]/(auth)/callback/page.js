// app/[locale]/auth/callback/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuth();
  
  useEffect(() => {
    async function fetchTokens() {
      try {
        // Get tokens from your Django endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/accounts/google/callback/`, {
          credentials: 'include' // Important to include cookies!
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Save auth data
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('accessToken', data.access);
          localStorage.setItem('refreshToken', data.refresh);
          
          // Update auth context
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Redirect to home page
          router.push('/');
        } else {
          router.push('/login?error=authentication_failed');
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        router.push('/login?error=server_error');
      }
    }
    
    fetchTokens();
  }, [router, setUser, setIsAuthenticated]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Authentication</h1>
        <p>Please wait while we finish setting up your account...</p>
      </div>
    </div>
  );
}