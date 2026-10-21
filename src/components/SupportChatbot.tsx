'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  UploadCloud,
  FileText,
  ShieldCheck,
  TrendingUp,
  Mail,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  links?: { label: string; href: string }[];
  timestamp: string;
}

const KNOWLEDGE_BASE: {
  keywords: string[];
  response: string;
  links?: { label: string; href: string }[];
}[] = [
  {
    keywords: ['submit', 'submission', 'upload manuscript', 'how to submit', 'start submission'],
    response: `To submit your manuscript to NextGen Innovation & Research Journals:
1. Navigate to the **Submit Manuscript** portal.
2. Select your target journal.
3. Upload your manuscript file (**Microsoft Word .docx, .doc** or **PDF**).
4. Enter your title, abstract, and keywords.
5. Add all co-author names, affiliations, emails, and ORCID identifiers.
6. Provide funding, data availability, and conflict-of-interest declarations.
7. Confirm and submit. You will receive an official submission tracking code (e.g., \`NGR-2026-XXXX\`).`,
    links: [
      { label: 'Start Submission Wizard', href: '/submit' },
      { label: 'Browse Journals', href: '/journals' }
    ]
  },
  {
    keywords: ['format', 'file format', 'docx', 'doc', 'pdf', 'accepted files', 'file types'],
    response: `NextGen Innovation & Research Journals accepts manuscripts in:
- **Microsoft Word (.docx, .doc)**: Prepared in 11pt/12pt standard academic font, 1.5 line spacing, and numbered sections.
- **Portable Document Format (.pdf)**: High-resolution typeset manuscripts or preprints with embedded fonts.
- Tables should include descriptive titles and clear column headers.
- Figures must have a minimum resolution of 300 DPI.`,
    links: [
      { label: 'Submission Guidelines', href: '/submit' },
      { label: 'Editorial Policies', href: '/editorial-policies' }
    ]
  },
  {
    keywords: ['peer review', 'review process', 'double blind', 'anonymous', 'how long', 'timeline'],
    response: `NextGen Innovation & Research Journals practices **Double-Anonymous Peer Review**:
- Both author identities and reviewer identities are strictly concealed throughout the evaluation.
- **Initial Desk Review**: 3 to 5 business days.
- **External Peer Review**: 2 to 4 weeks with at least two independent expert subject reviewers.
- Editorial decisions include: **Accept**, **Minor Revisions**, **Major Revisions**, or **Reject**.`,
    links: [
      { label: 'Peer Review Policies', href: '/editorial-policies' }
    ]
  },
  {
    keywords: ['guideline', 'guidelines', 'author guideline', 'instruction', 'instructions for authors'],
    response: `Each journal features tailored Author Guidelines:
- Specific scope criteria, section structuring, word count parameters, and reference formats.
- Authors can view the dedicated guidelines page for each journal via the **Author Guidelines** tab on any journal portal.`,
    links: [
      { label: 'Explore Journals', href: '/journals' },
      { label: 'Submit Manuscript', href: '/submit' }
    ]
  },
  {
    keywords: ['fee', 'apc', 'cost', 'charge', 'price', 'payment', 'article processing'],
    response: `**Open Access & Article Processing Charges (APCs)**:
- All published articles are immediately **Open Access** under the **CC BY 4.0** license.
- **Inaugural Volume Period**: There are **zero publication fees** or author charges. Publication is completely free for contributing authors.`,
    links: [
      { label: 'Open Access Ethics', href: '/editorial-policies' }
    ]
  },
  {
    keywords: ['impact factor', 'jif', 'citescore', 'metrics', 'citation', 'ranking'],
    response: `NextGen Innovation & Research Journals publishes transparent **2-Year Journal Impact Factor (JIF)** reports for all journals:
- Calculated using standard Clarivate / JCR formulas across all peer-reviewed articles and citation windows.
- Includes 5-Year Impact Factor, CiteScore™ tracker, and Immediacy Index.
- Click the **Impact Factor badge** on any journal masthead or sidebar to inspect the full report and formula breakdown.`,
    links: [
      { label: 'View JSTAI Metrics', href: '/journals/jstai' }
    ]
  },
  {
    keywords: ['index', 'indexing', 'google scholar', 'crossref', 'doi', 'scholar'],
    response: `All published articles on NextGen Innovation & Research Journals are globally indexed:
- **Google Scholar**: Server-side Highwire Press meta citation tags (\`citation_title\`, \`citation_author\`, \`citation_pdf_url\`, \`citation_doi\`, etc.).
- **Crossref**: Persistent digital DOIs (\`10.5555/...\`).
- **Dynamic XML Sitemap & Robots**: Continuous automated crawling for scholarly search engines.`,
    links: [
      { label: 'Search Published Research', href: '/articles' }
    ]
  },
  {
    keywords: ['download', 'pdf', 'pdf.json', 'save pdf', 'print'],
    response: `To read or download an article:
1. Open the article detail page.
2. Click the **Download Official PDF** button.
3. The platform delivers the official typeset scholarly publication with full academic tables, headings, and metadata.
4. You can also read the complete manuscript directly on the article web page.`,
    links: [
      { label: 'Browse Articles', href: '/articles' }
    ]
  },
  {
    keywords: ['status', 'track', 'where is my paper', 'decision', 'revision'],
    response: `To track your submission or submit a requested revision:
1. Sign in to your account.
2. Open the **Author Portal** from your user menu.
3. You will see real-time status badges (*Submitted*, *Under Review*, *Revision Requested*, *Accepted*, *Published*).
4. If a revision was requested, click **Submit Revised Manuscript** to upload your updated file and response letter.`,
    links: [
      { label: 'Author Portal', href: '/dashboard/author' },
      { label: 'Sign In', href: '/login' }
    ]
  },
  {
    keywords: ['contact', 'email', 'editorial office', 'help', 'editor email', 'support'],
    response: `You can reach our administrative and editorial offices:
- **General Inquiries**: \`nextgenjournals@gmail.com\`
- **Office**: London, UK
- You can also leave a message right here in this chat, and our academic support team will follow up!`,
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'About the Journals', href: '/about' }
    ]
  }
];

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Hello! I am the NextGen Scholarly Support Assistant. How can I help you today with manuscript submission, peer review, author guidelines, or article access?',
      links: [
        { label: 'Submit Manuscript', href: '/submit' },
        { label: 'Browse Journals', href: '/journals' },
        { label: 'Editorial Policies', href: '/editorial-policies' }
      ],
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'How do I submit a manuscript?',
    'What file formats are accepted?',
    'How does peer review work?',
    'Are there publication fees (APCs)?',
    'Where are articles indexed?',
    'How are 2-Year Impact Factors calculated?'
  ];

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Match response from knowledge base
    setTimeout(() => {
      const lower = text.toLowerCase();
      let matched = KNOWLEDGE_BASE.find((k) =>
        k.keywords.some((kw) => lower.includes(kw))
      );

      let botResponse = '';
      let botLinks: { label: string; href: string }[] | undefined = undefined;

      if (matched) {
        botResponse = matched.response;
        botLinks = matched.links;
      } else {
        botResponse = `Thank you for your inquiry. For specific queries regarding "${text}", please review our Editorial Guidelines or contact the managing editorial office at nextgenjournals@gmail.com. Our editorial desk is available to assist you Monday through Friday.`;
        botLinks = [
          { label: 'Author Guidelines', href: '/submit' },
          { label: 'Contact Office', href: '/contact' }
        ];
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        links: botLinks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center group">
          <div className="hidden sm:flex items-center bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg mr-3 backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
            <span className="font-medium">Academic Support Online</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center relative border-2 border-white/20"
            aria-label="Open Academic Support Chat"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[85vh] sm:max-h-[640px] flex flex-col rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-blue-950 text-white p-4 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white">NextGen Support Desk</h3>
                  <span className="flex items-center text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                    24/7 AI Desk
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Instant guidance for authors, reviewers & visitors
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick FAQ Pills */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0 pl-1">
              Popular:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="shrink-0 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors shadow-2xs whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-gradient-to-b from-slate-50/50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs space-y-2 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs font-normal">
                    {msg.text}
                  </div>

                  {msg.links && msg.links.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.links.map((link, lIdx) => (
                        <Link
                          key={lIdx}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-colors border border-blue-200"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2">
                <Bot className="w-4 h-4 text-blue-600 animate-spin" />
                <span>NextGen Desk is thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about submissions, review, or guidelines..."
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
