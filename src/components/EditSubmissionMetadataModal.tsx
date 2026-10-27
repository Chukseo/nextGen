'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthorItem {
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  orcid?: string | null;
  isCorresponding?: boolean;
}

interface EditSubmissionMetadataModalProps {
  submission: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export default function EditSubmissionMetadataModal({
  submission,
  isOpen,
  onClose,
  onSuccess,
}: EditSubmissionMetadataModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [articleType, setArticleType] = useState('RESEARCH_ARTICLE');
  const [discipline, setDiscipline] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [references, setReferences] = useState('');
  const [conflictOfInterest, setConflictOfInterest] = useState('');
  const [ethicsStatement, setEthicsStatement] = useState('');
  const [dataAvailability, setDataAvailability] = useState('');
  const [fundingInfo, setFundingInfo] = useState('');
  const [acknowledgements, setAcknowledgements] = useState('');
  const [authors, setAuthors] = useState<AuthorItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setTitle(submission.title || '');
      setSubtitle(submission.subtitle || '');
      setAbstract(submission.abstract || '');
      setArticleType(submission.articleType || 'RESEARCH_ARTICLE');
      setDiscipline(submission.discipline || '');
      setPageRange(submission.pageRange || '');
      setReferences(submission.referencesRaw || '');
      setConflictOfInterest(submission.conflictOfInterest || '');
      setEthicsStatement(submission.ethicsStatement || '');
      setDataAvailability(submission.dataAvailability || '');
      setFundingInfo(submission.fundingInfo || '');
      setAcknowledgements(submission.acknowledgements || '');

      const initialAuthors: AuthorItem[] =
        Array.isArray(submission.coAuthors) && submission.coAuthors.length > 0
          ? submission.coAuthors.map((a: any) => ({
              firstName: a.firstName || '',
              lastName: a.lastName || '',
              email: a.email || '',
              affiliation: a.affiliation || '',
              orcid: a.orcid || '',
              isCorresponding: Boolean(a.isCorresponding),
            }))
          : [
              {
                firstName: submission.author?.name?.split(' ')[0] || '',
                lastName: submission.author?.name?.split(' ').slice(1).join(' ') || '',
                email: submission.author?.email || '',
                affiliation: submission.author?.affiliation || '',
                orcid: submission.author?.orcid || '',
                isCorresponding: true,
              },
            ];

      setAuthors(initialAuthors);
      setError(null);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const handleAddAuthor = () => {
    setAuthors([
      ...authors,
      {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        orcid: '',
        isCorresponding: false,
      },
    ]);
  };

  const handleRemoveAuthor = (idx: number) => {
    if (authors.length <= 1) return;
    setAuthors(authors.filter((_, i) => i !== idx));
  };

  const handleAuthorChange = (idx: number, field: keyof AuthorItem, value: any) => {
    const updated = [...authors];
    if (field === 'isCorresponding' && value === true) {
      // Set this author as corresponding
      updated.forEach((a, i) => {
        a.isCorresponding = i === idx;
      });
    } else {
      (updated[idx] as any)[field] = value;
    }
    setAuthors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }
    if (!abstract.trim() || abstract.length < 50) {
      setError('Abstract must be at least 50 characters.');
      return;
    }
    if (!discipline.trim()) {
      setError('Discipline / Subject Category is required.');
      return;
    }
    if (authors.some((a) => !a.firstName.trim() || !a.lastName.trim() || !a.email.trim() || !a.affiliation.trim())) {
      setError('All author fields (First Name, Last Name, Email, and Affiliation) are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          abstract: abstract.trim(),
          articleType,
          discipline: discipline.trim(),
          pageRange: pageRange.trim() || null,
          referencesRaw: references.trim() || null,
          conflictOfInterest: conflictOfInterest.trim() || null,
          ethicsStatement: ethicsStatement.trim() || null,
          dataAvailability: dataAvailability.trim() || null,
          fundingInfo: fundingInfo.trim() || null,
          acknowledgements: acknowledgements.trim() || null,
          coAuthors: authors.map((a, idx) => ({
            ...a,
            authorOrder: idx + 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update manuscript metadata.');
      }

      onSuccess(data.submission);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                {submission.submissionNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {submission.journal?.title || 'Journal Manuscript'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Edit Manuscript Metadata & Author List (Step 2)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Metadata */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              1. Title & Classification
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Article Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Survey-Based Empirical Investigation"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article Type <span className="text-rose-600">*</span>
                </label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="RESEARCH_ARTICLE">Research Article</option>
                  <option value="REVIEW_ARTICLE">Review Article</option>
                  <option value="SHORT_COMMUNICATION">Short Communication</option>
                  <option value="TECHNICAL_REPORT">Technical Report</option>
                  <option value="CASE_STUDY">Case Study</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discipline / Subject Category <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  placeholder="e.g. Computer Science - Cybersecurity"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Structured Abstract <span className="text-rose-600">*</span> (Min 50 characters)
              </label>
              <textarea
                rows={5}
                required
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-serif text-slate-800 leading-relaxed"
              />
              <div className="text-[11px] text-slate-400 text-right">{abstract.length} characters</div>
            </div>
          </div>

          {/* Section 2: Author List Management */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Authors & Affiliations ({authors.length})
              </h4>
              <button
                type="button"
                onClick={handleAddAuthor}
                className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Author</span>
              </button>
            </div>

            <div className="space-y-3">
              {authors.map((author, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Author #{idx + 1}
                    </span>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove author"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={author.firstName}
                        onChange={(e) => handleAuthorChange(idx, 'firstName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={author.lastName}
                        onChange={(e) => handleAuthorChange(idx, 'lastName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={author.email}
                        onChange={(e) => handleAuthorChange(idx, 'email', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Institutional Affiliation *</label>
                      <input
                        type="text"
                        required
                        value={author.affiliation}
                        onChange={(e) => handleAuthorChange(idx, 'affiliation', e.target.value)}
                        placeholder="e.g. University of Lagos, Department of Computer Science"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">ORCID iD (Optional)</label>
                      <input
                        type="text"
                        value={author.orcid || ''}
                        onChange={(e) => handleAuthorChange(idx, 'orcid', e.target.value)}
                        placeholder="0000-0002-1825-0097"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                      <input
                        type="checkbox"
                        id={`modal-corr-${idx}`}
                        checked={Boolean(author.isCorresponding)}
                        onChange={(e) => handleAuthorChange(idx, 'isCorresponding', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor={`modal-corr-${idx}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Corresponding Author
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: References & Page Range */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              3. References & Pagination (Google Scholar Indexing)
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bibliographic References <span className="text-rose-600">*</span> (One reference per line)
              </label>
              <textarea
                rows={6}
                required
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder={"Ogunmodede, T. A., & Ebijuwa, A. S. (2013). Problems of... https://doi.org/10.xxxxx\nSmith, J. (2020). Example reference. Journal of Example, 5(2), 12-18."}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-serif text-slate-800 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Include DOIs where available. Required for Google Scholar citation graph and reference extraction.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Page Range (Optional, e.g. 1-18 or 32-48)
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1-15"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
              />
            </div>
          </div>

          {/* Section 4: Ethical Statements & Declarations */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              4. Declarations & Editorial Statements
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Conflict of Interest</label>
                <input
                  type="text"
                  value={conflictOfInterest}
                  onChange={(e) => setConflictOfInterest(e.target.value)}
                  placeholder="The authors declare no competing financial or non-financial interests."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ethics Approval Statement</label>
                <input
                  type="text"
                  value={ethicsStatement}
                  onChange={(e) => setEthicsStatement(e.target.value)}
                  placeholder="Informed consent was obtained from all individual participants included in the study."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Availability Statement</label>
                <input
                  type="text"
                  value={dataAvailability}
                  onChange={(e) => setDataAvailability(e.target.value)}
                  placeholder="The survey datasets and technical instruments generated during this study are available..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Funding & Grants</label>
                <input
                  type="text"
                  value={fundingInfo}
                  onChange={(e) => setFundingInfo(e.target.value)}
                  placeholder="e.g. Self-funded or National Science Foundation Grant..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Acknowledgements (Optional)</label>
                <input
                  type="text"
                  value={acknowledgements}
                  onChange={(e) => setAcknowledgements(e.target.value)}
                  placeholder="We thank the participating students and laboratory staff for their valuable assistance."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Changes...' : 'Save Metadata Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
