import { Search, AlertTriangle } from 'lucide-react';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  type?: 'notFound' | 'error';
}

export function ErrorMessage({ message, onRetry, type = 'error' }: ErrorMessageProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        {type === 'notFound' ? <Search size={32} /> : <AlertTriangle size={32} />}
      </div>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
