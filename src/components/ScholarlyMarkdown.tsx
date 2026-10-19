import React from 'react';

interface ScholarlyMarkdownProps {
  content: string;
  className?: string;
}

export default function ScholarlyMarkdown({ content, className = '' }: ScholarlyMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-slate max-w-none text-sm space-y-5 leading-relaxed ${className}`}>
      {content.split('\n\n').map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 1 (# ...)
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-6 scholarly-heading">
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        // Heading 2 (## ...)
        if (trimmed.startsWith('## ')) {
          return (
            <div key={idx} className="pt-2">
              <h3 className="text-lg font-bold text-slate-900 text-blue-900 flex items-center gap-2 scholarly-heading">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                {trimmed.replace(/^##\s+/, '')}
              </h3>
            </div>
          );
        }

        // Heading 3 (### ...)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-slate-900 mt-3 scholarly-heading">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        // Blockquote (> ...)
        if (trimmed.startsWith('> ')) {
          return (
            <div key={idx} className="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-lg text-slate-700 italic my-3 text-xs leading-relaxed">
              {trimmed.replace(/^>\s+/, '')}
            </div>
          );
        }

        // List items
        if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.includes('\n1. ') || /^\d+\.\s+/.test(trimmed)) {
          const lines = trimmed.split('\n');
          return (
            <ul key={idx} className="space-y-1.5 pl-4 list-disc text-slate-700 text-xs sm:text-sm">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
                if (!cleanLine) return null;
                return (
                  <li key={lIdx} className="leading-relaxed">
                    {cleanLine.includes('**') ? (
                      <span>
                        {cleanLine.split('**').map((seg, sIdx) =>
                          sIdx % 2 === 1 ? <strong key={sIdx} className="text-slate-900 font-bold">{seg}</strong> : seg
                        )}
                      </span>
                    ) : (
                      cleanLine
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Horizontal rule
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-200 my-4" />;
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed">
            {trimmed.includes('**') ? (
              <span>
                {trimmed.split('**').map((seg, sIdx) =>
                  sIdx % 2 === 1 ? <strong key={sIdx} className="text-slate-900 font-bold">{seg}</strong> : seg
                )}
              </span>
            ) : (
              trimmed
            )}
          </p>
        );
      })}
    </div>
  );
}
