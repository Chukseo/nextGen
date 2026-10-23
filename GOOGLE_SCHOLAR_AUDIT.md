# Google Scholar Technical Audit

Audit target: `https://nextgenuk.online`  
Implementation reviewed: Next.js application in this repository  
Audit date: 2026-10-23

## Executive Summary

The source application is server-rendered and already emits article-level citation metadata, canonical URLs, XML sitemap entries, robots directives, and `ScholarlyArticle` JSON-LD. That is the right technical foundation for Google Scholar discovery. The public target could not be fetched by the audit client, so its live HTTP status, headers, rendered HTML, redirects, robots response, sitemap response, and PDF bytes remain deployment checks rather than verified facts.

The changes in this release close source-level gaps that could limit discovery: public author profiles, publication-volume URLs, issue JSON-LD, stable public PDF URLs, crawler-safe PDF headers, and non-200 handling for PDF failures.

## Scholar Compliance Score

Source readiness: **91/100**. The implementation can reach **95+/100 after deployment verification** of every public article and PDF.

| Measure | Score | Basis |
| --- | ---: | --- |
| Metadata completeness | 96 | Per-article Highwire Press metadata is emitted server-side; only records with missing database fields remain incomplete. |
| Crawlability | 88 | Robots and sitemap logic are present, but live host responses were unavailable to test. |
| Academic publishing compliance | 90 | Article pages, PDFs, references, issue and journal pages are supported; records need a production data-quality pass. |
| PDF compliance | 82 | PDFs are generated/stamped and now receive correct crawler headers; text extraction, encryption, and embedded document metadata must be checked on deployed files. |

## Critical Issues

1. **Live host verification is blocked.** Confirm that `https://nextgenuk.online/robots.txt`, `/sitemap.xml`, each article page, and every PDF return 200 with no authentication, challenge page, or `noindex` header.
2. **Do not publish incomplete records.** A published article must have a real title, named authors with affiliations, publication date, abstract, volume, issue, references, stable PDF, and usable full text. Never use placeholder authors or generated fallback content as publication metadata.
3. **PDFs require a byte-level audit.** For every production PDF, verify selectable text, no password/encryption, `/Title`, `/Author`, and creation/modification dates. Image-only scans must be replaced with OCR/text-native PDFs.

## Medium Issues

1. Add a publication-workflow validation gate that prevents records with missing mandatory scholarly fields from reaching `PUBLISHED`.
2. Populate a unique stable slug for every article before publication; raw IDs remain a fallback only.
3. Link volume pages from journal and issue interfaces so `/volumes/{id}` is not only sitemap-discoverable.
4. Deduplicate author identity data at the data-model level. Current profiles use the submitted-author record, so the same person across submissions can have multiple profile URLs.

## Low Priority Improvements

1. Add `citation_reference` tags only if a validated reference parser is introduced; do not create inaccurate citation metadata.
2. Add author citation counts only from a trustworthy external source; never self-report Scholar citation totals.
3. Submit the deployed sitemap in Google Search Console and request inclusion through Google Scholar's standard discovery process. Inclusion is not guaranteed by metadata alone.

## Exact Files Modified

- `src/app/articles/[id]/page.tsx`: stable PDF citation URL and corrected nested `Periodical`/`PublicationVolume` JSON-LD.
- `src/app/articles/[id]/ArticleDetailClient.tsx`: public PDF links and author-profile links.
- `src/app/articles/[id]/pdf/route.ts`: public scholarly PDF endpoint.
- `src/app/api/articles/[id]/pdf/route.ts`: slug resolution, crawler-safe PDF headers, and honest 503 errors.
- `src/app/authors/[id]/page.tsx`: indexable author profiles with affiliation, biography, ORCID, publication list, citation links, and `ProfilePage` JSON-LD.
- `src/app/volumes/[id]/page.tsx`: publication-volume page and JSON-LD.
- `src/app/issues/[id]/page.tsx`: `PublicationIssue` JSON-LD.
- `src/app/sitemap.ts`: author and volume URLs.

## Citation Metadata Contract

Every published article must emit, in server HTML:

```html
<meta name="citation_title" content="Exact article title">
<meta name="citation_author" content="One tag per author">
<meta name="citation_author_institution" content="One tag per author affiliation">
<meta name="citation_publication_date" content="YYYY/MM/DD">
<meta name="citation_journal_title" content="Journal title">
<meta name="citation_volume" content="N">
<meta name="citation_issue" content="N">
<meta name="citation_firstpage" content="N">
<meta name="citation_lastpage" content="N">
<meta name="citation_pdf_url" content="https://nextgenuk.online/articles/article-slug/pdf">
<meta name="citation_abstract_html_url" content="https://nextgenuk.online/articles/article-slug">
<meta name="citation_doi" content="10.xxxx/xxxx">
```

The implementation emits all of these when the underlying data exists. DOI is intentionally omitted until it has `REGISTERED` status, preventing a false identifier from being indexed.

## Indexing and PDF Checklist

1. Set `NEXT_PUBLIC_SITE_URL=https://nextgenuk.online`; redirect `www.nextgenuk.online` to this canonical host in the hosting platform.
2. Use only the canonical article URL in internal links and Crossref deposits.
3. Verify the PDF endpoint answers `Content-Type: application/pdf`, `X-Robots-Tag: index, follow`, and never returns an HTML document with a 200 status.
4. Crawl the live domain after deployment and reject pages with 3xx chains, 4xx/5xx, `noindex`, duplicate canonicals, or missing required tags.
5. Submit the sitemap after the live crawl passes.
