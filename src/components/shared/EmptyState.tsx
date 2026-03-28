import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export function EmptyState({ icon, title, subtitle, ctaLabel, ctaTo }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.subtitle}>{subtitle}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className={styles.cta}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
