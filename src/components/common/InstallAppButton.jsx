import React, { useEffect, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import './InstallAppButton.css';

const INSTALL_STORAGE_KEY = 'institute-app-installed';

const wasInstalled = () => {
  try {
    return window.localStorage.getItem(INSTALL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const rememberInstalled = () => {
  try {
    window.localStorage.setItem(INSTALL_STORAGE_KEY, 'true');
  } catch {
    // Standalone display detection still hides the control when storage is unavailable.
  }
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(
    () => window.__instituteInstallPrompt || null
  );
  const [installed, setInstalled] = useState(() => isStandalone() || wasInstalled());
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      window.__instituteInstallPrompt = event;
      if (!wasInstalled()) setInstallPrompt(event);
    };
    const handleCapturedInstallPrompt = () => {
      if (!wasInstalled()) {
        setInstallPrompt(window.__instituteInstallPrompt || null);
      }
    };
    const handleInstalled = () => {
      rememberInstalled();
      window.__instituteInstallPrompt = null;
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('institute-install-prompt-ready', handleCapturedInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('institute-install-prompt-ready', handleCapturedInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installed) return;
    if (!installPrompt) {
      const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
      setMessage(isIos
        ? 'In Safari, tap Share and then Add to Home Screen.'
        : 'Open your browser menu and choose Install app or Add to Home screen.');
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    window.__instituteInstallPrompt = null;
    setInstallPrompt(null);
    if (outcome === 'accepted') {
      rememberInstalled();
      setInstalled(true);
    }
  };

  if (installed) return null;

  return (
    <div className="pwa-install-card">
      <button type="button" className="pwa-install-button" onClick={handleInstall}>
        <FaDownload aria-hidden="true" />
        <span>Install App</span>
      </button>
      {message && <small aria-live="polite">{message}</small>}
    </div>
  );
}

export default InstallAppButton;
