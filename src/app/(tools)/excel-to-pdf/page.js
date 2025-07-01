import ExceltoPdf from '@/components/pages/ExceltoPdf';

export const metadata = {
  title: 'Convert Excel to PDF Online Free - XLSX to PDF | PDF Techno',
  description: 'Convert Excel spreadsheets to PDF online. Support for XLS and XLSX files. Free, fast, and secure Excel to PDF converter.',
  keywords: 'Excel to PDF, XLSX to PDF, XLS to PDF, convert Excel to PDF, Excel converter, spreadsheet to PDF',
  openGraph: {
    title: 'Convert Excel to PDF Online Free - XLSX to PDF | PDF Techno',
    description: 'Convert Excel spreadsheets to PDF online. Support for XLS and XLSX files. Free and secure.',
    url: 'https://www.pdftechno.com/excel-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert Excel to PDF Online Free - PDF Techno',
    description: 'Convert Excel spreadsheets to PDF online. Support for XLS and XLSX files.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/excel-to-pdf',
    languages: {
      'en-US': '/excel-to-pdf',
      'es-ES': '/es/excel-to-pdf',
      'fr-FR': '/fr/excel-to-pdf',
    },
  },
};

export default function ExcelToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Excel to PDF Converter - PDF Techno",
            "description": "Convert Excel spreadsheets to PDF online. Support for XLS and XLSX files.",
            "url": "https://www.pdftechno.com/excel-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert Excel to PDF",
              "Support XLS and XLSX",
              "Preserve formatting",
              "Convert formulas and charts",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <ExceltoPdf />
    </>
  );
}