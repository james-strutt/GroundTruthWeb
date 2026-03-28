import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import styles from './InstallPrompt.module.css';

const DISMISSED_KEY = 'gt-install-prompt-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="complementary" aria-label="Install application">
      <Download size={16} style={{ color: 'var(--terracotta)', flexShrink: 0 }} />
      <span className={styles.text}>Install GroundTruth for quick access</span>
      <button className={styles.installButton} onClick={() => void handleInstall()}>
        Install
      </button>
      <button className={styles.dismissButton} onClick={handleDismiss} aria-label="Dismiss install prompt">
        <X size={14} />
      </button>
    </div>
  );
}
