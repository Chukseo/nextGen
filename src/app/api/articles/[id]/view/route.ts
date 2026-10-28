import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseCountryViews } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articleIdOrSlug = params.id;
    let clientCountry: string | null = null;

    try {
      const body = await req.json();
      if (body?.countryCode && typeof body.countryCode === 'string') {
        clientCountry = body.countryCode.trim().toUpperCase();
      }
    } catch {
      // Body is optional
    }

    // Header-based Geo IP detection
    const headerCountry =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-country-code') ||
      req.headers.get('x-country');

    const countryCode = (
      clientCountry && clientCountry.length === 2 && clientCountry !== 'XX'
        ? clientCountry
        : headerCountry && headerCountry.length === 2 && headerCountry !== 'XX'
        ? headerCountry
        : 'GB' // Default to United Kingdom (Publisher Headquarters)
    ).toUpperCase();

    // Find the article
    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: articleIdOrSlug },
          { slug: articleIdOrSlug },
          { submissionId: articleIdOrSlug },
        ],
      },
      select: {
        id: true,
        viewsCount: true,
        countryViews: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Parse existing country breakdown
    let countryMap: Record<string, number> = {};
    if (article.countryViews) {
      try {
        const parsed = JSON.parse(article.countryViews);
        if (typeof parsed === 'object' && parsed !== null) {
          countryMap = parsed;
        }
      } catch {
        countryMap = {};
      }
    }

    // Increment country count
    countryMap[countryCode] = (countryMap[countryCode] || 0) + 1;
    const newViewsCount = (article.viewsCount || 0) + 1;
    const updatedCountryViewsJson = JSON.stringify(countryMap);

    // Save updated view count and country views
    await prisma.publishedArticle.update({
      where: { id: article.id },
      data: {
        viewsCount: newViewsCount,
        countryViews: updatedCountryViewsJson,
      },
    });

    const breakdown = parseCountryViews(updatedCountryViewsJson, newViewsCount);

    return NextResponse.json({
      success: true,
      viewsCount: newViewsCount,
      countryBreakdown: breakdown,
    });
  } catch (error: any) {
    console.error('Error updating article view count by country:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
          { submissionId: params.id },
        ],
      },
      select: {
        viewsCount: true,
        countryViews: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const breakdown = parseCountryViews(article.countryViews, article.viewsCount);

    return NextResponse.json({
      viewsCount: article.viewsCount || 0,
      countryBreakdown: breakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
