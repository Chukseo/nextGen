'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, X } from 'lucide-react';
import { generateAPACitation, generateBibTeX, generateRIS, CitationArticleData } from '@/lib/citations';

export default function CitationModal({
  data,
  onClose,
}: {
  data: CitationArticleData;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'APA' | 'BibTeX' | 'RIS'>('APA');
  const [copied, setCopied] = useState(false);

  const apaText = generateAPACitation(data);
  const bibtexText = generateBibTeX(data);
  const risText = generateRIS(data);

  const currentContent = activeTab === 'APA' ? apaText : activeTab === 'BibTeX' ? bibtexText : risText;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = 'citation.txt';
    let mime = 'text/plain';

    if (activeTab === 'BibTeX') {
      filename = 'article.bib';
      mime = 'application/x-bibtex';
    } else if (activeTab === 'RIS') {
      filename = 'article.ris';
      mime = 'application/x-research-info-systems';
    }

    const blob = new Blob([currentContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-sm">Cite this Academic Article</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex border-b border-slate-200">
            {(['APA', 'BibTeX', 'RIS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto">
            {currentContent}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold py-2 px-3 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Citation'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold py-2 px-3 rounded bg-blue-700 hover:bg-blue-800 text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .{activeTab.toLowerCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
