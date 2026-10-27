import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportChatbot from '@/components/SupportChatbot';
import { getBaseUrl } from '@/lib/siteUrl';

const SITE_URL = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
    template: '%s | NextGen Innovation & Research Journals',
  },
  description: 'Digital scholarly academic journal publisher advancing science, technology, artificial intelligence, computing, engineering, and interdisciplinary research.',
  keywords: [
    'NextGen Innovation & Research Journals',
    'NextGen Journals',
    'NextGen Research',
    'nextgenuk.online',
    'academic publishing',
    'scholarly journals',
    'peer-reviewed open access',
    'Crossref DOI',
    'Zenodo Open Science',
    'Google Scholar indexing',
    'London UK publisher',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'NextGen Innovation & Research Journals',
    title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
    description: 'Peer-reviewed open-access scholarly publishing across science, technology, AI, engineering, and interdisciplinary research.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextGen Innovation & Research Journals',
    description: 'Peer-reviewed open-access scholarly publishing.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PublishingHouse',
    name: 'NextGen Innovation & Research Journals',
    alternateName: 'NextGen Research and Innovation Press',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Peer-reviewed open-access scholarly academic publisher based in London, UK.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'London',
      addressCountry: 'GB',
    },
    publishingPrinciples: `${SITE_URL}/editorial-policies`,
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <SupportChatbot />
        </Providers>
      </body>
    </html>
  );
}
