'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollEnhancements() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = window.scrollY;

      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100)));
      }
      setShowBackToTop(currentScroll > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ── Intersection Observer for all reveal variants ────────────
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { root: null, rootMargin: '0px 0px -48px 0px', threshold: 0.07 }
    );

    const selectors = [
      '.reveal-on-scroll',
      '.reveal-left',
      '.reveal-scale',
    ];

    const allRevealEls = document.querySelectorAll(selectors.join(','));
    allRevealEls.forEach((el) => observer.observe(el));

    // Handle dynamically rendered reveal elements
    const mutationObserver = new MutationObserver(() => {
      const newEls = document.querySelectorAll(
        selectors.map((s) => `${s}:not(.is-observed)`).join(',')
      );
      newEls.forEach((el) => {
        el.classList.add('is-observed');
        observer.observe(el);
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[999] pointer-events-none scroll-progress-bar transition-[width] duration-150"
        style={{
          width: `${scrollProgress}%`,
          opacity: scrollProgress > 1 ? 1 : 0,
          transition: 'width 0.15s linear, opacity 0.3s ease',
        }}
      />

      {/* Back-to-top button - positioned comfortably above the chat launcher */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        className={`fixed bottom-24 right-6 z-40 w-11 h-11 rounded-2xl
          bg-navy-950/90 hover:bg-blue-600 text-white
          shadow-xl hover:shadow-blue-500/30 hover:shadow-2xl
          border border-white/10 backdrop-blur-md
          flex items-center justify-center
          transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]
          group btn-magnetic
          ${showBackToTop
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-6 scale-85 pointer-events-none'
          }`}
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
      >
        <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
      </button>
    </>
  );
}
