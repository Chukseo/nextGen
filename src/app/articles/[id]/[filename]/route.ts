import { GET as handler, dynamic as dynamicConfig } from '@/app/api/articles/[id]/pdf/route';
import { notFound } from 'next/navigation';

export const dynamic = dynamicConfig;

export async function GET(
  req: Request,
  { params }: { params: { id: string; filename: string } }
) {
  // Only serve PDF responses for .pdf requests
  if (params.filename && !params.filename.endsWith('.pdf')) {
    return notFound();
  }
  return handler(req, { params: { id: params.id } });
}
