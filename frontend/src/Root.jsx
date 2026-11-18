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
          .register('/sw.js', { scope: '/app' })
          .then((reg) => {
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
