export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/my-files',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: 'https://www.pdftechno.com/sitemap.xml',
  };
}