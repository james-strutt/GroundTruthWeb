import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="alert">
      <WifiOff size={14} />
      You're offline — some features may be unavailable
    </div>
  );
}
