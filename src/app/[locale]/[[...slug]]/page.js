import { notFound } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/config';
import dynamic from 'next/dynamic';

// Map of slug paths to their component imports
const pageComponents = {
  '/': dynamic(() => import('@/components/pages/Homepage')),
  'merge-pdf': dynamic(() => import('@/components/pages/MergePdf')),
  'split-pdf': dynamic(() => import('@/components/pages/SplitPdf')),
  'compress-pdf': dynamic(() => import('@/components/pages/CompressPdf')),
  'rotate-pdf': dynamic(() => import('@/components/pages/RotatePdf')),
  'organize-pdf': dynamic(() => import('@/components/pages/OrganizePdf')),
  'word-to-pdf': dynamic(() => import('@/components/pages/WordtoPdf')),
  'excel-to-pdf': dynamic(() => import('@/components/pages/ExceltoPdf')),
  'powerpoint-to-pdf': dynamic(() => import('@/components/pages/PPTtoPdf')),
  'image-to-pdf': dynamic(() => import('@/components/pages/ImagetoPdf')),
  'xml-to-pdf': dynamic(() => import('@/components/pages/XMLtoPdf')),
  'heic-to-pdf': dynamic(() => import('@/components/pages/HeictoPdf')),
  'pdf-to-word': dynamic(() => import('@/components/pages/PdftoWord')),
  'pdf-to-powerpoint': dynamic(() => import('@/components/pages/PdftoPPT')),
  'pdf-to-image': dynamic(() => import('@/components/pages/PdftoImage')),
  'pdf-to-excel': dynamic(() => import('@/components/pages/PdftoExcel')),
  'pdf-to-pdfa': dynamic(() => import('@/components/pages/PdftoPdfa')),
  'unlock-pdf': dynamic(() => import('@/components/pages/UnlockPdf')),
  'protect-pdf': dynamic(() => import('@/components/pages/ProtectPdf')),
  'sign-pdf': dynamic(() => import('@/components/pages/SignPdf')),
  'watermark-pdf': dynamic(() => import('@/components/pages/WatermarkPdf')),
  'repair-pdf': dynamic(() => import('@/components/pages/RepairPdf')),
  'ocr-pdf': dynamic(() => import('@/components/pages/OcrPdf')),
  'add-page-numbers': dynamic(() => import('@/components/pages/PageNumbers')),
//   'edit-pdf': dynamic(() => import('@/components/pages/EditPdf')),
  'login': dynamic(() => import('@/components/pages/Auth/Login')),
  'register': dynamic(() => import('@/components/pages/Auth/Register')),
//   'profile': dynamic(() => import('@/components/pages/Profile')),
  'my-files': dynamic(() => import('@/components/pages/Auth/MyFiles')),
  'about': dynamic(() => import('@/components/pages/Extras/About')),
  'privacy': dynamic(() => import('@/components/pages/Extras/TermsAndConditions')),
  'terms': dynamic(() => import('@/components/pages/Extras/TermsAndConditions')),
};

export async function generateStaticParams() {
  // Generate static params for all non-default locales and all pages
  const params = [];
  
  for (const locale of locales) {
    if (locale !== defaultLocale) {
      // Add all page slugs for each locale
      for (const slug of Object.keys(pageComponents)) {
        if (slug === '') {
          params.push({ locale, slug: [] });
        } else {
          params.push({ locale, slug: [slug] });
        }
      }
    }
  }
  
  return params;
}

export default function LocalizedPage({ params }) {
  const { locale, slug } = params;
  
  // Validate locale
  if (!locales.includes(locale) || locale === defaultLocale) {
    notFound();
  }
  
  // Get the page path
  const pagePath = slug ? slug.join('/') : '';
  
  // Get the component for this page
  const PageComponent = pageComponents[pagePath];
  
  if (!PageComponent) {
    notFound();
  }
  
  return <PageComponent />;
}