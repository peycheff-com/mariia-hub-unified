import React, { useEffect } from 'react';

import { createSkipLink } from '@/utils/accessibility';

export const SkipNavigation: React.FC = () => {
  useEffect(() => {
    // Inject skip link styles if not already present
    if (!document.getElementById('skip-nav-styles')) {
      const style = document.createElement('style');
      style.id = 'skip-nav-styles';
      style.textContent = `
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: var(--color-primary-600);
          color: white;
          padding: 8px;
          text-decoration: none;
          border-radius: var(--radius-sm);
          z-index: 100;
          transition: top 0.3s;
        }

        .skip-link:focus {
          top: 6px;
        }

        /* Ensure focus styles are visible */
        *:focus-visible {
          outline: 2px solid var(--color-primary-600);
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .skip-link {
            border: 2px solid;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .skip-link {
            transition: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Add skip links to the page
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      const main = document.querySelector('main') || document.getElementById('root');
      if (main && !main.id) {
        main.id = 'main-content';
      }
    }

    return () => {
      // Cleanup styles if component is unmounted
      const styles = document.getElementById('skip-nav-styles');
      if (styles) {
        styles.remove();
      }
    };
  }, []);

  // The skip links are injected directly into the DOM
  return null;
};

export default SkipNavigation;