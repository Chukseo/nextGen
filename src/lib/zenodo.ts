import prisma from './prisma';
import { getFileBuffer } from './storage';
import { getBaseUrl } from './siteUrl';

export interface ZenodoCreator {
  name: string;
  affiliation?: string;
  orcid?: string;
}

export interface ZenodoCommunity {
  identifier: string;
}

export interface ZenodoMetadata {
  title: string;
  upload_type: 'publication' | 'poster' | 'presentation' | 'dataset' | 'image' | 'video' | 'software' | 'lesson' | 'other';
  publication_type: 'article' | 'book' | 'section' | 'workingpaper' | 'report' | 'thesis' | 'conferencepaper' | 'patent' | 'preprint' | 'other';
  description: string;
  publication_date: string; // YYYY-MM-DD
  creators: ZenodoCreator[];
  access_right: 'open' | 'embargoed' | 'restricted' | 'closed';
  license: string; // e.g. "cc-by-4.0"
  keywords?: string[];
  language?: string; // "eng"
  journal_title?: string;
  journal_volume?: string;
  journal_issue?: string;
  journal_pages?: string;
  imprint_publisher?: string;
  related_identifiers?: Array<{
    identifier: string;
    relation: string; // e.g. "isIdenticalTo"
    resource_type?: string;
  }>;
  communities?: ZenodoCommunity[];
  prereserve_doi?: {
    doi: string;
    recid: number;
  };
}

export interface ZenodoDepositionLinks {
  self: string;
  html: string;
  badge?: string;
  files: string;
  bucket?: string;
  publish?: string;
  edit?: string;
  discard?: string;
  newversion?: string;
  record?: string;
  record_html?: string;
  [key: string]: string | undefined;
}

export interface ZenodoDeposition {
  id: number;
  conceptrecid?: string;
  title?: string;
  metadata?: ZenodoMetadata;
  links: ZenodoDepositionLinks;
  state: 'unsubmitted' | 'done' | 'inprogress';
  submitted: boolean;
  doi?: string;
  record_id?: number;
  files?: Array<{
    id: string;
    filename: string;
    filesize: number;
    checksum: string;
  }>;
}

export interface ZenodoPublishResult {
  recordId: string;
  doi: string;
  recordUrl: string;
  doiUrl: string;
  publishedAt: Date;
  alreadyPublished?: boolean;
}

// Configuration helper
function getZenodoConfig() {
  const token = process.env.ZENODO_TOKEN || 'SGQoSyJqrXPbu7IEizs4UG388gRaNWnSbhkDZyZbrV15HNfwDtUhtdKrqVjH';
  const baseUrl = (process.env.ZENODO_BASE_URL || 'https://zenodo.org/api').replace(/\/+$/, '');
  const communityId = process.env.ZENODO_COMMUNITY_ID || 'NextGenJournals';
  const enabled = process.env.ZENODO_ENABLED !== 'false';

  return { token, baseUrl, communityId, enabled };
}

/**
 * Exponential backoff retry utility
 */
async function withRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      console.warn(`[Zenodo] ${operationName} failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      if (attempt >= maxRetries) {
        throw new Error(`[Zenodo] ${operationName} failed after ${maxRetries} attempts: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }

  throw new Error(`[Zenodo] ${operationName} unexpected loop exit`);
}

/**
 * Helper to execute Zenodo API requests with proper headers and error handling
 */
