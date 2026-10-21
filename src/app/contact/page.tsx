import React from 'react';
import { Mail, Globe, MapPin, MessageSquare, Phone } from 'lucide-react';

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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
            Editorial Office
          </h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">General Submissions</span>
                <span className="text-slate-600">editorial@nextgen.org</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MessageSquare className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">DOI & Metadata Deposits</span>
                <span className="text-slate-600">doi@nextgen-press.org</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Publishing Headquarters</span>
                <span className="text-slate-600">NextGen Innovation & Research Journal<br />London, UK</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
            Journal-Specific Contacts
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">Journal of Science, Technology & AI (JSTAI)</span>
              <span className="text-blue-700">jstai-nextgenjournals@gmail.com</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">NextGen Engineering & Computing Review (NECR)</span>
              <span className="text-blue-700">necr-nextgenjournals@gmail.com</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Interdisciplinary Health & Life Sciences (IHLS)</span>
              <span className="text-blue-700">ihls-nextgenjournals@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
