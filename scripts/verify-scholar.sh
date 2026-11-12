#!/usr/bin/env bash
# ==============================================================================
# Google Scholar Indexing & Health Verification Script for nextgenuk.online
# ==============================================================================

TARGET_DOMAIN="https://nextgenuk.online"
WWW_DOMAIN="https://www.nextgenuk.online"
SAMPLE_ARTICLE="cybersecurity-awareness-everyday-practices-and-privacy-behaviour-among-students-of-the-uni"

echo "========================================================================"
echo " 1. Verifying Apex vs WWW Domain Redirects (Non-WWW Preference)"
echo "========================================================================"
echo "Checking $WWW_DOMAIN (Should 301/308 redirect to $TARGET_DOMAIN)..."
curl -sI "$WWW_DOMAIN" | head -n 10
echo ""

echo "Checking $TARGET_DOMAIN (Should return 200 OK)..."
curl -sI "$TARGET_DOMAIN" | head -n 10
echo ""

echo "========================================================================"
echo " 2. Verifying robots.txt and Crawler Access"
echo "========================================================================"
curl -s "$TARGET_DOMAIN/robots.txt" | head -n 25
echo ""

echo "========================================================================"
echo " 3. Verifying Google Scholar Metadata on Sample Article Page"
echo "========================================================================"
ARTICLE_URL="$TARGET_DOMAIN/articles/$SAMPLE_ARTICLE"
echo "Fetching HTML metadata from $ARTICLE_URL as Google-Scholar bot..."
curl -s -A "Mozilla/5.0 (compatible; Google-Scholar; +http://scholar.google.com/scholar/about.html)" "$ARTICLE_URL" | \
  grep -E '<meta name="(citation_|DC\.)' | head -n 30
echo ""

echo "========================================================================"
echo " 4. Verifying Direct PDF URL Accessibility & Content-Type"
echo "========================================================================"
PDF_URL="$TARGET_DOMAIN/articles/$SAMPLE_ARTICLE/article.pdf"
echo "Sending HEAD request to $PDF_URL..."
curl -sI -A "Mozilla/5.0 (compatible; Googlebot; +http://www.google.com/bot.html)" "$PDF_URL" | head -n 15
echo ""

echo "========================================================================"
echo " 5. Verifying Sitemap for Google Scholar Discovery"
echo "========================================================================"
curl -s "$TARGET_DOMAIN/sitemap.xml" | head -n 20
echo ""

echo "Done! If non-www is returning 200 OK and WWW is redirecting, Google Scholar"
echo "can index all articles without canonical loops or hostname conflicts."
