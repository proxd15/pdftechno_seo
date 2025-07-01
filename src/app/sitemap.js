import { locales, defaultLocale } from '@/i18n/config';

const baseUrl = 'https://www.pdftechno.com';

// Define all your routes
const routes = [
  '',
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'rotate-pdf',
  'organize-pdf',
  'word-to-pdf',
  'excel-to-pdf',
  'powerpoint-to-pdf',
  'image-to-pdf',
  'xml-to-pdf',
  'heic-to-pdf',
  'pdf-to-word',
  'pdf-to-powerpoint',
  'pdf-to-image',
  'pdf-to-excel',
  'pdf-to-pdfa',
  'unlock-pdf',
  'protect-pdf',
  'sign-pdf',
  'watermark-pdf',
  'repair-pdf',
  'ocr-pdf',
  'scan-pdf',
  'add-page-numbers',
  'edit-pdf',
  'about',
  'privacy',
  'terms',
];

// Routes that should not be indexed
const excludedRoutes = [
  'login',
  'register',
  'profile',
  'my-files',
];

// Priority configuration for different route types
const getPriority = (route) => {
  if (route === '') return 1.0; // Homepage
  if (route === 'merge-pdf' || route === 'compress-pdf' || route === 'pdf-to-word') return 0.9; // Popular tools
  if (route.includes('pdf')) return 0.8; // Other PDF tools
  if (route === 'about' || route === 'privacy' || route === 'terms') return 0.5; // Info pages
  return 0.7; // Default
};

// Change frequency configuration
const getChangeFreq = (route) => {
  if (route === '') return 'daily'; // Homepage
  if (route === 'about' || route === 'privacy' || route === 'terms') return 'monthly'; // Static pages
  return 'weekly'; // Tools pages
};

export default function sitemap() {
  const sitemapEntries = [];
  const currentDate = new Date().toISOString();

  // Add entries for each route in each language
  routes.forEach(route => {
    // Add default language (English) with clean URLs
    const url = route === '' ? baseUrl : `${baseUrl}/${route}`;
    sitemapEntries.push({
      url,
      lastModified: currentDate,
      changeFrequency: getChangeFreq(route),
      priority: getPriority(route),
      alternates: {
        languages: {
          'en': url,
          'es': route === '' ? `${baseUrl}/es` : `${baseUrl}/es/${route}`,
          'fr': route === '' ? `${baseUrl}/fr` : `${baseUrl}/fr/${route}`,
        }
      }
    });

    // Add non-default language URLs
    locales.forEach(locale => {
      if (locale !== defaultLocale) {
        const localizedUrl = route === '' ? `${baseUrl}/${locale}` : `${baseUrl}/${locale}/${route}`;
        sitemapEntries.push({
          url: localizedUrl,
          lastModified: currentDate,
          changeFrequency: getChangeFreq(route),
          priority: getPriority(route) * 0.9, // Slightly lower priority for non-default languages
          alternates: {
            languages: {
              'en': url,
              'es': route === '' ? `${baseUrl}/es` : `${baseUrl}/es/${route}`,
              'fr': route === '' ? `${baseUrl}/fr` : `${baseUrl}/fr/${route}`,
            }
          }
        });
      }
    });
  });

  return sitemapEntries;
}