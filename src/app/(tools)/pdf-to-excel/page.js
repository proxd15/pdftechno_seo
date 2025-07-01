import PdftoExcel from '@/components/pages/PdftoExcel';

export const metadata = {
  title: 'Convert PDF to Excel Online Free - PDF to XLSX | PDF Techno',
  description: 'Convert PDF tables to Excel spreadsheets online. Extract data from PDF to XLS/XLSX format. Free, fast, and accurate.',
  keywords: 'PDF to Excel, PDF to XLSX, PDF to XLS, convert PDF to Excel, extract PDF tables, PDF data extraction',
  openGraph: {
    title: 'Convert PDF to Excel Online Free - PDF to XLSX | PDF Techno',
    description: 'Convert PDF tables to Excel spreadsheets online. Extract data from PDF to Excel format.',
    url: 'https://www.pdftechno.com/pdf-to-excel',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert PDF to Excel Online Free - PDF Techno',
    description: 'Convert PDF tables to Excel spreadsheets online. Free, fast, and accurate.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/pdf-to-excel',
    languages: {
      'en-US': '/pdf-to-excel',
      'es-ES': '/es/pdf-to-excel',
      'fr-FR': '/fr/pdf-to-excel',
    },
  },
};

export default function PdfToExcelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PDF to Excel Converter - PDF Techno",
            "description": "Convert PDF tables to Excel spreadsheets online. Extract data from PDF to Excel format.",
            "url": "https://www.pdftechno.com/pdf-to-excel",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert PDF to Excel",
              "Extract tables accurately",
              "Preserve data structure",
              "Support complex tables",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <PdftoExcel />
    </>
  );
}