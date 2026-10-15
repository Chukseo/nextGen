import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = 
  Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') && !supabaseKey.includes('placeholder'));

const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage');

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/pdf', // pdf
  'application/zip',
  'text/plain',
  'image/png',
  'image/jpeg'
];

export async function uploadFile({
  fileBuffer,
  originalFileName,
  mimeType,
  bucketName = 'manuscripts-private',
  customPath,
}: {
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  bucketName?: 'manuscripts-private' | 'published-articles';
  customPath?: string;
}): Promise<{ storageKey: string; publicUrl?: string }> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType) && !mimeType.startsWith('image/')) {
    throw new Error(`Invalid file type: ${mimeType}. Allowed formats are DOC, DOCX, PDF, and standard supplementary files.`);
  }

  // Validate File Size (max 50MB)
  if (fileBuffer.length > 50 * 1024 * 1024) {
    throw new Error('File exceeds maximum allowable size of 50MB.');
  }

  // Normalize safe file name
  const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = customPath || `${bucketName}/${timestamp}_${sanitizedName}`;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload to Supabase storage: ${error.message}`);
    }

    let publicUrl: string | undefined;
    if (bucketName === 'published-articles') {
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      publicUrl = urlData.publicUrl;
    }

    return { storageKey: data.path, publicUrl };
  } else {
    // Local secure storage fallback
    const fullDirPath = path.join(LOCAL_STORAGE_DIR, bucketName);
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }
    const fullFilePath = path.join(fullDirPath, `${timestamp}_${sanitizedName}`);
    fs.writeFileSync(fullFilePath, fileBuffer);

    const relativeKey = `${bucketName}/${timestamp}_${sanitizedName}`;
    const publicUrl = bucketName === 'published-articles' ? `/storage/published/${timestamp}_${sanitizedName}` : undefined;

    return { storageKey: relativeKey, publicUrl };
  }
}

export async function getFileStream(storageKey: string, bucketName: string = 'manuscripts-private'): Promise<{
  stream: NodeJS.ReadableStream | ReadableStream<Uint8Array>;
  mimeType: string;
  fileSize?: number;
}> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.storage.from(bucketName).download(storageKey);
    if (error || !data) {
      throw new Error(`Supabase download error: ${error?.message || 'File not found'}`);
    }
    return {
      stream: data.stream(),
      mimeType: data.type || 'application/octet-stream',
      fileSize: data.size,
    };
  } else {
    // Local fallback
    const safeKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(LOCAL_STORAGE_DIR, safeKey);

    if (!fs.existsSync(fullPath)) {
      // Check in public/storage as well
      const altPath = path.join(process.cwd(), 'public', safeKey);
      if (fs.existsSync(altPath)) {
        const stats = fs.statSync(altPath);
        return {
          stream: fs.createReadStream(altPath),
          mimeType: getMimeTypeFromExt(altPath),
          fileSize: stats.size,
        };
      }
      throw new Error(`File not found: ${storageKey}`);
    }

    const stats = fs.statSync(fullPath);
    return {
      stream: fs.createReadStream(fullPath),
      mimeType: getMimeTypeFromExt(fullPath),
      fileSize: stats.size,
    };
  }
}

function getMimeTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.doc':
      return 'application/msword';
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