async function zenodoRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    isRawBinary?: boolean;
  } = {}
): Promise<T> {
  const { token, baseUrl } = getZenodoConfig();
  if (!token) {
    throw new Error('ZENODO_TOKEN is not configured in environment variables');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'NextGenJournals/1.0',
    Accept: 'application/json',
    ...options.headers,
  };

  let body = options.body;
  if (body && !options.isRawBinary && typeof body === 'object' && !(body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    let errorDetails: string;
    try {
      const errJson = await response.json();
      errorDetails = JSON.stringify(errJson);
    } catch {
      errorDetails = await response.text();
    }
    throw new Error(`Zenodo API ${method} ${url} responded with ${response.status}: ${errorDetails}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

/**
 * 1. Create a new draft deposition in Zenodo
 */
export async function createDeposition(metadata?: Partial<ZenodoMetadata>): Promise<ZenodoDeposition> {
  return withRetry('createDeposition', async () => {
    return zenodoRequest<ZenodoDeposition>('/deposit/depositions', {
      method: 'POST',
      body: metadata ? { metadata } : {},
    });
  });
}

/**
 * 2. Upload file to Zenodo deposition (using direct bucket API or files fallback)
 */
export async function uploadFile(
  bucketUrlOrDepositionId: string | number,
  filename: string,
  fileBuffer: Buffer
): Promise<any> {
  return withRetry(`uploadFile(${filename})`, async () => {
    const { token, baseUrl } = getZenodoConfig();
    const sanitizedFilename = encodeURIComponent(filename.replace(/[^a-zA-Z0-9._-]/g, '_'));

    if (typeof bucketUrlOrDepositionId === 'string' && bucketUrlOrDepositionId.startsWith('http')) {
      // Direct bucket stream upload (Zenodo recommended)
      const uploadUrl = `${bucketUrlOrDepositionId.replace(/\/+$/, '')}/${sanitizedFilename}`;
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'NextGenJournals/1.0',
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(fileBuffer),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zenodo bucket file upload failed (${response.status}): ${errorText}`);
      }

      return await response.json();
    } else {
      // Fallback via /deposit/depositions/{id}/files
      const depositionId = bucketUrlOrDepositionId;
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
      formData.append('name', sanitizedFilename);
      formData.append('file', blob, sanitizedFilename);

      const response = await fetch(`${baseUrl}/deposit/depositions/${depositionId}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'NextGenJournals/1.0',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zenodo files API upload failed (${response.status}): ${errorText}`);
      }

      return await response.json();
    }
  });
}

/**
 * 3. Update metadata on a Zenodo draft deposition
 */
export async function updateMetadata(
  depositionId: string | number,
  metadata: ZenodoMetadata
): Promise<ZenodoDeposition> {
  return withRetry(`updateMetadata(${depositionId})`, async () => {
    try {
      return await zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${depositionId}`, {
        method: 'PUT',
        body: { metadata },
      });
    } catch (error: any) {
      // If community assignment triggered an error, retry without the community field
      if (metadata.communities && metadata.communities.length > 0) {
        console.warn(`[Zenodo] Retrying metadata update without communities for deposition ${depositionId}...`);
        const fallbackMetadata = { ...metadata };
        delete fallbackMetadata.communities;
        return await zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${depositionId}`, {
          method: 'PUT',
          body: { metadata: fallbackMetadata },
        });
      }
      throw error;
    }
  });
}

/**
 * 4. Publish Zenodo deposition
 */
export async function publishRecord(depositionId: string | number): Promise<ZenodoDeposition> {
  return withRetry(`publishRecord(${depositionId})`, async () => {
    return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${depositionId}/actions/publish`, {
      method: 'POST',
    });
  });
}

/**
 * 5. Retrieve an existing deposition or published record from Zenodo
 */
export async function getRecord(id: string | number): Promise<ZenodoDeposition> {
  return withRetry(`getRecord(${id})`, async () => {
    return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${id}`);
  });
}

/**
 * Helper to build Zenodo metadata from an article record
 */
