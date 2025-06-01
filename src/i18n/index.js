'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { locales, defaultLocale } from './config';

// Import all dictionary files
import enDict from './locales/en.json';
import esDict from './locales/es.json';
import frDict from './locales/fr.json';

const dictionaries = {
  en: enDict,
  es: esDict,
  fr: frDict
};

// Function to get localized href
export function getLocalizedHref(path, locale) {
  // For locale URL structure, add locale prefix
  if (path === '/') {
    return `/${locale}`;
  }
  return `/${locale}${path}`;
}

// Create the i18n context
const I18nContext = createContext(null);

export function I18nProvider({ children, initialLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Use the initialLocale from URL params if available, otherwise fall back to default
  const [locale, setLocale] = useState(initialLocale && locales.includes(initialLocale) ? initialLocale : defaultLocale);
  const [dict, setDict] = useState(dictionaries[locale] || dictionaries[defaultLocale]);

  // Sync with cookies when component mounts or locale changes
  useEffect(() => {
    const cookieLocale = Cookies.get('NEXT_LOCALE');
    
    // If cookie exists but differs from current locale, update it
    if (locale !== cookieLocale) {
      Cookies.set('NEXT_LOCALE', locale, { expires: 365, path: '/' });
    }
  }, [locale]);

  // Change locale and redirect
  const changeLocale = (newLocale) => {
    if (dictionaries[newLocale]) {
      // Set cookie for middleware
      Cookies.set('NEXT_LOCALE', newLocale, { expires: 365, path: '/' });
      
      // Update state
      setLocale(newLocale);
      setDict(dictionaries[newLocale]);
      
      // Redirect to the new locale URL
      if (pathname) {
        // Extract the path without the locale prefix
        const segments = pathname.split('/');
        // Remove the first empty segment and the locale segment
        segments.splice(0, 2);
        const pathWithoutLocale = segments.length > 0 ? `/${segments.join('/')}` : '/';
        
        // Construct the new URL with the new locale
        const newPath = getLocalizedHref(pathWithoutLocale, newLocale);
        router.push(newPath);
      }
    }
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        locales,
        changeLocale,
        t: (key) => {
          // Simple dot notation path resolver
          const path = key.split('.');
          let current = dict;
          
          for (const segment of path) {
            if (current[segment] === undefined) {
              console.warn(`Translation missing: ${key}`);
              return key;
            }
            current = current[segment];
          }
          
          return current;
        },
        dict,
        getLocalizedHref: (path) => getLocalizedHref(path, locale),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use the i18n context
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}