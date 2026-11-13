import React from 'react';
import { Metadata } from 'next';
import { Mail, Globe, MapPin, MessageSquare, Phone } from 'lucide-react';
import { getBaseUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Contact Editorial Office & Publisher',
  description: 'Contact NextGen Innovation & Research Journals editorial office, technical support, and publisher at Gower Street, London, United Kingdom, affiliated with University College London (UCL) and in partnership with LOU Publishing.',
  alternates: {
    canonical: `${getBaseUrl()}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-12">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Inquiries & Support</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 scholarly-heading">
          Contact NextGen
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-light">
          Reach the editorial office, technical publication support, or journal leadership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-700">
        <div className="reveal-on-scroll hover-lift bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 space-y-4">
          <h2 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
            Editorial Office
          </h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">General Submissions</span>
                <span className="text-slate-600">nextgenjournals@gmail.com</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MessageSquare className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">DOI & Metadata Deposits</span>
                <span className="text-slate-600">depositsdoi@nextgenuk.online</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Publishing Headquarters</span>
                <span className="text-slate-600">
                  NextGen Innovation &amp; Research Journals<br />
                  Gower Street, London, United Kingdom
                </span>
                <span className="text-[11px] text-blue-700 font-semibold block mt-1">
                  Affiliated Institution: University College London (UCL)
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Strategic Publishing Partner</span>
                <span className="text-slate-600">
                  LOU Publishing and Information Services<br />
                  20 Nnamdi Crescent Street Asaba, Delta State, Nigeria
                </span>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div>Tel: <a href="tel:+2348055821283" className="text-blue-700 hover:underline">+234 8055821283</a></div>
                  <div>Email: <a href="mailto:loupublishinginfo@gmail.com" className="text-blue-700 hover:underline">loupublishinginfo@gmail.com</a></div>
                  <div>Portal: <a href="https://loupublishing.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">loupublishing.onrender.com</a></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="reveal-on-scroll hover-lift delay-100 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 space-y-4">
          <h2 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
            Journal-Specific Contacts
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">NextGen International Journal of Knowledge Management (NIJKM)</span>
              <span className="text-blue-700">lucky.urhiewhu@dou.edu.ng</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Journal of Science, Technology & AI (JSTAI)</span>
              <span className="text-blue-700">nextgeneditorial1@gmail.com</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">NextGen Engineering & Computing Review (NECR)</span>
              <span className="text-blue-700">nextgeneditorial1@gmail.com</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">NextGen Journal of Librarianship (NJL)</span>
              <span className="text-blue-700">lucky.urhiewhu@dou.edu.ng</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Interdisciplinary Health & Life Sciences (IHLS)</span>
              <span className="text-blue-700">nextgeneditorial1@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
