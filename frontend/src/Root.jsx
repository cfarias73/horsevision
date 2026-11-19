import React, { useState, useEffect } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

export default function Root() {
  const [authMode, setAuthMode] = useState('signup');
  const [skipSplash, setSkipSplash] = useState(false);

  const [route, setRoute] = useState(() => {
    try {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (path.startsWith('/app') || search.includes('view=app') || hash === '#app') {
        return '/app';
      }
    } catch (e) {}
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      try {
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;
        if (path.startsWith('/app') || search.includes('view=app') || hash === '#app') {
          setRoute('/app');
        } else {
          setRoute('/');
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Force-clear stale browser/PWA caches, refresh legacy Service Workers, and repaint favicon immediately
  useEffect(() => {
    try {
      if ('caches' in window) {
        window.caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => window.caches.delete(k))))
          .catch(() => {});
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => {
            regs.forEach((reg) => {
              reg.update().catch(() => {});
              if (!reg.active?.scriptURL?.includes('v=4')) {
                reg.unregister().catch(() => {});
              }
            });
          })
          .catch(() => {});
      }

      document
        .querySelectorAll('link[rel*="icon"]')
        .forEach((el) => el.parentNode?.removeChild(el));

      const freshFavicon = document.createElement('link');
      freshFavicon.rel = 'icon';
      freshFavicon.type = 'image/png';
      freshFavicon.href = '/favicon-2026.png?v=20261118';
      document.head.appendChild(freshFavicon);

      const freshShortcut = document.createElement('link');
      freshShortcut.rel = 'shortcut icon';
      freshShortcut.type = 'image/png';
      freshShortcut.href = '/favicon-2026.png?v=20261118';
      document.head.appendChild(freshShortcut);
    } catch (e) {}
  }, []);

  // When on /app, register PWA Service Worker & Manifest exclusively
  useEffect(() => {
    if (route === '/app') {
      // Inject manifest link if not present
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      // Register Service Worker
      if (
        'serviceWorker' in navigator &&
        (window.location.protocol === 'https:' ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1')
      ) {
        navigator.serviceWorker
          .register('/sw.js?v=4', { scope: '/app' })
          .then((reg) => {
            reg.update().catch(() => {});
            console.log('HorseVision PWA ServiceWorker active with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('SW registration:', err);
          });
      }
    }
  }, [route]);

  const navigateTo = (path, mode = 'signup') => {
    try {
      if (path === '/app') {
        setAuthMode(mode);
        setSkipSplash(true);
        // Ensure translation is isolated to landing page only
        try {
          const domain = window.location.hostname;
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          if (domain !== 'localhost' && !domain.includes('127.0.0.1')) {
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
          }
          document.cookie = 'googtrans=/es/es; path=/;';
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            const hasEs = Array.from(select.options || []).some((o) => o.value === 'es');
            select.value = hasEs ? 'es' : '';
            select.dispatchEvent(new Event('change'));
          }
        } catch (e) {}
      }
      window.history.pushState({}, '', path);
      setRoute(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.location.href = path;
    }
  };

  if (route === '/app') {
    return (
      <App
        onBackToLanding={() => navigateTo('/')}
        initialAuthMode={authMode}
        skipSplash={skipSplash}
      />
    );
  }

  return <LandingPage onLaunchApp={(mode = 'signup') => navigateTo('/app', mode)} />;
}
