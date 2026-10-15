import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const journalSlug = searchParams.get('journal');
    const discipline = searchParams.get('discipline');
    const year = searchParams.get('year');
    const keyword = searchParams.get('keyword');

    let where: any = {
      // ONLY published articles are returned publicly
      submission: {
        status: 'PUBLISHED',
      },
    };

    if (journalSlug) {
      where.journal = { slug: journalSlug };
    }

    if (discipline) {
      where.submission = {
        ...where.submission,
        discipline: { contains: discipline },
      };
    }

    if (year) {
      where.issue = {
        year: Number(year),
      };
    }

    if (keyword) {
      where.keywords = {
        some: {
          keyword: { contains: keyword },
        },
      };
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { abstract: { contains: query } },
        { doi: { contains: query } },
        {
          submission: {
            coAuthors: {
              some: {
                OR: [
                  { firstName: { contains: query } },
                  { lastName: { contains: query } },
                  { affiliation: { contains: query } },
                ],
              },
            },
          },
        },
        {
          keywords: {
            some: {
              keyword: { contains: query },
            },
          },
        },
      ];
    }

    const articles = await prisma.publishedArticle.findMany({
      where,
      include: {
        journal: { select: { title: true, slug: true, abbreviation: true } },
        issue: { include: { volume: true } },
        submission: {
          include: {
            coAuthors: { orderBy: { authorOrder: 'asc' } },
          },
        },
        keywords: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({
      total: articles.length,
      articles,
    });
  } catch (error: any) {
    console.error('Fetch articles error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
