import MyFiles from '@/components/pages/Auth/MyFiles';

export const metadata = {
  title: 'My Files - PDF Techno',
  description: 'Access and manage all your processed PDF files in one place.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'My Files - PDF Techno',
    description: 'Access and manage your PDF files.',
    url: 'https://www.pdftechno.com/my-files',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/my-files',
    languages: {
      'en-US': '/my-files',
      'es-ES': '/es/my-files',
      'fr-FR': '/fr/my-files',
    },
  },
};

export default function MyFilesPage() {
  return <MyFiles />;
}