import RepairPdf from '@/components/pages/RepairPdf';

export const metadata = {
  title: 'Repair Damaged PDF Online Free – Quick & Secure Tool',
  description: 'Fix corrupted or damaged PDF files online for free. Restore content quickly with our secure, easy-to-use repair tool. No downloads or sign-up needed.',
  keywords: 'repair damaged pdf online free, how to repair a damaged pdf file online, repair PDF, fix PDF, corrupted PDF, damaged PDF, PDF recovery, restore PDF',
  openGraph: {
    title: 'Repair PDF Online Free - Fix Corrupted PDFs | PDF Techno',
    description: 'Repair corrupted or damaged PDF files online. Recover data from broken PDFs.',
    url: 'https://www.pdftechno.com/repair-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repair PDF Online Free - PDF Techno',
    description: 'Repair corrupted or damaged PDF files online. Free and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/repair-pdf',
    languages: {
      'en-US': '/repair-pdf',
      'es-ES': '/es/repair-pdf',
      'fr-FR': '/fr/repair-pdf',
    },
  },
};

export default function RepairPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Repair PDF - PDF Techno",
            "description": "Repair corrupted or damaged PDF files online. Recover data from broken PDFs.",
            "url": "https://www.pdftechno.com/repair-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Fix corrupted PDFs",
              "Recover damaged files",
              "Restore PDF structure",
              "Extract readable data",
              "Batch repair",
              "Secure processing"
            ]
          })
        }}
      />
      <RepairPdf />
    </>
  );
}