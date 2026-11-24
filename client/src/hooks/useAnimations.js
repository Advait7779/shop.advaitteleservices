import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll-triggered reveal animation observer.
 * Robust implementation with MutationObserver and safety fallback
 * to guarantee that dynamically loaded content (like product cards) is never stuck hidden.
 */
export function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger';

    const revealElement = (el) => {
      if (!el.classList.contains('visible')) {
        el.classList.add('visible');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '120px 0px 120px 0px' }
    );

    const observeAll = () => {
      document.querySelectorAll(selectors).forEach((el) => {
        // If already near viewport or above fold, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 150) {
          revealElement(el);
        }
        observer.observe(el);
      });
    };

    // Run immediately and after small delay
    observeAll();
    const timer1 = setTimeout(observeAll, 100);
    const timer2 = setTimeout(observeAll, 400);

    // Watch for DOM changes (dynamically loaded products, route changes, etc.)
    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety fallback: ensure nothing stays invisible after 800ms
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll(selectors).forEach(revealElement);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(safetyTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);
}

/**
 * Scroll to top on route change for clean page transitions.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
}
