import { UserRole } from '@/types';

export interface UserSessionData {
  id: string;
  email: string;
  name?: string | null;
  roles: { role: string; journalId?: string | null }[];
}

export function hasRole(user: UserSessionData | null | undefined, targetRole: UserRole, journalId?: string): boolean {
  if (!user || !user.roles) return false;
  // Master Admin has universal access
  if (user.roles.some(r => r.role === 'MASTER_ADMIN')) return true;

  return user.roles.some(r => {
    if (r.role !== targetRole) return false;
    if (journalId && r.journalId) {
      return r.journalId === journalId;
    }
    return true;
  });
}

export function isMasterAdmin(user: UserSessionData | null | undefined): boolean {
  return hasRole(user, 'MASTER_ADMIN');
}

export function isJournalManager(user: UserSessionData | null | undefined, journalId?: string): boolean {
  if (isMasterAdmin(user)) return true;
  return hasRole(user, 'JOURNAL_MANAGER', journalId);
}

export function isEditor(user: UserSessionData | null | undefined, journalId?: string): boolean {
  if (isMasterAdmin(user)) return true;
  if (isJournalManager(user, journalId)) return true;
  return hasRole(user, 'EDITOR', journalId) || hasRole(user, 'SECTION_EDITOR', journalId);
}

export function isReviewer(user: UserSessionData | null | undefined): boolean {
  return hasRole(user, 'REVIEWER');
}

export function canAccessSubmissionFile(
  user: UserSessionData | null | undefined,
  submission: {
    authorId: string;
    journalId: string;
    reviewModel: string;
    assignedEditorId?: string | null;
  },
  file: {
    isConfidential: boolean;
    fileType: string;
  },
  reviewerAssignment?: { reviewerId: string; status: string } | null
): boolean {
  if (!user) return false;
  if (isMasterAdmin(user)) return true;
  if (isEditor(user, submission.journalId)) return true;

  // Author access
  if (user.id === submission.authorId) {
    // Authors cannot access internal confidential reviewer notes/files
    return !file.isConfidential;
  }

  // Reviewer access
  if (reviewerAssignment && reviewerAssignment.reviewerId === user.id) {
    if (reviewerAssignment.status === 'ACCEPTED' || reviewerAssignment.status === 'INVITED') {
      // In double-anonymous mode, author identification must not be accessed
      return file.fileType === 'MANUSCRIPT_DOCX' || file.fileType === 'SUPPLEMENTARY' || file.fileType === 'REVISION';
    }
  }

  return false;
}
