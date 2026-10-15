export type UserRole = 
  | 'MASTER_ADMIN'
  | 'JOURNAL_MANAGER'
  | 'EDITOR'
  | 'SECTION_EDITOR'
  | 'REVIEWER'
  | 'AUTHOR'
  | 'READER';

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'INITIAL_SCREENING'
  | 'EDITOR_ASSIGNED'
  | 'UNDER_REVIEW'
  | 'REVISIONS_REQUESTED'
  | 'REVISION_SUBMITTED'
  | 'RE_EVALUATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COPYEDITING'
  | 'PRODUCTION'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'WITHDRAWN'
  | 'ON_HOLD';

export type ArticleType =
  | 'RESEARCH_ARTICLE'
  | 'REVIEW_ARTICLE'
  | 'SHORT_COMMUNICATION'
  | 'TECHNICAL_REPORT'
  | 'CASE_STUDY';

export type ReviewModel =
  | 'SINGLE_ANONYMOUS'
  | 'DOUBLE_ANONYMOUS'
  | 'OPEN';

export type ReviewAssignmentStatus =
  | 'INVITED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReviewRecommendation =
  | 'ACCEPT'
  | 'MINOR_REVISION'
  | 'MAJOR_REVISION'
  | 'REJECT';

export type EditorialDecisionType =
  | 'ACCEPT'
  | 'MINOR_REVISION'
  | 'MAJOR_REVISION'
  | 'REJECT'
  | 'DESK_REJECT'
  | 'SEND_TO_REVIEW';

export type DOIRegistrationStatus =
  | 'NOT_GENERATED'
  | 'DRAFT'
  | 'PENDING'
  | 'DEPOSITED'
  | 'REGISTERED'
  | 'FAILED';

export type FileType =
  | 'MANUSCRIPT_DOCX'
  | 'SUPPLEMENTARY'
  | 'REVISION'
  | 'COPYEDITED'
  | 'FINAL_TYPESET_PDF';

export interface AuthorMetadata {
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  country?: string;
  orcid?: string;
  isCorresponding: boolean;
  authorOrder: number;
  bio?: string;
}

export interface SubmissionWizardData {
  journalId: string;
  articleType: ArticleType;
  title: string;
  subtitle?: string;
  abstract: string;
  discipline: string;
  language: string;
  keywords: string[];
  reviewModel: ReviewModel;
  authors: AuthorMetadata[];
  conflictOfInterest?: string;
  ethicsStatement?: string;
  fundingInfo?: string;
  dataAvailability?: string;
  consentStatement?: string;
  acknowledgements?: string;
  coverLetter?: string;
  declarationsConfirmed: boolean;
  uploadedFileKey?: string;
  uploadedFileName?: string;
  uploadedFileSize?: number;
  supplementaryFiles?: { key: string; name: string; size: number }[];
}
