import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportChatbot from '@/components/SupportChatbot';

export const metadata: Metadata = {
  title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
  description: 'Digital scholarly academic journal publisher advancing science, technology, artificial intelligence, computing, engineering, and interdisciplinary research.',
  keywords: 'academic publishing, scholarly journals, peer review, open access, crossref doi, artificial intelligence research, nextgen innovation & research journals',
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
  return (
    <html lang="en">
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
