export async function GET() {
  const baseUrl = 'https://www.pdftechno.com';
  const locales = ['en', 'es', 'fr', 'de'];
  const staticPages = [
    '',
    'about',
    'contact',
    'privacy',
    'terms',
    'cookie-policy',
  ];
  const toolPages = [
    'add-page-numbers',
    'compress-pdf',
    'edit-pdf',
    'excel-to-pdf',
    'image-to-pdf',
    'merge-pdf',
    'ocr-pdf',
    'organize-pdf',
    'pdf-to-excel',
    'pdf-to-image',
    'pdf-to-pdfa',
    'pdf-to-powerpoint',
    'pdf-to-word',
    'powerpoint-to-pdf',
    'protect-pdf',
    'repair-pdf',
    'rotate-pdf',
    'sign-pdf',
    'split-pdf',
    'unlock-pdf',
    'watermark-pdf',
    'word-to-pdf',
  ];
  const urls = [];
  for (const locale of locales) {
    for (const page of staticPages) {
      urls.push(`${baseUrl}/${locale}${page ? '/' + page : ''}`);
    }
    for (const tool of toolPages) {
      urls.push(`${baseUrl}/${locale}/${tool}`);
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (url) => `<url><loc>${url}</loc></url>`
    )
    .join('\n')}
</urlset>`;
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 