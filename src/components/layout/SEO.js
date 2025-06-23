import Head from 'next/head';

/**
 * SEO component for dynamic/client-side pages.
 * Usage:
 * <SEO title="..." description="..." keywords="..." canonical="..." og={{...}} twitter={{...}} />
 */
export default function SEO({
  title = 'PDF Techno - Free Online PDF Tools',
  description = 'Free online PDF tools to merge, split, compress, convert and edit PDF files. 100% secure, no registration required.',
  keywords = 'free PDF tools, online PDF editor, merge PDF, split PDF, compress PDF, PDF converter',
  canonical,
  og = {},
  twitter = {},
  children,
}) {
  const ogTitle = og.title || title;
  const ogDescription = og.description || description;
  const ogUrl = og.url || canonical;
  const ogImage = og.image || '/static/assets/pdf-techno-og-image.webp';
  const twitterTitle = twitter.title || title;
  const twitterDescription = twitter.description || description;
  const twitterImage = twitter.image || ogImage;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={og.type || 'website'} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {og.siteName && <meta property="og:site_name" content={og.siteName} />}
      {og.locale && <meta property="og:locale" content={og.locale} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitter.card || 'summary_large_image'} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      {twitter.creator && <meta name="twitter:creator" content={twitter.creator} />}

      {/* Extra children for custom tags (e.g., structured data) */}
      {children}
    </Head>
  );
} 