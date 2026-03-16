/**
 * Full-screen image lightbox — click an image to view it
 * full-size with a dark overlay. Click or press Escape to close.
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './Lightbox.module.css';

interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt, onClose }: LightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose}>
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt ?? ''}
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
