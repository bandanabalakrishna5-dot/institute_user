import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Capture the one-shot install event before routed screens mount. Some Android
// browsers emit it while the initial bundle is still rendering.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__instituteInstallPrompt = event;
  window.dispatchEvent(new Event('institute-install-prompt-ready'));
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Keep the service worker out of development so local code changes never use stale bundles.
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`).then((registration) => {
      const announceUpdate = (worker) => {
        window.__instituteWaitingServiceWorker = worker;
        window.dispatchEvent(new CustomEvent('institute-app-update-available', { detail: { worker } }));
      };
      if (registration.waiting && navigator.serviceWorker.controller) announceUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announceUpdate(worker);
        });
      });
      registration.update().catch(() => {});
    }).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
