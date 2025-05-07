'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Only register in production and HTTPS
          if (process.env.NODE_ENV === 'production' && window.location.protocol === 'https:') {
            // Unregister any existing service workers first
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }

            // Register the new service worker
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              type: 'module',
              updateViaCache: 'none'
            });
            
            if (registration.installing) {
              console.log('Service worker installing');
            } else if (registration.waiting) {
              console.log('Service worker installed');
            } else if (registration.active) {
              console.log('Service worker active');
            }

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New service worker installed, waiting for activation');
                  }
                });
              }
            });
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