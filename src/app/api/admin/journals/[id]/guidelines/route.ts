import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { generateDefaultAuthorGuidelines } from '@/lib/guidelinesGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    const settingKey = `journal_guidelines_${journal.id}`;
    const savedSetting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    const isCustom = !!savedSetting?.value;
    const guidelines = savedSetting?.value || generateDefaultAuthorGuidelines(journal);

    return NextResponse.json({
      success: true,
      journalId: journal.id,
      journalSlug: journal.slug,
      journalTitle: journal.title,
      isCustom,
      guidelines,
    });
  } catch (error: any) {
    console.error('Fetch author guidelines error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;
    const targetJournal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!targetJournal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, targetJournal.id)) {
      return NextResponse.json({ error: 'Admin or Editor privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { guidelines } = body;

    if (!guidelines || typeof guidelines !== 'string') {
      return NextResponse.json({ error: 'Valid guidelines text is required' }, { status: 400 });
    }

    const settingKey = `journal_guidelines_${targetJournal.id}`;

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: {
        value: guidelines,
        description: `Author Guidelines for ${targetJournal.title}`,
      },
      create: {
        key: settingKey,
        value: guidelines,
        description: `Author Guidelines for ${targetJournal.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Author guidelines for "${targetJournal.title}" have been saved.`,
      guidelines,
    });
  } catch (error: any) {
    console.error('Update author guidelines error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Master Admin privileges required' }, { status: 403 });
    }

    const targetJournal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!targetJournal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    const settingKey = `journal_guidelines_${targetJournal.id}`;
    await prisma.systemSetting.deleteMany({
      where: { key: settingKey },
    });

    const defaultGuidelines = generateDefaultAuthorGuidelines(targetJournal);

    return NextResponse.json({
      success: true,
      message: `Author guidelines for "${targetJournal.title}" reset to standard default template.`,
      guidelines: defaultGuidelines,
    });
  } catch (error: any) {
    console.error('Reset author guidelines error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
