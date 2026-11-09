'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollEnhancements() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = window.scrollY;

      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100));
        setScrollProgress(progress);
      }

      setShowBackToTop(currentScroll > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver for reveal-on-scroll elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08,
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    // Handle dynamically rendered elements
    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll('.reveal-on-scroll:not(.is-observed)');
      newElements.forEach((el) => {
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* Top Reading / Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[999] pointer-events-none transition-all duration-150"
        style={{
          background: 'linear-gradient(90deg, #2563eb, #3b82f6, #06b6d4, #10b981)',
          width: `${scrollProgress}%`,
          opacity: scrollProgress > 1 ? 1 : 0,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)',
        }}
      />

      {/* Floating Back-to-Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-navy-950/90 hover:bg-blue-600 text-white shadow-xl hover:shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-300 transform group ${
          showBackToTop
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" />
      </button>
    </>
  );
}
