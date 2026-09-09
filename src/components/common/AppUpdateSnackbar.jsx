import React, { useCallback, useEffect, useState } from 'react';

const VERSION_KEY = 'institute-user-loaded-version';

const manifestVersion = (manifest) =>
  manifest?.files?.['main.js'] || (manifest?.entrypoints || []).join('|');

function AppUpdateSnackbar() {
  const [update, setUpdate] = useState(null);

  const checkDeployment = useCallback(async () => {
    try {
      const response = await fetch('/asset-manifest.json', { cache: 'no-store' });
      if (!response.ok) return;
      const version = manifestVersion(await response.json());
      if (!version) return;
      const loadedVersion = localStorage.getItem(VERSION_KEY);
      if (!loadedVersion) localStorage.setItem(VERSION_KEY, version);
      else if (loadedVersion !== version) setUpdate((current) => ({ ...(current || {}), version }));
    } catch (error) {
      // Update checks must not affect normal app use while offline.
    }
  }, []);

  useEffect(() => {
    const handleServiceWorkerUpdate = (event) => {
      setUpdate((current) => ({
        ...(current || {}),
        worker: event.detail?.worker || window.__instituteWaitingServiceWorker,
      }));
    };
    window.addEventListener('institute-app-update-available', handleServiceWorkerUpdate);
    if (window.__instituteWaitingServiceWorker) {
      setUpdate({ worker: window.__instituteWaitingServiceWorker });
    }
    checkDeployment();
    const interval = window.setInterval(checkDeployment, 5 * 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkDeployment();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('institute-app-update-available', handleServiceWorkerUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [checkDeployment]);

  const applyUpdate = async () => {
    if (update?.version) localStorage.setItem(VERSION_KEY, update.version);
    const worker = update?.worker || window.__instituteWaitingServiceWorker;
    if (worker) {
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      }, { once: true });
      worker.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('institute-user-')).map((key) => caches.delete(key)));
    }
    window.location.reload();
  };

  if (!update) return null;
  return (
    <div className="app-update-snackbar" role="status" aria-live="polite">
      <span>A new app update is available.</span>
      <button type="button" onClick={applyUpdate}>Update</button>
    </div>
  );
}

export default AppUpdateSnackbar;
