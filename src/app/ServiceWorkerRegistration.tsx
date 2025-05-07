'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Only register in production and HTTPS
          if (process.env.NODE_ENV === 'production' && window.location.protocol === 'https:') {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              type: 'module'
            });
            
            if (registration.installing) {
              console.log('Service worker installing');
            } else if (registration.waiting) {
              console.log('Service worker installed');
            } else if (registration.active) {
              console.log('Service worker active');
            }
          } else {
            console.log('Service worker registration skipped - not in production or not HTTPS');
          }
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    // Register immediately if the page is already loaded
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      // Otherwise wait for the load event
      window.addEventListener('load', registerServiceWorker);
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
} 