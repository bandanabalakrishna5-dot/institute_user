import React, { useEffect, useState } from 'react';
import { FaDownload, FaCheckCircle } from 'react-icons/fa';
import './InstallAppButton.css';
import './InstallAppButton.css';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [message, setMessage] = useState('Install for faster access from your home screen.');

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setMessage('Install for faster access from your home screen.');
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setMessage('The app is installed on this device.');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
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
    setInstallPrompt(null);
    setMessage(outcome === 'accepted'
      ? 'App installation started.'
      : 'You can install later from your browser menu.');
  };

  return (
    <div className="pwa-install-card">
      <button type="button" className="pwa-install-button" onClick={handleInstall} disabled={installed}>
        {installed ? <FaCheckCircle aria-hidden="true" /> : <FaDownload aria-hidden="true" />}
        <span>{installed ? 'App Installed' : 'Install App'}</span>
      </button>
      <small aria-live="polite">{message}</small>
    </div>
  );
}

export default InstallAppButton;
