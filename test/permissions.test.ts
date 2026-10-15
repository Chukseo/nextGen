import { describe, it, expect } from 'vitest';
import {
  hasRole,
  isMasterAdmin,
  isEditor,
  isJournalManager,
  isReviewer,
  canAccessSubmissionFile,
} from '../src/lib/permissions';

describe('Role-Based Access Control and Permissions', () => {
  const masterAdminUser = {
    id: 'user-admin-1',
    email: 'admin@nextgen-press.org',
    roles: [{ role: 'MASTER_ADMIN' }],
  };

  const editorUser = {
    id: 'user-editor-1',
    email: 'editor.chen@nextgen-press.org',
    roles: [{ role: 'EDITOR', journalId: 'journal-jstai' }],
  };

  const authorUser = {
    id: 'user-author-1',
    email: 'author.lewis@research.org',
    roles: [{ role: 'AUTHOR' }],
  };

  const reviewerUser = {
    id: 'user-reviewer-1',
    email: 'reviewer.turing@univ.edu',
    roles: [{ role: 'REVIEWER' }],
  };

  const visitorUser = null;

  it('correctly identifies master admin with universal authority', () => {
    expect(isMasterAdmin(masterAdminUser)).toBe(true);
    expect(isEditor(masterAdminUser, 'journal-jstai')).toBe(true);
    expect(isJournalManager(masterAdminUser, 'journal-jstai')).toBe(true);
  });

  it('enforces journal-scoped permissions for editors', () => {
    expect(isEditor(editorUser, 'journal-jstai')).toBe(true);
    expect(isEditor(editorUser, 'journal-necr')).toBe(false); // cannot edit other journals
    expect(isMasterAdmin(editorUser)).toBe(false); // cannot claim master admin
  });

  it('prevents authors and visitors from accessing editorial privileges', () => {
    expect(isEditor(authorUser, 'journal-jstai')).toBe(false);
    expect(isMasterAdmin(authorUser)).toBe(false);
    expect(isEditor(visitorUser, 'journal-jstai')).toBe(false);
  });

  it('strictly protects confidential manuscript and review files', () => {
    const submission = {
      authorId: 'user-author-1',
      journalId: 'journal-jstai',
      reviewModel: 'DOUBLE_ANONYMOUS',
    };

    const confidentialReviewReport = {
      isConfidential: true,
      fileType: 'REVIEW_REPORT_ATTACHMENT',
    };

    const authorManuscriptFile = {
      isConfidential: false,
      fileType: 'MANUSCRIPT_DOCX',
    };

    // Author cannot access confidential internal notes
    expect(canAccessSubmissionFile(authorUser, submission, confidentialReviewReport)).toBe(false);

    // Author can access their own manuscript file
    expect(canAccessSubmissionFile(authorUser, submission, authorManuscriptFile)).toBe(true);

    // Other author cannot access this author's manuscript
    const otherAuthor = { id: 'other-author', email: 'other@inst.edu', roles: [{ role: 'AUTHOR' }] };
    expect(canAccessSubmissionFile(otherAuthor, submission, authorManuscriptFile)).toBe(false);

    // Assigned reviewer can access blinded manuscript
    const reviewerAssignment = { reviewerId: 'user-reviewer-1', status: 'ACCEPTED' };
    expect(canAccessSubmissionFile(reviewerUser, submission, authorManuscriptFile, reviewerAssignment)).toBe(true);

    // Unassigned reviewer cannot access manuscript
    expect(canAccessSubmissionFile(reviewerUser, submission, authorManuscriptFile, null)).toBe(false);

    // Master Admin can access all
    expect(canAccessSubmissionFile(masterAdminUser, submission, confidentialReviewReport)).toBe(true);
  });
});