export function buildZenodoMetadataFromArticle(article: any): ZenodoMetadata {
  const { communityId } = getZenodoConfig();
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/articles/${article.slug || article.id}`;

  // Authors mapping
  const coAuthors = article.submission?.coAuthors || [];
  let creators: ZenodoCreator[] = [];

  if (coAuthors.length > 0) {
    creators = coAuthors.map((ca: any) => {
      const name = `${ca.firstName || ''} ${ca.lastName || ''}`.trim() || 'Author';
      return {
        name,
        ...(ca.affiliation ? { affiliation: ca.affiliation.trim() } : {}),
        ...(ca.orcid ? { orcid: ca.orcid.replace(/^https?:\/\/orcid\.org\//, '').trim() } : {}),
      };
    });
  } else if (article.submission?.author?.name && !/Admin|NextGen|Staff/i.test(article.submission.author.name)) {
    creators = [
      {
        name: article.submission.author.name.trim(),
        ...(article.submission.author.affiliation ? { affiliation: article.submission.author.affiliation.trim() } : {}),
        ...(article.submission.author.orcid ? { orcid: article.submission.author.orcid.trim() } : {}),
      },
    ];
  } else {
    creators = [{ name: 'NextGen Research Contributor' }];
  }

  // Publication date
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Clean description HTML
  const rawAbstract = article.abstract || 'Academic research paper published in NextGen Innovation & Research Journals.';
  const description = rawAbstract.startsWith('<p>') ? rawAbstract : `<p>${rawAbstract}</p>`;

  // Keywords
  const keywords = (article.keywords || [])
    .map((k: any) => (typeof k === 'string' ? k : k.keyword))
    .filter(Boolean);

  // Journal info
  const journalTitle = article.journal?.title || 'NextGen Innovation & Research Journal';
  const volumeNumber = article.issue?.volume?.volumeNumber ? String(article.issue.volume.volumeNumber) : undefined;
  const issueNumber = article.issue?.issueNumber ? String(article.issue.issueNumber) : undefined;
  const pageRange = article.pageRange || undefined;

  const metadata: ZenodoMetadata = {
    title: article.title.trim(),
    upload_type: 'publication',
    publication_type: 'article',
    description,
    publication_date: pubDate,
    creators,
    access_right: 'open',
    license: 'cc-by-4.0',
    language: 'eng',
    imprint_publisher: article.journal?.publisher || 'NextGen Innovation & Research Journals',
    related_identifiers: [
      {
        identifier: canonicalUrl,
        relation: 'isIdenticalTo',
        resource_type: 'publication-article',
      },
    ],
  };

  if (keywords.length > 0) {
    metadata.keywords = keywords;
  }
  if (journalTitle) {
    metadata.journal_title = journalTitle;
  }
  if (volumeNumber) {
    metadata.journal_volume = volumeNumber;
  }
  if (issueNumber) {
    metadata.journal_issue = issueNumber;
  }
  if (pageRange) {
    metadata.journal_pages = pageRange;
  }

  // Community assignment (lowercased identifier)
  if (communityId) {
    metadata.communities = [{ identifier: communityId.toLowerCase() }];
  }

  return metadata;
}

/**
 * Fetch the PDF buffer for an article from public URL, storage key, or local API
 */
async function fetchArticlePdfBuffer(article: any): Promise<{ buffer: Buffer; filename: string }> {
  const filename = `${article.journal?.abbreviation || 'Article'}_${article.articleNumber || article.id}.pdf`;

  // 1. Try public/remote URL
  if (article.pdfUrl && /^https?:\/\//i.test(article.pdfUrl)) {
    try {
      const res = await fetch(article.pdfUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return { buffer: Buffer.from(arrayBuf), filename };
      }
    } catch (err) {
      console.warn(`[Zenodo] Could not fetch PDF from remote pdfUrl (${article.pdfUrl}):`, err);
    }
  }

  // 2. Try Supabase / local storage key
  if (article.pdfStorageKey) {
    try {
      const buffer = await getFileBuffer(article.pdfStorageKey, 'published-articles');
      if (buffer && buffer.length > 0) {
        return { buffer, filename };
      }
    } catch (err) {
      console.warn(`[Zenodo] Could not get file buffer from storageKey (${article.pdfStorageKey}):`, err);
    }
  }

  // 3. Try application PDF endpoint fallback
  const baseUrl = getBaseUrl();
  const pdfEndpoint = `${baseUrl}/api/articles/${article.id}/pdf`;
  try {
    const res = await fetch(pdfEndpoint);
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuf), filename };
    }
  } catch (err) {
    console.warn(`[Zenodo] Could not fetch PDF from internal endpoint (${pdfEndpoint}):`, err);
  }

  throw new Error(`Failed to retrieve PDF buffer for article ${article.id} (${article.title})`);
}

/**
 * Complete production Zenodo publishing workflow for an article
 */
export async function publishArticleToZenodo(
  articleId: string,
  options: { force?: boolean } = {}
): Promise<ZenodoPublishResult> {
  const { enabled } = getZenodoConfig();
  if (!enabled) {
    console.log('[Zenodo] Publishing pipeline is disabled via ZENODO_ENABLED=false');
    throw new Error('Zenodo publishing is disabled');
  }

  // Load article with full relations
  const article = await prisma.publishedArticle.findFirst({
    where: {
      OR: [{ id: articleId }, { slug: articleId }, { submissionId: articleId }],
    },
    include: {
      journal: true,
      issue: { include: { volume: true } },
      submission: {
        include: {
          coAuthors: { orderBy: { authorOrder: 'asc' } },
          author: true,
          files: true,
          doiRecord: true,
        },
      },
      keywords: true,
    },
  });

  if (!article) {
    throw new Error(`Published article with ID "${articleId}" not found`);
  }

  // Duplicate protection
  if (!options.force && article.zenodoRecordId && article.zenodoDoi && article.zenodoDepositStatus === 'PUBLISHED') {
    console.log(`[Zenodo] Article ${article.id} already deposited to Zenodo (DOI: ${article.zenodoDoi}). Skipping.`);
    return {
      recordId: article.zenodoRecordId,
      doi: article.zenodoDoi,
      recordUrl: article.zenodoUrl || `https://zenodo.org/records/${article.zenodoRecordId}`,
      doiUrl: `https://doi.org/${article.zenodoDoi}`,
      publishedAt: article.zenodoPublishedAt || article.publishedAt,
      alreadyPublished: true,
    };
  }

  // Set status to PENDING / UPLOADING
  await prisma.publishedArticle.update({
    where: { id: article.id },
    data: {
      zenodoDepositStatus: 'UPLOADING',
      zenodoLastError: null,
    },
  });

  try {
    // STEP 1: Generate metadata from article
    const metadata = buildZenodoMetadataFromArticle(article);

    // STEP 2: Create Zenodo draft deposition
    console.log(`[Zenodo] Creating draft deposition for "${article.title}"...`);
    const deposition = await createDeposition(metadata);

    // STEP 3: Reserve DOI automatically & check validity
    const reservedDoi = deposition.metadata?.prereserve_doi?.doi || `10.5281/zenodo.${deposition.id}`;
    if (!reservedDoi) {
      throw new Error(`Zenodo failed to allocate a reserved DOI for deposition ${deposition.id}`);
    }
    console.log(`[Zenodo] Deposition created: ${deposition.id}, reserved DOI: ${reservedDoi}`);

    // Persist draft reservation in DB
    await prisma.publishedArticle.update({
      where: { id: article.id },
      data: {
        zenodoRecordId: String(deposition.id),
        zenodoDoi: reservedDoi,
        zenodoUrl: deposition.links.record_html || deposition.links.html || `https://zenodo.org/records/${deposition.id}`,
      },
    });

    // STEP 4: Upload article PDF
    console.log(`[Zenodo] Fetching and uploading PDF for "${article.title}"...`);
    const { buffer: pdfBuffer, filename } = await fetchArticlePdfBuffer(article);
    const targetUpload = deposition.links.bucket || deposition.id;
    await uploadFile(targetUpload, filename, pdfBuffer);
    console.log(`[Zenodo] Successfully uploaded ${filename} (${pdfBuffer.length} bytes)`);

    // STEP 5: Update metadata with community assignment & final details
    console.log(`[Zenodo] Updating metadata on deposition ${deposition.id}...`);
    await updateMetadata(deposition.id, metadata);

    // STEP 6: Publish deposition
    console.log(`[Zenodo] Publishing deposition ${deposition.id}...`);
    const published = await publishRecord(deposition.id);

    // STEP 7: Extract final published values
    const recordId = String(published.id || deposition.id);
    const finalDoi = published.doi || reservedDoi;
    const recordUrl =
      published.links?.record_html ||
      published.links?.html ||
      `https://zenodo.org/records/${recordId}`;
    const doiUrl = `https://doi.org/${finalDoi}`;

    console.log(`[Zenodo] Deposition ${recordId} published! Final DOI: ${finalDoi}`);

    // STEP 8: Store values in database
    const shouldUpdatePrimaryDoi = !article.doi || article.doi.startsWith('10.5555') || article.doiStatus !== 'REGISTERED';

    await prisma.publishedArticle.update({
      where: { id: article.id },
      data: {
        zenodoRecordId: recordId,
        zenodoDoi: finalDoi,
        zenodoUrl: recordUrl,
        zenodoPublishedAt: new Date(),
        zenodoDepositStatus: 'PUBLISHED',
        zenodoLastError: null,
        // Upgrade primary DOI to official Zenodo DOI if previously missing or placeholder
        ...(shouldUpdatePrimaryDoi
          ? {
              doi: finalDoi,
              doiStatus: 'REGISTERED',
            }
          : {}),
      },
    });

    // Update submission DOI record if it exists
    if (article.submissionId) {
      await prisma.dOIRecord.upsert({
        where: { submissionId: article.submissionId },
        update: {
          doi: finalDoi,
          status: 'REGISTERED',
          registeredAt: new Date(),
          agency: 'ZENODO',
        },
        create: {
          submissionId: article.submissionId,
          doi: finalDoi,
          prefix: finalDoi.split('/')[0] || '10.5281',
          suffix: finalDoi.split('/')[1] || `zenodo.${recordId}`,
          agency: 'ZENODO',
          status: 'REGISTERED',
          registeredAt: new Date(),
        },
      }).catch((err) => console.warn('[Zenodo] Could not sync DOIRecord:', err));
    }

    return {
      recordId,
      doi: finalDoi,
      recordUrl,
      doiUrl,
      publishedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`[Zenodo] Failed to publish article ${article.id} to Zenodo:`, error);
    await prisma.publishedArticle.update({
      where: { id: article.id },
      data: {
        zenodoDepositStatus: 'FAILED',
        zenodoLastError: error.message || 'Unknown Zenodo publishing error',
      },
    }).catch(() => {});
    throw error;
  }
}
